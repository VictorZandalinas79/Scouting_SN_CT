import { fetchMatchEvents } from './services/scoresway.js';
import { processMatchEvents } from './processors/eventProcessor.js';
import { upsertPlayerMetrics } from './services/supabase.js';

/**
 * Pipeline principal de extracción, procesamiento y almacenamiento.
 *
 * @param matchId ID del partido (ej. 1234567)
 */
export async function runScrapingPipeline(matchId: string) {
  try {
    console.log(`[1/3] Extrayendo datos en vivo para el partido ${matchId}...`);
    const matchData = await fetchMatchEvents(matchId);
    
    console.log(`[2/3] Procesando ${matchData.liveData?.event?.length || 0} eventos...`);
    const metrics = processMatchEvents(matchData, matchId);
    
    console.log(`[3/3] Guardando métricas de ${metrics.length} jugadores en Supabase...`);
    await upsertPlayerMetrics(metrics);
    
    console.log(`🎉 Pipeline finalizado exitosamente para el partido ${matchId}.`);
  } catch (error) {
    console.error(`❌ El pipeline falló para el partido ${matchId}:`, error);
  }
}

// Permitir ejecución desde CLI
const args = process.argv.slice(2);
if (args[0]) {
  const matchId = args[0];
  runScrapingPipeline(matchId);
}
