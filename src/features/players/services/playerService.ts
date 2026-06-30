import { Player } from '../../../types';
import { supabase } from '../../../services/supabase/supabaseClient';

const computeAge = (birthDateStr: string | null): number => {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getBirthDateFromAge = (age: number): string => {
  const currentYear = new Date().getFullYear();
  return `${currentYear - age}-01-01`;
};

const mapDatabasePlayerToPlayer = (dbPlayer: any): Player => {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name,
    age: dbPlayer.birth_date ? computeAge(dbPlayer.birth_date) : 0,
    nationality: dbPlayer.nationality || '',
    club: dbPlayer.teams?.name || 'Libre',
    position: dbPlayer.primary_position_id || 'CM',
    preferredFoot: dbPlayer.preferred_foot === 'left' ? 'Left' : dbPlayer.preferred_foot === 'right' ? 'Right' : 'Both',
    height: dbPlayer.height || 0,
    weight: dbPlayer.weight || 0,
    contractUntil: dbPlayer.contract_until || '',
    marketValue: dbPlayer.market_value ? Number(dbPlayer.market_value) : 0,
    photoUrl: dbPlayer.photo_url || undefined,
    rating: dbPlayer.rating ? Number(dbPlayer.rating) : 0.0,
    potential: dbPlayer.potential ? Number(dbPlayer.potential) : 0.0,
    status: dbPlayer.status || 'Monitored',
    attributes: dbPlayer.attributes || {
      pace: 50,
      shooting: 50,
      passing: 50,
      dribbling: 50,
      defending: 50,
      physical: 50,
      tactical: 50
    },
    stats: dbPlayer.stats || {
      matchesPlayed: 0,
      minutesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0
    },
    scoutId: dbPlayer.scout_id || '',
    clubId: dbPlayer.club_id,
    createdAt: dbPlayer.created_at,
    updatedAt: dbPlayer.updated_at,
  };
};

export const playerService = {
  getPlayers: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        teams (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDatabasePlayerToPlayer);
  },

  getPlayerById: async (id: string): Promise<Player | undefined> => {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        teams (
          name
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapDatabasePlayerToPlayer(data) : undefined;
  },

  createPlayer: async (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('No se pudo encontrar el club del usuario');

    let currentTeamId = null;
    if (playerData.club && playerData.club !== 'Libre') {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .ilike('name', playerData.club)
        .maybeSingle();
      if (team) {
        currentTeamId = team.id;
      }
    }

    const dbPayload = {
      name: playerData.name,
      nationality: playerData.nationality,
      birth_date: getBirthDateFromAge(playerData.age),
      height: playerData.height,
      weight: playerData.weight,
      preferred_foot: playerData.preferredFoot.toLowerCase(),
      primary_position_id: playerData.position,
      photo_url: playerData.photoUrl || null,
      market_value: playerData.marketValue,
      contract_until: playerData.contractUntil || null,
      status: playerData.status,
      rating: playerData.rating,
      potential: playerData.potential,
      attributes: playerData.attributes,
      stats: playerData.stats,
      scout_id: playerData.scoutId || user.id,
      club_id: profile.club_id,
      current_team_id: currentTeamId,
    };

    const { data: created, error } = await supabase
      .from('players')
      .insert(dbPayload)
      .select(`
        *,
        teams (
          name
        )
      `)
      .single();

    if (error) throw error;
    return mapDatabasePlayerToPlayer(created);
  },

  updatePlayer: async (id: string, updates: Partial<Player>): Promise<Player> => {
    const dbPayload: any = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.nationality !== undefined) dbPayload.nationality = updates.nationality;
    if (updates.age !== undefined) dbPayload.birth_date = getBirthDateFromAge(updates.age);
    if (updates.height !== undefined) dbPayload.height = updates.height;
    if (updates.weight !== undefined) dbPayload.weight = updates.weight;
    if (updates.preferredFoot !== undefined) dbPayload.preferred_foot = updates.preferredFoot.toLowerCase();
    if (updates.position !== undefined) dbPayload.primary_position_id = updates.position;
    if (updates.photoUrl !== undefined) dbPayload.photo_url = updates.photoUrl || null;
    if (updates.marketValue !== undefined) dbPayload.market_value = updates.marketValue;
    if (updates.contractUntil !== undefined) dbPayload.contract_until = updates.contractUntil || null;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.rating !== undefined) dbPayload.rating = updates.rating;
    if (updates.potential !== undefined) dbPayload.potential = updates.potential;
    if (updates.attributes !== undefined) dbPayload.attributes = updates.attributes;
    if (updates.stats !== undefined) dbPayload.stats = updates.stats;
    if (updates.scoutId !== undefined) dbPayload.scout_id = updates.scoutId || null;

    if (updates.club !== undefined) {
      let currentTeamId = null;
      if (updates.club && updates.club !== 'Libre') {
        const { data: team } = await supabase
          .from('teams')
          .select('id')
          .ilike('name', updates.club)
          .maybeSingle();
        if (team) {
          currentTeamId = team.id;
        }
      }
      dbPayload.current_team_id = currentTeamId;
    }
    dbPayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('players')
      .update(dbPayload)
      .eq('id', id)
      .select(`
        *,
        teams (
          name
        )
      `)
      .single();

    if (error) throw error;
    return mapDatabasePlayerToPlayer(updated);
  },

  deletePlayer: async (id: string): Promise<string> => {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return id;
  }
};
