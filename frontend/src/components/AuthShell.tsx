import React from 'react';

interface AuthShellProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  children?: React.ReactNode;
}

const publicAssetUrl = (assetPath: string) =>
  `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;

export const AuthShell: React.FC<AuthShellProps> = ({
  eyebrow,
  title,
  description,
  brandTitle,
  brandSubtitle,
  children,
}) => {
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
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-notary-600 mb-2">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-notary-700 text-center">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-sm sm:text-base text-neutral-600 text-center leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Children (form content) */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
