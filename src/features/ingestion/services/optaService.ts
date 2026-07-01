import { supabase } from '../../../services/supabase/supabaseClient';

export interface OptaLeague {
  country: string;
  name: string;
  competitionId: string;
}

export interface OptaSeason {
  seasonId: string;
  seasonName: string;
  isActive: boolean;
}

// Búsqueda agrupada por competición (ignorando temporalmente la temporada)
export const searchOptaCompetitions = async (query: string): Promise<OptaLeague[]> => {
  if (!query || query.length < 2) return [];

  // Usamos el texto base sin procesar porque ilike es case-insensitive y unaccent/pg_trgm ayudan
  const { data, error } = await supabase
    .from('opta_competitions')
    .select('country, name, competition_id')
    .or(`name.ilike.%${query}%,country.ilike.%${query}%`)
    .limit(500); // Traemos varios para luego hacer el unique

  if (error) {
    console.error('Error fetching competitions:', error);
    throw new Error('No se pudo buscar en la base de datos de competiciones');
  }

  // Hacer unique manual por competition_id en cliente (dado que Supabase free a veces no soporta .distinct bien sin RPC)
  const uniqueComps = new Map<string, OptaLeague>();
  (data || []).forEach(row => {
    if (!uniqueComps.has(row.competition_id)) {
      uniqueComps.set(row.competition_id, {
        country: row.country,
        name: row.name,
        competitionId: row.competition_id,
      });
    }
  });

  return Array.from(uniqueComps.values()).slice(0, 50); // Devolver máximo 50 únicas
};

// Cargar las temporadas para una competición específica
export const fetchOptaSeasons = async (competitionId: string): Promise<OptaSeason[]> => {
  if (!competitionId) return [];

  const { data, error } = await supabase
    .from('opta_competitions')
    .select('season_id, season_name, is_active')
    .eq('competition_id', competitionId)
    .order('is_active', { ascending: false })
    .order('season_name', { ascending: false });

  if (error) {
    console.error('Error fetching seasons:', error);
    throw new Error('No se pudieron cargar las temporadas');
  }

  return (data || []).map(row => ({
    seasonId: row.season_id,
    seasonName: row.season_name,
    isActive: row.is_active
  }));
};
