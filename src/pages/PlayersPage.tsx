import React, { useState } from 'react';
import { usePlayersQuery } from '../features/players/hooks/usePlayersQuery';
import { useReportsQuery } from '../features/reports/hooks/useReportsQuery';
import { useForm } from 'react-hook-form';
import { Player, PlayerPosition, PlayerStatus, PlayerStats } from '../types';
import { PipelineManager } from '../services/ingestion/core/PipelineManager';
import {
  Search,
  Plus,
  Filter,
  Trash2,
  Sliders,
  DollarSign,
  Star,
  User,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Activity,
  Award,
  Calendar,
  Layers,
  Sparkles,
  Edit2,
  Info,
  Globe,
  Footprints,
  Maximize2
} from 'lucide-react';

interface PlayerFormInput {
  name: string;
  age: number;
  nationality: string;
  club: string;
  position: PlayerPosition;
  preferredFoot: 'Left' | 'Right' | 'Both';
  height: number;
  weight: number;
  contractUntil: string;
  marketValue: number;
  rating: number;
  potential: number;
  status: PlayerStatus;
  
  // Attributes
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  tactical: number;

  // Stats
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export const PlayersPage: React.FC = () => {
  const { players, createPlayer, updatePlayer, deletePlayer } = usePlayersQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [footFilter, setFootFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('rating');
  
  // Selection & Tab States
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<'bio' | 'attributes' | 'stats' | 'reports'>('bio');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<any>(null);

  // Fetch reports for the selected player
  const { playerReports } = useReportsQuery(undefined, selectedPlayer?.id);

  // Forms
  const createForm = useForm<PlayerFormInput>({
    defaultValues: {
      pace: 75, shooting: 70, passing: 75, dribbling: 75, defending: 70, physical: 75, tactical: 75,
      rating: 4.0, potential: 4.0, status: 'Monitored', preferredFoot: 'Right', height: 180, weight: 75, age: 22,
      matchesPlayed: 20, minutesPlayed: 1500, goals: 0, assists: 0, yellowCards: 0, redCards: 0
    }
  });

  const editForm = useForm<PlayerFormInput>();

  // Ingestion trigger
  const handleImportAPI = async () => {
    setIsImporting(true);
    setImportLogs([]);
    setImportResult(null);
    setIsImportModalOpen(true);

    try {
      const manager = new PipelineManager();
      const res = await manager.runPipeline();
      setImportResult(res);
      setImportLogs(res.logs);
    } catch (error: any) {
      setImportLogs((prev) => [...prev, `[ERROR INGESTA] ${error.message}`]);
    } finally {
      setIsImporting(false);
    }
  };

  const onCreateSubmit = (data: PlayerFormInput) => {
    const newPlayer = {
      name: data.name,
      age: Number(data.age),
      nationality: data.nationality,
      club: data.club,
      position: data.position,
      preferredFoot: data.preferredFoot,
      height: Number(data.height),
      weight: Number(data.weight),
      contractUntil: data.contractUntil,
      marketValue: Number(data.marketValue),
      rating: Number(data.rating),
      potential: Number(data.potential || data.rating),
      status: data.status,
      attributes: {
        pace: Number(data.pace),
        shooting: Number(data.shooting),
        passing: Number(data.passing),
        dribbling: Number(data.dribbling),
        defending: Number(data.defending),
        physical: Number(data.physical),
        tactical: Number(data.tactical),
      },
      stats: {
        matchesPlayed: Number(data.matchesPlayed),
        minutesPlayed: Number(data.minutesPlayed),
        goals: Number(data.goals),
        assists: Number(data.assists),
        yellowCards: Number(data.yellowCards),
        redCards: Number(data.redCards),
      },
      scoutId: 'usr_1',
      clubId: 'club_1',
    };

    createPlayer(newPlayer, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        createForm.reset();
      },
    });
  };

  const onEditSubmit = (data: PlayerFormInput) => {
    if (!selectedPlayer) return;
    
    const updatedFields = {
      name: data.name,
      age: Number(data.age),
      nationality: data.nationality,
      club: data.club,
      position: data.position,
      preferredFoot: data.preferredFoot,
      height: Number(data.height),
      weight: Number(data.weight),
      contractUntil: data.contractUntil,
      marketValue: Number(data.marketValue),
      rating: Number(data.rating),
      potential: Number(data.potential || data.rating),
      status: data.status,
      attributes: {
        pace: Number(data.pace),
        shooting: Number(data.shooting),
        passing: Number(data.passing),
        dribbling: Number(data.dribbling),
        defending: Number(data.defending),
        physical: Number(data.physical),
        tactical: Number(data.tactical),
      },
      stats: {
        matchesPlayed: Number(data.matchesPlayed),
        minutesPlayed: Number(data.minutesPlayed),
        goals: Number(data.goals),
        assists: Number(data.assists),
        yellowCards: Number(data.yellowCards),
        redCards: Number(data.redCards),
      },
    };

    updatePlayer(
      { id: selectedPlayer.id, updates: updatedFields },
      {
        onSuccess: (updatedPlayer) => {
          setSelectedPlayer(updatedPlayer);
          setIsEditModalOpen(false);
        },
      }
    );
  };

  const openEditModal = () => {
    if (!selectedPlayer) return;
    editForm.reset({
      name: selectedPlayer.name,
      age: selectedPlayer.age,
      nationality: selectedPlayer.nationality,
      club: selectedPlayer.club,
      position: selectedPlayer.position,
      preferredFoot: selectedPlayer.preferredFoot,
      height: selectedPlayer.height,
      weight: selectedPlayer.weight,
      contractUntil: selectedPlayer.contractUntil,
      marketValue: selectedPlayer.marketValue,
      rating: selectedPlayer.rating,
      potential: selectedPlayer.potential,
      status: selectedPlayer.status,
      
      pace: selectedPlayer.attributes.pace,
      shooting: selectedPlayer.attributes.shooting,
      passing: selectedPlayer.attributes.passing,
      dribbling: selectedPlayer.attributes.dribbling,
      defending: selectedPlayer.attributes.defending,
      physical: selectedPlayer.attributes.physical,
      tactical: selectedPlayer.attributes.tactical,

      matchesPlayed: selectedPlayer.stats?.matchesPlayed || 0,
      minutesPlayed: selectedPlayer.stats?.minutesPlayed || 0,
      goals: selectedPlayer.stats?.goals || 0,
      assists: selectedPlayer.stats?.assists || 0,
      yellowCards: selectedPlayer.stats?.yellowCards || 0,
      redCards: selectedPlayer.stats?.redCards || 0,
    });
    setIsEditModalOpen(true);
  };

  // Filters & Sorting logic
  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.club.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'All' || player.position === positionFilter;
    const matchesStatus = statusFilter === 'All' || player.status === statusFilter;
    const matchesFoot = footFilter === 'All' || player.preferredFoot === footFilter;
    return matchesSearch && matchesPosition && matchesStatus && matchesFoot;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'age') return a.age - b.age;
    if (sortBy === 'value') return b.marketValue - a.marketValue;
    if (sortBy === 'height') return b.height - a.height;
    if (sortBy === 'goals') return (b.stats?.goals || 0) - (a.stats?.goals || 0);
    if (sortBy === 'assists') return (b.stats?.assists || 0) - (a.stats?.assists || 0);
    return a.name.localeCompare(b.name);
  });

  const getStatusStyle = (status: PlayerStatus) => {
    switch (status) {
      case 'Target':
        return 'bg-amber-950/40 text-amber-400 border-amber-900/60';
      case 'Recommended':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60';
      case 'Monitored':
        return 'bg-blue-950/40 text-blue-400 border-blue-900/60';
      default:
        return 'bg-gray-800/40 text-gray-400 border-gray-700/60';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Base de Datos de Talentos</h2>
          <p className="text-gray-400 mt-1">Gestión de fichas técnicas, estadísticas y sincronización de APIs.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleImportAPI}
            className="flex items-center gap-2 rounded-xl border border-[#1e293b] hover:border-emerald-500 bg-[#0f1422] px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors"
          >
            <RefreshCw size={16} className={isImporting ? 'animate-spin text-emerald-500' : 'text-gray-400'} />
            Importar desde API
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus size={16} />
            Crear Jugador
          </button>
        </div>
      </div>

      {/* Advanced Search & Filtering Console */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#0f1422] rounded-2xl border border-[#1e293b]">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, nacionalidad o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1e293b] bg-[#141a29] text-white focus:outline-none focus:border-emerald-500 text-sm placeholder-gray-500"
          />
        </div>

        {/* Position Select */}
        <div className="flex items-center gap-2 bg-[#141a29] border border-[#1e293b] rounded-xl px-3 py-2">
          <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-xs font-semibold w-full"
          >
            <option value="All">Posición: Todos</option>
            <option value="GK">GK - Portero</option>
            <option value="CB">CB - Central</option>
            <option value="LB">LB - Lateral Izquierdo</option>
            <option value="RB">RB - Lateral Derecho</option>
            <option value="DM">DM - Pivote</option>
            <option value="CM">CM - Mediocentro</option>
            <option value="AM">AM - Mediapunta</option>
            <option value="LW">LW - Extremo Izquierdo</option>
            <option value="RW">RW - Extremo Derecho</option>
            <option value="ST">ST - Delantero Centro</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 bg-[#141a29] border border-[#1e293b] rounded-xl px-3 py-2">
          <Sliders size={14} className="text-gray-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-xs font-semibold w-full"
          >
            <option value="rating">Ordenar por: Valoración</option>
            <option value="value">Ordenar por: Valor de Mercado</option>
            <option value="age">Ordenar por: Edad (Menor primero)</option>
            <option value="height">Ordenar por: Altura</option>
            <option value="goals">Ordenar por: Goles</option>
            <option value="assists">Ordenar por: Asistencias</option>
          </select>
        </div>

        {/* Extra Filters (Status & Foot) */}
        <div className="md:col-span-4 flex flex-wrap gap-4 pt-2 border-t border-[#1e293b]/40 mt-1">
          <div className="flex items-center gap-2 bg-[#141a29] border border-[#1e293b] px-3.5 py-1.5 rounded-xl text-xs font-semibold">
            <span className="text-gray-500">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="All">Todos</option>
              <option value="Target">Target (Objetivo)</option>
              <option value="Monitored">Monitored (Seguimiento)</option>
              <option value="Recommended">Recommended (Recomendado)</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#141a29] border border-[#1e293b] px-3.5 py-1.5 rounded-xl text-xs font-semibold">
            <Footprints size={12} className="text-emerald-500" />
            <span className="text-gray-500">Pie Hábil:</span>
            <select
              value={footFilter}
              onChange={(e) => setFootFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="All">Todos</option>
              <option value="Left">Izquierdo</option>
              <option value="Right">Derecho</option>
              <option value="Both">Ambos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid + Panel Detail split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Players Grid list */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${selectedPlayer ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => {
                setSelectedPlayer(player);
                setActiveTab('bio');
              }}
              className={`rounded-2xl border bg-[#0f1422] p-5 shadow-lg cursor-pointer hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between h-72 ${
                selectedPlayer?.id === player.id ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-[#121829]' : 'border-[#1e293b]'
              }`}
            >
              {/* Card Header Bio */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={player.photoUrl || 'https://via.placeholder.com/150'}
                    alt={player.name}
                    className="h-12 w-12 rounded-full border border-gray-700 object-cover shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{player.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{player.club} • {player.age} años</p>
                    <span className="mt-1.5 inline-block rounded-md bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 text-[9px] font-extrabold text-emerald-400 uppercase">
                      {player.position}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold border uppercase tracking-wider ${getStatusStyle(player.status)}`}>
                    {player.status}
                  </span>
                  <div className="flex items-center gap-1 mt-2 text-xs font-extrabold text-gray-300">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    {player.rating.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Aggregated Quick Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center bg-[#141a29]/80 border border-[#1e293b]/60 rounded-xl p-2.5 my-3 text-[10px]">
                <div>
                  <span className="text-gray-500 font-semibold block">PARTIDOS</span>
                  <span className="text-gray-200 font-bold mt-0.5 block">{player.stats?.matchesPlayed || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block">MINUTOS</span>
                  <span className="text-gray-200 font-bold mt-0.5 block">{player.stats?.minutesPlayed || 0}</span>
                </div>
                <div>
                  <span className="text-emerald-500 font-semibold block">GOLES</span>
                  <span className="text-emerald-400 font-bold mt-0.5 block">{player.stats?.goals || 0}</span>
                </div>
                <div>
                  <span className="text-blue-500 font-semibold block">ASISTS</span>
                  <span className="text-blue-400 font-bold mt-0.5 block">{player.stats?.assists || 0}</span>
                </div>
              </div>

              {/* Bio Details */}
              <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-[#1e293b] pt-3 mt-1">
                <div className="flex items-center gap-1">
                  <DollarSign size={13} className="text-emerald-500" />
                  <span className="font-semibold text-gray-200">{(player.marketValue / 1000000).toFixed(0)}M €</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#141a29] px-2 py-0.5 rounded border border-[#1e293b]">
                    {player.height} cm
                  </span>
                  <span className="bg-[#141a29] px-2 py-0.5 rounded border border-[#1e293b]">
                    {player.preferredFoot}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabbed Detailed Profile Panel */}
        {selectedPlayer && (
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0f1422] shadow-2xl overflow-hidden relative sticky top-6 lg:col-span-1">
            {/* Control buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
              <button
                onClick={openEditModal}
                className="text-gray-400 hover:text-white rounded-full bg-gray-900/60 p-1.5 hover:bg-gray-800 transition-colors"
                title="Editar jugador"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar a ${selectedPlayer.name} de la base de datos?`)) {
                    deletePlayer(selectedPlayer.id);
                    setSelectedPlayer(null);
                  }
                }}
                className="text-gray-400 hover:text-red-400 rounded-full bg-gray-900/60 p-1.5 hover:bg-red-950/20 transition-colors"
                title="Eliminar jugador"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-gray-400 hover:text-white rounded-full bg-gray-900/60 p-1.5 hover:bg-gray-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Profile Hero Header */}
            <div className="bg-gradient-to-b from-[#162520] to-[#0f1422] p-6 text-center border-b border-[#1e293b] pt-12">
              <img
                src={selectedPlayer.photoUrl || 'https://via.placeholder.com/150'}
                alt={selectedPlayer.name}
                className="h-20 w-20 rounded-full border-2 border-emerald-500 shadow-xl object-cover mx-auto mb-3"
              />
              <h3 className="text-lg font-bold text-white leading-tight">{selectedPlayer.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{selectedPlayer.club}</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="rounded bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                  {selectedPlayer.position}
                </span>
                <span className="rounded bg-gray-800 px-2 py-0.5 text-[9px] font-bold text-gray-300">
                  {selectedPlayer.age} Años
                </span>
              </div>
            </div>

            {/* Tab navigation headers */}
            <div className="flex border-b border-[#1e293b] bg-[#0c101a] text-[10px] uppercase font-bold tracking-wider shrink-0">
              <button
                onClick={() => setActiveTab('bio')}
                className={`flex-1 py-3 text-center transition-all ${
                  activeTab === 'bio' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-[#0f1422]/60' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Bio
              </button>
              <button
                onClick={() => setActiveTab('attributes')}
                className={`flex-1 py-3 text-center transition-all ${
                  activeTab === 'attributes' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-[#0f1422]/60' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Habilidades
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-3 text-center transition-all ${
                  activeTab === 'stats' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-[#0f1422]/60' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Estadísticas
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 py-3 text-center transition-all ${
                  activeTab === 'reports' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-[#0f1422]/60' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Informes ({playerReports.length})
              </button>
            </div>

            {/* Tab Content Panel */}
            <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto">
              
              {/* Tab 1: Biological & Contract Details */}
              {activeTab === 'bio' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs bg-[#141a29] p-4 rounded-xl border border-[#1e293b]/60">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Nacionalidad</p>
                      <p className="font-semibold text-gray-200 mt-1 flex items-center gap-1.5">
                        <Globe size={12} className="text-gray-400" />
                        {selectedPlayer.nationality}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Valor de Mercado</p>
                      <p className="font-semibold text-emerald-400 mt-1">
                        {(selectedPlayer.marketValue / 1000000).toFixed(1)}M €
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Pie Hábil</p>
                      <p className="font-semibold text-gray-200 mt-1 flex items-center gap-1.5">
                        <Footprints size={12} className="text-gray-400" />
                        {selectedPlayer.preferredFoot}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Contrato Hasta</p>
                      <p className="font-semibold text-gray-200 mt-1 flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-400" />
                        {selectedPlayer.contractUntil}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Estatura</p>
                      <p className="font-semibold text-gray-200 mt-1">{selectedPlayer.height} cm</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Peso Corporal</p>
                      <p className="font-semibold text-gray-200 mt-1">{selectedPlayer.weight} kg</p>
                    </div>
                  </div>

                  <div className="bg-[#141a29]/30 border border-[#1e293b]/40 rounded-xl p-4 space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Última Sincronización</h4>
                    <p className="text-xs text-gray-300">
                      Actualizado por última vez: <span className="text-gray-400 font-bold">{new Date(selectedPlayer.updatedAt).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Technical attributes sliders */}
              {activeTab === 'attributes' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Habilidades Técnicas</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedPlayer.attributes).map(([attr, val]) => (
                      <div key={attr} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="capitalize text-gray-300">{attr}</span>
                          <span className="text-emerald-400 font-bold">{val} / 100</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${val}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Detailed Statistics */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Estadísticas de la Temporada</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#141a29] p-3.5 rounded-xl border border-[#1e293b]/50 text-center">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Goles</span>
                      <span className="text-2xl font-black text-emerald-400 block mt-1">{selectedPlayer.stats?.goals || 0}</span>
                    </div>
                    <div className="bg-[#141a29] p-3.5 rounded-xl border border-[#1e293b]/50 text-center">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Asistencias</span>
                      <span className="text-2xl font-black text-blue-400 block mt-1">{selectedPlayer.stats?.assists || 0}</span>
                    </div>
                  </div>

                  <div className="bg-[#141a29]/80 border border-[#1e293b]/60 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Partidos Jugados:</span>
                      <span className="text-white font-bold">{selectedPlayer.stats?.matchesPlayed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Minutos en Campo:</span>
                      <span className="text-white font-bold">{selectedPlayer.stats?.minutesPlayed || 0} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Tarjetas Amarillas:</span>
                      <span className="text-amber-500 font-bold">{selectedPlayer.stats?.yellowCards || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Tarjetas Rojas:</span>
                      <span className="text-red-500 font-bold">{selectedPlayer.stats?.redCards || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Scout technical reports */}
              {activeTab === 'reports' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Historial de Ojeos</h4>
                  <div className="space-y-3">
                    {playerReports.map((report) => (
                      <div key={report.id} className="p-3 bg-[#141a29] border border-[#1e293b]/50 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-white truncate max-w-[150px]">{report.matchName}</p>
                          <span className="text-[10px] font-bold text-emerald-400">{report.rating.toFixed(1)} ★</span>
                        </div>
                        <p className="text-[9px] text-gray-500">{report.matchDate} • por {report.scoutName}</p>
                        <p className="text-gray-400 leading-relaxed mt-1 text-[11px] line-clamp-2">{report.notes}</p>
                      </div>
                    ))}
                    {playerReports.length === 0 && (
                      <p className="text-center text-xs text-gray-500 py-6">
                        No hay informes de partidos cargados para este jugador.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Player Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#1e293b] bg-[#0f1422] p-8 shadow-2xl my-8">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-white mb-6">Registrar Nuevo Jugador</h3>

            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              {/* Biological Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    {...createForm.register('name')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Club de Origen</label>
                  <input
                    type="text"
                    required
                    {...createForm.register('club')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Posición</label>
                  <select
                    {...createForm.register('position')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="GK">GK - Portero</option>
                    <option value="CB">CB - Central</option>
                    <option value="LB">LB - Lateral Izquierdo</option>
                    <option value="RB">RB - Lateral Derecho</option>
                    <option value="DM">DM - Pivote</option>
                    <option value="CM">CM - Mediocentro</option>
                    <option value="AM">AM - Mediapunta</option>
                    <option value="LW">LW - Extremo Izquierdo</option>
                    <option value="RW">RW - Extremo Derecho</option>
                    <option value="ST">ST - Delantero Centro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Nacionalidad</label>
                  <input
                    type="text"
                    required
                    {...createForm.register('nationality')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Edad</label>
                  <input
                    type="number"
                    required
                    {...createForm.register('age')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Pie Hábil</label>
                  <select
                    {...createForm.register('preferredFoot')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Right">Derecho</option>
                    <option value="Left">Izquierdo</option>
                    <option value="Both">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Altura (cm)</label>
                  <input
                    type="number"
                    required
                    {...createForm.register('height')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Peso (kg)</label>
                  <input
                    type="number"
                    required
                    {...createForm.register('weight')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Fin de Contrato</label>
                  <input
                    type="date"
                    required
                    {...createForm.register('contractUntil')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Valor de Mercado (€)</label>
                  <input
                    type="number"
                    required
                    {...createForm.register('marketValue')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Estado Scouting</label>
                  <select
                    {...createForm.register('status')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Monitored">Monitored (Seguimiento)</option>
                    <option value="Target">Target (Objetivo)</option>
                    <option value="Recommended">Recommended (Recomendado)</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Attributes Section */}
              <div className="border-t border-[#1e293b] pt-4">
                <h4 className="text-xs font-bold text-white mb-4">Habilidades Técnicas (1 - 100)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical', 'tactical'].map((attr) => (
                    <div key={attr}>
                      <label className="block text-[10px] font-bold text-gray-400 capitalize">{attr}</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        {...createForm.register(attr as any, { required: true })}
                        className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Valoración (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      {...createForm.register('rating', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Potencial (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      {...createForm.register('potential', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="border-t border-[#1e293b] pt-4">
                <h4 className="text-xs font-bold text-white mb-4">Estadísticas de Temporada</h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Partidos</label>
                    <input
                      type="number"
                      {...createForm.register('matchesPlayed', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Minutos</label>
                    <input
                      type="number"
                      {...createForm.register('minutesPlayed', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Goles</label>
                    <input
                      type="number"
                      {...createForm.register('goals', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Asists</label>
                    <input
                      type="number"
                      {...createForm.register('assists', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Amarillas</label>
                    <input
                      type="number"
                      {...createForm.register('yellowCards', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Rojas</label>
                    <input
                      type="number"
                      {...createForm.register('redCards', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#1e293b] pt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-gray-700 hover:border-gray-500 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                >
                  Registrar Jugador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Player Form */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#1e293b] bg-[#0f1422] p-8 shadow-2xl my-8">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-white mb-6">Editar Ficha de Jugador</h3>

            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              {/* Biological Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    {...editForm.register('name')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Club actual</label>
                  <input
                    type="text"
                    required
                    {...editForm.register('club')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Posición</label>
                  <select
                    {...editForm.register('position')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="GK">GK - Portero</option>
                    <option value="CB">CB - Central</option>
                    <option value="LB">LB - Lateral Izquierdo</option>
                    <option value="RB">RB - Lateral Derecho</option>
                    <option value="DM">DM - Pivote</option>
                    <option value="CM">CM - Mediocentro</option>
                    <option value="AM">AM - Mediapunta</option>
                    <option value="LW">LW - Extremo Izquierdo</option>
                    <option value="RW">RW - Extremo Derecho</option>
                    <option value="ST">ST - Delantero Centro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Nacionalidad</label>
                  <input
                    type="text"
                    required
                    {...editForm.register('nationality')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Edad</label>
                  <input
                    type="number"
                    required
                    {...editForm.register('age')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Pie Hábil</label>
                  <select
                    {...editForm.register('preferredFoot')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Right">Derecho</option>
                    <option value="Left">Izquierdo</option>
                    <option value="Both">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Altura (cm)</label>
                  <input
                    type="number"
                    required
                    {...editForm.register('height')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Peso (kg)</label>
                  <input
                    type="number"
                    required
                    {...editForm.register('weight')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Fin de Contrato</label>
                  <input
                    type="date"
                    required
                    {...editForm.register('contractUntil')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Valor de Mercado (€)</label>
                  <input
                    type="number"
                    required
                    {...editForm.register('marketValue')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-300 uppercase">Estado Scouting</label>
                  <select
                    {...editForm.register('status')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Monitored">Monitored (Seguimiento)</option>
                    <option value="Target">Target (Objetivo)</option>
                    <option value="Recommended">Recommended (Recomendado)</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Attributes Section */}
              <div className="border-t border-[#1e293b] pt-4">
                <h4 className="text-xs font-bold text-white mb-4">Habilidades Técnicas (1 - 100)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical', 'tactical'].map((attr) => (
                    <div key={attr}>
                      <label className="block text-[10px] font-bold text-gray-400 capitalize">{attr}</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        {...editForm.register(attr as any, { required: true })}
                        className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Valoración (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      {...editForm.register('rating', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Potencial (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      {...editForm.register('potential', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="border-t border-[#1e293b] pt-4">
                <h4 className="text-xs font-bold text-white mb-4">Estadísticas de Temporada</h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Partidos</label>
                    <input
                      type="number"
                      {...editForm.register('matchesPlayed', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Minutos</label>
                    <input
                      type="number"
                      {...editForm.register('minutesPlayed', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Goles</label>
                    <input
                      type="number"
                      {...editForm.register('goals', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Asists</label>
                    <input
                      type="number"
                      {...editForm.register('assists', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Amarillas</label>
                    <input
                      type="number"
                      {...editForm.register('yellowCards', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Rojas</label>
                    <input
                      type="number"
                      {...editForm.register('redCards', { required: true })}
                      className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#1e293b] pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-gray-700 hover:border-gray-500 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: API Import Log Status Console */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#1e293b] bg-[#0f1422] p-8 shadow-2xl">
            <button
              onClick={() => setIsImportModalOpen(false)}
              disabled={isImporting}
              className="absolute top-4 right-4 text-gray-500 hover:text-white disabled:opacity-30"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Activity className={isImporting ? 'animate-pulse text-emerald-500' : 'text-emerald-500'} size={20} />
              Ingesta de APIs Deportivas en Ejecución
            </h3>

            {isImporting ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                <p className="mt-4 text-xs font-semibold text-gray-400 uppercase tracking-widest animate-pulse">
                  Conectando, normalizando y deduplicando fuentes...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-center bg-[#141a29] border border-[#1e293b]/60 rounded-xl p-4 text-xs">
                  <div>
                    <span className="text-gray-500 font-bold block">PROCESADOS</span>
                    <span className="text-lg font-black text-white block mt-1">{importResult?.totalProcessed || 0}</span>
                  </div>
                  <div>
                    <span className="text-emerald-500 font-bold block">CREADOS</span>
                    <span className="text-lg font-black text-emerald-400 block mt-1">{importResult?.totalCreated || 0}</span>
                  </div>
                  <div>
                    <span className="text-blue-500 font-bold block">ACTUALIZADOS</span>
                    <span className="text-lg font-black text-blue-400 block mt-1">{importResult?.totalUpdated || 0}</span>
                  </div>
                  <div>
                    <span className="text-amber-500 font-bold block">EN REVISIÓN</span>
                    <span className="text-lg font-black text-amber-400 block mt-1">{importResult?.totalFlaggedForReview || 0}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consola de Ingesta (Logs del Servidor)</p>
                  <div className="bg-black/40 border border-[#1e293b] rounded-xl p-4 h-56 overflow-y-auto font-mono text-[10px] text-gray-300 space-y-1">
                    {importLogs.map((log, idx) => (
                      <p key={idx} className={log.includes('[ALERTA]') ? 'text-amber-400 font-bold' : log.includes('[ERROR') ? 'text-red-400' : 'text-gray-300'}>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      // Force local refresh by resetting select player
                      setSelectedPlayer(null);
                    }}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                  >
                    Finalizar y Recargar Lista
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
