import { mockPlayers, mockTeams, mockReports, mockRankings, mockUser, mockTeamReports } from './mockData';

export const initializeStorage = () => {
  if (!localStorage.getItem('ctsn_user')) {
    localStorage.setItem('ctsn_user', JSON.stringify(mockUser));
  }
  if (!localStorage.getItem('ctsn_players')) {
    localStorage.setItem('ctsn_players', JSON.stringify(mockPlayers));
  }
  if (!localStorage.getItem('ctsn_teams')) {
    localStorage.setItem('ctsn_teams', JSON.stringify(mockTeams));
  }
  if (!localStorage.getItem('ctsn_reports')) {
    localStorage.setItem('ctsn_reports', JSON.stringify(mockReports));
  }
  if (!localStorage.getItem('ctsn_rankings')) {
    localStorage.setItem('ctsn_rankings', JSON.stringify(mockRankings));
  }
  if (!localStorage.getItem('ctsn_team_reports')) {
    localStorage.setItem('ctsn_team_reports', JSON.stringify(mockTeamReports));
  }
};

// Helper getter/setter functions
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
};

export const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};
