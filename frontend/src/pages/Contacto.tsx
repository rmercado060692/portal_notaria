import React from 'react';
import { ArrowUpRight, Mail, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';

import { Layout } from '../components/Layout';

const Contacto: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <section className="app-panel overflow-hidden px-7 py-8 sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Atención al cliente</p>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-neutral-900">Contacto</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
                Si necesitas ayuda con tu acceso al portal, recuperación de contraseña o seguimiento de un trámite, puedes
                comunicarte con la Notaría Mendoza Vásquez por nuestros canales digitales y presenciales.
              </p>
            </div>

            <div className="rounded-[28px] border border-gold-100 bg-gradient-to-br from-notary-900 via-notary-800 to-[#4a0d18] px-6 py-6 text-white shadow-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-200">Respuesta asistida</p>
              <p className="mt-3 font-display text-2xl font-bold">Canales institucionales activos</p>
              <p className="mt-3 text-sm leading-6 text-white/80">
                WhatsApp directo, correo legal y atención presencial para soporte del portal y consultas del cliente.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <article className="app-card px-6 py-6 transition hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9f9ef] text-[#1a7f43]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold text-neutral-900">WhatsApp</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">Canal más rápido para apoyo con acceso, recuperación de clave y orientación inicial.</p>
            <a
              href="https://wa.me/51961772325"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-[#1a7f43] transition hover:text-[#146237]"
            >
              +51 961 772 325
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </article>

          <article className="app-card px-6 py-6 transition hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-50 text-gold-700">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold text-neutral-900">Correo</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">Usa el correo institucional para soporte formal, validaciones y seguimiento administrativo.</p>
            <a
              href="mailto:legal@notariamendoza.com"
              className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-neutral-900 transition hover:text-notary-800"
            >
              legal@notariamendoza.com
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </article>

          <article className="app-card px-6 py-6 transition hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-info">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold text-neutral-900">Atención presencial</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">Si necesitas acudir a la notaría para validaciones o trámites presenciales, esta es la dirección institucional.</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Av.+Alfredo+Benavides+4982,+Santiago+de+Surco"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-neutral-900 transition hover:text-notary-800"
            >
              Av. Alfredo Benavides N° 4982, Santiago de Surco
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </article>
        </section>

        <section className="app-card px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-success">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-neutral-900">Confianza y seguridad</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                La información mostrada es referencial y corresponde a los registros internos de la Notaría Mendoza Vásquez.
                Para información registral oficial, puede consultar los canales oficiales de SUNARP.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Contacto;
