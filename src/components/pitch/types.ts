/**
 * Evento "slim" que viaja comprimido en Storage ({matchId}/events.json.gz).
 * Es el subconjunto mínimo de los eventos Opta necesario para dibujar
 * campogramas (pases, tiros, acciones defensivas...). El pipeline de Python
 * genera este formato a partir del JSON crudo de la API.
 *
 * Sistema de coordenadas Opta:
 *   - x: 0 (línea de fondo propia) → 100 (portería rival)
 *   - y: 0 (banda derecha) → 100 (banda izquierda)
 *   - Portería rival en (100, 50). Área rival: x > 83 y 21.1 ≤ y ≤ 78.9.
 */
export interface SlimEvent {
  /** typeId de Opta (1 = Pass, 13 = Miss, 14 = Post, 15 = Attempt Saved, 16 = Goal...) */
  type: number;
  /** Nombre legible del tipo de evento (opcional, para tooltips) */
  typeName?: string;
  x: number;
  y: number;
  /** Coordenada destino (fin de pase / dirección de tiro). Opta qualifiers 140/141 */
  endX?: number;
  endY?: number;
  playerId?: string;
  playerName?: string;
  teamId?: string;
  /** 1 = exitoso, 0 = fallido */
  outcome?: number;
  min?: number;
  sec?: number;
  /** Expected Goals del disparo, si está calculado */
  xg?: number;
}

/** Tipos de campograma que sabe pintar el PitchMap. */
export type PitchMapMode = 'passes' | 'shots' | 'defensive' | 'touches' | 'heatmap';

/** typeId de Opta relevantes para el render. */
export const OPTA = {
  PASS: 1,
  OFFSIDE_PASS: 2,
  TAKE_ON: 3,
  TACKLE: 7,
  INTERCEPTION: 8,
  CLEARANCE: 12,
  MISS: 13,
  POST: 14,
  ATTEMPT_SAVED: 15,
  GOAL: 16,
  BALL_RECOVERY: 49,
  BLOCKED_PASS: 74,
} as const;

export const SHOT_TYPES: number[] = [OPTA.MISS, OPTA.POST, OPTA.ATTEMPT_SAVED, OPTA.GOAL];
export const DEFENSIVE_TYPES: number[] = [
  OPTA.TACKLE,
  OPTA.INTERCEPTION,
  OPTA.CLEARANCE,
  OPTA.BALL_RECOVERY,
  OPTA.BLOCKED_PASS,
];
