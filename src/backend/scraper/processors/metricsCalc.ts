import { MatchEvent, PlayerMetrics } from '../types/index.js';

/**
 * Normaliza cualquier métrica absoluta a un valor "por 90 minutos".
 */
export function calculateP90(metric: number, minutesPlayed: number): number {
  if (minutesPlayed === 0) return 0;
  return Number(((metric / minutesPlayed) * 90).toFixed(2));
}

/**
 * Calcula el porcentaje de éxito.
 */
export function calculatePercentage(successful: number, total: number): number {
  if (total === 0) return 0;
  return Number(((successful / total) * 100).toFixed(2));
}

/**
 * Verifica si unas coordenadas dadas corresponden a campo propio.
 * Asume escala x: 0 a 100, donde 0 es la propia portería.
 */
export function isOwnHalf(x: number): boolean {
  return x <= 50;
}
