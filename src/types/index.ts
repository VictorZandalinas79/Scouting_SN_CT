export type UserRole = 'admin' | 'head_scout' | 'scout';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clubId: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  logoUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export type PlayerPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'DM' | 'CM' | 'AM' | 'LW' | 'RW' | 'ST';

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  tactical: number;
}

export interface PlayerStats {
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export type PlayerStatus = 'Monitored' | 'Target' | 'Recommended' | 'Archived';

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  club: string;
  position: PlayerPosition;
  preferredFoot: 'Left' | 'Right' | 'Both';
  height: number; // in cm
  weight: number; // in kg
  contractUntil: string;
  marketValue: number; // in EUR
  photoUrl?: string;
  rating: number; // 1 to 5 stars or 1-100
  potential: number; // 1 to 5 stars
  status: PlayerStatus;
  attributes: PlayerAttributes;
  stats: PlayerStats;
  scoutId: string;
  clubId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamStats {
  matchesPlayed: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
}

export interface TeamSeasonHistory {
  season: string;
  leaguePosition: number;
  coach: string;
}

export interface Team {
  id: string;
  name: string;
  league: string;
  country: string;
  logoUrl?: string;
  clubId: string;
  scoutId: string;
  playersCount: number;
  season: string;
  coach: string;
  usualSystem: string;
  gameModel: string;
  pressingStyle: string;
  buildUp: string;
  transitions: string;
  setPieces: string;
  collectiveStats: TeamStats;
  seasonHistory: TeamSeasonHistory[];
  createdAt: string;
}

export interface TeamReport {
  id: string;
  teamId: string;
  scoutId: string;
  scoutName: string;
  date: string;
  notes: string;
  verdict: 'Excellent' | 'Average' | 'Needs Improvement';
  tacticalAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  createdAt: string;
}

export type ReportVerdict = 'Sign' | 'Monitor' | 'Dismiss';

export interface ScoutingReport {
  id: string;
  playerId: string;
  playerName: string;
  playerPhotoUrl?: string;
  playerPosition: PlayerPosition;
  scoutId: string;
  scoutName: string;
  matchName: string;
  matchDate: string;
  notes: string;
  strengths: string[];
  weaknesses: string[];
  verdict: ReportVerdict;
  rating: number; // 1 to 10
  createdAt: string;
  updatedAt: string;
}

export interface RankingList {
  id: string;
  name: string;
  description: string;
  clubId: string;
  playerIds: string[];
  createdAt: string;
}
