import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlayersPage } from '../pages/PlayersPage';
import { TeamsPage } from '../pages/TeamsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { RankingsPage } from '../pages/RankingsPage';
import { AdminPage } from '../pages/AdminPage';
import { TacticalBoardPage } from '../pages/TacticalBoardPage';
import { CampogramaPage } from '../pages/CampogramaPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
      </Route>

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="rankings" element={<RankingsPage />} />
          <Route path="tactical-board" element={<TacticalBoardPage />} />
          <Route path="campograma" element={<CampogramaPage />} />
          {/* Admin routes limited to head_scout and admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'head_scout']} />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Default route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
