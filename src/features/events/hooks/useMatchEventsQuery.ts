import { useQuery } from '@tanstack/react-query';
import { eventsService } from '../services/eventsService';

/**
 * Descarga y cachea los eventos slim de un partido desde Supabase Storage.
 * react-query evita volver a bajar el .gz si ya está en caché.
 */
export const useMatchEventsQuery = (matchId?: string) => {
  const query = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => eventsService.getMatchEvents(matchId!),
    enabled: !!matchId,
    staleTime: 1000 * 60 * 30, // 30 min: los eventos de un partido no cambian
    retry: 1,
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
  };
};
