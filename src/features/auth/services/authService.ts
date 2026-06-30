import { UserProfile } from '../../../types';
import { supabase } from '../../../services/supabase/supabaseClient';

export const authService = {
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session || !session.user) {
      return null;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role_id as any,
      clubId: profile.club_id,
      avatarUrl: profile.avatar_url || undefined,
      createdAt: profile.created_at,
    };
  },

  signIn: async (email: string, password?: string): Promise<UserProfile> => {
    if (!email) throw new Error('El correo electrónico es requerido');
    if (!password) throw new Error('La contraseña es requerida');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('No se pudo autenticar al usuario.');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('No se pudo encontrar el perfil de usuario asociado en la base de datos.');
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role_id as any,
      clubId: profile.club_id,
      avatarUrl: profile.avatar_url || undefined,
      createdAt: profile.created_at,
    };
  },

  signUp: async (email: string, password: string, name: string, avatarUrl?: string): Promise<UserProfile> => {
    if (!email) throw new Error('El correo electrónico es requerido');
    if (!password) throw new Error('La contraseña es requerida');
    if (!name) throw new Error('El nombre y apellidos son requeridos');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role_id: 'scout',
          avatar_url: avatarUrl || null,
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('No se pudo crear el usuario.');

    // Esperar a que el trigger cree el perfil en la base de datos
    let profileData = null;
    for (let i = 0; i < 5; i++) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      
      if (profile) {
        profileData = profile;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Si email confirmation está habilitado, el perfil no se creará de inmediato en public.profiles
    // porque auth.users no se inserta del mismo modo o se congela.
    if (!profileData) {
      throw new Error(
        'Registro exitoso. Se ha enviado un correo de confirmación (si está activo en Supabase). Por favor verifícalo.'
      );
    }

    return {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      role: profileData.role_id as any,
      clubId: profileData.club_id,
      avatarUrl: profileData.avatar_url || undefined,
      createdAt: profileData.created_at,
    };
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay una sesión de usuario activa');

    const mappedUpdates: any = {};
    if (updates.name !== undefined) mappedUpdates.name = updates.name;
    if (updates.avatarUrl !== undefined) mappedUpdates.avatar_url = updates.avatarUrl;
    mappedUpdates.updated_at = new Date().toISOString();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(mappedUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role_id as any,
      clubId: profile.club_id,
      avatarUrl: profile.avatar_url || undefined,
      createdAt: profile.created_at,
    };
  }
};
