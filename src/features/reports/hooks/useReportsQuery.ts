import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import { ScoutingReport } from '../../../types';
import { useUIStore } from '../../../store/global/useUIStore';

export const useReportsQuery = (reportId?: string, playerId?: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const reportsQuery = useQuery({
    queryKey: ['reports'],
    queryFn: reportService.getReports,
  });

  const playerReportsQuery = useQuery({
    queryKey: ['reports', 'player', playerId],
    queryFn: () => reportService.getReportsByPlayerId(playerId!),
    enabled: !!playerId,
  });

  const reportDetailQuery = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => reportService.getReportById(reportId!),
    enabled: !!reportId,
  });

  const createMutation = useMutation({
    mutationFn: reportService.createReport,
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      if (newReport.playerId) {
        queryClient.invalidateQueries({ queryKey: ['reports', 'player', newReport.playerId] });
        queryClient.invalidateQueries({ queryKey: ['player', newReport.playerId] });
      }
      addToast('Informe de scouting añadido con éxito', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al añadir el informe', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ScoutingReport> }) =>
      reportService.updateReport(id, updates),
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report', updatedReport.id] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'player', updatedReport.playerId] });
      addToast('Informe de scouting actualizado', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reportService.deleteReport,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      addToast('Informe eliminado', 'warning');
    },
  });

  return {
    reports: reportsQuery.data || [],
    isLoadingReports: reportsQuery.isLoading,
    playerReports: playerReportsQuery.data || [],
    isLoadingPlayerReports: playerReportsQuery.isLoading,
    report: reportDetailQuery.data,
    isLoadingReportDetail: reportDetailQuery.isLoading,
    createReport: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateReport: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteReport: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
