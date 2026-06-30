-- =========================================================================
-- MIGRACIÓN ADICIONAL: ADAPTAR BASE DE DATOS PARA LA APLICACIÓN DE SCOUTING
-- =========================================================================

-- 1. Añadir columnas faltantes a la tabla de jugadores (players)
ALTER TABLE public.players 
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Monitored' CHECK (status IN ('Monitored', 'Target', 'Recommended', 'Archived')),
    ADD COLUMN IF NOT EXISTS rating NUMERIC(4,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS potential NUMERIC(4,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{"pace":50,"shooting":50,"passing":50,"dribbling":50,"defending":50,"physical":50,"tactical":50}'::jsonb,
    ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"matchesPlayed":0,"minutesPlayed":0,"goals":0,"assists":0,"yellowCards":0,"redCards":0}'::jsonb,
    ADD COLUMN IF NOT EXISTS scout_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Añadir columnas faltantes a la tabla de equipos (teams)
ALTER TABLE public.teams 
    ADD COLUMN IF NOT EXISTS league VARCHAR(150),
    ADD COLUMN IF NOT EXISTS scout_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS season VARCHAR(50),
    ADD COLUMN IF NOT EXISTS coach VARCHAR(150),
    ADD COLUMN IF NOT EXISTS usual_system VARCHAR(50),
    ADD COLUMN IF NOT EXISTS game_model TEXT,
    ADD COLUMN IF NOT EXISTS pressing_style TEXT,
    ADD COLUMN IF NOT EXISTS build_up TEXT,
    ADD COLUMN IF NOT EXISTS transitions TEXT,
    ADD COLUMN IF NOT EXISTS set_pieces TEXT,
    ADD COLUMN IF NOT EXISTS collective_stats JSONB DEFAULT '{"matchesPlayed":0,"won":0,"drawn":0,"lost":0,"goalsFor":0,"goalsAgainst":0,"cleanSheets":0}'::jsonb,
    ADD COLUMN IF NOT EXISTS season_history JSONB DEFAULT '[]'::jsonb;

-- 3. Añadir columna faltante a la tabla de informes de scouting (scouting_reports)
ALTER TABLE public.scouting_reports 
    ADD COLUMN IF NOT EXISTS match_name VARCHAR(255);

-- 4. Crear la tabla de informes de equipos (team_reports)
CREATE TABLE IF NOT EXISTS public.team_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    scout_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scout_name VARCHAR(150),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    verdict VARCHAR(50) NOT NULL CHECK (verdict IN ('Excellent', 'Average', 'Needs Improvement')),
    tactical_analysis TEXT,
    strengths TEXT[],
    weaknesses TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en informes de equipos
ALTER TABLE public.team_reports ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento de informes de equipos (aislamiento por club de su respectivo equipo)
DROP POLICY IF EXISTS club_isolation_team_reports ON public.team_reports;
CREATE POLICY club_isolation_team_reports ON public.team_reports 
    FOR ALL USING (
        team_id IN (SELECT id FROM public.teams WHERE club_id = get_user_club_id())
    );

-- 5. Crear la tabla de listas de clasificación (ranking_lists)
CREATE TABLE IF NOT EXISTS public.ranking_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    player_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en listas de clasificación
ALTER TABLE public.ranking_lists ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento de listas de clasificación por club
DROP POLICY IF EXISTS club_isolation_ranking_lists ON public.ranking_lists;
CREATE POLICY club_isolation_ranking_lists ON public.ranking_lists 
    FOR ALL USING (
        club_id = get_user_club_id()
    );
