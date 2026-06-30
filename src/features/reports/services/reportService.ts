import { ScoutingReport } from '../../../types';
import { supabase } from '../../../services/supabase/supabaseClient';

const mapDatabaseReportToScoutingReport = (dbReport: any): ScoutingReport => {
  return {
    id: dbReport.id,
    playerId: dbReport.player_id,
    playerName: dbReport.players?.name || 'Jugador desconocido',
    playerPhotoUrl: dbReport.players?.photo_url || undefined,
    playerPosition: dbReport.players?.primary_position_id || 'CM',
    scoutId: dbReport.scout_id || '',
    scoutName: dbReport.profiles?.name || 'Ojeador',
    matchName: dbReport.match_name || dbReport.competition || 'Partido',
    matchDate: dbReport.date || dbReport.created_at?.split('T')[0],
    notes: dbReport.notes || '',
    strengths: dbReport.strengths_list || [],
    weaknesses: dbReport.weaknesses_list || [],
    verdict: dbReport.verdict,
    rating: dbReport.overall_rating ? Number(dbReport.overall_rating) : 5,
    createdAt: dbReport.created_at,
    updatedAt: dbReport.updated_at,
  };
};

export const reportService = {
  getReports: async (): Promise<ScoutingReport[]> => {
    const { data, error } = await supabase
      .from('scouting_reports')
      .select(`
        *,
        players (
          name,
          photo_url,
          primary_position_id
        ),
        profiles (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDatabaseReportToScoutingReport);
  },

  getReportById: async (id: string): Promise<ScoutingReport | undefined> => {
    const { data, error } = await supabase
      .from('scouting_reports')
      .select(`
        *,
        players (
          name,
          photo_url,
          primary_position_id
        ),
        profiles (
          name
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapDatabaseReportToScoutingReport(data) : undefined;
  },

  getReportsByPlayerId: async (playerId: string): Promise<ScoutingReport[]> => {
    const { data, error } = await supabase
      .from('scouting_reports')
      .select(`
        *,
        players (
          name,
          photo_url,
          primary_position_id
        ),
        profiles (
          name
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDatabaseReportToScoutingReport);
  },

  createReport: async (reportData: Omit<ScoutingReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScoutingReport> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('club_id, name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('No se pudo encontrar el club del usuario');

    const dbPayload = {
      player_id: reportData.playerId,
      scout_id: reportData.scoutId || user.id,
      match_name: reportData.matchName,
      date: reportData.matchDate || new Date().toISOString().split('T')[0],
      notes: reportData.notes,
      strengths_list: reportData.strengths,
      weaknesses_list: reportData.weaknesses,
      verdict: reportData.verdict,
      overall_rating: reportData.rating,
      club_id: profile.club_id,
    };

    const { data: created, error } = await supabase
      .from('scouting_reports')
      .insert(dbPayload)
      .select(`
        *,
        players (
          name,
          photo_url,
          primary_position_id
        ),
        profiles (
          name
        )
      `)
      .single();

    if (error) throw error;

    // Actualizar dinámicamente la calificación del jugador basándonos en el promedio de sus reportes
    try {
      const { data: reports } = await supabase
        .from('scouting_reports')
        .select('overall_rating')
        .eq('player_id', reportData.playerId);
      
      if (reports && reports.length > 0) {
        const sum = reports.reduce((acc, r) => acc + Number(r.overall_rating), 0);
        const avgRating = Number((sum / reports.length).toFixed(1));
        
        await supabase
          .from('players')
          .update({ rating: avgRating })
          .eq('id', reportData.playerId);
      }
    } catch (e) {
      console.error('Error al actualizar rating promedio del jugador:', e);
    }

    return mapDatabaseReportToScoutingReport(created);
  },

  updateReport: async (id: string, updates: Partial<ScoutingReport>): Promise<ScoutingReport> => {
    const dbPayload: any = {};
    if (updates.matchName !== undefined) dbPayload.match_name = updates.matchName;
    if (updates.matchDate !== undefined) dbPayload.date = updates.matchDate;
    if (updates.notes !== undefined) dbPayload.notes = updates.notes;
    if (updates.strengths !== undefined) dbPayload.strengths_list = updates.strengths;
    if (updates.weaknesses !== undefined) dbPayload.weaknesses_list = updates.weaknesses;
    if (updates.verdict !== undefined) dbPayload.verdict = updates.verdict;
    if (updates.rating !== undefined) dbPayload.overall_rating = updates.rating;
    dbPayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('scouting_reports')
      .update(dbPayload)
      .eq('id', id)
      .select(`
        *,
        players (
          name,
          photo_url,
          primary_position_id
        ),
        profiles (
          name
        )
      `)
      .single();

    if (error) throw error;

    // Recalcular el rating del jugador si cambió la calificación del reporte
    if (updates.rating !== undefined && updated) {
      try {
        const { data: reports } = await supabase
          .from('scouting_reports')
          .select('overall_rating')
          .eq('player_id', updated.player_id);
        
        if (reports && reports.length > 0) {
          const sum = reports.reduce((acc, r) => acc + Number(r.overall_rating), 0);
          const avgRating = Number((sum / reports.length).toFixed(1));
          
          await supabase
            .from('players')
            .update({ rating: avgRating })
            .eq('id', updated.player_id);
        }
      } catch (e) {
        console.error('Error al actualizar rating promedio del jugador:', e);
      }
    }

    return mapDatabaseReportToScoutingReport(updated);
  },

  deleteReport: async (id: string): Promise<string> => {
    // Primero obtener el player_id para recalcular su rating después de borrar
    const { data: report } = await supabase
      .from('scouting_reports')
      .select('player_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('scouting_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (report) {
      try {
        const { data: reports } = await supabase
          .from('scouting_reports')
          .select('overall_rating')
          .eq('player_id', report.player_id);
        
        const avgRating = reports && reports.length > 0
          ? Number((reports.reduce((acc, r) => acc + Number(r.overall_rating), 0) / reports.length).toFixed(1))
          : 0.0;
        
        await supabase
          .from('players')
          .update({ rating: avgRating })
          .eq('id', report.player_id);
      } catch (e) {
        console.error('Error al actualizar rating promedio del jugador:', e);
      }
    }

    return id;
  }
};
