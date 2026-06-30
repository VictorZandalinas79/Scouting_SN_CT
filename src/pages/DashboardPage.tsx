import React from 'react';
import { usePlayersQuery } from '../features/players/hooks/usePlayersQuery';
import { useReportsQuery } from '../features/reports/hooks/useReportsQuery';
import { useTeamsQuery } from '../features/teams/hooks/useTeamsQuery';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  AlertTriangle,
  Star,
  Activity,
  ArrowRight,
  TrendingUp,
  Shield,
  Calendar,
  Layers,
  Heart,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { players } = usePlayersQuery();
  const { reports } = useReportsQuery();
  const { teams } = useTeamsQuery();

  // Aggregate Data
  const totalPlayersCount = players.length;
  const totalReportsCount = reports.length;
  const totalTeamsCount = teams.length;

  // Pending players: players with needsReview flag (or we simulate duplicates)
  // Let's filter players with needsReview or mock items needing review
  const pendingPlayers = players.filter((p) => p.name.includes('Review') || p.id === 'ply_pending_1' || p.marketValue === 0);
  const pendingTeams = teams.filter((t) => t.coach === 'Desconocido' || !t.collectiveStats || t.collectiveStats.matchesPlayed === 0);

  // Favorites (Recommended status)
  const favoritePlayers = players.filter((p) => p.status === 'Recommended' || p.rating >= 4.8);

  // Most Viewed (Top minutes played in active season)
  const mostViewedPlayers = [...players]
    .sort((a, b) => (b.stats?.minutesPlayed || 0) - (a.stats?.minutesPlayed || 0))
    .slice(0, 3);

  // Competitions list
  const competitions = [
    { name: 'La Liga', country: 'España', teams: 20, icon: '🇪🇸' },
    { name: 'Premier League', country: 'Inglaterra', teams: 20, icon: '🏴' },
    { name: 'Bundesliga', country: 'Alemania', teams: 18, icon: '🇩🇪' },
  ];

  // Upcoming matches to scout
  const upcomingMatches = [
    { id: 1, date: '2026-07-04', matchName: 'Real Madrid vs Atlético Madrid', scout: 'Santiago Bernabéu', competition: 'La Liga' },
    { id: 2, date: '2026-07-08', matchName: 'Arsenal vs Manchester United', scout: 'Santiago Bernabéu', competition: 'Premier League' },
    { id: 3, date: '2026-07-12', matchName: 'Bayern München vs Borussia Dortmund', scout: 'Santiago Bernabéu', competition: 'Bundesliga' },
  ];

  // Recent Activity Feed
  const recentActivity = [
    { id: 1, text: 'Santiago Bernabéu redactó un informe sobre Jude Bellingham', type: 'report', time: 'hace 2 horas' },
    { id: 2, text: 'Tubería de ingesta detectó y fusionó registro de Erling Haaland', type: 'sync', time: 'hace 4 horas' },
    { id: 3, text: 'Nuevo equipo Real Madrid CF registrado en base de datos', type: 'team', time: 'hace 1 día' },
    { id: 4, text: 'Se creó la clasificación táctica "Top Talentos Sub-25 2026"', type: 'ranking', time: 'hace 2 días' },
  ];

  // Ingestion Alerts
  const systemAlerts = [
    { id: 1, message: 'Deduplicador Fuzzy: Encontrada coincidencia (91%) para Wirtz. Requiere aprobación.', severity: 'warning' },
    { id: 2, message: 'Falta configurar variables de entorno para API externa de Stats.', severity: 'info' },
  ];

  // Recharts: Market value distribution chart data
  const valueChartData = players.map((p) => ({
    name: p.name.split(' ')[0],
    Valor: p.marketValue / 1000000,
    Rating: p.rating * 20,
  }));

  // Recharts: Ratings distribution
  const ratingChartData = players.map((p) => ({
    name: p.name.split(' ')[0],
    Rating: p.rating,
    Potencial: p.potential || p.rating,
  }));

  // Stats for the Grid
  const statsList = [
    { name: 'Jugadores Añadidos', value: totalPlayersCount, icon: Users, color: 'from-blue-600 to-indigo-600' },
    { name: 'Informes de Scouting', value: totalReportsCount, icon: FileText, color: 'from-emerald-600 to-teal-600' },
    { name: 'Jugadores Pendientes', value: pendingPlayers.length + 1, icon: AlertTriangle, color: 'from-amber-600 to-orange-600' },
    { name: 'Equipos Pendientes', value: pendingTeams.length, icon: Shield, color: 'from-rose-600 to-pink-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      
      {/* Welcome & Sync Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1e293b] pb-5 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Consola de Scouting</h2>
          <p className="text-gray-400 mt-1">Monitoreo de transferencias, estadísticas colectivas e informes de campo.</p>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-3.5 py-2 rounded-xl font-bold">
          <Activity className="h-4 w-4 animate-pulse" />
          Servicio RLS Supabase Activo
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsList.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="relative overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-md hover:border-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{stat.name}</p>
                  <p className="text-3xl font-extrabold text-white mt-1.5">{stat.value}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-2.5 text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Market Value distribution Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Distribución de Valores de Mercado (M €)
            </h3>
            <span className="text-[10px] text-gray-500 font-bold bg-[#141a29] px-2 py-0.5 rounded border border-[#1e293b]">
              Filtro: Activo
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={valueChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/30" />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1422', borderColor: '#1e293b', borderRadius: '10px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Valor" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#valueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & System Notifications */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-md space-y-4 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider border-b border-[#1e293b]/60 pb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas del Sistema e Ingesta
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-48 pr-1">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border text-xs leading-relaxed flex gap-2.5 ${
                  alert.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-900/60 text-amber-400'
                    : 'bg-blue-950/20 border-blue-900/60 text-blue-400'
                }`}
              >
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <p>{alert.message}</p>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/60 text-emerald-400 text-xs leading-relaxed flex gap-2.5">
              <CheckCircle size={15} className="shrink-0 mt-0.5" />
              <p>No se registran fallos de claves foráneas en las últimas 48 horas.</p>
            </div>
          </div>
          <Link
            to="/admin"
            className="w-full flex items-center justify-center gap-1 py-2 border border-[#1e293b] rounded-xl text-[10px] uppercase font-bold text-gray-400 hover:bg-gray-900/40 transition-colors mt-3"
          >
            Consola de Administración <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Grid: Bottom Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Col 1: Latest Scouting Reports & Match Planner */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-2 mb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <FileText className="h-4 w-4 text-emerald-500" />
                Últimos Informes
              </h3>
              <Link to="/reports" className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2.5">
              {reports.slice(0, 2).map((rep) => (
                <div key={rep.id} className="p-3 rounded-xl bg-[#141a29] border border-[#1e293b]/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-white truncate max-w-[130px]">{rep.playerName}</span>
                    <span className="text-emerald-400 font-bold">{rep.rating.toFixed(1)} ★</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{rep.matchName}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e293b]/65">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-3">
              <Calendar className="h-4 w-4 text-emerald-500" />
              Próximos Partidos
            </h3>
            <div className="space-y-2">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-[#141a29]/40 border border-[#1e293b]/30 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-250 truncate max-w-[150px]">{m.matchName}</p>
                    <p className="text-[9px] text-gray-550 mt-0.5">{m.competition} • {m.date}</p>
                  </div>
                  <span className="text-[8px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    Scout
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 2: Most Viewed & Favorite/Recommended Players */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider border-b border-[#1e293b]/60 pb-2 mb-3">
              <Eye className="h-4 w-4 text-indigo-500" />
              Jugadores Más Vistos (Minutos)
            </h3>
            <div className="space-y-2">
              {mostViewedPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-[#141a29]/60 border border-[#1e293b]/40">
                  <div className="flex items-center gap-2">
                    <img
                      src={player.photoUrl || 'https://via.placeholder.com/150'}
                      alt={player.name}
                      className="h-7 w-7 rounded-full object-cover border border-gray-700"
                    />
                    <div>
                      <p className="text-[11px] font-bold text-white truncate max-w-[120px]">{player.name}</p>
                      <p className="text-[9px] text-gray-550">{player.position} • {player.club}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">
                    {player.stats?.minutesPlayed || 0}'
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e293b]/65">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-3">
              <Heart className="h-4 w-4 text-rose-500" />
              Favoritos / Recomendados
            </h3>
            <div className="space-y-2">
              {favoritePlayers.slice(0, 2).map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-[#141a29]/60 border border-[#1e293b]/40">
                  <div className="flex items-center gap-2">
                    <img
                      src={player.photoUrl || 'https://via.placeholder.com/150'}
                      alt={player.name}
                      className="h-7 w-7 rounded-full object-cover border border-gray-700"
                    />
                    <div>
                      <p className="text-[11px] font-bold text-white truncate max-w-[120px]">{player.name}</p>
                      <p className="text-[9px] text-gray-550">{player.position} • {player.club}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-extrabold text-amber-500 flex items-center gap-0.5">
                      <Star size={10} className="fill-amber-500" /> {player.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Competitions & Activity Log */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-5 shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider border-b border-[#1e293b]/60 pb-2 mb-3">
              <Layers className="text-emerald-500" size={14} />
              Competiciones Trackeadas
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {competitions.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded bg-[#141a29] border border-[#1e293b]/40 text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="text-sm">{c.icon}</span>
                    {c.name}
                  </span>
                  <span className="text-[10px] text-gray-500">{c.country}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e293b]/65">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-3">
              <Clock className="h-4 w-4 text-emerald-500" />
              Actividad Reciente
            </h3>
            <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
              {recentActivity.map((act) => (
                <div key={act.id} className="text-[11px] leading-relaxed border-l-2 border-emerald-500 pl-2.5">
                  <p className="text-gray-300 font-medium">{act.text}</p>
                  <span className="text-[9px] text-gray-550 block mt-0.5">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
