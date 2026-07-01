import React from 'react';
import { IngestionPanel } from '../components/ingestion/IngestionPanel';

export const AdminPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Panel de Administración de Club</h2>
        <p className="text-gray-400 mt-1">Gestione la descarga e ingesta de datos del proveedor de estadísticas (Opta).</p>
      </div>

      <IngestionPanel />
    </div>
  );
};
