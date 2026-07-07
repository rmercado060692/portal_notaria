import React from 'react';
import { HelpCircle, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';

import { Layout } from '../components/Layout';

const items = [
  {
    title: '¿Cómo veo mis trámites?',
    description: 'Cuando inicias sesión, el portal busca automáticamente los trámites asociados a tu documento registrado. No necesitas escribir tu kardex manualmente.',
  },
  {
    title: '¿La información es oficial?',
    description: 'La información mostrada corresponde a los registros internos de la Notaría Mendoza Vásquez. Para información registral oficial, consulta los canales oficiales de SUNARP.',
  },
  {
    title: '¿Qué hago si olvidé mi contraseña?',
    description: 'Puedes usar la opción de recuperación de contraseña desde la pantalla de acceso. Si tu correo no está actualizado, la notaría puede asistirte de forma manual.',
  },
  {
    title: '¿Cuándo aparecen mis documentos?',
    description: 'Los documentos solo se muestran cuando existen archivos reales disponibles en el expediente. El portal no genera ni muestra documentos ficticios.',
  },
];

const FAQ: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <section className="app-panel px-7 py-8 sm:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Ayuda y confianza</p>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-neutral-900">Preguntas frecuentes</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
                Aquí encontrarás respuestas claras sobre el funcionamiento del portal, el origen de la información y la forma correcta de interpretar el avance de tus trámites.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                <ShieldCheck className="h-5 w-5 text-success" />
                <p className="mt-3 text-sm font-semibold text-neutral-900">Portal seguro</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Tu información está protegida y se muestra de forma autenticada.</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                <Sparkles className="h-5 w-5 text-gold-600" />
                <p className="mt-3 text-sm font-semibold text-neutral-900">Información entendible</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Los estados se presentan con lenguaje claro para el cliente.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <article key={item.title} className="app-card px-6 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-notary-50 text-notary-800">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-neutral-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="app-card px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-50 text-gold-700">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-neutral-900">Aviso importante</h2>
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

export default FAQ;
