CREATE TABLE IF NOT EXISTS public.player_match_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id VARCHAR NOT NULL,
    player_id VARCHAR NOT NULL,
    team_id VARCHAR NOT NULL,
    minutes_played NUMERIC DEFAULT 0,
    
    -- Métricas Defensivas
    def_aereos_ganados_propio NUMERIC DEFAULT 0,
    def_aereos_ganados_propio_p90 NUMERIC DEFAULT 0,
    def_recuperaciones NUMERIC DEFAULT 0,
    def_recuperaciones_p90 NUMERIC DEFAULT 0,
    entradas_totales NUMERIC DEFAULT 0,
    entradas_exitosas NUMERIC DEFAULT 0,
    precision_entradas_pct NUMERIC DEFAULT 0,
    
    -- Extensibilidad para el futuro (+100 métricas)
    metrics JSONB DEFAULT '{}'::jsonb,
    
    -- Métricas Ofensivas / ABP
    abp_lanzador_corner NUMERIC DEFAULT 0,
    abp_lanzador_corner_p90 NUMERIC DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(match_id, player_id)
);

-- Asegurar que la columna JSONB existe (por si la tabla ya estaba creada)
ALTER TABLE public.player_match_metrics ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;

-- Habilitar RLS si es necesario, dependiendo de tu configuración
ALTER TABLE public.player_match_metrics ENABLE ROW LEVEL SECURITY;

-- Política de lectura para todos los usuarios autenticados
DROP POLICY IF EXISTS "Enable read access for all users" ON public.player_match_metrics;
CREATE POLICY "Enable read access for all users"
    ON public.player_match_metrics FOR SELECT
    USING (true);

-- Política de inserción/actualización/borrado
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.player_match_metrics;
CREATE POLICY "Enable all operations for all users"
    ON public.player_match_metrics FOR ALL
    USING (true)
    WITH CHECK (true);

-- Otorgar permisos base a los roles de Supabase (PostgREST)
GRANT ALL ON public.player_match_metrics TO anon;
GRANT ALL ON public.player_match_metrics TO authenticated;
GRANT ALL ON public.player_match_metrics TO service_role;
