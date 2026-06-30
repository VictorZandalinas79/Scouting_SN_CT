export interface Qualifier {
  qualifierId: number;
  value?: string;
}

export interface MatchEvent {
  id: number;
  eventId: number;
  typeId: number;
  periodId: number;
  timeMin: number;
  timeSec: number;
  contestantId: string;
  playerId: string;
  x: number;
  y: number;
  qualifier?: Qualifier[];
}

export interface MatchData {
  matchInfo: {
    id: string;
    contestant: Array<{ id: string; name: string }>;
  };
  liveData: {
    event: MatchEvent[];
  };
}

export interface PlayerMetrics {
  match_id: string;
  player_id: string;
  team_id: string;
  minutes_played: number;

  def_aereos_ganados_propio: number;
  def_aereos_ganados_propio_p90: number;
  
  def_recuperaciones: number;
  def_recuperaciones_p90: number;

  entradas_totales: number;
  entradas_exitosas: number;
  precision_entradas_pct: number;

  abp_lanzador_corner: number;
  abp_lanzador_corner_p90: number;
}
