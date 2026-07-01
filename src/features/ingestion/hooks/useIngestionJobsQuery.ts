import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ingestionService } from '../services/ingestionService';
import { useUIStore } from '../../../store/global/useUIStore';

export const useIngestionJobsQuery = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const jobsQuery = useQuery({
    queryKey: ['ingestion-jobs'],
    queryFn: ingestionService.getJobs,
    // Sondeo suave: refresca el estado mientras el worker procesa.
    refetchInterval: 5000,
  });

  const createCompetition = useMutation({
    mutationFn: ({ competitionId, seasonId }: { competitionId: string; seasonId: string }) =>
      ingestionService.createCompetitionJob(competitionId, seasonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-jobs'] });
      addToast('Trabajo de competición encolado. El worker lo procesará en breve.', 'success');
    },
    onError: (e: any) => addToast(e.message || 'No se pudo encolar el trabajo', 'error'),
  });

  const createMatch = useMutation({
    mutationFn: (matchId: string) => ingestionService.createMatchJob(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-jobs'] });
      addToast('Trabajo de partido encolado.', 'success');
    },
    onError: (e: any) => addToast(e.message || 'No se pudo encolar el trabajo', 'error'),
  });

  const deleteJob = useMutation({
    mutationFn: (jobId: string) => ingestionService.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-jobs'] });
      addToast('Trabajo borrado de la cola.', 'success');
    },
    onError: (e: any) => addToast(e.message || 'No se pudo borrar el trabajo', 'error'),
  });

  const cancelJob = useMutation({
    mutationFn: (jobId: string) => ingestionService.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-jobs'] });
      addToast('Trabajo cancelado.', 'success');
    },
    onError: (e: any) => addToast(e.message || 'No se pudo cancelar el trabajo', 'error'),
  });

  return {
    jobs: jobsQuery.data ?? [],
    isLoading: jobsQuery.isLoading,
    createCompetitionJob: createCompetition.mutate,
    createMatchJob: createMatch.mutate,
    deleteJob: deleteJob.mutate,
    cancelJob: cancelJob.mutate,
    isSubmitting: createCompetition.isPending || createMatch.isPending || deleteJob.isPending || cancelJob.isPending,
  };
};
