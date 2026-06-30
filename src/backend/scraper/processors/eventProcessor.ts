import { MatchData, MatchEvent, PlayerMetrics } from '../types/index.js';
import { calculateP90, calculatePercentage, isOwnHalf } from './metricsCalc.js';

// Mapeo sugerido para Opta/Scoresway (estos IDs son hipotéticos o estándares comunes en Opta)
const EVENT_TYPES = {
  PASS: 1,
  TACKLE: 7,
  RECOVERY: 49,
  AERIAL_DUEL: 44,
  CORNER_AWARDED: 6, // u otros asociados a saque de esquina
};

// Qualifiers (Opta usa qualifiers para indicar si fue exitoso, zona, etc)
const QUALIFIERS = {
  WON: 286,    // Qualifier indicando éxito (ej. duelo aéreo ganado)
  CORNER: 6,   // Indicador de corner
};

/**
 * Función principal para procesar los eventos crudos y transformarlos en métricas por jugador.
 */
export function processMatchEvents(matchData: MatchData, matchId: string): PlayerMetrics[] {
  const events = matchData.liveData?.event || [];
  
  // Agruparemos por playerId
  const playerStatsMap = new Map<string, any>();

  // Iterar por todos los eventos
  for (const event of events) {
    // Solo nos importan los eventos de jugadores en el campo
    if (!event.playerId) continue;

    if (!playerStatsMap.has(event.playerId)) {
      playerStatsMap.set(event.playerId, {
        match_id: matchId,
        player_id: event.playerId,
        team_id: event.contestantId,
        minutes_played: 90, // Por simplicidad asumimos 90. En producción, calcula según entradas/salidas o usa stats base.
        
        def_aereos_ganados_propio: 0,
        def_recuperaciones: 0,
        entradas_totales: 0,
        entradas_exitosas: 0,
        abp_lanzador_corner: 0,
      });
    }

    const stats = playerStatsMap.get(event.playerId);

    // 1. Duelos Aéreos Ganados en Campo Propio
    if (event.typeId === EVENT_TYPES.AERIAL_DUEL && isOwnHalf(event.x)) {
      const isWon = event.qualifier?.some(q => q.qualifierId === QUALIFIERS.WON);
      if (isWon) {
        stats.def_aereos_ganados_propio += 1;
      }
    }

    // 2. Recuperaciones
    if (event.typeId === EVENT_TYPES.RECOVERY) {
      stats.def_recuperaciones += 1;
    }

    // 3. Precisión de Entradas (Tackles)
    if (event.typeId === EVENT_TYPES.TACKLE) {
      stats.entradas_totales += 1;
      const isWon = event.qualifier?.some(q => q.qualifierId === QUALIFIERS.WON);
      if (isWon) {
        stats.entradas_exitosas += 1;
      }
    }

    // 4. ABP Lanzador de Corner (Pases tipificados como corner)
    if (event.typeId === EVENT_TYPES.PASS) {
      const isCorner = event.qualifier?.some(q => q.qualifierId === QUALIFIERS.CORNER);
      if (isCorner) {
        stats.abp_lanzador_corner += 1;
      }
    }
  }

  // Segunda pasada para calcular P90s y porcentajes
  const finalMetrics: PlayerMetrics[] = Array.from(playerStatsMap.values()).map(stats => {
    return {
      match_id: stats.match_id,
      player_id: stats.player_id,
      team_id: stats.team_id,
      minutes_played: stats.minutes_played,

      def_aereos_ganados_propio: stats.def_aereos_ganados_propio,
      def_aereos_ganados_propio_p90: calculateP90(stats.def_aereos_ganados_propio, stats.minutes_played),

      def_recuperaciones: stats.def_recuperaciones,
      def_recuperaciones_p90: calculateP90(stats.def_recuperaciones, stats.minutes_played),

      entradas_totales: stats.entradas_totales,
      entradas_exitosas: stats.entradas_exitosas,
      precision_entradas_pct: calculatePercentage(stats.entradas_exitosas, stats.entradas_totales),

      abp_lanzador_corner: stats.abp_lanzador_corner,
      abp_lanzador_corner_p90: calculateP90(stats.abp_lanzador_corner, stats.minutes_played),
    };
  });

  return finalMetrics;
}
