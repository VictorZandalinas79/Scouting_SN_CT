import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useForm } from 'react-hook-form';
import { usePlayersQuery } from '../features/players/hooks/usePlayersQuery';
import { useTeamsQuery } from '../features/teams/hooks/useTeamsQuery';
import { useTeamReportsQuery } from '../features/teams/hooks/useTeamReportsQuery';
import { Player, Team, TeamReport } from '../types';
import {
  Shield,
  Plus,
  Users,
  Trash2,
  HelpCircle,
  TrendingUp,
  Sliders,
  Award,
  FileText,
  Calendar,
  Layers,
  Activity,
  ThumbsUp,
  ThumbsDown,
  X,
  Target,
  Star
} from 'lucide-react';

const ITEM_TYPE = 'PLAYER';

interface Lineup {
  [position: string]: Player | null;
}

const TACTICAL_POSITIONS = [
  { id: 'GK', label: 'POR', top: '85%', left: '50%' },
  { id: 'LD', label: 'LD', top: '65%', left: '80%' },
  { id: 'DFD', label: 'DFC', top: '70%', left: '60%' },
  { id: 'DFI', label: 'DFC', top: '70%', left: '40%' },
  { id: 'LI', label: 'LI', top: '65%', left: '20%' },
  { id: 'MCD', label: 'MCD', top: '50%', left: '50%' },
  { id: 'MCD2', label: 'MC', top: '42%', left: '68%' },
  { id: 'MCI', label: 'MC', top: '42%', left: '32%' },
  { id: 'ED', label: 'ED', top: '20%', left: '80%' },
  { id: 'EI', label: 'EI', top: '20%', left: '20%' },
  { id: 'DC', label: 'DC', top: '15%', left: '50%' },
];

interface TeamReportForm {
  date: string;
  notes: string;
  verdict: 'Excellent' | 'Average' | 'Needs Improvement';
  tacticalAnalysis: string;
  strengthsInput: string;
  weaknessesInput: string;
}

/* Draggable Player Chip */
const DraggablePlayerChip: React.FC<{ player: Player }> = ({ player }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { player },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef as any}
      className={`flex items-center justify-between p-3 rounded-xl border border-[#1e293b] bg-[#141a29] hover:bg-[#1f293d] transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 border-emerald-500' : ''
      }`}
    >
      <div className="flex items-center gap-2.5">
        <img
          src={player.photoUrl || 'https://via.placeholder.com/150'}
          alt={player.name}
          className="h-7 w-7 rounded-full object-cover border border-gray-700"
        />
        <div>
          <p className="text-xs font-bold text-gray-200">{player.name}</p>
          <p className="text-[10px] text-gray-400 font-medium">{player.position} • {player.club}</p>
        </div>
      </div>
      <span className="text-[9px] bg-emerald-950/50 border border-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-400 font-bold">
        {player.rating.toFixed(1)} ★
      </span>
    </div>
  );
};

/* Droppable Spot on the Pitch */
const TacticalSpot: React.FC<{
  pos: typeof TACTICAL_POSITIONS[0];
  assignedPlayer: Player | null;
  onDropPlayer: (player: Player) => void;
  onRemovePlayer: () => void;
}> = ({ pos, assignedPlayer, onDropPlayer, onRemovePlayer }) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { player: Player }) => onDropPlayer(item.player),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const activeBg = isOver
    ? 'bg-emerald-500/30 border-emerald-400 scale-110 shadow-emerald-500/20'
    : canDrop
    ? 'bg-emerald-900/20 border-emerald-600/40 border-dashed animate-pulse'
    : 'bg-black/60 border-emerald-500/30';

  return (
    <div
      ref={dropRef as any}
      style={{ top: pos.top, left: pos.left }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-200 z-10 ${
        assignedPlayer ? 'w-24' : 'w-16'
      }`}
    >
      {assignedPlayer ? (
        <div className="relative flex flex-col items-center group">
          <button
            onClick={onRemovePlayer}
            className="absolute -top-1.5 -right-1.5 z-20 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Quitar jugador"
          >
            ×
          </button>
          <img
            src={assignedPlayer.photoUrl || 'https://via.placeholder.com/150'}
            alt={assignedPlayer.name}
            className="h-11 w-11 rounded-full border-2 border-emerald-500 shadow-xl object-cover"
          />
          <div className="mt-1 bg-gray-950/90 border border-emerald-800 rounded px-1.5 py-0.5 text-center shadow-lg pointer-events-none max-w-full">
            <p className="text-[9px] font-bold text-white truncate max-w-[80px]">{assignedPlayer.name}</p>
            <p className="text-[8px] text-emerald-400 font-bold leading-none">{pos.id}</p>
          </div>
        </div>
      ) : (
        <div className={`h-11 w-11 rounded-full border-2 flex items-center justify-center shadow-xl ${activeBg}`}>
          <span className="text-[10px] font-extrabold text-emerald-400/80">{pos.label}</span>
        </div>
      )}
    </div>
  );
};

/* Core Layout component */
const TeamsPageContent: React.FC = () => {
  const { players } = usePlayersQuery();
  const { teams, createTeam, deleteTeam } = useTeamsQuery();
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const activeTeam = selectedTeam || teams[0];

  const { reports, createReport, deleteReport } = useTeamReportsQuery(activeTeam?.id);

  // States
  const [activeTab, setActiveTab] = useState<'tactic' | 'board' | 'roster' | 'reports'>('tactic');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeague, setNewTeamLeague] = useState('');
  const [lineup, setLineup] = useState<Lineup>({});

  const { register, handleSubmit, reset } = useForm<TeamReportForm>({
    defaultValues: {
      verdict: 'Average',
      date: new Date().toISOString().substring(0, 10),
    }
  });

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    createTeam(
      {
        name: newTeamName,
        league: newTeamLeague || 'La Liga',
        country: 'España',
        clubId: 'club_1',
        scoutId: 'usr_1',
        season: '2025/2026',
        coach: 'Desconocido',
        usualSystem: '4-3-3',
        gameModel: 'Modelo de posesión básico sin definir.',
        pressingStyle: 'Presión media organizada.',
        buildUp: 'Salida de balón por el suelo apoyándose en defensas.',
        transitions: 'Transiciones equilibradas.',
        setPieces: 'Defensa en zona.',
        collectiveStats: {
          matchesPlayed: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          cleanSheets: 0,
        },
        seasonHistory: [],
      },
      {
        onSuccess: (newT) => {
          setSelectedTeam(newT);
          setNewTeamName('');
          setNewTeamLeague('');
          setLineup({});
        },
      }
    );
  };

  const handleReportSubmit = (data: TeamReportForm) => {
    if (!activeTeam) return;

    createReport(
      {
        teamId: activeTeam.id,
        scoutId: 'usr_1',
        scoutName: 'Santiago Bernabéu',
        date: data.date,
        notes: data.notes,
        verdict: data.verdict,
        tacticalAnalysis: data.tacticalAnalysis,
        strengths: data.strengthsInput.split(',').map((s) => s.trim()).filter(Boolean),
        weaknesses: data.weaknessesInput.split(',').map((w) => w.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          setIsReportModalOpen(false);
          reset();
        },
      }
    );
  };

  const handleDropPlayer = (posId: string, player: Player) => {
    const updatedLineup = { ...lineup };
    Object.keys(updatedLineup).forEach((key) => {
      if (updatedLineup[key]?.id === player.id) {
        updatedLineup[key] = null;
      }
    });

    updatedLineup[posId] = player;
    setLineup(updatedLineup);
  };

  const handleRemovePlayer = (posId: string) => {
    setLineup((prev) => ({ ...prev, [posId]: null }));
  };

  // Get players contracted by active team
  const rosterPlayers = players.filter((p) => p.club.toLowerCase() === activeTeam?.name.toLowerCase());

  const getVerdictStyle = (v: string) => {
    if (v === 'Excellent') return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60';
    if (v === 'Average') return 'bg-blue-950/40 text-blue-400 border-blue-900/60';
    return 'bg-red-950/40 text-red-400 border-red-900/60';
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      <div className="flex justify-between items-center border-b border-[#1e293b] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Análisis de Clubes</h2>
          <p className="text-gray-400 mt-1">Configure modelos de juego, redacte informes de rivales e interactúe con la pizarra táctica.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Sidebar Selector */}
        <div className="xl:col-span-1 rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e293b]/60 pb-2">
            <Shield className="text-emerald-500" size={16} />
            Equipos del Sistema
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => {
                  setSelectedTeam(team);
                  setLineup({});
                  setActiveTab('tactic');
                }}
                className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer hover:bg-gray-900/35 transition-colors ${
                  activeTeam?.id === team.id ? 'border-emerald-500 bg-emerald-950/20' : 'border-[#1e293b] bg-[#141a29]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{team.name}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{team.league}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar equipo ${team.name}?`)) {
                      deleteTeam(team.id);
                      if (selectedTeam?.id === team.id) setSelectedTeam(null);
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-400 rounded-md hover:bg-red-950/20"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateTeam} className="border-t border-[#1e293b] pt-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Añadir Nuevo Equipo</p>
            <input
              type="text"
              placeholder="Nombre del club..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Liga..."
              value={newTeamLeague}
              onChange={(e) => setNewTeamLeague(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-colors"
            >
              <Plus size={14} /> Registrar Equipo
            </button>
          </form>
        </div>

        {/* Team Profile Detail Card & Tabs */}
        {activeTeam ? (
          <div className="xl:col-span-3 rounded-2xl border border-[#1e293b] bg-[#0f1422] overflow-hidden shadow-lg flex flex-col h-[620px]">
            {/* Header info */}
            <div className="bg-gradient-to-r from-[#111e19] to-[#0f1422] p-6 border-b border-[#1e293b] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-900 flex items-center justify-center font-bold text-emerald-400 shadow-md">
                  {activeTeam.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">{activeTeam.name}</h3>
                  <p className="text-xs text-gray-400">{activeTeam.league} • {activeTeam.country}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold bg-[#141a29] px-3 py-1 rounded-full border border-[#1e293b] uppercase">
                  Temp. {activeTeam.season}
                </span>
                <p className="text-[10px] text-emerald-400 font-bold mt-1.5">DT: {activeTeam.coach}</p>
              </div>
            </div>

            {/* Tab Headers */}
            <div className="flex border-b border-[#1e293b] bg-[#0d121e] text-[10px] uppercase font-bold tracking-wider shrink-0">
              <button
                onClick={() => setActiveTab('tactic')}
                className={`flex-1 py-3 text-center transition-all ${
                  activeTab === 'tactic' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-[#0f1422]/60' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Táctica & Datos
              </button>
              <button
                onClick={() => setActiveTab('board')}
                className={`flex-1 py-3 text-center transition-all ${
                  activeTab === 'board' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-[#0f1422]/60' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Pizarra Táctica
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                className={`flex-1 py-3 text-center transition-all ${
                  activeTab === 'roster' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-[#0f1422]/60' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Plantilla ({rosterPlayers.length})
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 py-3 text-center transition-all ${
                  activeTab === 'reports' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-[#0f1422]/60' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Informes ({reports.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0f1422]">
              
              {/* Tab 1: Tactical characteristics & stats */}
              {activeTab === 'tactic' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  
                  {/* Left Column: Tactical descriptions */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Identidad de Juego</h4>
                    
                    <div className="space-y-3 bg-[#141a29] border border-[#1e293b]/60 rounded-xl p-4 text-xs leading-relaxed">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block">MODELO DE JUEGO</span>
                        <p className="text-gray-200 mt-1">{activeTeam.gameModel}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-[#1e293b]/40 pt-3 mt-3">
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block">SISTEMA HABITUAL</span>
                          <p className="text-emerald-400 font-extrabold mt-1">{activeTeam.usualSystem}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block">ESTILO DE PRESIÓN</span>
                          <p className="text-gray-200 mt-1">{activeTeam.pressingStyle}</p>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider pt-2">Fases de Juego</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#141a29]/80 border border-[#1e293b]/60 rounded-xl p-3.5 text-xs">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Salida de Balón</span>
                        <p className="text-gray-300 mt-1.5 leading-normal">{activeTeam.buildUp}</p>
                      </div>
                      <div className="bg-[#141a29]/80 border border-[#1e293b]/60 rounded-xl p-3.5 text-xs">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Transiciones</span>
                        <p className="text-gray-300 mt-1.5 leading-normal">{activeTeam.transitions}</p>
                      </div>
                      <div className="bg-[#141a29]/80 border border-[#1e293b]/60 rounded-xl p-3.5 text-xs">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Balón Parado</span>
                        <p className="text-gray-300 mt-1.5 leading-normal">{activeTeam.setPieces}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Stats and history */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estadísticas Colectivas</h4>
                    <div className="bg-[#141a29] border border-[#1e293b]/60 rounded-xl p-4 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Partidos Jugados:</span>
                        <span className="text-white font-bold">{activeTeam.collectiveStats?.matchesPlayed || 0}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span className="font-medium">Victorias:</span>
                        <span className="font-bold">{activeTeam.collectiveStats?.won || 0}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span className="font-medium">Empates:</span>
                        <span className="font-bold">{activeTeam.collectiveStats?.drawn || 0}</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span className="font-medium">Derrotas:</span>
                        <span className="font-bold">{activeTeam.collectiveStats?.lost || 0}</span>
                      </div>
                      <div className="border-t border-[#1e293b]/40 pt-2 flex justify-between">
                        <span className="text-gray-500 font-medium">Goles a Favor:</span>
                        <span className="text-white font-bold">{activeTeam.collectiveStats?.goalsFor || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Goles en Contra:</span>
                        <span className="text-white font-bold">{activeTeam.collectiveStats?.goalsAgainst || 0}</span>
                      </div>
                      <div className="flex justify-between text-blue-400">
                        <span className="font-medium">Porterías a Cero:</span>
                        <span className="font-bold">{activeTeam.collectiveStats?.cleanSheets || 0}</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Historial de Temporadas</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {activeTeam.seasonHistory?.map((hist, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-[#141a29]/40 border border-[#1e293b]/30 p-2.5 rounded-lg text-xs">
                          <div>
                            <p className="font-bold text-gray-200">{hist.season}</p>
                            <p className="text-[9px] text-gray-500">DT: {hist.coach}</p>
                          </div>
                          <span className="bg-[#141a29] border border-[#1e293b] px-2 py-0.5 rounded font-extrabold text-emerald-400 text-[10px]">
                            #{hist.leaguePosition}º Lugar
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Campograma Tactical Pitch board */}
              {activeTab === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                  {/* Draggable players sidebar */}
                  <div className="md:col-span-2 bg-[#141a29]/80 border border-[#1e293b]/60 rounded-xl p-4 space-y-3 flex flex-col h-[460px]">
                    <div className="flex justify-between items-center border-b border-[#1e293b] pb-2 shrink-0">
                      <span className="text-xs font-bold text-white uppercase">Candidatos o Plantilla</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 font-bold uppercase">
                        Arrastrables
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                      {/* Let scouts drag any player in database to position them! */}
                      {players.map((player) => (
                        <DraggablePlayerChip key={player.id} player={player} />
                      ))}
                    </div>
                  </div>

                  {/* Soccer Pitch Visualizer drop target */}
                  <div className="md:col-span-3 flex flex-col items-center">
                    <div className="relative w-full max-w-[340px] aspect-[3/4] bg-emerald-950 border border-emerald-600/30 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-950/40 shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-[#133017] to-emerald-950"></div>
                      <div className="absolute top-1/2 left-1/2 h-20 w-20 border border-emerald-500/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute top-1/2 left-0 w-full border-t border-emerald-500/20"></div>
                      <div className="absolute bottom-0 left-1/2 w-48 h-24 border border-emerald-500/20 border-b-0 -translate-x-1/2"></div>
                      <div className="absolute top-0 left-1/2 w-48 h-24 border border-emerald-500/20 border-t-0 -translate-x-1/2"></div>

                      {TACTICAL_POSITIONS.map((pos) => (
                        <TacticalSpot
                          key={pos.id}
                          pos={pos}
                          assignedPlayer={lineup[pos.id] || null}
                          onDropPlayer={(player) => handleDropPlayer(pos.id, player)}
                          onRemovePlayer={() => handleRemovePlayer(pos.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Roster players list */}
              {activeTab === 'roster' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jugadores en la Plantilla</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rosterPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-[#141a29] border border-[#1e293b]/60">
                        <div className="flex items-center gap-3">
                          <img
                            src={player.photoUrl || 'https://via.placeholder.com/150'}
                            alt={player.name}
                            className="h-8 w-8 rounded-full border border-gray-700 object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-200 leading-tight">{player.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{player.position} • {player.age} años</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-400">
                            {(player.marketValue / 1000000).toFixed(0)}M €
                          </span>
                          <div className="flex items-center gap-0.5 justify-end text-[9px] text-gray-400 mt-0.5 font-bold">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {player.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {rosterPlayers.length === 0 && (
                      <div className="col-span-2 py-8 text-center text-xs text-gray-500">
                        No hay ningún jugador registrado en la base de datos para este club.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Team Scouting Reports */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informes de Análisis del Club</h4>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-colors"
                    >
                      <Plus size={12} /> Redactar Informe
                    </button>
                  </div>

                  <div className="space-y-3">
                    {reports.map((rep) => (
                      <div key={rep.id} className="p-4 bg-[#141a29] border border-[#1e293b]/60 rounded-xl space-y-3 text-xs leading-relaxed">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-white flex items-center gap-2">
                            <FileText size={14} className="text-emerald-500" />
                            Informe Táctico de Equipo
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${getVerdictStyle(rep.verdict)}`}>
                            {rep.verdict === 'Excellent' ? 'Excelente' : rep.verdict === 'Average' ? 'Aceptable' : 'Por Mejorar'}
                          </span>
                        </div>
                        
                        <p className="text-gray-300">{rep.notes}</p>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-[#1e293b]/30 pt-3 text-[11px] text-gray-400">
                          <div>
                            <span className="font-bold text-emerald-400 block mb-1">Fortalezas:</span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {rep.strengths.map((str, i) => <li key={i}>{str}</li>)}
                            </ul>
                          </div>
                          <div>
                            <span className="font-bold text-red-400 block mb-1">Debilidades:</span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {rep.weaknesses.map((weak, i) => <li key={i}>{weak}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div className="border-t border-[#1e293b]/30 pt-2 flex justify-between items-center text-[10px] text-gray-500">
                          <span>Analista: {rep.scoutName} • {rep.date}</span>
                          <button
                            onClick={() => deleteReport(rep.id)}
                            className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-red-950/20"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <p className="text-center text-xs text-gray-500 py-8">
                        No hay informes registrados sobre el comportamiento táctico de este club.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="xl:col-span-3 py-12 text-center text-xs text-gray-500 border border-[#1e293b] rounded-2xl bg-[#0f1422]">
            Seleccione o cree un club en la barra lateral para ver su perfil táctico.
          </div>
        )}
      </div>

      {/* Modal: Write Team Report */}
      {isReportModalOpen && activeTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#1e293b] bg-[#0f1422] p-8 shadow-2xl my-8">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-white mb-6">Redactar Informe Táctico: {activeTeam.name}</h3>

            <form onSubmit={handleSubmit(handleReportSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase">Fecha del Análisis</label>
                  <input
                    type="date"
                    required
                    {...register('date')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase">Valoración del Bloque</label>
                  <select
                    {...register('verdict')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Excellent">Excellent (Excelente modelo)</option>
                    <option value="Average">Average (Aceptable)</option>
                    <option value="Needs Improvement">Needs Improvement (Por mejorar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Análisis Táctico Específico</label>
                <textarea
                  rows={3}
                  required
                  {...register('tacticalAnalysis')}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm resize-none"
                  placeholder="Detalle los patrones de juego en fase de salida de balón, presión, y replegamiento..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Fortalezas del Equipo (separadas por comas)</label>
                <input
                  type="text"
                  {...register('strengthsInput')}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  placeholder="e.g. Velocidad por bandas, Altura a balón parado, Fuerza en duelos"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Debilidades del Equipo (separadas por comas)</label>
                <input
                  type="text"
                  {...register('weaknessesInput')}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  placeholder="e.g. Repliegue defensivo tardío, Desatención en córners rivales"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Conclusiones del Reporte y Observaciones Libres</label>
                <textarea
                  rows={3}
                  required
                  {...register('notes')}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm resize-none"
                  placeholder="Comentarios adicionales generales de ojeador..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#1e293b] pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded-xl border border-gray-700 hover:border-gray-500 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                >
                  Guardar Informe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const TeamsPage: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TeamsPageContent />
    </DndProvider>
  );
};
