import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, UserRound } from 'lucide-react';

import { authService } from '../api/services';
import { AuthShell } from '../components';

const ForgotPassword: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.forgotPassword({ identifier });
      setSubmitted(true);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'No fue posible procesar tu solicitud en este momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Recuperación de acceso"
      title="Recupera tu contraseña"
      description="Ingresa tu correo, usuario o DNI registrado. Si existe una cuenta vinculada con correo activo, enviaremos un enlace seguro para restablecer la contraseña."
    >
      {submitted ? (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-5 text-sm leading-7 text-emerald-900">
            Revisamos tu solicitud. Si el identificador corresponde a una cuenta con correo registrado, recibirás un mensaje
            con el enlace para crear una nueva contraseña.
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 px-5 py-5">
            <p className="text-sm font-semibold text-neutral-900">¿No te llega el correo?</p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Verifica tu bandeja de spam o comunícate con la notaría para validar tu correo registrado.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href="https://wa.me/51961772325"
                target="_blank"
                rel="noreferrer"
                className="app-button-secondary w-full justify-center"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <a href="mailto:legal@notariamendoza.com" className="app-button-secondary w-full justify-center">
                <Mail className="h-4 w-4" />
                Escribir por correo
              </a>
            </div>
          </div>

          <Link to="/login" className="app-button-primary w-full justify-center">
            Volver al ingreso
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
            <label className="mb-2 block text-sm font-semibold text-neutral-700">Correo, usuario o DNI</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Ejemplo: 47791102 o legal@cliente.com"
                className="app-input pl-12"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="app-button-primary h-14 w-full text-base">
            {loading ? 'Enviando solicitud...' : 'Enviar enlace de recuperación'}
          </button>

          <div className="flex items-center justify-between gap-3 text-sm">
            <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-neutral-600 transition hover:text-neutral-900">
              <ArrowLeft className="h-4 w-4" />
              Volver al login
            </Link>
            <a href="https://wa.me/51961772325" target="_blank" rel="noreferrer" className="font-semibold text-notary-800 transition hover:text-notary-700">
              Necesito ayuda
            </a>
          </div>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
