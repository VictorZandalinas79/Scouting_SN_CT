import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlayersQuery } from '../features/players/hooks/usePlayersQuery';
import { Player } from '../types';
import { useUIStore } from '../store/global/useUIStore';
import { getStorageItem, setStorageItem } from '../utils/storageInit';
import {
  Sparkles,
  Plus,
  Trash2,
  Share2,
  Download,
  Copy,
  Layers,
  Star,
  Users,
  Compass,
  ArrowRightLeft,
  X,
  FileText,
  Printer,
  ChevronRight
} from 'lucide-react';

const DRAG_TYPE = 'PLAYER_TACTICAL';

interface TacticalSpot {
  id: string;
  label: string;
  top: string; // e.g. "85%"
  left: string; // e.g. "50%"
  assignedPlayer: Player | null;
}

interface SavedLineup {
  id: string;
  name: string;
  formation: string;
  spots: TacticalSpot[];
  createdAt: string;
}

const FORMATION_PRESETS: { [key: string]: Omit<TacticalSpot, 'assignedPlayer'>[] } = {
  '4-3-3': [
    { id: 'gk', label: 'POR', top: '85%', left: '50%' },
    { id: 'ld', label: 'LD', top: '65%', left: '80%' },
    { id: 'dfd', label: 'DFC', top: '72%', left: '60%' },
    { id: 'dfi', label: 'DFC', top: '72%', left: '40%' },
    { id: 'li', label: 'LI', top: '65%', left: '20%' },
    { id: 'mcd', label: 'MCD', top: '50%', left: '50%' },
    { id: 'mcd2', label: 'MC', top: '42%', left: '70%' },
    { id: 'mci', label: 'MC', top: '42%', left: '30%' },
    { id: 'ed', label: 'ED', top: '20%', left: '80%' },
    { id: 'ei', label: 'EI', top: '20%', left: '20%' },
    { id: 'dc', label: 'DC', top: '15%', left: '50%' },
  ],
  '4-4-2': [
    { id: 'gk', label: 'POR', top: '85%', left: '50%' },
    { id: 'ld', label: 'LD', top: '65%', left: '82%' },
    { id: 'dfd', label: 'DFC', top: '72%', left: '62%' },
    { id: 'dfi', label: 'DFC', top: '72%', left: '38%' },
    { id: 'li', label: 'LI', top: '65%', left: '18%' },
    { id: 'md', label: 'MD', top: '45%', left: '82%' },
    { id: 'mcd', label: 'MC', top: '48%', left: '60%' },
    { id: 'mci', label: 'MC', top: '48%', left: '40%' },
    { id: 'mi', label: 'MI', top: '45%', left: '18%' },
    { id: 'dc1', label: 'DC', top: '18%', left: '60%' },
    { id: 'dc2', label: 'DC', top: '18%', left: '40%' },
  ],
  '3-5-2': [
    { id: 'gk', label: 'POR', top: '85%', left: '50%' },
    { id: 'dfd', label: 'DFC', top: '72%', left: '70%' },
    { id: 'dfc', label: 'DFC', top: '75%', left: '50%' },
    { id: 'dfi', label: 'DFC', top: '72%', left: '30%' },
    { id: 'crd', label: 'CRD', top: '50%', left: '85%' },
    { id: 'cri', label: 'CRI', top: '50%', left: '15%' },
    { id: 'mcd', label: 'MCD', top: '52%', left: '50%' },
    { id: 'mc1', label: 'MC', top: '42%', left: '65%' },
    { id: 'mc2', label: 'MC', top: '42%', left: '35%' },
    { id: 'dc1', label: 'DC', top: '18%', left: '62%' },
    { id: 'dc2', label: 'DC', top: '18%', left: '38%' },
  ],
  '5-3-2': [
    { id: 'gk', label: 'POR', top: '85%', left: '50%' },
    { id: 'ld', label: 'LD', top: '65%', left: '85%' },
    { id: 'dfd', label: 'DFC', top: '72%', left: '68%' },
    { id: 'dfc', label: 'DFC', top: '75%', left: '50%' },
    { id: 'dfi', label: 'DFC', top: '72%', left: '32%' },
    { id: 'li', label: 'LI', top: '65%', left: '15%' },
    { id: 'mc1', label: 'MC', top: '45%', left: '68%' },
    { id: 'mcd', label: 'MCD', top: '48%', left: '50%' },
    { id: 'mc2', label: 'MC', top: '45%', left: '32%' },
    { id: 'dc1', label: 'DC', top: '18%', left: '60%' },
    { id: 'dc2', label: 'DC', top: '18%', left: '40%' },
  ],
  '4-2-3-1': [
    { id: 'gk', label: 'POR', top: '85%', left: '50%' },
    { id: 'ld', label: 'LD', top: '65%', left: '80%' },
    { id: 'dfd', label: 'DFC', top: '72%', left: '60%' },
    { id: 'dfi', label: 'DFC', top: '72%', left: '40%' },
    { id: 'li', label: 'LI', top: '65%', left: '20%' },
    { id: 'mcd1', label: 'MCD', top: '54%', left: '62%' },
    { id: 'mcd2', label: 'MCD', top: '54%', left: '38%' },
    { id: 'md', label: 'MD', top: '35%', left: '78%' },
    { id: 'mi', label: 'MI', top: '35%', left: '22%' },
    { id: 'mco', label: 'MCO', top: '32%', left: '50%' },
    { id: 'dc', label: 'DC', top: '15%', left: '50%' },
  ],
  'Custom': [
    { id: 'gk', label: 'POR', top: '85%', left: '50%' },
    { id: 'ld', label: 'LD', top: '65%', left: '80%' },
    { id: 'dfd', label: 'DFC', top: '72%', left: '60%' },
    { id: 'dfi', label: 'DFC', top: '72%', left: '40%' },
    { id: 'li', label: 'LI', top: '65%', left: '20%' },
    { id: 'mcd', label: 'MCD', top: '50%', left: '50%' },
    { id: 'mcd2', label: 'MC', top: '42%', left: '70%' },
    { id: 'mci', label: 'MC', top: '42%', left: '30%' },
    { id: 'ed', label: 'ED', top: '20%', left: '80%' },
    { id: 'ei', label: 'EI', top: '20%', left: '20%' },
    { id: 'dc', label: 'DC', top: '15%', left: '50%' },
  ],
};

/* Draggable Player inside Sidebar */
const DraggableSidebarPlayer: React.FC<{ player: Player }> = ({ player }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DRAG_TYPE,
    item: { player },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef as any}
      className={`flex items-center justify-between p-2.5 rounded-xl border border-[#1e293b] bg-[#141a29] hover:bg-[#1e293d] transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 border-emerald-500' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <img
          src={player.photoUrl || 'https://via.placeholder.com/150'}
          alt={player.name}
          className="h-7 w-7 rounded-full object-cover border border-gray-700"
        />
        <div>
          <p className="text-[11px] font-bold text-gray-200 truncate max-w-[120px]">{player.name}</p>
          <p className="text-[9px] text-gray-500">{player.position} • {player.club}</p>
        </div>
      </div>
      <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/30">
        {player.rating.toFixed(1)} ★
      </span>
    </div>
  );
};

/* Droppable Spot on the Pitch */
const TacticalPitchSpot: React.FC<{
  spot: TacticalSpot;
  isSelected: boolean;
  onSelect: () => void;
  onDropPlayer: (player: Player) => void;
  onRemovePlayer: () => void;
  miniMode?: boolean;
}> = ({ spot, isSelected, onSelect, onDropPlayer, onRemovePlayer, miniMode = false }) => {
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: DRAG_TYPE,
    drop: (item: { player: Player }) => onDropPlayer(item.player),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const assigned = spot.assignedPlayer;

  return (
    <div
      ref={dropRef as any}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ top: spot.top, left: spot.left }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10 ${
        miniMode ? 'scale-75' : ''
      }`}
    >
      {assigned ? (
        <div
          className={`relative flex flex-col items-center group rounded-xl p-1 ${
            isSelected && !miniMode ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#080b11]' : ''
          }`}
        >
          {!miniMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemovePlayer();
              }}
              className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold shadow opacity-0 group-hover:opacity-100 transition-opacity z-25"
            >
              ×
            </button>
          )}
          <img
            src={assigned.photoUrl || 'https://via.placeholder.com/150'}
            alt={assigned.name}
            className={`rounded-full border-2 border-emerald-500 shadow-xl object-cover ${
              miniMode ? 'h-7 w-7' : 'h-10 w-10 md:h-12 md:w-12'
            }`}
          />
          <div className="mt-1 bg-black/80 border border-emerald-900/60 rounded px-1 py-0.5 text-center shadow-lg max-w-[80px] md:max-w-[100px] pointer-events-none">
            <p className="text-[8px] md:text-[9px] font-extrabold text-white truncate">{assigned.name}</p>
            <p className="text-[7px] md:text-[8px] text-emerald-400 font-bold leading-none mt-0.5">{spot.label}</p>
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center rounded-full border-2 transition-colors ${
            isOver
              ? 'bg-emerald-500/20 border-emerald-400 scale-110'
              : isSelected && !miniMode
              ? 'bg-emerald-950/40 border-emerald-400'
              : 'bg-black/60 border-emerald-500/30'
          } ${miniMode ? 'h-7 w-7' : 'h-9 w-9 md:h-11 md:w-11'}`}
        >
          <span className="text-[8px] md:text-[9px] font-extrabold text-emerald-400">{spot.label}</span>
        </div>
      )}
    </div>
  );
};

const TacticalBoardContent: React.FC = () => {
  const { players } = usePlayersQuery();
  const { addToast } = useUIStore();

  // Active Lineup State
  const [formationName, setFormationName] = useState<string>('4-3-3');
  const [spots, setSpots] = useState<TacticalSpot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  // Saved Lineups Registry
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>([]);
  const [newLineupName, setNewLineupName] = useState('');

  // Comparison State
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareLineupA, setCompareLineupA] = useState<string>('');
  const [compareLineupB, setCompareLineupB] = useState<string>('');

  // Search in sidebar
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Initialize active spots based on preset
  useEffect(() => {
    const preset = FORMATION_PRESETS[formationName] || FORMATION_PRESETS['4-3-3'];
    setSpots(
      preset.map((p) => ({
        ...p,
        assignedPlayer: null,
      }))
    );
    setSelectedSpotId(null);
  }, [formationName]);

  // Load saved lineups on boot
  useEffect(() => {
    const loaded = getStorageItem<SavedLineup[]>('ctsn_saved_lineups', []);
    setSavedLineups(loaded);
    if (loaded.length >= 2) {
      setCompareLineupA(loaded[0].id);
      setCompareLineupB(loaded[1].id);
    }
  }, []);

  const handleSaveLineup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineupName.trim()) {
      addToast('Indique un nombre para la alineación', 'warning');
      return;
    }
    const newLineup: SavedLineup = {
      id: `lineup_${Math.random().toString(36).substring(2, 9)}`,
      name: newLineupName,
      formation: formationName,
      spots: [...spots],
      createdAt: new Date().toISOString(),
    };
    const updated = [newLineup, ...savedLineups];
    setSavedLineups(updated);
    setStorageItem('ctsn_saved_lineups', updated);
    setNewLineupName('');
    addToast('Alineación guardada con éxito', 'success');
  };

  const handleDeleteLineup = (id: string) => {
    if (confirm('¿Eliminar esta alineación guardada?')) {
      const updated = savedLineups.filter((l) => l.id !== id);
      setSavedLineups(updated);
      setStorageItem('ctsn_saved_lineups', updated);
      addToast('Alineación eliminada', 'warning');
    }
  };

  const handleLoadLineup = (lineup: SavedLineup) => {
    setFormationName(lineup.formation);
    setSpots(lineup.spots);
    setSelectedSpotId(null);
    addToast(`Cargada alineación: ${lineup.name}`, 'success');
  };

  const handleDropPlayer = (spotId: string, player: Player) => {
    // Prevent same player duplicate on different spots
    const cleanSpots = spots.map((s) => {
      if (s.assignedPlayer?.id === player.id) {
        return { ...s, assignedPlayer: null };
      }
      return s;
    });

    // Assign player
    setSpots(
      cleanSpots.map((s) => (s.id === spotId ? { ...s, assignedPlayer: player } : s))
    );
  };

  const handleRemovePlayer = (spotId: string) => {
    setSpots(spots.map((s) => (s.id === spotId ? { ...s, assignedPlayer: null } : s)));
  };

  // Spot coordinate adjusters (custom mapping)
  const activeSpot = spots.find((s) => s.id === selectedSpotId);

  const handleAdjustCoordinate = (axis: 'top' | 'left', val: number) => {
    if (!selectedSpotId) return;
    setSpots(
      spots.map((s) =>
        s.id === selectedSpotId ? { ...s, [axis]: `${val}%` } : s
      )
    );
    if (formationName !== 'Custom') {
      setFormationName('Custom');
    }
  };

  const handleShareLineup = () => {
    const fakeShareUrl = `${window.location.origin}/tactical-board#share=${Math.random().toString(36).substring(2, 8)}`;
    navigator.clipboard.writeText(fakeShareUrl);
    addToast('¡Enlace de pizarra táctica copiado al portapapeles!', 'success');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ formation: formationName, spots }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tactical_model_${formationName.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Archivo de pizarra táctica JSON descargado', 'success');
  };

  // Search filter
  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    p.club.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Lineups for comparison
  const lineupAObj = savedLineups.find((l) => l.id === compareLineupA);
  const lineupBObj = savedLineups.find((l) => l.id === compareLineupB);

  const getLineupAvgRating = (l?: SavedLineup) => {
    if (!l) return 0;
    const assigned = l.spots.filter((s) => !!s.assignedPlayer);
    if (assigned.length === 0) return 0;
    const sum = assigned.reduce((acc, curr) => acc + (curr.assignedPlayer?.rating || 0), 0);
    return sum / assigned.length;
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1e293b] pb-5 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Pizarra Táctica (Campograma)</h2>
          <p className="text-gray-400 mt-1">
            Diseñe modelos de juego, posicione candidatos, compare alineaciones y exporte pizarras de ojeo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              comparisonMode
                ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500'
                : 'border-[#1e293b] bg-[#141a29] text-gray-300 hover:bg-[#1e293d]'
            }`}
          >
            <ArrowRightLeft size={13} />
            {comparisonMode ? 'Vista Tablero' : 'Comparar Pizarras'}
          </button>
          
          <button
            onClick={handleShareLineup}
            className="flex items-center gap-1.5 rounded-xl border border-[#1e293b] bg-[#141a29] px-4 py-2 text-xs font-bold text-gray-350 hover:bg-[#1e293d] transition-colors"
          >
            <Share2 size={13} /> Compartir
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-xl border border-[#1e293b] bg-[#141a29] px-4 py-2 text-xs font-bold text-gray-350 hover:bg-[#1e293d] transition-colors"
          >
            <Download size={13} /> Exportar JSON
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-colors"
          >
            <Printer size={13} /> Imprimir
          </button>
        </div>
      </div>

      {/* Comparison Split Mode */}
      {comparisonMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Pitch A */}
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-2">
              <span className="text-xs font-bold text-white">Pizarra Comparativa A</span>
              <select
                value={compareLineupA}
                onChange={(e) => setCompareLineupA(e.target.value)}
                className="rounded-lg border border-[#1e293b] bg-[#141a29] px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">Seleccione Pizarra...</option>
                {savedLineups.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {lineupAObj ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-[280px] aspect-[3/4] bg-emerald-950 border border-emerald-600/30 rounded-2xl overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-[#133017] to-emerald-950"></div>
                  <div className="absolute top-1/2 left-1/2 h-16 w-16 border border-emerald-500/25 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-0 w-full border-t border-emerald-500/25"></div>
                  <div className="absolute bottom-0 left-1/2 w-40 h-20 border border-emerald-500/25 border-b-0 -translate-x-1/2"></div>
                  <div className="absolute top-0 left-1/2 w-40 h-20 border border-emerald-500/25 border-t-0 -translate-x-1/2"></div>

                  {lineupAObj.spots.map((spot) => (
                    <TacticalPitchSpot
                      key={spot.id}
                      spot={spot}
                      isSelected={false}
                      onSelect={() => {}}
                      onDropPlayer={() => {}}
                      onRemovePlayer={() => {}}
                      miniMode={true}
                    />
                  ))}
                </div>
                <div className="text-center text-xs leading-normal">
                  <p className="font-extrabold text-white">{lineupAObj.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Formación: {lineupAObj.formation}</p>
                  <p className="text-[10px] text-amber-500 font-extrabold mt-1">
                    Nota Media: {getLineupAvgRating(lineupAObj).toFixed(1)} ★
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-gray-500">
                Seleccione una alineación para renderizar.
              </div>
            )}
          </div>

          {/* Pitch B */}
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-2">
              <span className="text-xs font-bold text-white">Pizarra Comparativa B</span>
              <select
                value={compareLineupB}
                onChange={(e) => setCompareLineupB(e.target.value)}
                className="rounded-lg border border-[#1e293b] bg-[#141a29] px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">Seleccione Pizarra...</option>
                {savedLineups.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {lineupBObj ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-[280px] aspect-[3/4] bg-emerald-950 border border-emerald-600/30 rounded-2xl overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-[#133017] to-emerald-950"></div>
                  <div className="absolute top-1/2 left-1/2 h-16 w-16 border border-emerald-500/25 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-0 w-full border-t border-emerald-500/25"></div>
                  <div className="absolute bottom-0 left-1/2 w-40 h-20 border border-emerald-500/25 border-b-0 -translate-x-1/2"></div>
                  <div className="absolute top-0 left-1/2 w-40 h-20 border border-emerald-500/25 border-t-0 -translate-x-1/2"></div>

                  {lineupBObj.spots.map((spot) => (
                    <TacticalPitchSpot
                      key={spot.id}
                      spot={spot}
                      isSelected={false}
                      onSelect={() => {}}
                      onDropPlayer={() => {}}
                      onRemovePlayer={() => {}}
                      miniMode={true}
                    />
                  ))}
                </div>
                <div className="text-center text-xs leading-normal">
                  <p className="font-extrabold text-white">{lineupBObj.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Formación: {lineupBObj.formation}</p>
                  <p className="text-[10px] text-amber-500 font-extrabold mt-1">
                    Nota Media: {getLineupAvgRating(lineupBObj).toFixed(1)} ★
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-gray-500">
                Seleccione una alineación para renderizar.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Normal Layout: sidebar (lineups + players) and active pitch board */
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Column 1: Saved Lineups Registry & Active Formation Controls */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Formation selection */}
            <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#1e293b]/60 pb-2 uppercase tracking-wide">
                <Compass className="text-emerald-500" size={14} /> Esquema Táctico
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1', 'Custom'].map((formName) => (
                  <button
                    key={formName}
                    onClick={() => setFormationName(formName)}
                    className={`text-[11px] font-bold py-2 rounded-lg border text-center transition-colors ${
                      formationName === formName
                        ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                        : 'border-[#1e293b] bg-[#141a29] text-gray-400 hover:bg-[#1e293d]'
                    }`}
                  >
                    {formName}
                  </button>
                ))}
              </div>

              {/* Position Coordinator (if spot is selected) */}
              {selectedSpotId && activeSpot && (
                <div className="border-t border-[#1e293b] pt-3 space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      Ajustar Foco: {activeSpot.label}
                    </span>
                    <button
                      onClick={() => setSelectedSpotId(null)}
                      className="text-gray-500 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1">
                        <span>Ancho (Horizontal %)</span>
                        <span>{activeSpot.left}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={parseInt(activeSpot.left)}
                        onChange={(e) => handleAdjustCoordinate('left', Number(e.target.value))}
                        className="w-full h-1 bg-[#141a29] rounded accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1">
                        <span>Profundidad (Vertical %)</span>
                        <span>{activeSpot.top}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={parseInt(activeSpot.top)}
                        onChange={(e) => handleAdjustCoordinate('top', Number(e.target.value))}
                        className="w-full h-1 bg-[#141a29] rounded accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Lineup form */}
            <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#1e293b]/60 pb-2 uppercase tracking-wide">
                <Layers className="text-emerald-500" size={14} /> Guardar Alineación
              </h3>
              <form onSubmit={handleSaveLineup} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre de la pizarra..."
                  value={newLineupName}
                  onChange={(e) => setNewLineupName(e.target.value)}
                  className="w-full rounded-xl border border-[#1e293b] bg-[#141a29] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                >
                  <Plus size={14} /> Guardar Configuración
                </button>
              </form>

              {/* Saved registry */}
              <div className="border-t border-[#1e293b] pt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                {savedLineups.map((lineup) => (
                  <div
                    key={lineup.id}
                    className="flex justify-between items-center p-2 rounded bg-[#141a29] border border-[#1e293b]/60 text-xs hover:border-emerald-500/40 transition-colors cursor-pointer"
                    onClick={() => handleLoadLineup(lineup)}
                  >
                    <div>
                      <p className="font-bold text-gray-200 leading-tight truncate max-w-[120px]">{lineup.name}</p>
                      <p className="text-[8px] text-gray-500 mt-0.5">{lineup.formation}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLineup(lineup.id);
                      }}
                      className="p-1 text-gray-500 hover:text-red-400 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {savedLineups.length === 0 && (
                  <p className="text-[10px] text-center text-gray-500 py-2">No hay alineaciones guardadas.</p>
                )}
              </div>
            </div>

          </div>

          {/* Column 2: Active Soccer Pitch Board */}
          <div className="xl:col-span-2 flex flex-col items-center">
            <div
              className="relative w-full max-w-[380px] md:max-w-[420px] aspect-[3/4] bg-emerald-950 border border-emerald-600/30 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-950/40"
              onClick={() => setSelectedSpotId(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-[#122e16] to-emerald-950"></div>
              <div className="absolute top-1/2 left-1/2 h-24 w-24 border border-emerald-500/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-0 w-full border-t border-emerald-500/20"></div>
              <div className="absolute bottom-0 left-1/2 w-56 h-28 border border-emerald-500/20 border-b-0 -translate-x-1/2"></div>
              <div className="absolute top-0 left-1/2 w-56 h-28 border border-emerald-500/20 border-t-0 -translate-x-1/2"></div>

              {/* Render spots on the field */}
              {spots.map((spot) => (
                <TacticalPitchSpot
                  key={spot.id}
                  spot={spot}
                  isSelected={selectedSpotId === spot.id}
                  onSelect={() => setSelectedSpotId(spot.id)}
                  onDropPlayer={(player) => handleDropPlayer(spot.id, player)}
                  onRemovePlayer={() => handleRemovePlayer(spot.id)}
                />
              ))}
            </div>
          </div>

          {/* Column 3: Draggable Players List sidebar */}
          <div className="xl:col-span-1 rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-lg flex flex-col h-[560px]">
            <h3 className="text-xs font-bold text-white flex items-center justify-between border-b border-[#1e293b]/60 pb-2 uppercase tracking-wide shrink-0">
              <span className="flex items-center gap-2">
                <Users className="text-emerald-500" size={14} /> Candidatos
              </span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 font-bold uppercase">
                Arrastrar
              </span>
            </h3>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Buscar por nombre o club..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="mt-3 w-full rounded-xl border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shrink-0"
            />

            {/* List */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
              {filteredPlayers.map((player) => (
                <DraggableSidebarPlayer key={player.id} player={player} />
              ))}
              {filteredPlayers.length === 0 && (
                <p className="text-[10px] text-center text-gray-500 py-8">Ningún jugador ojeado.</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export const TacticalBoardPage: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TacticalBoardContent />
    </DndProvider>
  );
};
