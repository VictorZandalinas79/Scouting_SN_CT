import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthQuery } from '../features/auth/hooks/useAuthQuery';
import {
  Settings,
  Shield,
  CreditCard,
  User,
  Users,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface ProfileFormInput {
  name: string;
  avatarUrl: string;
}

export const AdminPage: React.FC = () => {
  const { user, updateProfile, isUpdatingProfile } = useAuthQuery();
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormInput>({
    defaultValues: {
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  const onSubmit = (data: ProfileFormInput) => {
    updateProfile({
      name: data.name,
      avatarUrl: data.avatarUrl,
    });
  };

  const usersList = [
    { name: 'Santiago Bernabéu', email: 'chief_scout@ctsn.club', role: 'Head Scout', status: 'Activo' },
    { name: 'Zinedine Zidane', email: 'zizou@ctsn.club', role: 'Scout', status: 'Activo' },
    { name: 'Carlo Ancelotti', email: 'carletto@ctsn.club', role: 'Admin', status: 'Activo' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Panel de Administración de Club</h2>
        <p className="text-gray-400 mt-1">Configure los parámetros del club, administre permisos de scouts y controle su plan SaaS.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Profile & SaaS Billing */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Edit Settings */}
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-6 shadow-lg space-y-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <User className="text-emerald-500" size={18} />
              Configuración de Perfil Personal
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase">Nombre de Visualización</label>
                  <input
                    type="text"
                    {...register('name', { required: 'El nombre es obligatorio' })}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase">URL de Foto de Perfil</label>
                  <input
                    type="text"
                    {...register('avatarUrl')}
                    className="mt-1 block w-full rounded-lg border border-[#1e293b] bg-[#141a29] px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {isUpdatingProfile ? 'Guardando...' : 'Actualizar Perfil'}
              </button>
            </form>
          </div>

          {/* Members list */}
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-6 shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="text-emerald-500" size={18} />
                Gestión de Miembros de la Secretaría Técnica
              </h3>
              <span className="text-[10px] text-gray-500 font-bold bg-[#141a29] px-2 py-0.5 rounded border border-[#1e293b]">
                {usersList.length} Miembros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-gray-400">
                <thead className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-[#1e293b]/60">
                  <tr>
                    <th className="py-2.5 px-3">Miembro</th>
                    <th className="py-2.5 px-3">Rol</th>
                    <th className="py-2.5 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/40">
                  {usersList.map((usr, index) => (
                    <tr key={index} className="hover:bg-gray-900/10">
                      <td className="py-3 px-3">
                        <p className="font-bold text-gray-200 text-xs">{usr.name}</p>
                        <p className="text-[10px] text-gray-500">{usr.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {usr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Subscription & SaaS Information */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0f1422] to-emerald-950/20 p-6 shadow-xl space-y-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-[#1e293b]/60 pb-3">
              <CreditCard className="text-emerald-500" size={18} />
              Suscripción de Club
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-emerald-950/30 border border-emerald-900/60 p-4 rounded-xl">
                <div>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Plan Activo</p>
                  <p className="text-xl font-extrabold text-white mt-1">SaaS ENTERPRISE</p>
                </div>
                <span className="text-[9px] bg-white text-emerald-950 px-2 py-1 rounded font-extrabold tracking-wide uppercase">
                  Anual
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider mb-3">Características Incluidas</p>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Scouts Ilimitados
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Pizarra Táctica Interactiva (Campograma)
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Exportación de PDF Fichas Técnicas
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Sincronización en Tiempo Real
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1e293b] bg-[#0f1422] p-6 shadow-lg space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="text-emerald-500" size={16} />
              Seguridad & Auditoría
            </h4>
            <p className="text-xs text-gray-400 leading-normal">
              Su club tiene activada la protección de datos GDPR en la base de datos cifrada de Supabase. El registro de accesos de scouts está auditado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
