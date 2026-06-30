import React, { useState } from 'react';
import { useReportsQuery } from '../features/reports/hooks/useReportsQuery';
import { usePlayersQuery } from '../features/players/hooks/usePlayersQuery';
import { useForm } from 'react-hook-form';
import { ReportVerdict, ScoutingReport } from '../types';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Star,
  CheckCircle,
  X
} from 'lucide-react';

interface ReportFormInput {
  playerId: string;
  matchName: string;
  matchDate: string;
  verdict: ReportVerdict;
  rating: number;
  notes: string;
  strengthsInput: string; // Comma-separated
  weaknessesInput: string; // Comma-separated
}

export const ReportsPage: React.FC = () => {
  const { reports, createReport, deleteReport } = useReportsQuery();
  const { players } = usePlayersQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScoutingReport | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReportFormInput>({
    defaultValues: {
      rating: 7.0,
      verdict: 'Monitor',
      matchDate: new Date().toISOString().substring(0, 10),
    }
  });

  const onSubmit = (data: ReportFormInput) => {
    const player = players.find((p) => p.id === data.playerId);
    if (!player) return;

    const newReport = {
      playerId: data.playerId,
      playerName: player.name,
      playerPhotoUrl: player.photoUrl,
      playerPosition: player.position,
      scoutId: 'usr_1',
      scoutName: 'Santiago Bernabéu',
      matchName: data.matchName,
      matchDate: data.matchDate,
      notes: data.notes,
      strengths: data.strengthsInput.split(',').map((s) => s.trim()).filter(Boolean),
      weaknesses: data.weaknessesInput.split(',').map((w) => w.trim()).filter(Boolean),
      verdict: data.verdict,
      rating: Number(data.rating),
    };

    createReport(newReport, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.matchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerdict = verdictFilter === 'All' || report.verdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Informes de Scouting</h2>
          <p className="text-gray-400 mt-1">Gestione las valoraciones de partidos, notas de campo y veredictos técnicos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus size={16} />
          Nuevo Informe
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-[#0f1422] rounded-2xl border border-[#1e293b]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por jugador, partido o comentarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#1e293b] bg-[#141a29] text-white focus:outline-none focus:border-emerald-500 text-sm placeholder-gray-500"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#141a29] border border-[#1e293b] rounded-xl px-3 py-1.5 self-start">
          <FileText size={14} className="text-gray-400" />
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-xs font-semibold"
          >
            <option value="All">Veredicto: Todos</option>
            <option value="Sign">Fichaje Recomendado</option>
            <option value="Monitor">En Seguimiento</option>
            <option value="Dismiss">Descartado</option>
          </select>
        </div>
      </div>

      {/* Main Grid/Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Reports log list */}
        <div className={`space-y-4 ${selectedReport ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={`rounded-2xl border bg-[#0f1422] p-5 shadow-lg cursor-pointer hover:border-emerald-500/50 transition-all duration-200 ${
                selectedReport?.id === report.id ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-[#1e293b]'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={report.playerPhotoUrl || 'https://via.placeholder.com/150'}
                    alt={report.playerName}
                    className="h-10 w-10 rounded-full border border-gray-700 object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{report.playerName}</h3>
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5">{report.playerPosition}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-gray-500">Valoración</p>
                    <p className="text-xs font-bold text-emerald-400">{report.rating.toFixed(1)} / 10</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                      report.verdict === 'Sign'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                        : report.verdict === 'Monitor'
                        ? 'bg-amber-950/40 text-amber-400 border-amber-900/60'
                        : 'bg-red-950/40 text-red-400 border-red-900/60'
                    }`}
                  >
                    {report.verdict === 'Sign' ? 'Fichar' : report.verdict === 'Monitor' ? 'Seguir' : 'Descarte'}
                  </span>
                </div>
              </div>

              <div className="my-4">
                <p className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Calendar size={12} className="text-emerald-500" />
                  {report.matchName} • {report.matchDate}
                </p>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                  {report.notes}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-[#1e293b]/60 pt-3 shrink-0">
                <span>Informante: {report.scoutName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('¿Eliminar permanentemente este informe técnico?')) {
                      deleteReport(report.id);
                      if (selectedReport?.id === report.id) setSelectedReport(null);
                    }
                  }}
                  className="rounded p-1.5 text-gray-500 hover:bg-red-950/20 hover:text-red-400 transition-colors"
                  title="Eliminar informe"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Report View sidebar */}
        {selectedReport && (
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0f1422] p-6 shadow-2xl space-y-6 relative sticky top-6">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white rounded-full p-1"
            >
              <X size={18} />
            </button>

            <div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                  selectedReport.verdict === 'Sign'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                    : selectedReport.verdict === 'Monitor'
                    ? 'bg-amber-950/40 text-amber-400 border-amber-900/60'
                    : 'bg-red-950/40 text-red-400 border-red-900/60'
                }`}
              >
                Veredicto: {selectedReport.verdict === 'Sign' ? 'Fichaje' : selectedReport.verdict === 'Monitor' ? 'Seguimiento' : 'Descarte'}
              </span>
              <h3 className="text-lg font-bold text-white mt-3">{selectedReport.playerName}</h3>
              <p className="text-xs text-emerald-500 font-semibold">{selectedReport.playerPosition}</p>
            </div>

            <div className="space-y-4 border-t border-[#1e293b] pt-4">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Partido Observado</p>
                <p className="text-xs font-semibold text-gray-200 mt-1">{selectedReport.matchName}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{selectedReport.matchDate}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Calificación Scout</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-white">{selectedReport.rating.toFixed(1)} / 10.0</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Análisis Técnico</h4>
              <div className="space-y-2 bg-[#141a29] p-3.5 rounded-xl text-xs leading-relaxed text-gray-300">
                {selectedReport.notes}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <ThumbsUp size={12} /> Fortalezas
                </h4>
                <ul className="space-y-1">
                  {selectedReport.strengths.map((str, idx) => (
                    <li key={idx} className="text-xs text-gray-300 flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 border-t border-[#1e293b]/60 pt-3">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <ThumbsDown size={12} /> Debilidades
                </h4>
                <ul className="space-y-1">
                  {selectedReport.weaknesses.map((weak, idx) => (
                    <li key={idx} className="text-xs text-gray-300 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-red-500 rounded-full shrink-0"></span>
                      {weak}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Scouting Report Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#1e293b] bg-[#0f1422] p-8 shadow-2xl my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Generar Informe de Scouting</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Seleccionar Jugador</label>
                <select
                  {...register('playerId', { required: 'Debe seleccionar un jugador' })}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="">-- Seleccionar de base de datos --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position} - {p.club})
                    </option>
                  ))}
                </select>
                {errors.playerId && <span className="text-red-400 text-xs">{errors.playerId.message}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase">Partido Observado</label>
                  <input
                    type="text"
                    {...register('matchName', { required: true })}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="e.g. Champions League vs Bayern"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase">Fecha del Partido</label>
                  <input
                    type="date"
                    {...register('matchDate', { required: true })}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase">Veredicto Técnico</label>
                  <select
                    {...register('verdict')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Sign">Sign (Fichaje Recomendado)</option>
                    <option value="Monitor">Monitor (Seguimiento Continuo)</option>
                    <option value="Dismiss">Dismiss (Descartado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase">Calificación del Partido (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    {...register('rating', { required: true })}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Fortalezas (separadas por comas)</label>
                <input
                  type="text"
                  {...register('strengthsInput')}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  placeholder="e.g. Visión de juego, Físico imponente, Presión alta"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Debilidades (separadas por comas)</label>
                <input
                  type="text"
                  {...register('weaknessesInput')}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  placeholder="e.g. Duels aéreos, Retorno táctico tardío"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Notas Técnicas y Comentarios de Campo</label>
                <textarea
                  rows={4}
                  {...register('notes', { required: true })}
                  className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm resize-none"
                  placeholder="Comentarios detallados de la actuación técnica, táctica y física del jugador..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#1e293b] pt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-700 hover:border-gray-500 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                >
                  Registrar Informe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
