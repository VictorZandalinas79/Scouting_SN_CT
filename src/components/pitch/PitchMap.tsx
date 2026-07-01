import React, { useMemo } from 'react';
import { Pitch } from './Pitch';
import { fx, fy } from './geometry';
import {
  SlimEvent,
  PitchMapMode,
  OPTA,
  SHOT_TYPES,
  DEFENSIVE_TYPES,
} from './types';

const OK = '#34d399'; // emerald-400
const FAIL = '#fb7185'; // rose-400
const SAVED = '#fbbf24'; // amber-400
const NEUTRAL = '#94a3b8'; // slate-400

interface PitchMapProps {
  events: SlimEvent[];
  mode: PitchMapMode;
  /** Si se pasa, solo se pintan los eventos de este jugador. */
  playerId?: string;
  className?: string;
}

/** Flechas de pase: verde = completado, rojo = fallado. */
const PassesLayer: React.FC<{ events: SlimEvent[] }> = ({ events }) => {
  const passes = events.filter(
    (e) => e.type === OPTA.PASS && e.endX != null && e.endY != null
  );
  return (
    <g>
      {passes.map((e, i) => {
        const ok = e.outcome === 1;
        const color = ok ? OK : FAIL;
        return (
          <line
            key={i}
            x1={fx(e.x)}
            y1={fy(e.y)}
            x2={fx(e.endX!)}
            y2={fy(e.endY!)}
            stroke={color}
            strokeWidth={0.35}
            strokeOpacity={ok ? 0.75 : 0.55}
            markerEnd={`url(#arrow-${ok ? 'ok' : 'fail'})`}
          >
            <title>
              {(e.playerName || 'Pase')} · {ok ? 'completado' : 'fallado'}
              {e.min != null ? ` · ${e.min}'` : ''}
            </title>
          </line>
        );
      })}
    </g>
  );
};

/** Tiros: tamaño por xG, color por resultado. Gol relleno, resto anillo. */
const ShotsLayer: React.FC<{ events: SlimEvent[] }> = ({ events }) => {
  const shots = events.filter((e) => SHOT_TYPES.includes(e.type));
  return (
    <g>
      {shots.map((e, i) => {
        const isGoal = e.type === OPTA.GOAL;
        const isSaved = e.type === OPTA.ATTEMPT_SAVED;
        const color = isGoal ? OK : isSaved ? SAVED : FAIL;
        const r = 0.8 + Math.sqrt(Math.max(e.xg ?? 0.05, 0.02)) * 4;
        return (
          <circle
            key={i}
            cx={fx(e.x)}
            cy={fy(e.y)}
            r={r}
            fill={isGoal ? color : 'transparent'}
            fillOpacity={0.85}
            stroke={color}
            strokeWidth={0.35}
          >
            <title>
              {(e.playerName || 'Tiro')} · {e.typeName || (isGoal ? 'Gol' : 'Tiro')}
              {e.xg != null ? ` · xG ${e.xg.toFixed(2)}` : ''}
              {e.min != null ? ` · ${e.min}'` : ''}
            </title>
          </circle>
        );
      })}
    </g>
  );
};

/** Acciones defensivas: entradas, intercepciones, despejes, recuperaciones. */
const DefensiveLayer: React.FC<{ events: SlimEvent[] }> = ({ events }) => {
  const defs = events.filter((e) => DEFENSIVE_TYPES.includes(e.type));
  const colorFor = (t: number) => {
    if (t === OPTA.TACKLE) return OK;
    if (t === OPTA.INTERCEPTION) return '#38bdf8'; // sky-400
    if (t === OPTA.CLEARANCE) return SAVED;
    return NEUTRAL;
  };
  return (
    <g>
      {defs.map((e, i) => (
        <rect
          key={i}
          x={fx(e.x) - 0.9}
          y={fy(e.y) - 0.9}
          width={1.8}
          height={1.8}
          transform={`rotate(45 ${fx(e.x)} ${fy(e.y)})`}
          fill={colorFor(e.type)}
          fillOpacity={0.8}
        >
          <title>
            {(e.playerName || 'Acción')} · {e.typeName || 'defensiva'}
            {e.min != null ? ` · ${e.min}'` : ''}
          </title>
        </rect>
      ))}
    </g>
  );
};

/** Todos los toques como puntos. */
const TouchesLayer: React.FC<{ events: SlimEvent[] }> = ({ events }) => (
  <g>
    {events.map((e, i) => (
      <circle
        key={i}
        cx={fx(e.x)}
        cy={fy(e.y)}
        r={0.7}
        fill={OK}
        fillOpacity={0.55}
      >
        <title>
          {(e.playerName || 'Toque')}
          {e.min != null ? ` · ${e.min}'` : ''}
        </title>
      </circle>
    ))}
  </g>
);

/** Mapa de calor sencillo: rejilla 12x8, opacidad por densidad de eventos. */
const HeatmapLayer: React.FC<{ events: SlimEvent[] }> = ({ events }) => {
  const { cells, max } = useMemo(() => {
    const COLS = 12;
    const ROWS = 8;
    const grid = new Array(COLS * ROWS).fill(0);
    for (const e of events) {
      const cx = Math.min(COLS - 1, Math.max(0, Math.floor((e.x / 100) * COLS)));
      const cy = Math.min(ROWS - 1, Math.max(0, Math.floor((e.y / 100) * ROWS)));
      grid[cy * COLS + cx] += 1;
    }
    return { cells: grid, max: Math.max(1, ...grid), rows: ROWS, cols: COLS };
  }, [events]);

  const COLS = 12;
  const ROWS = 8;
  const cw = 105 / COLS;
  const ch = 68 / ROWS;

  return (
    <g style={{ filter: 'url(#heat-blur)' }}>
      {cells.map((count, idx) => {
        if (count === 0) return null;
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const intensity = count / max;
        return (
          <rect
            key={idx}
            x={col * cw}
            y={row * ch}
            width={cw}
            height={ch}
            fill={OK}
            fillOpacity={0.08 + intensity * 0.55}
          />
        );
      })}
    </g>
  );
};

export const PitchMap: React.FC<PitchMapProps> = ({
  events,
  mode,
  playerId,
  className,
}) => {
  const filtered = useMemo(
    () => (playerId ? events.filter((e) => e.playerId === playerId) : events),
    [events, playerId]
  );

  return (
    <Pitch className={className}>
      <defs>
        <marker
          id="arrow-ok"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill={OK} />
        </marker>
        <marker
          id="arrow-fail"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill={FAIL} />
        </marker>
        <filter id="heat-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {mode === 'passes' && <PassesLayer events={filtered} />}
      {mode === 'shots' && <ShotsLayer events={filtered} />}
      {mode === 'defensive' && <DefensiveLayer events={filtered} />}
      {mode === 'touches' && <TouchesLayer events={filtered} />}
      {mode === 'heatmap' && <HeatmapLayer events={filtered} />}
    </Pitch>
  );
};
