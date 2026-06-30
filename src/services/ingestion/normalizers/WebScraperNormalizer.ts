import { BaseNormalizer } from '../core/BaseNormalizer';
import { RawWebScrapedPlayer, NormalizedPlayerDTO } from '../types';
import { PlayerPosition } from '../../../types';

export class WebScraperNormalizer implements BaseNormalizer<RawWebScrapedPlayer> {
  normalize(raw: RawWebScrapedPlayer): NormalizedPlayerDTO {
    return {
      externalIds: {
        webScraper: raw.scraping_url,
      },
      name: raw.profile.name,
      birthDate: raw.profile.born,
      nationality: raw.profile.citizenship,
      height: this.parseHeight(raw.profile.height),
      weight: this.parseWeight(raw.profile.weight),
      preferredFoot: this.parseFoot(raw.profile.strong_foot),
      marketValue: this.parseMarketValue(raw.profile.market_value_str),
      currentClubName: raw.profile.club,
      primaryPosition: this.mapPosition(raw.profile.main_position),
      attributes: {
        pace: raw.ratings.acceleration,
        shooting: raw.ratings.finishing,
        passing: raw.ratings.playmaking,
        dribbling: raw.ratings.ball_control,
        defending: raw.ratings.tackling,
        physical: raw.ratings.strength,
        tactical: raw.ratings.tactics,
      },
      stats: {
        matchesPlayed: raw.history_summary.matches,
        minutesPlayed: raw.history_summary.mins,
        goals: raw.history_summary.goals,
        assists: raw.history_summary.assists,
        yellowCards: raw.history_summary.yellows,
        redCards: raw.history_summary.reds,
      },
    };
  }

  private parseHeight(val: string): number | undefined {
    // "1,86 m" -> 186
    if (!val) return undefined;
    const cleaned = val.replace(',', '.').replace(/[^0-9.]/g, '');
    const meters = parseFloat(cleaned);
    return isNaN(meters) ? undefined : Math.round(meters * 100);
  }

  private parseWeight(val?: string): number | undefined {
    // "75 kg" -> 75
    if (!val) return undefined;
    const cleaned = val.replace(/[^0-9]/g, '');
    const kg = parseInt(cleaned, 10);
    return isNaN(kg) ? undefined : kg;
  }

  private parseFoot(val?: string): 'left' | 'right' | 'both' {
    if (!val) return 'right';
    const f = val.toLowerCase();
    if (f.includes('left')) return 'left';
    if (f.includes('both')) return 'both';
    return 'right';
  }

  private parseMarketValue(val?: string): number | undefined {
    // "180.00 Mill. €" -> 180000000, "500 K €" -> 500000
    if (!val) return undefined;
    const cleaned = val.replace(',', '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return undefined;

    if (val.toLowerCase().includes('mill')) {
      return Math.round(num * 1000000);
    }
    if (val.toLowerCase().includes('k')) {
      return Math.round(num * 1000);
    }
    return Math.round(num);
  }

  private mapPosition(pos: string): PlayerPosition {
    const p = pos.toLowerCase();
    if (p.includes('centre-forward') || p.includes('striker')) return 'ST';
    if (p.includes('left winger')) return 'LW';
    if (p.includes('right winger')) return 'RW';
    if (p.includes('attacking midfield')) return 'AM';
    if (p.includes('defensive midfield')) return 'DM';
    if (p.includes('central midfield')) return 'CM';
    if (p.includes('goalkeeper')) return 'GK';
    if (p.includes('left-back') || p.includes('left back')) return 'LB';
    if (p.includes('right-back') || p.includes('right back')) return 'RB';
    return 'CB'; // default
  }
}
