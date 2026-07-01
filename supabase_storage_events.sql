-- ============================================================================
-- Bucket de Storage para los eventos slim comprimidos de cada partido.
-- Ruta de cada fichero: {match_id}/events.json.gz
-- El worker de Python sube con la service_role key; el frontend descarga con
-- la sesión del usuario autenticado.
-- ============================================================================

-- 1. Crear el bucket 'match-events' (privado).
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-events', 'match-events', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir LECTURA a cualquier usuario autenticado.
--    (La escritura la hace el worker con service_role, que salta RLS.)
DROP POLICY IF EXISTS "Read match events (authenticated)" ON storage.objects;
CREATE POLICY "Read match events (authenticated)"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'match-events');

-- OPCIONAL — si prefieres que el bucket sea público (cualquiera con la URL
-- puede descargar; egress cuenta igual). Descomenta y omite la política de
-- lectura anterior:
-- UPDATE storage.buckets SET public = true WHERE id = 'match-events';
