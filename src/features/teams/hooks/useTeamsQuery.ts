import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';
import { Team } from '../../../types';
import { useUIStore } from '../../../store/global/useUIStore';

export const useTeamsQuery = (teamId?: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getTeams,
  });

  const teamDetailQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamService.getTeamById(teamId!),
    enabled: !!teamId,
  });

  const createMutation = useMutation({
    mutationFn: teamService.createTeam,
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      addToast(`Equipo ${newTeam.name} guardado con éxito`, 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al guardar el equipo', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Team> }) =>
      teamService.updateTeam(id, updates),
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', updatedTeam.id] });
      addToast(`Equipo ${updatedTeam.name} actualizado`, 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teamService.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      addToast('Equipo eliminado de la base de datos', 'warning');
    },
  });

  return {
    teams: teamsQuery.data || [],
    isLoadingTeams: teamsQuery.isLoading,
    team: teamDetailQuery.data,
    isLoadingTeamDetail: teamDetailQuery.isLoading,
    createTeam: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTeam: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteTeam: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
