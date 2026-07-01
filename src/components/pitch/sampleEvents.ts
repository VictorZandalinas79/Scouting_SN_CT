import { SlimEvent, OPTA } from './types';

/**
 * Dataset de ejemplo (mock) que imita lo que el pipeline generará por partido:
 * eventos slim de dos jugadores. Sirve para la demo del campograma antes de
 * conectar los .gz reales de Supabase Storage.
 */
const p = (
  x: number,
  y: number,
  endX: number,
  endY: number,
  outcome: number,
  playerId: string,
  playerName: string,
  min: number
): SlimEvent => ({
  type: OPTA.PASS,
  typeName: 'Pase',
  x,
  y,
  endX,
  endY,
  outcome,
  playerId,
  playerName,
  min,
});

const shot = (
  x: number,
  y: number,
  type: number,
  xg: number,
  playerId: string,
  playerName: string,
  min: number
): SlimEvent => ({
  type,
  typeName:
    type === OPTA.GOAL
      ? 'Gol'
      : type === OPTA.ATTEMPT_SAVED
      ? 'Tiro a puerta'
      : type === OPTA.POST
      ? 'Al palo'
      : 'Tiro fuera',
  x,
  y,
  xg,
  outcome: type === OPTA.GOAL ? 1 : 0,
  playerId,
  playerName,
  min,
});

const def = (
  x: number,
  y: number,
  type: number,
  typeName: string,
  playerId: string,
  playerName: string,
  min: number
): SlimEvent => ({ type, typeName, x, y, outcome: 1, playerId, playerName, min });

const HERRERA = { id: 'p1', name: 'Herrera' };
const NICO = { id: 'p2', name: 'Nico Williams' };

export const SAMPLE_EVENTS: SlimEvent[] = [
  // ── Pases de Herrera (mediocentro, juego interior) ──
  p(45, 50, 62, 55, 1, HERRERA.id, HERRERA.name, 4),
  p(52, 48, 68, 40, 1, HERRERA.id, HERRERA.name, 11),
  p(38, 60, 55, 72, 1, HERRERA.id, HERRERA.name, 18),
  p(60, 55, 78, 62, 1, HERRERA.id, HERRERA.name, 23),
  p(48, 45, 40, 30, 1, HERRERA.id, HERRERA.name, 29),
  p(55, 50, 72, 68, 0, HERRERA.id, HERRERA.name, 34),
  p(42, 38, 66, 25, 1, HERRERA.id, HERRERA.name, 41),
  p(58, 62, 84, 55, 0, HERRERA.id, HERRERA.name, 47),
  p(50, 52, 63, 48, 1, HERRERA.id, HERRERA.name, 55),
  p(46, 44, 59, 60, 1, HERRERA.id, HERRERA.name, 63),
  p(62, 58, 82, 72, 1, HERRERA.id, HERRERA.name, 70),
  p(54, 50, 71, 42, 0, HERRERA.id, HERRERA.name, 78),
  p(40, 55, 52, 68, 1, HERRERA.id, HERRERA.name, 85),

  // ── Pases de Nico Williams (extremo izquierdo) ──
  p(65, 82, 88, 70, 1, NICO.id, NICO.name, 7),
  p(72, 85, 92, 55, 0, NICO.id, NICO.name, 15),
  p(58, 78, 80, 88, 1, NICO.id, NICO.name, 26),
  p(80, 80, 94, 48, 1, NICO.id, NICO.name, 38),
  p(70, 88, 90, 62, 0, NICO.id, NICO.name, 52),
  p(75, 84, 93, 45, 1, NICO.id, NICO.name, 66),
  p(68, 90, 86, 74, 1, NICO.id, NICO.name, 74),
  p(82, 78, 95, 52, 0, NICO.id, NICO.name, 88),

  // ── Tiros ──
  shot(88, 52, OPTA.GOAL, 0.34, NICO.id, NICO.name, 39),
  shot(80, 40, OPTA.ATTEMPT_SAVED, 0.12, NICO.id, NICO.name, 53),
  shot(76, 60, OPTA.MISS, 0.06, NICO.id, NICO.name, 67),
  shot(90, 48, OPTA.POST, 0.28, HERRERA.id, HERRERA.name, 71),
  shot(72, 55, OPTA.MISS, 0.04, HERRERA.id, HERRERA.name, 46),

  // ── Acciones defensivas de Herrera ──
  def(42, 45, OPTA.TACKLE, 'Entrada', HERRERA.id, HERRERA.name, 13),
  def(38, 55, OPTA.INTERCEPTION, 'Intercepción', HERRERA.id, HERRERA.name, 22),
  def(48, 50, OPTA.BALL_RECOVERY, 'Recuperación', HERRERA.id, HERRERA.name, 31),
  def(35, 40, OPTA.CLEARANCE, 'Despeje', HERRERA.id, HERRERA.name, 44),
  def(44, 60, OPTA.TACKLE, 'Entrada', HERRERA.id, HERRERA.name, 58),
  def(40, 48, OPTA.BALL_RECOVERY, 'Recuperación', HERRERA.id, HERRERA.name, 82),

  // ── Acciones defensivas de Nico ──
  def(60, 85, OPTA.BALL_RECOVERY, 'Recuperación', NICO.id, NICO.name, 20),
  def(65, 80, OPTA.INTERCEPTION, 'Intercepción', NICO.id, NICO.name, 61),
];

export const SAMPLE_PLAYERS = [HERRERA, NICO];
