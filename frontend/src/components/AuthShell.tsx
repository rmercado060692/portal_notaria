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
const logoSrc = publicAssetUrl('logo-notaria.jpeg');
const heroSrc = publicAssetUrl('login-hero-reference.png');

export const AuthShell: React.FC<AuthShellProps> = ({
  eyebrow,
  title,
  description,
  children,
  brandTitle,
  brandSubtitle,
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#20050d]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 3, 6, 0.55) 0%, rgba(46, 6, 16, 0.36) 36%, rgba(46, 6, 16, 0.2) 100%), url(${heroSrc})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,132,61,0.18),transparent_18%),linear-gradient(180deg,rgba(94,16,32,0.12),rgba(20,4,8,0.44))]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <section className="w-full max-w-[34rem] pt-12 sm:pt-16">
          <div className="relative rounded-[30px] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.975),rgba(255,255,255,0.93))] px-5 pb-6 pt-14 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:rounded-[34px] sm:px-10 sm:pb-10 sm:pt-20">
            <div className="absolute left-1/2 top-0 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-[4px] border-[#6b0e1d] bg-white shadow-[0_18px_42px_rgba(0,0,0,0.38)] sm:h-28 sm:w-28 sm:border-[5px]">
              <img src={logoSrc} alt="Logo Notaría Mendoza Vásquez" className="h-full w-full object-cover" />
            </div>

            {brandTitle ? (
              <div className="mb-6 text-center sm:mb-8">
                <p className="font-display text-base font-extrabold uppercase tracking-[0.14em] text-notary-900 sm:text-xl sm:tracking-[0.18em]">
                  {brandTitle}
                </p>
                {brandSubtitle ? (
                  <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-notary-500 sm:text-xs sm:tracking-[0.38em]">
                    {brandSubtitle}
                  </p>
                ) : null}
                <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-gold-400 to-transparent sm:mt-5 sm:w-24" />
              </div>
            ) : (
              <div className="mb-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-notary-500">{eyebrow}</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-[2.15rem]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{description}</p>
              </div>
            )}
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
