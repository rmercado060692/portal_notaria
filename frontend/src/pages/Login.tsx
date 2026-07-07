import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, UserRound } from 'lucide-react';

import { AuthShell } from '../components';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      if (remember) {
        localStorage.setItem('portal_remember_user', username);
      } else {
        localStorage.removeItem('portal_remember_user');
      }
      navigate('/dashboard');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'No fue posible iniciar sesión con esas credenciales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('portal_remember_user');
    if (savedUser) {
      setUsername(savedUser);
      setRemember(true);
    }
  }, []);

  return (
    <AuthShell
      eyebrow="Acceso institucional"
      title="Ingresa al portal del cliente"
      description="Accede con tu usuario, correo o DNI registrado. Si olvidaste tu contraseña, ahora puedes solicitar un enlace seguro para restablecerla."
      brandTitle="NOTARIA MENDOZA VÁSQUEZ"
      brandSubtitle="PORTAL DEL USUARIO"
    >
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">Usuario / DNI / correo</label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ejemplo: 12345678"
              className="app-input pl-12"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">Contraseña</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              className="app-input pl-12 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-notary-800 focus:ring-notary-300"
            />
            Recordarme en este equipo
          </label>

          <Link to="/forgot-password" className="text-sm font-semibold text-notary-800 transition hover:text-notary-700">
            Recuperar contraseña
          </Link>
        </div>

        <button type="submit" disabled={loading} className="app-button-primary h-14 w-full text-base sm:h-[58px]">
          {loading ? 'Validando acceso...' : 'Ingresar al portal'}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
