import React, { useState } from 'react';
import { usePlayersQuery } from '../features/players/hooks/usePlayersQuery';
import { Player } from '../types';
import {
  ListOrdered,
  Star,
  DollarSign,
  Award,
  Globe,
  Sliders,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  User,
  Clock,
  ArrowUpDown
} from 'lucide-react';

type PositionGroup =
  | 'All'
  | 'GK'
  | 'Laterales'
  | 'Centrales'
  | 'Mediocentros'
  | 'Interiores'
  | 'Extremos'
  | 'Mediapuntas'
  | 'Delanteros';

type SortOption =
  | 'rating'
  | 'potential'
  | 'age'
  | 'marketValue'
  | 'minutes'
  | 'performance';

export const RankingsPage: React.FC = () => {
  const { players } = usePlayersQuery();

  // Navigation / Tabs
  const [activeGroup, setActiveGroup] = useState<PositionGroup>('All');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter States
  const [filterLeague, setFilterLeague] = useState<string>('All');
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [filterFoot, setFilterFoot] = useState<string>('All');
  const [filterClub, setFilterClub] = useState<string>('All');
  
  const [minAge, setMinAge] = useState<number>(15);
  const [maxAge, setMaxAge] = useState<number>(42);
  const [minHeight, setMinHeight] = useState<number>(150);
  const [maxHeight, setMaxHeight] = useState<number>(210);
  const [maxContractYear, setMaxContractYear] = useState<string>('All');
  const [activeSeason, setActiveSeason] = useState<string>('All');

  // Helpers to check position groups
  const matchesGroup = (playerPos: string, group: PositionGroup): boolean => {
    if (group === 'All') return true;
    const pos = playerPos.toUpperCase();
    if (group === 'GK') return pos === 'GK' || pos === 'POR';
    if (group === 'Laterales') return ['LB', 'RB', 'LD', 'LI'].includes(pos);
    if (group === 'Centrales') return ['CB', 'DFC'].includes(pos);
    if (group === 'Mediocentros') return ['DM', 'MCD'].includes(pos);
    if (group === 'Interiores') return ['CM', 'MC'].includes(pos);
    if (group === 'Extremos') return ['LW', 'RW', 'ED', 'EI'].includes(pos);
    if (group === 'Mediapuntas') return ['AM', 'MCO'].includes(pos);
    if (group === 'Delanteros') return ['ST', 'CF', 'DC'].includes(pos);
    return false;
  };

  // Get unique options for filter dropdowns from actual data
  const leagues = Array.from(new Set(players.map((p) => p.club === 'Bayer 04 Leverkusen' ? 'Bundesliga' : p.club === 'Arsenal FC' || p.club === 'Manchester City FC' ? 'Premier League' : 'La Liga')));
  const countries = Array.from(new Set(players.map((p) => p.nationality)));
  const clubs = Array.from(new Set(players.map((p) => p.club)));

  // Filter & Sort Logic
  const filteredPlayers = players.filter((player) => {
    // Position Group Filter
    if (!matchesGroup(player.position, activeGroup)) return false;

    // League Filter (Derive league since it's present in clubs list)
    const derivedLeague = player.club === 'Bayer 04 Leverkusen' ? 'Bundesliga' : player.club === 'Arsenal FC' || player.club === 'Manchester City FC' ? 'Premier League' : 'La Liga';
    if (filterLeague !== 'All' && derivedLeague !== filterLeague) return false;

    // Country Filter
    if (filterCountry !== 'All' && player.nationality !== filterCountry) return false;

    // Preferred Foot Filter
    if (filterFoot !== 'All' && player.preferredFoot !== filterFoot) return false;

    // Club Filter
    if (filterClub !== 'All' && player.club !== filterClub) return false;

    // Age bounds
    if (player.age < minAge || player.age > maxAge) return false;

    // Height bounds
    if (player.height < minHeight || player.height > maxHeight) return false;

    // Contract year filter
    if (maxContractYear !== 'All') {
      const contractYear = player.contractUntil ? player.contractUntil.substring(0, 4) : '';
      if (contractYear !== maxContractYear) return false;
    }

    return true;
  });

  const getSortValue = (player: Player, option: SortOption): number => {
    switch (option) {
      case 'rating':
        return player.rating || 0;
      case 'potential':
        return player.potential || player.rating || 0;
      case 'age':
        return player.age || 0;
      case 'marketValue':
        return player.marketValue || 0;
      case 'minutes':
        return player.stats?.minutesPlayed || 0;
      case 'performance':
        // Goals + Assists
        return (player.stats?.goals || 0) + (player.stats?.assists || 0);
      default:
        return 0;
    }
  };

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const valA = getSortValue(a, sortBy);
    const valB = getSortValue(b, sortBy);

    if (valA === valB) {
      return a.name.localeCompare(b.name);
    }

    if (sortOrder === 'desc') {
      return valB - valA;
    } else {
      return valA - valB;
    }
  });

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
  };

  const getPositionGroupLabel = (group: PositionGroup) => {
    switch (group) {
      case 'All': return 'Todos';
      case 'GK': return 'Porteros';
      case 'Laterales': return 'Laterales';
      case 'Centrales': return 'Centrales';
      case 'Mediocentros': return 'Mediocentros';
      case 'Interiores': return 'Interiores';
      case 'Extremos': return 'Extremos';
      case 'Mediapuntas': return 'Mediapuntas';
      case 'Delanteros': return 'Delanteros';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      <div className="flex justify-between items-center border-b border-[#1e293b] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Clasificaciones de Rendimiento (Rankings)</h2>
          <p className="text-gray-400 mt-1">
            Compare y filtre el rendimiento de los talentos registrados por grupos de posición técnica, minutos y potencial.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Left Side: Position Tabs & Filters */}
        <div className="xl:col-span-1 rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-lg space-y-6">
          
          {/* Position Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#1e293b]/60 pb-2 uppercase tracking-wide">
              <Layers className="text-emerald-500" size={14} /> Demarcación
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(['All', 'GK', 'Laterales', 'Centrales', 'Mediocentros', 'Interiores', 'Extremos', 'Mediapuntas', 'Delanteros'] as PositionGroup[]).map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`text-[11px] font-bold py-2 px-3 rounded-lg border text-left transition-all ${
                    activeGroup === group
                      ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 shadow-inner'
                      : 'border-[#1e293b] bg-[#141a29]/80 text-gray-450 hover:bg-[#1e293d]/50'
                  }`}
                >
                  {getPositionGroupLabel(group)}
                </button>
              ))}
            </div>
          </div>

          {/* Filtering parameters */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#1e293b]/60 pb-2 uppercase tracking-wide">
              <Sliders className="text-emerald-500" size={14} /> Filtros de Ojeo
            </h3>

            {/* League & Country */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Competición / Liga</label>
                <select
                  value={filterLeague}
                  onChange={(e) => setFilterLeague(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="All">Todas las Ligas</option>
                  {leagues.map((lg) => (
                    <option key={lg} value={lg}>{lg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nacionalidad / País</label>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="All">Todos los Países</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Club de Origen</label>
                <select
                  value={filterClub}
                  onChange={(e) => setFilterClub(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="All">Todos los Clubes</option>
                  {clubs.map((club) => (
                    <option key={club} value={club}>{club}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Age Range */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                <span>Rango Edad</span>
                <span className="text-emerald-400 font-extrabold">{minAge} - {maxAge} años</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="15"
                  max="42"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-1/2 accent-emerald-500 h-1 bg-[#141a29] rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="range"
                  min="15"
                  max="42"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-1/2 accent-emerald-500 h-1 bg-[#141a29] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Height Range */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                <span>Altura</span>
                <span className="text-emerald-400 font-extrabold">{minHeight} - {maxHeight} cm</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="150"
                  max="210"
                  value={minHeight}
                  onChange={(e) => setMinHeight(Number(e.target.value))}
                  className="w-1/2 accent-emerald-500 h-1 bg-[#141a29] rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="range"
                  min="150"
                  max="210"
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(Number(e.target.value))}
                  className="w-1/2 accent-emerald-500 h-1 bg-[#141a29] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Foot & Contract */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Pie hábil</label>
                <select
                  value={filterFoot}
                  onChange={(e) => setFilterFoot(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="All">Todos</option>
                  <option value="Left">Izquierdo</option>
                  <option value="Right">Derecho</option>
                  <option value="Both">Ambos</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Expiración</label>
                <select
                  value={maxContractYear}
                  onChange={(e) => setMaxContractYear(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="All">Todos</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: The Master Ranking Leaderboard */}
        <div className="xl:col-span-3 rounded-2xl border border-[#1e293b] bg-[#0f1422] p-6 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ListOrdered className="text-emerald-500" size={16} />
              Clasificación de Talentos: {getPositionGroupLabel(activeGroup)} ({sortedPlayers.length})
            </h3>
            <span className="text-[10px] text-gray-500 bg-[#141a29] border border-[#1e293b] px-3 py-1 rounded-full font-bold uppercase">
              Temp: 2025/2026
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-gray-400">
              <thead className="border-b border-[#1e293b] text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-[#0d121e]">
                <tr>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4">Jugador</th>
                  <th className="py-3 px-4">Posición</th>
                  
                  <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('rating')}>
                    <span className="flex items-center gap-1.5">
                      Nota Media {sortBy === 'rating' && (sortOrder === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </span>
                  </th>
                  
                  <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('potential')}>
                    <span className="flex items-center gap-1.5">
                      Potencial {sortBy === 'potential' && (sortOrder === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </span>
                  </th>
                  
                  <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('age')}>
                    <span className="flex items-center gap-1.5">
                      Edad {sortBy === 'age' && (sortOrder === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </span>
                  </th>

                  <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('marketValue')}>
                    <span className="flex items-center gap-1.5">
                      Valor {sortBy === 'marketValue' && (sortOrder === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </span>
                  </th>

                  <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('minutes')}>
                    <span className="flex items-center gap-1.5">
                      Minutos {sortBy === 'minutes' && (sortOrder === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </span>
                  </th>

                  <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center" onClick={() => toggleSort('performance')}>
                    <span className="flex items-center justify-center gap-1.5">
                      G+A {sortBy === 'performance' && (sortOrder === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {sortedPlayers.map((player, index) => (
                  <tr key={player.id} className="hover:bg-gray-900/25 transition-colors">
                    <td className="py-3 px-4 text-center font-bold">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-[#141a29] border border-[#1e293b] text-[10px] font-extrabold text-emerald-400">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={player.photoUrl || 'https://via.placeholder.com/150'}
                        alt={player.name}
                        className="h-8 w-8 rounded-full border border-gray-700 object-cover"
                      />
                      <div>
                        <p className="font-bold text-gray-250 text-xs leading-none">{player.name}</p>
                        <p className="text-[9px] text-gray-500 mt-1">{player.club} • {player.nationality}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                        {player.position}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-0.5 text-amber-500 font-extrabold">
                        <Star className="h-3 w-3 fill-amber-500" />
                        {(player.rating || 0).toFixed(1)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-0.5 text-indigo-400 font-extrabold">
                        <Award className="h-3 w-3" />
                        {(player.potential || player.rating || 0).toFixed(1)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-200">{player.age} años</td>
                    <td className="py-3 px-4 text-gray-200 font-bold">
                      {(player.marketValue / 1000000).toFixed(0)}M €
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-300">
                      {player.stats?.minutesPlayed || 0}'
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">
                      {(player.stats?.goals || 0) + (player.stats?.assists || 0)}
                    </td>
                  </tr>
                ))}

                {sortedPlayers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-gray-500">
                      Ningún jugador coincide con los filtros establecidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
