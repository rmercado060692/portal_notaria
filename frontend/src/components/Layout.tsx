import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Bell,
  User,
  HelpCircle,
  Mail,
  Menu,
  X,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const publicAssetUrl = (assetPath: string) =>
  `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/tramites', label: 'Mis trámites', icon: FileText },
    { to: '/notificaciones', label: 'Notificaciones', icon: Bell },
    { to: '/perfil', label: 'Mi Perfil', icon: User },
    { to: '/faq', label: 'Preguntas frecuentes', icon: HelpCircle },
    { to: '/contacto', label: 'Contacto', icon: Mail },
  ];

  if (isAdmin) {
    menuItems.splice(1, 0, { to: '/admin', label: 'Panel de Administración', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-80 bg-notary-700 text-white shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Header */}
          <div className="p-6 border-b border-notary-600">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl">
                <img
                  src={publicAssetUrl('logo-em.png')}
                  alt="Logo Notaría Mendoza Vásquez"
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-bold text-white">
                  Notaría Mendoza Vásquez
                </h2>
                <p className="text-sm text-notary-200">
                  Portal Digital del Cliente
                </p>
              </div>
            </div>
          </div>

          {/* User Card */}
          {user && (
            <div className="p-4 mx-4 my-4 bg-notary-600/50 rounded-2xl border border-notary-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-gold-500 rounded-xl">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.first_name || user.username}
                  </p>
                  <p className="text-xs text-notary-200 truncate">
                    {user.document_number || user.email}
                  </p>
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-notary-500 text-white">
                    {isAdmin ? 'Personal de Notaría' : 'Cliente'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${isActive
                          ? 'bg-notary-500 text-white font-semibold shadow-md'
                          : 'text-notary-100 hover:bg-notary-600/60'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-notary-600">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-notary-800 text-notary-100 hover:bg-wine-600 transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 font-semibold">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between shadow-sm">
          {/* Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center lg:hidden">
                <img
                  src={publicAssetUrl('logo-em.png')}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-lg font-semibold text-neutral-900 hidden sm:block">
                Portal Digital
              </h1>
            </div>
          </div>

          {/* User info for desktop */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {user.first_name || user.username}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isAdmin ? 'Administrador' : 'Cliente'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-notary-100 text-notary-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
