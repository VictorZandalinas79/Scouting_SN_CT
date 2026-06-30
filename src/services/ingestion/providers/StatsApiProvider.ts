import { BaseProvider } from './BaseProvider';
import { RawStatsApiPlayer } from '../types';

export class StatsApiProvider extends BaseProvider<RawStatsApiPlayer> {
  async fetchRawData(query?: string): Promise<RawStatsApiPlayer[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Mock API payload from a professional source (Opta style)
    const mockApiData: RawStatsApiPlayer[] = [
      {
        player_id: 10011,
        full_name: 'Erling Haaland',
        dob: '2000-07-21',
        nation: 'Norway',
        height_cm: 194,
        weight_kg: 88,
        foot: 'left',
        value_eur: 180000000,
        team_name: 'Manchester City FC',
        role: 'Striker',
        metrics: {
          speed: 94,
          shot_power: 96,
          passing_accuracy: 75,
          dribble_success: 82,
          interceptions: 45,
          stamina: 88,
          positioning: 92,
        },
        season_stats: {
          appearances: 34,
          minutes: 2950,
          goals: 36,
          assists: 8,
          yellows: 3,
          reds: 0,
        },
      },
      {
        player_id: 10012,
        full_name: 'Kylian Mbappé',
        dob: '1998-12-20',
        nation: 'France',
        height_cm: 178,
        weight_kg: 73,
        foot: 'right',
        value_eur: 180000000,
        team_name: 'Real Madrid CF',
        role: 'Forward',
        metrics: {
          speed: 97,
          shot_power: 90,
          passing_accuracy: 84,
          dribble_success: 93,
          interceptions: 35,
          stamina: 89,
          positioning: 90,
        },
        season_stats: {
          appearances: 32,
          minutes: 2780,
          goals: 27,
          assists: 7,
          yellows: 2,
          reds: 0,
        },
      },
    ];

    if (query) {
      return mockApiData.filter((p) =>
        p.full_name.toLowerCase().includes(query.toLowerCase())
      );
    }
    return mockApiData;
  }
}
