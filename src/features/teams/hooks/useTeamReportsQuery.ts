import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamReportService } from '../services/teamReportService';
import { TeamReport } from '../../../types';
import { useUIStore } from '../../../store/global/useUIStore';

export const useTeamReportsQuery = (teamId?: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const teamReportsQuery = useQuery({
    queryKey: ['team_reports', teamId],
    queryFn: () => teamReportService.getTeamReports(teamId),
    enabled: !!teamId,
  });

  const createMutation = useMutation({
    mutationFn: teamReportService.createTeamReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_reports', teamId] });
      addToast('Informe táctico del equipo añadido con éxito', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Error al guardar el informe', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teamReportService.deleteTeamReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_reports', teamId] });
      addToast('Informe del equipo eliminado', 'warning');
    },
  });

  return {
    reports: teamReportsQuery.data || [],
    isLoadingReports: teamReportsQuery.isLoading,
    createReport: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteReport: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
