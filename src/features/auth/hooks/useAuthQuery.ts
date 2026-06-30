import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuthStore } from '../../../store/global/useAuthStore';
import { useUIStore } from '../../../store/global/useUIStore';

export const useAuthQuery = () => {
  const queryClient = useQueryClient();
  const { setUser, signOut: signOutStore } = useAuthStore();
  const { addToast } = useUIStore();

  const userQuery = useQuery({
    queryKey: ['auth_user'],
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    },
    staleTime: Infinity, // User session doesn't change unless explicit action
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password?: string }) => {
      return authService.signIn(email, password);
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['auth_user'], data);
      addToast(`Bienvenido de nuevo, ${data.name}!`, 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al iniciar sesión', 'error');
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, name, avatarUrl }: { email: string; password: string; name: string; avatarUrl?: string }) => {
      return authService.signUp(email, password, name, avatarUrl);
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['auth_user'], data);
      addToast(`¡Registro exitoso! Bienvenido, ${data.name}`, 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al registrarse', 'error');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      signOutStore();
      queryClient.setQueryData(['auth_user'], null);
      queryClient.clear(); // Clear all cache on logout
      addToast('Sesión cerrada con éxito', 'success');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['auth_user'], data);
      addToast('Perfil actualizado correctamente', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al actualizar el perfil', 'error');
    },
  });

  return {
    user: userQuery.data || null,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    signUp: signUpMutation.mutate,
    isSigningUp: signUpMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
};
