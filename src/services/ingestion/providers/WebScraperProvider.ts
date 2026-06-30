import { BaseProvider } from './BaseProvider';
import { RawWebScrapedPlayer } from '../types';

export class WebScraperProvider extends BaseProvider<RawWebScrapedPlayer> {
  async fetchRawData(query?: string): Promise<RawWebScrapedPlayer[]> {
    // Simulate scraping delay
    await new Promise((resolve) => setTimeout(resolve, 900));

    // Mock scraped profiles (e.g., Transfermarkt scraper payload)
    const mockScrapedData: RawWebScrapedPlayer[] = [
      {
        scraping_url: 'https://www.transfermarkt.com/jude-bellingham/profil/spieler/581678',
        scraped_at: new Date().toISOString(),
        profile: {
          name: 'Jude Bellingham',
          born: '2003-06-29',
          citizenship: 'England',
          height: '1,86 m',
          weight: '75 kg',
          strong_foot: 'right',
          market_value_str: '180.00 Mill. €',
          club: 'Real Madrid CF',
          main_position: 'Midfield - Attacking Midfield',
        },
        ratings: {
          acceleration: 84,
          finishing: 86,
          playmaking: 88,
          ball_control: 90,
          tackling: 78,
          strength: 89,
          tactics: 92,
        },
        history_summary: {
          matches: 28,
          mins: 2320,
          goals: 19,
          assists: 6,
          yellows: 5,
          reds: 0,
        },
      },
      {
        // Duplicate Candidate for Erling Haaland to test deduplication!
        scraping_url: 'https://www.transfermarkt.com/erling-haaland/profil/spieler/418560',
        scraped_at: new Date().toISOString(),
        profile: {
          name: 'Erling Haaland', // same birthdate, similar attributes
          born: '2000-07-21',
          citizenship: 'Norway',
          height: '1,94 m',
          weight: '88 kg',
          strong_foot: 'left',
          market_value_str: '180.00 Mill. €',
          club: 'Manchester City FC',
          main_position: 'Attack - Centre-Forward',
        },
        ratings: {
          acceleration: 93,
          finishing: 96,
          playmaking: 75,
          ball_control: 82,
          tackling: 45,
          strength: 92,
          tactics: 88,
        },
        history_summary: {
          matches: 34,
          mins: 2950,
          goals: 36,
          assists: 8,
          yellows: 3,
          reds: 0,
        },
      },
    ];

    if (query) {
      return mockScrapedData.filter((p) =>
        p.profile.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    return mockScrapedData;
  }
}
