import { BaseNormalizer } from '../core/BaseNormalizer';
import { RawStatsApiPlayer, NormalizedPlayerDTO } from '../types';
import { PlayerPosition } from '../../../types';

export class StatsApiNormalizer implements BaseNormalizer<RawStatsApiPlayer> {
  normalize(raw: RawStatsApiPlayer): NormalizedPlayerDTO {
    return {
      externalIds: {
        statsApi: String(raw.player_id),
      },
      name: raw.full_name,
      birthDate: raw.dob,
      nationality: raw.nation,
      height: raw.height_cm,
      weight: raw.weight_kg,
      preferredFoot: raw.foot === 'left' ? 'left' : raw.foot === 'right' ? 'right' : 'both',
      marketValue: raw.value_eur,
      currentClubName: raw.team_name,
      primaryPosition: this.mapPosition(raw.role),
      attributes: {
        pace: raw.metrics.speed,
        shooting: raw.metrics.shot_power,
        passing: raw.metrics.passing_accuracy,
        dribbling: raw.metrics.dribble_success,
        defending: raw.metrics.interceptions,
        physical: raw.metrics.stamina,
        tactical: raw.metrics.positioning,
      },
      stats: {
        matchesPlayed: raw.season_stats.appearances,
        minutesPlayed: raw.season_stats.minutes,
        goals: raw.season_stats.goals,
        assists: raw.season_stats.assists,
        yellowCards: raw.season_stats.yellows,
        redCards: raw.season_stats.reds,
      },
    };
  }

  private mapPosition(role: string): PlayerPosition {
    const r = role.toLowerCase();
    if (r.includes('striker') || r.includes('forward')) return 'ST';
    if (r.includes('winger') || r.includes('winger left')) return 'LW';
    if (r.includes('winger right')) return 'RW';
    if (r.includes('attacking midfielder') || r.includes('playmaker')) return 'AM';
    if (r.includes('defensive midfielder') || r.includes('pivote')) return 'DM';
    if (r.includes('midfielder') || r.includes('central midfielder')) return 'CM';
    if (r.includes('goalkeeper')) return 'GK';
    if (r.includes('fullback left') || r.includes('left back')) return 'LB';
    if (r.includes('fullback right') || r.includes('right back')) return 'RB';
    return 'CB'; // default defender
  }
}
