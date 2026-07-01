-- ============================================================================
-- Cola de trabajos de ingesta. El panel admin inserta filas 'pending' y el
-- worker de Python (GitHub Actions) las consume, procesa y actualiza el estado.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 'competition' = descargar eventos de todos los partidos de una competición
    -- 'match_events' = descargar eventos de un único partido
    job_type TEXT NOT NULL DEFAULT 'competition',
    competition_id TEXT,
    -- ID de temporada (tournamentCalendar / tmcl). Es lo que realmente pilota
    -- la descarga de fixtures. Se toma de tournamentCalendar.id del JSON.
    season_id TEXT,
    match_id TEXT,
    -- pending | processing | done | error
    status TEXT NOT NULL DEFAULT 'pending',
    message TEXT,
    matches_processed INT DEFAULT 0,
    matches_total INT DEFAULT 0,
    requested_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status
    ON public.ingestion_jobs (status, created_at);

ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado ve el estado de los trabajos.
DROP POLICY IF EXISTS "ingestion_jobs_select" ON public.ingestion_jobs;
CREATE POLICY "ingestion_jobs_select"
    ON public.ingestion_jobs FOR SELECT
    TO authenticated
    USING (true);

-- Inserción: cualquier usuario autenticado puede encolar trabajos.
-- (Si quieres restringir a admin/head_scout, cámbialo por una comprobación
--  contra profiles.role.)
DROP POLICY IF EXISTS "ingestion_jobs_insert" ON public.ingestion_jobs;
CREATE POLICY "ingestion_jobs_insert"
    ON public.ingestion_jobs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Actualización: los usuarios autenticados pueden cancelar trabajos.
DROP POLICY IF EXISTS "ingestion_jobs_update" ON public.ingestion_jobs;
CREATE POLICY "ingestion_jobs_update"
    ON public.ingestion_jobs FOR UPDATE
    TO authenticated
    USING (true);

-- Borrado: los usuarios autenticados pueden borrar trabajos de la tabla.
DROP POLICY IF EXISTS "ingestion_jobs_delete" ON public.ingestion_jobs;
CREATE POLICY "ingestion_jobs_delete"
    ON public.ingestion_jobs FOR DELETE
    TO authenticated
    USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingestion_jobs TO authenticated;
GRANT ALL ON public.ingestion_jobs TO service_role;
