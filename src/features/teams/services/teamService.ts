import { Team } from '../../../types';
import { supabase } from '../../../services/supabase/supabaseClient';

const mapDatabaseTeamToTeam = (dbTeam: any, playersCount: number): Team => {
  return {
    id: dbTeam.id,
    name: dbTeam.name,
    league: dbTeam.league || '',
    country: dbTeam.country || '',
    logoUrl: dbTeam.logo_url || undefined,
    clubId: dbTeam.club_id,
    scoutId: dbTeam.scout_id || '',
    playersCount: playersCount,
    season: dbTeam.season || '',
    coach: dbTeam.coach || '',
    usualSystem: dbTeam.usual_system || '',
    gameModel: dbTeam.game_model || '',
    pressingStyle: dbTeam.pressing_style || '',
    buildUp: dbTeam.build_up || '',
    transitions: dbTeam.transitions || '',
    setPieces: dbTeam.set_pieces || '',
    collectiveStats: dbTeam.collective_stats || {
      matchesPlayed: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
    },
    seasonHistory: dbTeam.season_history || [],
    createdAt: dbTeam.created_at,
  };
};

export const teamService = {
  getTeams: async (): Promise<Team[]> => {
    const { data: teamsData, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
      
    if (error) throw error;
    if (!teamsData) return [];

    const mappedTeams = await Promise.all(
      teamsData.map(async (t) => {
        const { count, error: countError } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('current_team_id', t.id);
          
        if (countError) console.error('Error counting players for team:', t.id, countError);
        return mapDatabaseTeamToTeam(t, count || 0);
      })
    );

    return mappedTeams;
  },

  getTeamById: async (id: string): Promise<Team | undefined> => {
    const { data: dbTeam, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!dbTeam) return undefined;

    const { count } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('current_team_id', id);

    return mapDatabaseTeamToTeam(dbTeam, count || 0);
  },

  createTeam: async (teamData: Omit<Team, 'id' | 'createdAt' | 'playersCount'>): Promise<Team> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) throw new Error('No se pudo encontrar el club del usuario');

    const dbPayload = {
      name: teamData.name,
      logo_url: teamData.logoUrl || null,
      country: teamData.country,
      club_id: profile.club_id,
      scout_id: teamData.scoutId || user.id,
      league: teamData.league,
      season: teamData.season,
      coach: teamData.coach,
      usual_system: teamData.usualSystem,
      game_model: teamData.gameModel,
      pressing_style: teamData.pressingStyle,
      build_up: teamData.buildUp,
      transitions: teamData.transitions,
      set_pieces: teamData.setPieces,
      collective_stats: teamData.collectiveStats,
      season_history: teamData.seasonHistory,
    };

    const { data: created, error } = await supabase
      .from('teams')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return mapDatabaseTeamToTeam(created, 0);
  },

  updateTeam: async (id: string, updates: Partial<Team>): Promise<Team> => {
    const dbPayload: any = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.logoUrl !== undefined) dbPayload.logo_url = updates.logoUrl;
    if (updates.country !== undefined) dbPayload.country = updates.country;
    if (updates.scoutId !== undefined) dbPayload.scout_id = updates.scoutId || null;
    if (updates.league !== undefined) dbPayload.league = updates.league;
    if (updates.season !== undefined) dbPayload.season = updates.season;
    if (updates.coach !== undefined) dbPayload.coach = updates.coach;
    if (updates.usualSystem !== undefined) dbPayload.usual_system = updates.usualSystem;
    if (updates.gameModel !== undefined) dbPayload.game_model = updates.gameModel;
    if (updates.pressingStyle !== undefined) dbPayload.pressing_style = updates.pressingStyle;
    if (updates.buildUp !== undefined) dbPayload.build_up = updates.buildUp;
    if (updates.transitions !== undefined) dbPayload.transitions = updates.transitions;
    if (updates.setPieces !== undefined) dbPayload.set_pieces = updates.setPieces;
    if (updates.collectiveStats !== undefined) dbPayload.collective_stats = updates.collectiveStats;
    if (updates.seasonHistory !== undefined) dbPayload.season_history = updates.seasonHistory;
    dbPayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('teams')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { count } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('current_team_id', id);

    return mapDatabaseTeamToTeam(updated, count || 0);
  },

  deleteTeam: async (id: string): Promise<string> => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return id;
  }
};
