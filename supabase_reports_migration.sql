-- =========================================================================
-- MIGRACIÓN: EXTENSIÓN DE INFORMES DE SCOUTING & CATÁLOGO DE ATRIBUTOS (EAV)
-- =========================================================================

-- 1. Tabla de Catálogo de Atributos
CREATE TABLE IF NOT EXISTS public.report_attributes_catalog (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('technical', 'tactical', 'physical', 'mental')),
    description TEXT
);

-- Habilitar RLS en el catálogo
ALTER TABLE public.report_attributes_catalog ENABLE ROW LEVEL SECURITY;

-- Evitar duplicación de políticas en ejecuciones sucesivas
DROP POLICY IF EXISTS read_catalog ON public.report_attributes_catalog;
CREATE POLICY read_catalog ON public.report_attributes_catalog FOR SELECT USING (true);

-- 2. Modificar/Extender la tabla scouting_reports con los nuevos campos de ojeo detallados
ALTER TABLE public.scouting_reports 
    ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS competition VARCHAR(150),
    ADD COLUMN IF NOT EXISTS minutes_observed INT DEFAULT 90,
    ADD COLUMN IF NOT EXISTS observed_team VARCHAR(150),
    ADD COLUMN IF NOT EXISTS rival VARCHAR(150),
    ADD COLUMN IF NOT EXISTS tactical_system VARCHAR(50),
    ADD COLUMN IF NOT EXISTS position_played VARCHAR(10) REFERENCES public.positions(id),
    ADD COLUMN IF NOT EXISTS strong_foot VARCHAR(10) CHECK (strong_foot IN ('left', 'right', 'both')),
    ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(100),
    ADD COLUMN IF NOT EXISTS free_report TEXT,
    ADD COLUMN IF NOT EXISTS strengths_list TEXT[],
    ADD COLUMN IF NOT EXISTS weaknesses_list TEXT[],
    ADD COLUMN IF NOT EXISTS potential_rating NUMERIC(4, 2) CHECK (potential_rating BETWEEN 1.0 AND 10.0),
    ADD COLUMN IF NOT EXISTS current_level_rating NUMERIC(4, 2) CHECK (current_level_rating BETWEEN 1.0 AND 10.0),
    ADD COLUMN IF NOT EXISTS personality VARCHAR(150),
    ADD COLUMN IF NOT EXISTS character VARCHAR(150),
    ADD COLUMN IF NOT EXISTS tactical_intelligence_rating INT CHECK (tactical_intelligence_rating BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS physical_capacity_rating INT CHECK (physical_capacity_rating BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS technical_capacity_rating INT CHECK (technical_capacity_rating BETWEEN 1 AND 10),
    ADD COLUMN IF NOT EXISTS mental_capacity_rating INT CHECK (mental_capacity_rating BETWEEN 1 AND 10);

-- 3. Tabla relacional de puntuación de atributos por informe (EAV)
CREATE TABLE IF NOT EXISTS public.report_attribute_scores (
    report_id UUID NOT NULL REFERENCES public.scouting_reports(id) ON DELETE CASCADE,
    attribute_id VARCHAR(50) NOT NULL REFERENCES public.report_attributes_catalog(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 10),
    PRIMARY KEY (report_id, attribute_id)
);

-- Habilitar RLS en las puntuaciones de atributos
ALTER TABLE public.report_attribute_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_isolation_attribute_scores ON public.report_attribute_scores;
CREATE POLICY club_isolation_attribute_scores ON public.report_attribute_scores FOR ALL USING (
    report_id IN (SELECT id FROM public.scouting_reports WHERE club_id = get_user_club_id())
);

-- 4. Población inicial de los 41 atributos en el catálogo
INSERT INTO public.report_attributes_catalog (id, name, category, description) VALUES
-- Técnicos
('crossing', 'Centros / Pases cruzados', 'technical', 'Precisión en envíos laterales al área.'),
('dribbling', 'Regate / Conducción', 'technical', 'Capacidad para superar rivales con el balón controlado.'),
('finishing', 'Remate / Finalización', 'technical', 'Eficacia de cara al gol dentro del área.'),
('first_touch', 'Primer Toque / Control', 'technical', 'Calidad en la recepción inicial del esférico.'),
('free_kick_taking', 'Lanzamiento de Faltas', 'technical', 'Especialista a balón parado directo e indirecto.'),
('heading', 'Cabeceo', 'technical', 'Técnica de golpeo aéreo defensivo y ofensivo.'),
('long_shots', 'Tiros Lejanos', 'technical', 'Amenaza y precisión en disparos desde fuera del área.'),
('long_throws', 'Saques de Banda Largos', 'technical', 'Capacidad para proyectar balones profundos desde la banda.'),
('marking', 'Marcaje', 'technical', 'Habilidad para seguir y neutralizar individualmente a un oponente.'),
('passing', 'Pase Corto', 'technical', 'Precisión y velocidad en pases a corta y media distancia.'),
('penalty_taking', 'Penaltis', 'technical', 'Efectividad en ejecuciones desde el punto fatídico.'),
('tackling', 'Entrada / Robo', 'technical', 'Limpieza y éxito al disputar el balón por el suelo.'),
('technique', 'Técnica Individual', 'technical', 'Calidad técnica general en situaciones de presión.'),
-- Tácticos
('anticipation', 'Anticipación', 'tactical', 'Habilidad para leer los movimientos del balón y del rival.'),
('decisions', 'Decisión / Criterio', 'tactical', 'Habilidad para elegir la mejor opción de juego en cada instante.'),
('flair', 'Improvisación / Talento', 'tactical', 'Acciones impredecibles y creatividad individual.'),
('off_the_ball', 'Juego sin Balón', 'tactical', 'Calidad en desmarques y arrastre de marcas.'),
('positioning', 'Posicionamiento Defensivo', 'tactical', 'Ubicación táctica correcta en fase de no posesión.'),
('teamwork', 'Trabajo en Equipo', 'tactical', 'Seguimiento de tácticas colectivas y apoyo al compañero.'),
('vision', 'Visión de Juego', 'tactical', 'Habilidad para detectar líneas de pase libres.'),
('work_rate', 'Sacrificio / Esfuerzo', 'tactical', 'Voluntad física para replegarse y presionar.'),
('pressing', 'Presión Tras Pérdida', 'tactical', 'Rapidez en la transición defensiva para acosar al poseedor.'),
-- Físicos
('acceleration', 'Aceleración', 'physical', 'Capacidad para alcanzar la velocidad máxima rápidamente.'),
('agility', 'Agilidad', 'physical', 'Destreza para cambiar de dirección a gran velocidad.'),
('balance', 'Equilibrio / Estabilidad', 'physical', 'Estabilidad corporal al chocar o girar.'),
('jumping_reach', 'Salto / Alcance Aéreo', 'physical', 'Capacidad para elevarse del suelo en duelos aéreos.'),
('natural_fitness', 'Resistencia Natural', 'physical', 'Velocidad de recuperación entre partidos y entrenamientos.'),
('pace', 'Velocidad Punta', 'physical', 'Velocidad máxima en carreras largas.'),
('stamina', 'Resistencia', 'physical', 'Capacidad para mantener el rendimiento durante 90 minutos.'),
('strength', 'Fuerza / Potencia', 'physical', 'Potencia física en forcejeos y protección de balón.'),
('injury_resistance', 'Resistencia a Lesiones', 'physical', 'Baja propensión a sufrir lesiones musculares o articulares.'),
-- Mentales / Psicológicos
('aggression', 'Agresividad', 'mental', 'Fuerza e intensidad competitiva en disputas.'),
('bravery', 'Valentía', 'mental', 'Voluntad para ir al suelo, ir a duelos aéreos difíciles o arriesgar el físico.'),
('composure', 'Serenidad / Temple', 'mental', 'Calma ante la presión defensiva o en definiciones.'),
('concentration', 'Concentración', 'mental', 'Mantenimiento del enfoque táctico durante el transcurso del partido.'),
('determination', 'Determinación', 'mental', 'Voluntad de ganar y perseverancia ante un marcador adverso.'),
('leadership', 'Laze / Liderazgo', 'mental', 'Habilidad para ordenar, motivar y comandar a los compañeros.'),
('focus', 'Enfoque Táctico', 'mental', 'Compromiso y atención a las directrices técnicas.'),
('self_control', 'Autocontrol', 'mental', 'Mantener la disciplina ante provocaciones o fatiga.'),
('competitiveness', 'Espíritu Competitivo', 'mental', 'Ambición de superación en cada duelo de juego.'),
('adaptability', 'Adaptabilidad', 'mental', 'Facilidad para amoldarse a diferentes roles y planteamientos tácticos.')
ON CONFLICT (id) DO NOTHING;
