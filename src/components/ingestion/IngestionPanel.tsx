import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertTriangle, Clock, DatabaseZap, Search } from 'lucide-react';
import { useIngestionJobsQuery } from '../../features/ingestion/hooks/useIngestionJobsQuery';
import { IngestionJob, JobStatus } from '../../features/ingestion/services/ingestionService';
import { useOptaCompetitionsQuery, useOptaSeasonsQuery } from '../../features/ingestion/hooks/useOptaLeaguesQuery';
import { OptaLeague, OptaSeason } from '../../features/ingestion/services/optaService';

const STATUS_META: Record<
  JobStatus,
  { label: string; className: string; Icon: React.ElementType; spin?: boolean }
> = {
  pending: {
    label: 'En cola',
    className: 'text-gray-300 bg-gray-800/60 border-gray-700',
    Icon: Clock,
  },
  processing: {
    label: 'Procesando',
    className: 'text-amber-300 bg-amber-950/40 border-amber-900',
    Icon: Loader2,
    spin: true,
  },
  done: {
    label: 'Completado',
    className: 'text-emerald-300 bg-emerald-950/40 border-emerald-900',
    Icon: CheckCircle,
  },
  error: {
    label: 'Error',
    className: 'text-rose-300 bg-rose-950/40 border-rose-900',
    Icon: AlertTriangle,
  },
};

const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.className}`}
    >
      <Icon className={`h-3 w-3 ${meta.spin ? 'animate-spin' : ''}`} />
      {meta.label}
    </span>
  );
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hace instantes';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
};

export const IngestionPanel: React.FC = () => {
  const { jobs, isLoading: isLoadingJobs, createCompetitionJob, isSubmitting, cancelJob, deleteJob } = useIngestionJobsQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<OptaLeague | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<OptaSeason | null>(null);

  const { data: competitions, isLoading: isLoadingComps } = useOptaCompetitionsQuery(searchTerm);
  const { data: seasons, isLoading: isLoadingSeasons } = useOptaSeasonsQuery(selectedLeague?.competitionId || null);
  
  const filteredComps = competitions || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeague || !selectedSeason) return;
    createCompetitionJob({ 
      competitionId: selectedLeague.competitionId, 
      seasonId: selectedSeason.seasonId 
    });
    setSelectedLeague(null);
    setSelectedSeason(null);
    setSearchTerm('');
  };

  return (
    <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-6 shadow-lg space-y-6">
      <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
        <DatabaseZap className="text-emerald-500" size={18} />
        Ingesta de Datos (Opta)
      </h3>

      {/* Formulario: encolar competición */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Paso 1: Seleccionar Competición */}
        <div className="relative">
          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
            1. Buscar Competición / País
          </label>
          <div className="relative">
            <input
              type="text"
              value={selectedLeague ? `${selectedLeague.country} - ${selectedLeague.name}` : searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedLeague(null);
                setSelectedSeason(null);
              }}
              placeholder="Ej: Spain, Premier, Hungría..."
              className="w-full rounded-lg border border-[#1e293b] bg-[#141a29] pl-9 pr-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
              disabled={isLoadingComps}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            {isLoadingComps && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-500" />
            )}
          </div>
          
          {/* Dropdown de resultados de competición */}
          {!selectedLeague && searchTerm.length >= 2 && filteredComps.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-[#1e293b] bg-[#141a29] shadow-xl">
              {filteredComps.map((comp) => (
                <div
                  key={comp.competitionId}
                  className="cursor-pointer px-4 py-2 hover:bg-[#1e293b] border-b border-[#1e293b]/50 last:border-0"
                  onClick={() => {
                    setSelectedLeague(comp);
                    setSearchTerm('');
                  }}
                >
                  <p className="text-sm font-bold text-gray-200">{comp.name}</p>
                  <p className="text-[10px] text-gray-400">{comp.country}</p>
                </div>
              ))}
            </div>
          )}
          {!selectedLeague && searchTerm.length >= 2 && filteredComps.length === 0 && !isLoadingComps && (
            <p className="text-xs text-rose-400 mt-2">No se encontraron ligas para "{searchTerm}"</p>
          )}
        </div>

        {/* Paso 2: Seleccionar Temporada */}
        {selectedLeague && (
          <div className="animate-fade-in">
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              2. Seleccionar Temporada
            </label>
            <div className="relative">
              <select
                className="w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm appearance-none"
                value={selectedSeason?.seasonId || ''}
                onChange={(e) => {
                  const s = (seasons || []).find(x => x.seasonId === e.target.value);
                  setSelectedSeason(s || null);
                }}
                disabled={isLoadingSeasons}
              >
                <option value="" disabled>-- Elige una temporada --</option>
                {(seasons || []).map((season) => (
                  <option key={season.seasonId} value={season.seasonId}>
                    {season.seasonName} {season.isActive ? '(ACTIVA)' : ''}
                  </option>
                ))}
              </select>
              {isLoadingSeasons && (
                <Loader2 className="absolute right-8 top-2.5 h-4 w-4 animate-spin text-gray-500" />
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !selectedLeague || !selectedSeason}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50 mt-4"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Encolar descarga
        </button>
        <p className="text-[11px] text-gray-500">
          Selecciona una liga y temporada para encolar la descarga. 
          El worker procesará la cola automáticamente subiendo los datos a Supabase Storage.
        </p>
      </form>

      {/* Tabla de estado */}
      <div className="pt-4 border-t border-[#1e293b]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Trabajos recientes
          </h4>
          {isLoadingJobs && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />}
        </div>

        {jobs.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center bg-[#141a29]/50 rounded-lg border border-[#1e293b]/50">
            No hay trabajos todavía. Encola una competición para empezar.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
            <table className="w-full border-collapse text-left text-sm text-gray-400">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-[#141a29] border-b border-[#1e293b]">
                <tr>
                  <th className="py-2 px-3">Objetivo</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Progreso</th>
                  <th className="py-2 px-3">Creado</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {jobs.map((job: IngestionJob) => (
                  <tr key={job.id} className="hover:bg-gray-900/40 align-top">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-gray-200 text-xs">
                        {job.job_type === 'competition' ? 'Competición' : 'Partido'}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono truncate max-w-[160px]">
                        {job.competition_id || job.match_id}
                      </p>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={job.status} />
                      {job.status === 'error' && job.message && (
                        <p className="text-[10px] text-rose-400/80 mt-1 max-w-[200px]">
                          {job.message}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-gray-300">
                      {job.matches_total > 0
                        ? `${job.matches_processed}/${job.matches_total}`
                        : job.matches_processed || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-gray-500 whitespace-nowrap">
                      {timeAgo(job.created_at)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {job.status === 'processing' || job.status === 'pending' ? (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="text-xs text-amber-500 hover:text-amber-400 underline decoration-dotted"
                          title="Cancelar progreso"
                        >
                          Cancelar
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm('¿Seguro que quieres borrar este registro?')) {
                              deleteJob(job.id);
                            }
                          }}
                          className="text-gray-500 hover:text-rose-500 transition-colors p-1 rounded"
                          title="Borrar de la cola"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
