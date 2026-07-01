import { supabase } from '../../../services/supabase/supabaseClient';

export type JobStatus = 'pending' | 'processing' | 'done' | 'error';
export type JobType = 'competition' | 'match_events';

export interface IngestionJob {
  id: string;
  job_type: JobType;
  competition_id: string | null;
  season_id: string | null;
  match_id: string | null;
  status: JobStatus;
  message: string | null;
  matches_processed: number;
  matches_total: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export const ingestionService = {
  async getJobs(): Promise<IngestionJob[]> {
    const { data, error } = await supabase
      .from('ingestion_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) throw new Error(error.message);
    return (data as IngestionJob[]) ?? [];
  },

  async createCompetitionJob(
    competitionId: string,
    seasonId: string
  ): Promise<IngestionJob> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('ingestion_jobs')
      .insert({
        job_type: 'competition',
        competition_id: competitionId,
        season_id: seasonId,
        status: 'pending',
        requested_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as IngestionJob;
  },

  async createMatchJob(matchId: string): Promise<IngestionJob> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('ingestion_jobs')
      .insert({
        job_type: 'match_events',
        match_id: matchId,
        status: 'pending',
        requested_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as IngestionJob;
  },

  async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('ingestion_jobs')
      .delete()
      .eq('id', jobId);
    if (error) throw new Error(error.message);
  },

  async cancelJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('ingestion_jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId);
    if (error) throw new Error(error.message);
  },
};
