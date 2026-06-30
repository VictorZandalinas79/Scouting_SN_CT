import { StatsApiProvider } from '../providers/StatsApiProvider';
import { WebScraperProvider } from '../providers/WebScraperProvider';
// Let's correct import paths:
import { StatsApiNormalizer } from '../normalizers/StatsApiNormalizer';
import { WebScraperNormalizer } from '../normalizers/WebScraperNormalizer';
import { Deduplicator } from './Deduplicator';
import { playerService } from '../../../features/players/services/playerService';
import { NormalizedPlayerDTO } from '../types';

export interface IngestionRunResult {
  totalProcessed: number;
  totalCreated: number;
  totalUpdated: number;
  totalFlaggedForReview: number;
  logs: string[];
}

export class PipelineManager {
  private statsProvider = new StatsApiProvider();
  private statsNormalizer = new StatsApiNormalizer();
  
  private scraperProvider = new WebScraperProvider();
  private scraperNormalizer = new WebScraperNormalizer();

  /**
   * Runs the ingestion pipeline for all sources
   */
  async runPipeline(): Promise<IngestionRunResult> {
    const logs: string[] = [];
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalFlaggedForReview = 0;
    
    logs.push(`[${new Date().toISOString()}] Iniciando tubería de ingesta...`);
    
    try {
      // 1. Fetch raw data from both sources
      logs.push('Obteniendo datos de API de Estadísticas...');
      const rawApiData = await this.statsProvider.fetchRawData();
      logs.push(`API retornó ${rawApiData.length} registros.`);
      
      logs.push('Obteniendo datos de Web Scraper...');
      const rawScrapeData = await this.scraperProvider.fetchRawData();
      logs.push(`Scraper retornó ${rawScrapeData.length} registros.`);
      
      // 2. Normalize all data into standardized DTOs
      const normalizedPlayers: NormalizedPlayerDTO[] = [];
      
      rawApiData.forEach((raw) => {
        try {
          normalizedPlayers.push(this.statsNormalizer.normalize(raw));
        } catch (err: any) {
          logs.push(`[Error Normalización API] ${raw.full_name}: ${err.message}`);
        }
      });
      
      rawScrapeData.forEach((raw) => {
        try {
          normalizedPlayers.push(this.scraperNormalizer.normalize(raw));
        } catch (err: any) {
          logs.push(`[Error Normalización Scraper] ${raw.profile.name}: ${err.message}`);
        }
      });
      
      totalProcessed = normalizedPlayers.length;
      logs.push(`Total de perfiles normalizados: ${totalProcessed}`);

      // 3. Query existing players database
      const existingPlayers = await playerService.getPlayers();
      
      // 4. Deduplicate and Save/Upsert
      for (const incoming of normalizedPlayers) {
        logs.push(`Analizando duplicados para: ${incoming.name}...`);
        const { matchedPlayer, needsReview, confidenceScore } = Deduplicator.findMatch(incoming, existingPlayers);
        
        if (matchedPlayer) {
          if (needsReview) {
            totalFlaggedForReview++;
            logs.push(`[ALERTA] Posible duplicación ambigua detectada para ${incoming.name} con ${matchedPlayer.name} (Confianza: ${(confidenceScore * 100).toFixed(0)}%). Requiere revisión manual.`);
          }
          
          // Perform automatic merge and update database
          const mergedPlayer = Deduplicator.mergeData(matchedPlayer, incoming);
          await playerService.updatePlayer(matchedPlayer.id, mergedPlayer);
          totalUpdated++;
          logs.push(`[ACTUALIZACIÓN] Jugador ${mergedPlayer.name} sincronizado y actualizado con nuevos datos.`);
        } else {
          // Create new player record in database
          await playerService.createPlayer({
            name: incoming.name,
            age: incoming.birthDate ? this.calculateAge(incoming.birthDate) : 22,
            nationality: incoming.nationality || 'Desconocido',
            club: incoming.currentClubName,
            position: incoming.primaryPosition,
            preferredFoot: incoming.preferredFoot === 'left' ? 'Left' : incoming.preferredFoot === 'right' ? 'Right' : 'Both',
            height: incoming.height || 180,
            weight: incoming.weight || 75,
            contractUntil: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // +3 years
            marketValue: incoming.marketValue || 0,
            rating: 3.5, // start middle
            potential: 3.5,
            status: 'Monitored',
            attributes: incoming.attributes,
            stats: incoming.stats,
            scoutId: 'usr_1',
            clubId: 'club_1',
          });
          totalCreated++;
          logs.push(`[NUEVO] Registrado nuevo talento en base de datos: ${incoming.name}.`);
        }
      }
      
      logs.push(`[${new Date().toISOString()}] Tubería finalizada con éxito.`);
    } catch (err: any) {
      logs.push(`[ERROR GENERAL PIPELINE] ${err.message}`);
    }
    
    return {
      totalProcessed,
      totalCreated,
      totalUpdated,
      totalFlaggedForReview,
      logs,
    };
  }
  
  private calculateAge(dob: string): number {
    const birthday = new Date(dob);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}
