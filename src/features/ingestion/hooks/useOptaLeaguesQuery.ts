import { useQuery } from '@tanstack/react-query';
import { searchOptaCompetitions, fetchOptaSeasons, OptaLeague, OptaSeason } from '../services/optaService';
import { useDebounce } from '../../../hooks/useDebounce';

export const useOptaCompetitionsQuery = (searchTerm: string) => {
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  return useQuery<OptaLeague[], Error>({
    queryKey: ['optaCompetitions', debouncedSearch],
    queryFn: () => searchOptaCompetitions(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};

export const useOptaSeasonsQuery = (competitionId: string | null) => {
  return useQuery<OptaSeason[], Error>({
    queryKey: ['optaSeasons', competitionId],
    queryFn: () => fetchOptaSeasons(competitionId!),
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 60, // 1 hora de caché
  });
};
