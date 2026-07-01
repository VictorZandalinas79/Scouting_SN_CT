import React, { useMemo, useState } from 'react';
import {
  Route as RouteIcon,
  Target,
  Shield,
  Activity,
  Flame,
  Search,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { PitchMap } from '../components/pitch/PitchMap';
import { PitchMapMode, SHOT_TYPES, OPTA, SlimEvent } from '../components/pitch/types';
import { SAMPLE_EVENTS } from '../components/pitch/sampleEvents';
import { useMatchEventsQuery } from '../features/events/hooks/useMatchEventsQuery';

const MODES: { id: PitchMapMode; label: string; icon: React.ElementType }[] = [
  { id: 'passes', label: 'Pases', icon: RouteIcon },
  { id: 'shots', label: 'Tiros', icon: Target },
  { id: 'defensive', label: 'Defensa', icon: Shield },
  { id: 'touches', label: 'Toques', icon: Activity },
  { id: 'heatmap', label: 'Mapa de calor', icon: Flame },
];

export const CampogramaPage: React.FC = () => {
  const [mode, setMode] = useState<PitchMapMode>('passes');
  const [playerId, setPlayerId] = useState<string>('');
  const [matchInput, setMatchInput] = useState<string>('');
  const [loadedMatchId, setLoadedMatchId] = useState<string>('');

  const { events: realEvents, isLoading, isError, error } = useMatchEventsQuery(
    loadedMatchId || undefined
  );

  // Fuente de datos activa: partido real si se cargó con éxito, si no la demo.
  const usingReal = !!loadedMatchId && !isError && realEvents.length > 0;
  const events: SlimEvent[] = usingReal ? realEvents : SAMPLE_EVENTS;

  // Lista de jugadores derivada de los eventos activos.
  const players = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of events) {
      if (e.playerId) map.set(e.playerId, e.playerName || e.playerId);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [events]);

  const scoped = useMemo(
    () => (playerId ? events.filter((e) => e.playerId === playerId) : events),
    [events, playerId]
  );

  const stats = useMemo(() => {
    const passes = scoped.filter((e) => e.type === OPTA.PASS);
    const passOk = passes.filter((e) => e.outcome === 1).length;
    const shots = scoped.filter((e) => SHOT_TYPES.includes(e.type));
    const goals = shots.filter((e) => e.type === OPTA.GOAL).length;
    const xg = shots.reduce((s, e) => s + (e.xg ?? 0), 0);
    return {
      passes: passes.length,
      passPct: passes.length ? Math.round((passOk / passes.length) * 100) : 0,
      shots: shots.length,
      goals,
      xg: xg.toFixed(2),
    };
  }, [scoped]);

  const handleLoad = () => {
    setPlayerId('');
    setLoadedMatchId(matchInput.trim());
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Campograma</h1>
          <p className="text-sm text-gray-400">
            {usingReal ? (
              <>
                Partido <span className="font-semibold text-emerald-400">{loadedMatchId}</span> ·{' '}
                {events.length} eventos
              </>
            ) : (
              'Datos de ejemplo (demo). Introduce un ID de partido para cargar datos reales.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Carga de partido real */}
          <div className="flex items-center gap-1 rounded-lg border border-[#1e293b] bg-[#141a29] px-2 py-1">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
              placeholder="ID de partido…"
              className="w-40 bg-transparent px-1 py-1 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={handleLoad}
              disabled={!matchInput.trim()}
              className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cargar
            </button>
          </div>

          {/* Filtro de jugador */}
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="rounded-lg border border-[#1e293b] bg-[#141a29] px-3 py-2 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Todos los jugadores</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estados de carga / error */}
      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#141a29] px-4 py-2 text-sm text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Descargando y descomprimiendo eventos del partido…
        </div>
      )}
      {isError && loadedMatchId && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-900/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4" />
          No se pudo cargar el partido {loadedMatchId}. Mostrando datos de ejemplo.{' '}
          <span className="text-rose-400/70">({error?.message})</span>
        </div>
      )}

      {/* Selector de modo */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                  : 'border-[#1e293b] bg-[#141a29] text-gray-300 hover:border-emerald-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
        {/* Campo */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0b0f19] p-3 shadow-lg">
          <PitchMap events={events} mode={mode} playerId={playerId || undefined} />
        </div>

        {/* Panel lateral: resumen + leyenda */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#1e293b] bg-[#141a29] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
              Resumen
            </h3>
            <dl className="space-y-2 text-sm">
              <Stat label="Pases" value={`${stats.passes} (${stats.passPct}%)`} />
              <Stat label="Tiros" value={stats.shots} />
              <Stat label="Goles" value={stats.goals} />
              <Stat label="xG" value={stats.xg} />
            </dl>
          </div>

          <div className="rounded-xl border border-[#1e293b] bg-[#141a29] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
              Leyenda
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {mode === 'passes' && (
                <>
                  <Legend color="#34d399" label="Pase completado" />
                  <Legend color="#fb7185" label="Pase fallado" />
                </>
              )}
              {mode === 'shots' && (
                <>
                  <Legend color="#34d399" label="Gol (relleno)" />
                  <Legend color="#fbbf24" label="Tiro a puerta" />
                  <Legend color="#fb7185" label="Fuera / al palo" />
                  <li className="text-xs text-gray-500">Tamaño = xG</li>
                </>
              )}
              {mode === 'defensive' && (
                <>
                  <Legend color="#34d399" label="Entrada" />
                  <Legend color="#38bdf8" label="Intercepción" />
                  <Legend color="#fbbf24" label="Despeje" />
                  <Legend color="#94a3b8" label="Recuperación" />
                </>
              )}
              {mode === 'touches' && <Legend color="#34d399" label="Toque / acción" />}
              {mode === 'heatmap' && (
                <li className="text-xs text-gray-500">
                  Zonas más intensas = mayor densidad de acciones.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <dt className="text-gray-400">{label}</dt>
    <dd className="font-bold text-white">{value}</dd>
  </div>
);

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <li className="flex items-center gap-2">
    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
    {label}
  </li>
);
