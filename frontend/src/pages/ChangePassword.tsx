import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';

import { authService } from '../api/services';
import { useAuth } from '../contexts/AuthContext';

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      await refreshUser();
      setSuccess('Contraseña actualizada correctamente.');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (requestError: any) {
      const detail = requestError?.response?.data;
      setError(detail?.old_password?.[0] || detail?.confirm_new_password?.[0] || detail?.detail || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-notary-950 via-notary-900 to-neutral-950 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-notary-100 text-notary-700 mx-auto flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">Cambio de contraseña</h1>
          <p className="text-neutral-600">
            {user?.must_change_password
              ? 'Debes cambiar tu contraseña temporal antes de continuar.'
              : 'Actualiza tu contraseña para mantener segura tu cuenta.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Contraseña actual</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-notary-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Nueva contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-notary-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Confirmar nueva contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                className="w-full pl-12 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-notary-200"
                required
              />
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-notary-700 text-white font-semibold hover:bg-notary-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
          </button>

          {!user?.must_change_password && (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
          )}

          {user?.must_change_password && (
            <button
              type="button"
              onClick={() => {
                void logout();
                navigate('/login');
              }}
              className="w-full py-3 rounded-xl text-neutral-500 font-medium hover:text-neutral-700 transition-colors"
            >
              Salir
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
