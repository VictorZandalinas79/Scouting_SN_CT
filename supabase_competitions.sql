CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create opta_competitions table
CREATE TABLE IF NOT EXISTS public.opta_competitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id TEXT NOT NULL,
    season_id TEXT NOT NULL,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    season_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching and filtering using ilike
CREATE INDEX IF NOT EXISTS opta_competitions_name_trgm_idx ON public.opta_competitions USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS opta_competitions_country_trgm_idx ON public.opta_competitions USING gin (country gin_trgm_ops);

CREATE INDEX IF NOT EXISTS opta_competitions_active_idx ON public.opta_competitions (is_active);

-- Enable RLS
ALTER TABLE public.opta_competitions ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Allow read access to everyone" ON public.opta_competitions
    FOR SELECT USING (true);

-- Only service role can write
CREATE POLICY "Allow all access to service role" ON public.opta_competitions
    USING (true)
    WITH CHECK (true);

-- Grant privileges
GRANT SELECT ON public.opta_competitions TO anon, authenticated;
GRANT ALL ON public.opta_competitions TO service_role;
