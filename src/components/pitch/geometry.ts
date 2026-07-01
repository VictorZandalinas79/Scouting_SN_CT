/**
 * Geometría del campo en coordenadas SVG.
 *
 * Trabajamos con un viewBox de PITCH_W x PITCH_H que respeta la proporción
 * real de un campo (~105x68 m). Los eventos vienen en coordenadas Opta 0-100
 * (tanto en x como en y) y se convierten con fx()/fy().
 */
export const PITCH_W = 105;
export const PITCH_H = 68;

/** Opta x (0-100) → coordenada SVG horizontal. */
export const fx = (x: number): number => (x / 100) * PITCH_W;

/**
 * Opta y (0-100) → coordenada SVG vertical.
 * Se invierte porque en SVG la y crece hacia abajo, y en Opta y=100 es la
 * banda superior cuando se ataca hacia la derecha.
 */
export const fy = (y: number): number => ((100 - y) / 100) * PITCH_H;

/** Distancia recorrida (para p.ej. escalar grosor de flechas de pase). */
export const passLength = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => Math.hypot(fx(x2) - fx(x1), fy(y2) - fy(y1));
