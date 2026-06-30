import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingService } from '../services/rankingService';
import { RankingList } from '../../../types';
import { useUIStore } from '../../../store/global/useUIStore';

export const useRankingsQuery = (rankingId?: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const rankingsQuery = useQuery({
    queryKey: ['rankings'],
    queryFn: rankingService.getRankings,
  });

  const rankingDetailQuery = useQuery({
    queryKey: ['ranking', rankingId],
    queryFn: () => rankingService.getRankingById(rankingId!),
    enabled: !!rankingId,
  });

  const createMutation = useMutation({
    mutationFn: rankingService.createRanking,
    onSuccess: (newRanking) => {
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      addToast(`Lista "${newRanking.name}" creada`, 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al crear la lista', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RankingList> }) =>
      rankingService.updateRanking(id, updates),
    onSuccess: (updatedRanking) => {
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['ranking', updatedRanking.id] });
      addToast(`Lista "${updatedRanking.name}" actualizada`, 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rankingService.deleteRanking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      addToast('Lista de clasificación eliminada', 'warning');
    },
  });

  return {
    rankings: rankingsQuery.data || [],
    isLoadingRankings: rankingsQuery.isLoading,
    ranking: rankingDetailQuery.data,
    isLoadingRankingDetail: rankingDetailQuery.isLoading,
    createRanking: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateRanking: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteRanking: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
