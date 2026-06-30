import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playerService } from '../services/playerService';
import { Player } from '../../../types';
import { useUIStore } from '../../../store/global/useUIStore';

export const usePlayersQuery = (playerId?: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const playersQuery = useQuery({
    queryKey: ['players'],
    queryFn: playerService.getPlayers,
  });

  const playerDetailQuery = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => playerService.getPlayerById(playerId!),
    enabled: !!playerId,
  });

  const createMutation = useMutation({
    mutationFn: playerService.createPlayer,
    onSuccess: (newPlayer) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      addToast(`Jugador ${newPlayer.name} registrado con éxito`, 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al crear el jugador', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Player> }) =>
      playerService.updatePlayer(id, updates),
    onSuccess: (updatedPlayer) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['player', updatedPlayer.id] });
      addToast(`Ficha de ${updatedPlayer.name} actualizada`, 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al actualizar el jugador', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: playerService.deletePlayer,
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      addToast('Jugador eliminado de la base de datos', 'warning');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al eliminar el jugador', 'error');
    },
  });

  return {
    players: playersQuery.data || [],
    isLoadingPlayers: playersQuery.isLoading,
    player: playerDetailQuery.data,
    isLoadingPlayerDetail: playerDetailQuery.isLoading,
    createPlayer: createMutation.mutate,
    isCreating: createMutation.isPending,
    updatePlayer: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deletePlayer: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
