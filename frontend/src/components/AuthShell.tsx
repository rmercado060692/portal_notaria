import React from 'react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  brandTitle?: string;
  brandSubtitle?: string;
}

const publicAssetUrl = (assetPath: string) => `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;
const logoSrc = publicAssetUrl('logo-em.png');

export const AuthShell: React.FC<AuthShellProps> = ({
  children,
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-notary-900 via-notary-800 to-notary-700">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,132,61,0.25),transparent_35%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

      <div className="relative mx-auto flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full max-w-[32rem]">
          <div className="relative rounded-[32px] border border-white/35 bg-white/98 px-6 py-10 shadow-[0_28px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-10 sm:py-12">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] border border-gold-200/50 bg-white p-2 shadow-card">
                <img src={logoSrc} alt="Logo Notaría Enrique Mendoza Vásquez" className="h-full w-full object-contain" />
              </div>

              <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
                Portal del Cliente
              </h1>
              <p className="mt-2 text-base font-semibold text-notary-800">
                Notaría Enrique Mendoza Vásquez
              </p>
              <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Consulta segura de trámites notariales
              </p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
