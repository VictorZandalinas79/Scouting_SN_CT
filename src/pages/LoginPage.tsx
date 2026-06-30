import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthQuery } from '../features/auth/hooks/useAuthQuery';

interface LoginFormInput {
  email: string;
  password?: string;
}

interface RegisterFormInput {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

// Lee un archivo de imagen y devuelve un data URL redimensionado (máx. 256px) para no guardar imágenes pesadas.
const readAndResizeImage = (file: File, maxSize = 256): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo procesar la imagen'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

// Botón con icono de ojo para mostrar/ocultar la contraseña.
const PasswordToggle: React.FC<{ visible: boolean; onToggle: () => void }> = ({ visible, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    tabIndex={-1}
    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors"
  >
    {visible ? (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.5a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )}
  </button>
);

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoggingIn, signUp, isSigningUp } = useAuthQuery();

  const loginForm = useForm<LoginFormInput>({
    defaultValues: {
      email: 'chief_scout@ctsn.club',
      password: '',
    }
  });

  const registerForm = useForm<RegisterFormInput>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      avatarUrl: '',
    }
  });

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setAuthError(null);
    setAvatarPreview(null);
    loginForm.reset();
    registerForm.reset();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAuthError('El archivo seleccionado no es una imagen.');
      return;
    }
    try {
      const dataUrl = await readAndResizeImage(file);
      setAvatarPreview(dataUrl);
      registerForm.setValue('avatarUrl', dataUrl);
    } catch (err: any) {
      setAuthError(err.message || 'No se pudo cargar la imagen.');
    }
  };

  const onLoginSubmit = (data: LoginFormInput) => {
    setAuthError(null);
    login(
      { email: data.email, password: data.password || '' },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
        onError: (err: any) => {
          setAuthError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        }
      }
    );
  };

  const onRegisterSubmit = (data: RegisterFormInput) => {
    setAuthError(null);
    signUp(
      {
        email: data.email,
        password: data.password,
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
      },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
        onError: (err: any) => {
          setAuthError(err.message || 'Error al registrar la cuenta.');
        }
      }
    );
  };

  return (
    <div className="bg-[#0f1422] border border-[#1e293b] rounded-2xl p-8 shadow-2xl w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Scouting CTSN</h2>
        <p className="mt-2 text-sm text-gray-400">
          Accede al sistema de ojeo y análisis de talento
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e293b] mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('login')}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'login'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('signup')}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'signup'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Registrarse
        </button>
      </div>

      {/* Error Alert */}
      {authError && (
        <div className="bg-red-950/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm mb-5 flex items-start gap-2 animate-fadeIn animate-duration-150">
          <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{authError}</span>
        </div>
      )}

      {/* Login Form */}
      {activeTab === 'login' && (
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-300">
              Correo Electrónico
            </label>
            <div className="mt-1">
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...loginForm.register('email', {
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Formato de correo inválido',
                  },
                })}
                className="block w-full rounded-xl border border-[#1e293b] bg-[#171f30] px-4 py-3 text-white placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="ejemplo@club.com"
              />
              {loginForm.formState.errors.email && (
                <span className="mt-1 block text-xs text-red-400">
                  {loginForm.formState.errors.email.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <div className="mt-1 relative">
              <input
                id="login-password"
                type={showLoginPassword ? 'text' : 'password'}
                {...loginForm.register('password', {
                  required: 'La contraseña es requerida',
                })}
                className="block w-full rounded-xl border border-[#1e293b] bg-[#171f30] px-4 py-3 pr-11 text-white placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="••••••••"
              />
              <PasswordToggle visible={showLoginPassword} onToggle={() => setShowLoginPassword((v) => !v)} />
              {loginForm.formState.errors.password && (
                <span className="mt-1 block text-xs text-red-400">
                  {loginForm.formState.errors.password.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors disabled:opacity-50"
            >
              {isLoggingIn ? 'Iniciando sesión...' : 'Entrar al Panel'}
            </button>
          </div>
        </form>
      )}

      {/* Register Form */}
      {activeTab === 'signup' && (
        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-gray-300">
              Nombre y Apellidos
            </label>
            <div className="mt-1">
              <input
                id="reg-name"
                type="text"
                {...registerForm.register('name', {
                  required: 'El nombre completo es requerido',
                })}
                className="block w-full rounded-xl border border-[#1e293b] bg-[#171f30] px-4 py-3 text-white placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="Santiago Bernabéu"
              />
              {registerForm.formState.errors.name && (
                <span className="mt-1 block text-xs text-red-400">
                  {registerForm.formState.errors.name.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300">
              Correo Electrónico
            </label>
            <div className="mt-1">
              <input
                id="reg-email"
                type="email"
                {...registerForm.register('email', {
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Formato de correo inválido',
                  },
                })}
                className="block w-full rounded-xl border border-[#1e293b] bg-[#171f30] px-4 py-3 text-white placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="scout@club.com"
              />
              {registerForm.formState.errors.email && (
                <span className="mt-1 block text-xs text-red-400">
                  {registerForm.formState.errors.email.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <div className="mt-1 relative">
              <input
                id="reg-password"
                type={showRegisterPassword ? 'text' : 'password'}
                {...registerForm.register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres',
                  },
                })}
                className="block w-full rounded-xl border border-[#1e293b] bg-[#171f30] px-4 py-3 pr-11 text-white placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="Mínimo 6 caracteres"
              />
              <PasswordToggle visible={showRegisterPassword} onToggle={() => setShowRegisterPassword((v) => !v)} />
              {registerForm.formState.errors.password && (
                <span className="mt-1 block text-xs text-red-400">
                  {registerForm.formState.errors.password.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="reg-avatar" className="block text-sm font-medium text-gray-300">
              Foto de Perfil (Opcional)
            </label>
            <input type="hidden" {...registerForm.register('avatarUrl')} />
            <div className="mt-1 flex items-center gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Vista previa"
                  className="h-16 w-16 rounded-full object-cover border border-[#1e293b]"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#171f30] border border-[#1e293b] flex items-center justify-center text-gray-500">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <label
                htmlFor="reg-avatar"
                className="cursor-pointer rounded-xl border border-[#1e293b] bg-[#171f30] px-4 py-2 text-sm font-medium text-gray-200 hover:border-emerald-500 transition-colors"
              >
                {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
                <input
                  id="reg-avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSigningUp}
              className="flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors disabled:opacity-50"
            >
              {isSigningUp ? 'Creando cuenta...' : 'Crear Cuenta y Entrar'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 border-t border-[#1e293b] pt-6 text-center">
        <p className="text-xs text-gray-500">
          ¿Dificultades de acceso? Contacte a su administrador de sistemas TI
        </p>
      </div>
    </div>
  );
};
