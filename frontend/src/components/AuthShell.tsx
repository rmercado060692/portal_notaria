import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';

interface AuthShellProps {
  title?: string;
  subtitle?: string;
  onSubmit?: (username: string, password: string) => void;
  error?: string | null;
  loading?: boolean;
}

const publicAssetUrl = (assetPath: string) =>
  `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;

export const AuthShell: React.FC<AuthShellProps> = ({
  title = "Portal del Cliente",
  subtitle = "Notaría Enrique Mendoza Vásquez",
  onSubmit,
  error,
  loading,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(username, password);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${publicAssetUrl('login-bg.png')})` }}
      />

      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-notary-700/80 via-notary-700/60 to-notary-700/40" />

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex justify-center lg:justify-end lg:pr-12 xl:pr-24">
        <div className="w-full max-w-md lg:max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10">
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-4">
              <img
                src={publicAssetUrl('logo-em.png')}
                alt="Logo Notaría Mendoza Vásquez"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-notary-700 text-center">
              {title}
            </h1>
            <p className="mt-2 text-base sm:text-lg text-neutral-600 text-center font-medium">
              {subtitle}
            </p>
            <p className="mt-2 text-sm text-neutral-500 text-center">
              Consulta segura de trámites notariales
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-wine-50 border border-wine-200 rounded-xl p-4 text-wine-600 text-sm">
                {error}
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-neutral-700">
                Usuario / DNI / Correo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-notary-500 focus:border-transparent transition-all"
                  placeholder="Ingrese su usuario, DNI o correo"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-notary-500 focus:border-transparent transition-all"
                  placeholder="Ingrese su contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-notary-600 focus:ring-notary-500"
                />
                <span className="text-sm text-neutral-600">Recordarme</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-semibold text-notary-600 hover:text-notary-700 transition-colors"
              >
                Recuperar contraseña
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-notary-700 hover:bg-notary-800 text-white font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar al portal
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
