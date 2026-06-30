import fs from 'fs/promises';
import path from 'path';
import { MatchData } from '../types/index.js';

/**
 * Lee los eventos del partido desde los archivos JSON locales guardados por la otra app.
 */
export async function fetchMatchEvents(matchId: string): Promise<MatchData> {
  // Ruta absoluta hacia la carpeta data de tu otra app
  const basePath = '/Users/imac/Programas/LFM Vilafranca/frontend-web/data/Partidos_Individuales';
  const filePath = path.join(basePath, matchId, 'events', `${matchId}.json`);
  
  try {
    console.log(`Leyendo archivo local: ${filePath}`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Como son archivos locales que ya procesaste con Python, asumimos que son JSON válidos (sin JSONP)
    const parsedData = JSON.parse(fileContent);
    
    return parsedData as MatchData;
  } catch (error: any) {
    console.error(`Error al leer el archivo local del partido ${matchId}:`, error.message);
    throw error;
  }
}
