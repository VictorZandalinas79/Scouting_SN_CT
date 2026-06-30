-- =========================================================================
-- FIX RLS: permitir que cada usuario lea/actualice SIEMPRE su propio perfil
-- =========================================================================
-- Problema: la política club_isolation_profiles dependía de get_user_club_id(),
-- que a su vez lee de profiles. Esa dependencia circular impedía leer el propio
-- perfil al iniciar sesión ("No se pudo encontrar el perfil de usuario...").
--
-- Ejecutar TODO este script en: Supabase -> SQL Editor -> New query -> Run.

-- 1. Asegurar que la función que busca el club ignora el RLS (SECURITY DEFINER)
--    y tiene un search_path fijo (evita recursión y problemas de permisos).
CREATE OR REPLACE FUNCTION public.get_user_club_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT club_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Política dedicada: un usuario SIEMPRE puede leer su propia fila de profiles.
--    (Es permisiva y se combina con OR con las demás, así que rompe el círculo.)
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT
    USING (id = auth.uid());

-- 3. Reemplazar la política de aislamiento por club incluyendo el propio id.
DROP POLICY IF EXISTS club_isolation_profiles ON public.profiles;
CREATE POLICY club_isolation_profiles ON public.profiles
    FOR ALL
    USING (id = auth.uid() OR club_id = get_user_club_id())
    WITH CHECK (id = auth.uid() OR club_id = get_user_club_id());

-- 4. Asegurar permisos del rol "authenticated" sobre la tabla.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
