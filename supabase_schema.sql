-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. CREACIÓN DE TABLAS MAESTRAS Y CATÁLOGOS
-- =========================================================================

-- Tabla de Clubes (Tenants)
CREATE TABLE public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Roles de Usuario
CREATE TABLE public.roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Insertar roles base
INSERT INTO public.roles (id, name, description) VALUES
('admin', 'Administrador del Club', 'Control total de la organización, suscripción y miembros.'),
('head_scout', 'Director de Scouting', 'Gestión de listas, asignación de partidos y aprobación de informes.'),
('scout', 'Scout / Ojeador', 'Visualización de partidos, creación de reportes y valoración de talentos.');

-- Tabla de Perfiles de Usuario (Relacionado con Auth de Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES public.roles(id),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Temporadas
CREATE TABLE public.seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL, -- e.g., '2025/2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Competiciones
CREATE TABLE public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    country VARCHAR(100),
    type VARCHAR(50) CHECK (type IN ('league', 'cup', 'international')),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Equipos
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    logo_url TEXT,
    country VARCHAR(100),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Posiciones
CREATE TABLE public.positions (
    id VARCHAR(10) PRIMARY KEY, -- 'GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'
    name VARCHAR(100) NOT NULL,
    line VARCHAR(20) NOT NULL CHECK (line IN ('goalkeeper', 'defender', 'midfielder', 'attacker'))
);

-- Insertar posiciones base
INSERT INTO public.positions (id, name, line) VALUES
('GK', 'Portero', 'goalkeeper'),
('CB', 'Central', 'defender'),
('LB', 'Lateral Izquierdo', 'defender'),
('RB', 'Lateral Derecho', 'defender'),
('DM', 'Pivote Defensivo', 'midfielder'),
('CM', 'Mediocentro', 'midfielder'),
('AM', 'Mediapunta', 'midfielder'),
('LW', 'Extremo Izquierdo', 'attacker'),
('RW', 'Extremo Derecho', 'attacker'),
('ST', 'Delantero Centro', 'attacker');

-- Tabla de Jugadores
CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    nationality VARCHAR(100),
    birth_date DATE,
    height INT, -- en cm
    weight INT, -- en kg
    preferred_foot VARCHAR(10) CHECK (preferred_foot IN ('left', 'right', 'both')),
    current_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    primary_position_id VARCHAR(10) REFERENCES public.positions(id),
    photo_url TEXT,
    market_value NUMERIC(15, 2),
    contract_until DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de Posiciones Secundarias
CREATE TABLE public.player_positions (
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    position_id VARCHAR(10) NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
    PRIMARY KEY (player_id, position_id)
);

-- Histórico de Equipos de los Jugadores
CREATE TABLE public.player_teams_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    transfer_fee NUMERIC(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partidos Vistos
CREATE TABLE public.matches_watched (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    match_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    scout_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    video_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Informes de Scouting
CREATE TABLE public.scouting_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    scout_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    match_id UUID REFERENCES public.matches_watched(id) ON DELETE SET NULL,
    verdict VARCHAR(20) NOT NULL CHECK (verdict IN ('Sign', 'Monitor', 'Dismiss')),
    overall_rating NUMERIC(4, 2) NOT NULL, -- valoración general (ej: 8.5)
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Valoraciones Subjetivas del Scouting
CREATE TABLE public.subjective_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.scouting_reports(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- ej: 'Inteligencia Táctica', 'Físico', 'Técnica'
    score INT NOT NULL CHECK (score BETWEEN 1 AND 10),
    notes TEXT
);

-- Fuentes de Datos Externas
CREATE TABLE public.data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- Wyscout, Opta
    api_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Valoraciones Objetivas (Métricas de Big Data)
CREATE TABLE public.objective_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
    metric_name VARCHAR(100) NOT NULL, -- ej: 'expected_goals_per_90'
    score NUMERIC(10, 4) NOT NULL,
    season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estadísticas Tradicionales Agregadas
CREATE TABLE public.statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    matches_played INT NOT NULL DEFAULT 0,
    minutes_played INT NOT NULL DEFAULT 0,
    goals INT NOT NULL DEFAULT 0,
    assists INT NOT NULL DEFAULT 0,
    yellow_cards INT NOT NULL DEFAULT 0,
    red_cards INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Etiquetas
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asignación de Etiquetas a Jugadores
CREATE TABLE public.player_tags (
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (player_id, tag_id)
);

-- Favoritos
CREATE TABLE public.favorites (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, player_id)
);

-- Histórico de Valoraciones del Jugador
CREATE TABLE public.rating_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    scout_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating NUMERIC(4, 2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- 2. CREACIÓN DE ÍNDICES DE RENDIMIENTO (OPTIMIZACIÓN DE CONSULTAS)
-- =========================================================================

CREATE INDEX idx_players_club_id ON public.players(club_id);
CREATE INDEX idx_players_name ON public.players(name);
CREATE INDEX idx_players_current_team ON public.players(current_team_id);
CREATE INDEX idx_profiles_club_id ON public.profiles(club_id);
CREATE INDEX idx_scouting_reports_player_id ON public.scouting_reports(player_id);
CREATE INDEX idx_scouting_reports_club_id ON public.scouting_reports(club_id);
CREATE INDEX idx_rating_history_player_id ON public.rating_history(player_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_statistics_player_season ON public.statistics(player_id, season_id);

-- =========================================================================
-- 3. SEGURIDAD DE NIVEL DE FILA (RLS) - AISLAMIENTO SaaS
-- =========================================================================

-- Activar RLS en todas las tablas
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_teams_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches_watched ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouting_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjective_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objective_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_history ENABLE ROW LEVEL SECURITY;

-- Función segura para obtener el club del usuario logueado
CREATE OR REPLACE FUNCTION public.get_user_club_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT club_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de aislamiento SaaS por club_id
CREATE POLICY club_isolation_clubs ON public.clubs FOR ALL USING (id = get_user_club_id());
CREATE POLICY club_isolation_profiles ON public.profiles FOR ALL USING (club_id = get_user_club_id());
CREATE POLICY club_isolation_seasons ON public.seasons FOR ALL USING (club_id = get_user_club_id());
CREATE POLICY club_isolation_competitions ON public.competitions FOR ALL USING (club_id = get_user_club_id());
CREATE POLICY club_isolation_teams ON public.teams FOR ALL USING (club_id = get_user_club_id());
CREATE POLICY club_isolation_players ON public.players FOR ALL USING (club_id = get_user_club_id());
CREATE POLICY club_isolation_matches ON public.matches_watched FOR ALL USING (club_id = get_user_club_id());
CREATE POLICY club_isolation_reports ON public.scouting_reports FOR ALL USING (club_id = get_user_club_id());
CREATE POLICY club_isolation_tags ON public.tags FOR ALL USING (club_id = get_user_club_id());

-- Políticas de seguridad para tablas relacionales o secundarias
CREATE POLICY club_isolation_player_positions ON public.player_positions FOR ALL USING (
    player_id IN (SELECT id FROM public.players WHERE club_id = get_user_club_id())
);
CREATE POLICY club_isolation_player_tags ON public.player_tags FOR ALL USING (
    player_id IN (SELECT id FROM public.players WHERE club_id = get_user_club_id())
);
CREATE POLICY club_isolation_teams_history ON public.player_teams_history FOR ALL USING (
    player_id IN (SELECT id FROM public.players WHERE club_id = get_user_club_id())
);
CREATE POLICY club_isolation_subjective_ratings ON public.subjective_ratings FOR ALL USING (
    report_id IN (SELECT id FROM public.scouting_reports WHERE club_id = get_user_club_id())
);
CREATE POLICY club_isolation_objective_ratings ON public.objective_ratings FOR ALL USING (
    player_id IN (SELECT id FROM public.players WHERE club_id = get_user_club_id())
);
CREATE POLICY club_isolation_statistics ON public.statistics FOR ALL USING (
    player_id IN (SELECT id FROM public.players WHERE club_id = get_user_club_id())
);
CREATE POLICY club_isolation_rating_history ON public.rating_history FOR ALL USING (
    player_id IN (SELECT id FROM public.players WHERE club_id = get_user_club_id())
);
CREATE POLICY club_isolation_favorites ON public.favorites FOR ALL USING (
    user_id = auth.uid()
);

-- =========================================================================
-- 4. VISTAS ANALÍTICAS ÚTILES
-- =========================================================================

-- Vista consolidada del perfil del jugador con promedios de scouting
CREATE OR REPLACE VIEW public.view_player_summary AS
SELECT 
    p.id AS player_id,
    p.club_id,
    p.name AS player_name,
    p.nationality,
    p.birth_date,
    EXTRACT(YEAR FROM age(p.birth_date)) AS age,
    p.height,
    p.weight,
    p.preferred_foot,
    p.market_value,
    p.contract_until,
    p.photo_url,
    t.name AS current_team_name,
    pos.id AS primary_position_code,
    pos.name AS primary_position_name,
    pos.line AS position_line,
    COALESCE(AVG(r.overall_rating), 0)::NUMERIC(4, 2) AS average_scouting_rating,
    COUNT(r.id) AS total_reports_filed
FROM 
    public.players p
LEFT JOIN public.teams t ON p.current_team_id = t.id
LEFT JOIN public.positions pos ON p.primary_position_id = pos.id
LEFT JOIN public.scouting_reports r ON p.id = r.player_id
GROUP BY 
    p.id, t.name, pos.id;

-- Vista de los últimos informes de scouting ingresados por club
CREATE OR REPLACE VIEW public.view_recent_scouting_activity AS
SELECT 
    r.id AS report_id,
    r.club_id,
    p.name AS player_name,
    p.photo_url AS player_photo,
    pos.id AS position_code,
    prof.name AS scout_name,
    r.verdict,
    r.overall_rating,
    m.match_name,
    m.date AS match_date,
    r.created_at AS report_date
FROM 
    public.scouting_reports r
JOIN public.players p ON r.player_id = p.id
LEFT JOIN public.positions pos ON p.primary_position_id = pos.id
JOIN public.profiles prof ON r.scout_id = prof.id
LEFT JOIN public.matches_watched m ON r.match_id = m.id;

-- =========================================================================
-- 5. FUNCIONES Y TRIGGERS SQL DE SOPORTE TÉCNICO
-- =========================================================================

-- Trigger para automatizar el campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_reports_updated_at BEFORE UPDATE ON public.scouting_reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para sincronizar auth.users con public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    v_club_id UUID;
    v_role_id VARCHAR(50);
    v_name VARCHAR(150);
BEGIN
    -- Intentar recuperar metadatos pasados en la registración
    v_club_id := (NEW.raw_user_meta_data->>'club_id')::UUID;
    v_role_id := COALESCE(NEW.raw_user_meta_data->>'role_id', 'scout');
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);

    -- Si no se provee club_id (ej: primer registro), crear un club por defecto
    IF v_club_id IS NULL THEN
        INSERT INTO public.clubs (name) 
        VALUES ('Club CTSN Default') 
        RETURNING id INTO v_club_id;
    END IF;

    INSERT INTO public.profiles (id, club_id, role_id, name, email, avatar_url)
    VALUES (
        NEW.id,
        v_club_id,
        v_role_id,
        v_name,
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Trigger para agregar historial de valoraciones automáticamente cuando se crea un reporte
CREATE OR REPLACE FUNCTION public.handle_new_report_rating()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.rating_history (player_id, scout_id, rating)
    VALUES (NEW.player_id, NEW.scout_id, NEW.overall_rating);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_on_report_inserted
  AFTER INSERT ON public.scouting_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_report_rating();
