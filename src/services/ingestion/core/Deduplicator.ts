import { Player } from '../../../types';
import { NormalizedPlayerDTO } from '../types';
import { getStringSimilarity } from '../../../utils/stringMetrics';

export interface MatchResult {
  matchedPlayer: Player | null;
  needsReview: boolean;
  confidenceScore: number;
}

export class Deduplicator {
  /**
   * Evaluates a incoming normalized player against the database list
   */
  static findMatch(incoming: NormalizedPlayerDTO, existingPlayers: Player[]): MatchResult {
    let bestMatch: Player | null = null;
    let maxConfidence = 0;
    
    for (const player of existingPlayers) {
      let confidence = 0;
      
      // 1. Match by exact birth date + name
      const incomingBirth = incoming.birthDate;
      const playerBirth = player.contractUntil; // In our mockup we don't have birthdate in Player, but we have height/weight/nationality
      // Let's use name similarity and nationality/height check since mock Player schema has age, height, nationality
      
      const nameSim = getStringSimilarity(incoming.name, player.name);
      
      if (nameSim > 0.98) {
        // Direct name match
        confidence = 1.0;
      } else if (nameSim >= 0.82) {
        // High fuzzy match on name - cross reference with nationality
        const nationMatch = incoming.nationality?.toLowerCase() === player.nationality.toLowerCase();
        const heightMatch = incoming.height ? Math.abs(incoming.height - player.height) <= 3 : false;
        
        if (nationMatch && heightMatch) {
          confidence = nameSim * 0.95; // highly confident fuzzy match
        } else if (nationMatch) {
          confidence = nameSim * 0.85;
        } else {
          confidence = nameSim * 0.50; // low confidence
        }
      }
      
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestMatch = player;
      }
    }
    
    // Threshold evaluation
    if (maxConfidence >= 0.95) {
      return { matchedPlayer: bestMatch, needsReview: false, confidenceScore: maxConfidence };
    } else if (maxConfidence >= 0.80) {
      return { matchedPlayer: bestMatch, needsReview: true, confidenceScore: maxConfidence };
    }
    
    return { matchedPlayer: null, needsReview: false, confidenceScore: 0 };
  }

  /**
   * Merges incoming stats and attributes into the existing player profile
   */
  static mergeData(existing: Player, incoming: NormalizedPlayerDTO): Player {
    return {
      ...existing,
      // Update metadata and physical stats if provided
      height: incoming.height || existing.height,
      weight: incoming.weight || existing.weight,
      marketValue: incoming.marketValue || existing.marketValue,
      
      // Merge performance attributes (e.g. choose the maximum or average)
      attributes: {
        pace: Math.max(existing.attributes.pace, incoming.attributes.pace),
        shooting: Math.max(existing.attributes.shooting, incoming.attributes.shooting),
        passing: Math.max(existing.attributes.passing, incoming.attributes.passing),
        dribbling: Math.max(existing.attributes.dribbling, incoming.attributes.dribbling),
        defending: Math.max(existing.attributes.defending, incoming.attributes.defending),
        physical: Math.max(existing.attributes.physical, incoming.attributes.physical),
        tactical: Math.max(existing.attributes.tactical, incoming.attributes.tactical),
      },
      
      updatedAt: new Date().toISOString(),
    };
  }
}
