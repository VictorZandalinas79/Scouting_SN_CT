import { RankingList } from '../../../types';
import { supabase } from '../../../services/supabase/supabaseClient';

const mapDatabaseRankingToRankingList = (dbRanking: any): RankingList => {
  return {
    id: dbRanking.id,
    name: dbRanking.name,
    description: dbRanking.description || '',
    clubId: dbRanking.club_id,
    playerIds: dbRanking.player_ids || [],
    createdAt: dbRanking.created_at,
  };
};

export const rankingService = {
  getRankings: async (): Promise<RankingList[]> => {
    const { data, error } = await supabase
      .from('ranking_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDatabaseRankingToRankingList);
  },

  getRankingById: async (id: string): Promise<RankingList | undefined> => {
    const { data, error } = await supabase
      .from('ranking_lists')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapDatabaseRankingToRankingList(data) : undefined;
  },

  createRanking: async (rankingData: Omit<RankingList, 'id' | 'createdAt'>): Promise<RankingList> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('No se pudo encontrar el club del usuario');

    const dbPayload = {
      name: rankingData.name,
      description: rankingData.description,
      player_ids: rankingData.playerIds,
      club_id: profile.club_id,
    };

    const { data: created, error } = await supabase
      .from('ranking_lists')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return mapDatabaseRankingToRankingList(created);
  },

  updateRanking: async (id: string, updates: Partial<RankingList>): Promise<RankingList> => {
    const dbPayload: any = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.playerIds !== undefined) dbPayload.player_ids = updates.playerIds;

    const { data: updated, error } = await supabase
      .from('ranking_lists')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapDatabaseRankingToRankingList(updated);
  },

  deleteRanking: async (id: string): Promise<string> => {
    const { error } = await supabase
      .from('ranking_lists')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return id;
  }
};
