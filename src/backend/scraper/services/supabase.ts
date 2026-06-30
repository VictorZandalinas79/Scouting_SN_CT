import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { config } from '../config/index.js';
import { PlayerMetrics } from '../types/index.js';

// Fix for Node.js < 22 where WebSocket is not native
if (typeof globalThis !== 'undefined' && !globalThis.WebSocket) {
  (globalThis as any).WebSocket = WebSocket;
}

if (!config.supabase.url || !config.supabase.key) {
  throw new Error('Supabase URL o KEY no definidos en las variables de entorno.');
}

export const supabase = createClient(config.supabase.url, config.supabase.key);

export async function upsertPlayerMetrics(metrics: PlayerMetrics[]) {
  if (metrics.length === 0) return;

  const { data, error } = await supabase
    .from('player_match_metrics')
    .upsert(metrics, {
      onConflict: 'match_id, player_id',
    })
    .select();

  if (error) {
    console.error('Error al insertar métricas en Supabase:', error.message);
    throw error;
  }

  console.log(`✅ Upsert completado con éxito: ${metrics.length} registros guardados.`);
  return data;
}
