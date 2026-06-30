import { TeamReport } from '../../../types';
import { supabase } from '../../../services/supabase/supabaseClient';

const mapDatabaseReportToTeamReport = (dbReport: any): TeamReport => {
  return {
    id: dbReport.id,
    teamId: dbReport.team_id,
    scoutId: dbReport.scout_id || '',
    scoutName: dbReport.scout_name || '',
    date: dbReport.date,
    notes: dbReport.notes || '',
    verdict: dbReport.verdict,
    tacticalAnalysis: dbReport.tactical_analysis || '',
    strengths: dbReport.strengths || [],
    weaknesses: dbReport.weaknesses || [],
    createdAt: dbReport.created_at,
  };
};

export const teamReportService = {
  getTeamReports: async (teamId?: string): Promise<TeamReport[]> => {
    let query = supabase
      .from('team_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapDatabaseReportToTeamReport);
  },

  createTeamReport: async (reportData: Omit<TeamReport, 'id' | 'createdAt'>): Promise<TeamReport> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const scoutName = reportData.scoutName || profile?.name || user.email?.split('@')[0] || 'Ojeador';

    const dbPayload = {
      team_id: reportData.teamId,
      scout_id: user.id,
      scout_name: scoutName,
      date: reportData.date || new Date().toISOString().split('T')[0],
      notes: reportData.notes,
      verdict: reportData.verdict,
      tactical_analysis: reportData.tacticalAnalysis,
      strengths: reportData.strengths,
      weaknesses: reportData.weaknesses,
    };

    const { data: created, error } = await supabase
      .from('team_reports')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return mapDatabaseReportToTeamReport(created);
  },

  deleteTeamReport: async (id: string): Promise<string> => {
    const { error } = await supabase
      .from('team_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return id;
  }
};
