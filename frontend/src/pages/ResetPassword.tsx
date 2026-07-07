import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';

import { authService } from '../api/services';
import { AuthShell } from '../components';

const ResetPassword: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const linkIsValid = useMemo(() => Boolean(uid && token), [token, uid]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!uid || !token) {
      setError('El enlace de recuperación no es válido.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPasswordConfirm({
        uid,
        token,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setSubmitted(true);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'No fue posible restablecer tu contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Nueva contraseña"
      title="Define una nueva clave"
      description="Crea una contraseña segura para volver a ingresar al portal. El enlace es personal y solo puede usarse dentro de su vigencia."
    >
      {!linkIsValid ? (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-5 text-sm leading-7 text-danger">
            El enlace recibido no es válido. Solicita uno nuevo desde la opción de recuperación de contraseña.
          </div>
          <Link to="/forgot-password" className="app-button-primary w-full justify-center">
            Solicitar nuevo enlace
          </Link>
        </div>
      ) : submitted ? (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Contraseña actualizada correctamente</p>
                <p className="mt-2 text-sm leading-6 text-emerald-900/85">
                  Ya puedes volver a ingresar al portal con tu nueva contraseña.
                </p>
              </div>
            </div>
          </div>
          <Link to="/login" className="app-button-primary w-full justify-center">
            Ir al login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">Nueva contraseña</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="app-input pl-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">Confirmar contraseña</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la nueva contraseña"
                className="app-input pl-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="app-button-primary h-14 w-full text-base">
            {loading ? 'Actualizando contraseña...' : 'Guardar nueva contraseña'}
          </button>

          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900">
            <ArrowLeft className="h-4 w-4" />
            Volver al login
          </Link>
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
