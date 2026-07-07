import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';

import { Layout } from '../components/Layout';
import { authService } from '../api/services';
import { useAuth } from '../contexts/AuthContext';

const ProfileSkeleton = () => (
  <div className="space-y-8">
    <div className="skeleton h-36 w-full rounded-[32px]" />
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[360px_1fr]">
      <div className="skeleton h-80 rounded-[28px]" />
      <div className="skeleton h-[420px] rounded-[28px]" />
    </div>
  </div>
);

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser, isLoading } = useAuth();
  const client = user?.client;

  const [form, setForm] = useState({
    email: user?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const displayName = client?.full_name || user?.username || 'Cliente';
  const documentLabel = client ? `${client.document_type} ${client.document_number}` : 'Documento no registrado';

  const memberSince = useMemo(() => {
    if (!user?.created_at) return 'No disponible';
    return new Date(user.created_at).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [user?.created_at]);

  const lastAccess = useMemo(() => {
    if (!user?.last_login_at) return 'Sin accesos registrados';
    return new Date(user.last_login_at).toLocaleString('es-PE');
  }, [user?.last_login_at]);

  useEffect(() => {
    setForm({
      email: user?.email || '',
      phone: client?.phone || '',
      address: client?.address || '',
    });
  }, [client?.address, client?.phone, user?.email]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await authService.updateProfile({
        email: form.email,
        phone: form.phone,
        address: form.address,
      });
      await refreshUser();
      setMessage('Tu perfil fue actualizado correctamente.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.email?.[0] || requestError?.response?.data?.detail || 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <ProfileSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <section className="app-panel overflow-hidden px-7 py-8 sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-notary-50 text-notary-800 shadow-card">
                <UserCircle2 className="h-14 w-14" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Mi perfil</p>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900">{displayName}</h1>
                <p className="mt-2 text-sm text-neutral-600">{documentLabel}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Portal seguro</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Tu información está protegida y solo puede ser actualizada desde este portal autenticado.</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Último acceso</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{lastAccess}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[360px_1fr]">
          <section className="space-y-6">
            <article className="app-card px-6 py-6">
              <h2 className="app-section-title">Resumen de cuenta</h2>
              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">Correo</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{user?.email || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">Celular</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{client?.phone || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">Dirección</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{client?.address || 'No registrada'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">Registro en portal</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{memberSince}</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="app-card px-6 py-6">
              <h2 className="app-section-title">Seguridad</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Mantén tu acceso actualizado y revisa periódicamente tu contraseña.
              </p>
              <button type="button" onClick={() => navigate('/change-password')} className="app-button-secondary mt-5 w-full">
                <ShieldCheck className="h-4 w-4" />
                Cambiar contraseña
              </button>
              <button type="button" onClick={() => void handleLogout()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-semibold text-danger transition hover:bg-red-100">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </article>
          </section>

          <section className="app-card px-6 py-6 sm:px-8 sm:py-8">
            <h2 className="app-section-title">Actualizar datos de contacto</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              Mantén tus datos actualizados para recibir notificaciones, coordinar la entrega de documentos y asegurar la correcta identificación de tus trámites.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {message && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-success">{message}</div>}
              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-700">Correo electrónico</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="app-input"
                    placeholder="cliente@correo.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-700">Celular</label>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="app-input"
                    placeholder="987654321"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">Dirección</label>
                <input
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  className="app-input"
                  placeholder="Dirección registrada"
                />
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-5 text-sm leading-7 text-neutral-600">
                La información mostrada es referencial y corresponde a los registros internos de la Notaría Mendoza Vásquez.
                Para información registral oficial, puede consultar los canales oficiales de SUNARP.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={saving} className="app-button-primary">
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando cambios...' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={() => navigate('/dashboard')} className="app-button-secondary">
                  Volver al dashboard
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
