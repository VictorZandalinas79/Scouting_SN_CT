import { PlayerPosition } from '../../types';

export interface IngestionAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  tactical: number;
}

export interface IngestionStats {
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

// The standardized target data format
export interface NormalizedPlayerDTO {
  externalIds: {
    statsApi?: string;
    webScraper?: string;
  };
  name: string;
  birthDate?: string; // YYYY-MM-DD
  nationality?: string;
  height?: number; // cm
  weight?: number; // kg
  preferredFoot?: 'left' | 'right' | 'both';
  marketValue?: number;
  currentClubName: string;
  primaryPosition: PlayerPosition;
  attributes: IngestionAttributes;
  stats: IngestionStats;
}

// Raw types from API Provider
export interface RawStatsApiPlayer {
  player_id: number;
  full_name: string;
  dob: string;
  nation: string;
  height_cm: number;
  weight_kg: number;
  foot: string;
  value_eur: number;
  team_name: string;
  role: string; // e.g. "Striker", "Midfielder"
  metrics: {
    speed: number;
    shot_power: number;
    passing_accuracy: number;
    dribble_success: number;
    interceptions: number;
    stamina: number;
    positioning: number;
  };
  season_stats: {
    appearances: number;
    minutes: number;
    goals: number;
    assists: number;
    yellows: number;
    reds: number;
  };
}

// Raw types from Web Scraper
export interface RawWebScrapedPlayer {
  scraping_url: string;
  scraped_at: string;
  profile: {
    name: string;
    born: string; // e.g., "1998-12-20"
    citizenship: string;
    height: string; // e.g., "1,87 m"
    weight?: string; // e.g., "82 kg"
    strong_foot?: string; // e.g., "right"
    market_value_str?: string; // e.g., "180.00 Mill. €"
    club: string;
    main_position: string; // e.g., "Forward - Center-Forward"
  };
  ratings: {
    acceleration: number;
    finishing: number;
    playmaking: number;
    ball_control: number;
    tackling: number;
    strength: number;
    tactics: number;
  };
  history_summary: {
    matches: number;
    mins: number;
    goals: number;
    assists: number;
    yellows: number;
    reds: number;
  };
}
