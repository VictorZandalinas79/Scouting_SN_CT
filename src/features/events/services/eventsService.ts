import { supabase } from '../../../services/supabase/supabaseClient';
import { SlimEvent } from '../../../components/pitch/types';

/** Bucket de Supabase Storage donde el pipeline sube los eventos comprimidos. */
export const EVENTS_BUCKET = 'match-events';

/** Ruta del fichero de eventos de un partido dentro del bucket. */
export const eventsPath = (matchId: string) => `${matchId}/events.json.gz`;

/**
 * Descomprime un Blob gzip a texto usando la API nativa del navegador
 * (DecompressionStream). Sin dependencias externas.
 */
async function gunzipToJson<T>(blob: Blob): Promise<T> {
  // Si el entorno no soporta DecompressionStream, intentamos leer en claro
  // (por si el fichero se subió sin comprimir).
  if (typeof DecompressionStream === 'undefined') {
    const raw = await blob.text();
    return JSON.parse(raw) as T;
  }
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  const text = await new Response(stream).text();
  return JSON.parse(text) as T;
}

export const eventsService = {
  /**
   * Descarga los eventos slim de un partido desde Storage y los descomprime.
   * Devuelve el array de SlimEvent listo para el <PitchMap/>.
   */
  async getMatchEvents(matchId: string): Promise<SlimEvent[]> {
    const { data, error } = await supabase.storage
      .from(EVENTS_BUCKET)
      .download(eventsPath(matchId));

    if (error) {
      throw new Error(
        `No se pudieron cargar los eventos del partido ${matchId}: ${error.message}`
      );
    }
    if (!data) {
      throw new Error(`Partido ${matchId} sin datos de eventos.`);
    }

    const events = await gunzipToJson<SlimEvent[]>(data);
    return Array.isArray(events) ? events : [];
  },
};
