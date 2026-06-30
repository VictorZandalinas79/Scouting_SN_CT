import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/global/useAuthStore';
import { useUIStore } from '../store/global/useUIStore';
import { useAuthQuery } from '../features/auth/hooks/useAuthQuery';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileSpreadsheet,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Layers
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar, toasts, removeToast } = useUIStore();
  const { logout } = useAuthQuery();

  const menuItems = [
    { name: 'Inicio', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'head_scout', 'scout'] },
    { name: 'Jugadores', path: '/players', icon: Users, roles: ['admin', 'head_scout', 'scout'] },
    { name: 'Equipos', path: '/teams', icon: Shield, roles: ['admin', 'head_scout', 'scout'] },
    { name: 'Campograma', path: '/tactical-board', icon: Layers, roles: ['admin', 'head_scout', 'scout'] },
    { name: 'Informes', path: '/reports', icon: FileSpreadsheet, roles: ['admin', 'head_scout', 'scout'] },
    { name: 'Rankings', path: '/rankings', icon: TrendingUp, roles: ['admin', 'head_scout', 'scout'] },
    { name: 'Administración', path: '/admin', icon: Settings, roles: ['admin', 'head_scout'] },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#080b11] text-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0f1422] border-r border-[#1e293b] transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } lg:static lg:block`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#1e293b]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900/50 shadow-lg shadow-emerald-900/30 shrink-0 p-1">
              <img src="/logo.png" alt="CTSN Logo" className="h-full w-full object-contain" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent truncate">
                SCOUT CTSN
              </span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-950/40 text-emerald-400 border-l-4 border-emerald-500'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white border-l-4 border-transparent'
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-white'
                  } ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}
                />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="border-t border-[#1e293b] p-4 bg-[#0d111c]">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatarUrl || 'https://via.placeholder.com/150'}
              alt={user?.name}
              className="h-10 w-10 rounded-full border border-emerald-500/30 object-cover shrink-0"
            />
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-200">{user?.name}</p>
                <p className="truncate text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  {user?.role === 'head_scout' ? 'Director Scouting' : user?.role}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="rounded p-1.5 text-gray-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          {!sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full justify-center rounded p-2 text-gray-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-[#1e293b] bg-[#0c101b]/80 backdrop-blur-md px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold tracking-wide text-gray-100 hidden sm:block">
              {menuItems.find((item) => location.pathname.startsWith(item.path))?.name || 'Scouting'}
            </h1>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="rounded-full p-2 text-gray-400 hover:bg-gray-900 hover:text-white relative transition-colors">
                <Bell size={18} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500"></span>
              </button>
            </div>
            <div className="h-6 w-px bg-[#1e293b]"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded-full uppercase">
                Club Real Madrid
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#080b11]">
          <Outlet />
        </main>
      </div>

      {/* Floating Notifications (Toast) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#1e293b] bg-[#0f1422]/90 backdrop-blur-md p-4 shadow-2xl pointer-events-auto animate-slide-in"
          >
            <div className="flex items-center gap-3">
              {getToastIcon(toast.type)}
              <span className="text-sm font-medium text-gray-200">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
