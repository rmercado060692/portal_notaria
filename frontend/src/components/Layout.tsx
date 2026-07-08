import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Lock,
  Menu,
  Phone,
  ShieldCheck,
  User,
  UserCircle2,
  X,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { notificationsService } from '../api/services';
import type { Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  to?: string;
  action?: () => void;
};

const publicAssetUrl = (assetPath: string) => `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;
const logoSrc = publicAssetUrl('logo-notaria.jpeg');

const getNotificationType = (text: string): 'success' | 'info' | 'warning' => {
  const normalized = text.toUpperCase();
  if (normalized.includes('INSCRITO') || normalized.includes('LISTO') || normalized.includes('GENERADA')) {
    return 'success';
  }
  if (normalized.includes('OBSERVADO') || normalized.includes('ERROR')) {
    return 'warning';
  }
  return 'info';
};

const formatNotificationDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Hace unos segundos';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffMinutes < 1440) return `Hace ${Math.round(diffMinutes / 60)} h`;
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const extractKardex = (title: string, message: string) => {
  const match = `${title} ${message}`.match(/\bK\d+\b|\bN\d+\b/i);
  return match?.[0] || null;
};

const normalizeNotifications = (value: unknown): Notification[] => (Array.isArray(value) ? value : []);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationsService.getNotifications();
        setNotifications(normalizeNotifications(data));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = useMemo(
    () => normalizeNotifications(notifications).filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate('/login');
  };

  const markAsRead = async (notification: Notification) => {
    if (notification.is_read) return;

    try {
      const updated = await notificationsService.markAsRead(notification.id);
      setNotifications((current) =>
        normalizeNotifications(current).map((item) => (item.id === notification.id ? updated : item))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((current) => normalizeNotifications(current).map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const openNotification = async (notification: Notification) => {
    await markAsRead(notification);
    const kardex = extractKardex(notification.title, notification.message);
    setShowNotifications(false);
    if (kardex) {
      navigate(`/tramite/${kardex}`);
    }
  };

  const displayName = user?.client?.full_name || user?.username || 'Cliente';
  const roleLabel = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? 'Personal de Notaría' : 'Cliente';
  const documentLabel = user?.client
    ? `${user.client.document_type} ${user.client.document_number}`
    : 'Portal seguro';

  const navItems: NavItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      to: '/dashboard',
    },
    {
      key: 'notifications',
      label: 'Notificaciones',
      icon: <Bell className="h-5 w-5" />,
      action: () => {
        setShowNotifications(true);
        setShowMobileMenu(false);
      },
    },
    {
      key: 'profile',
      label: 'Mi Perfil',
      icon: <User className="h-5 w-5" />,
      to: '/profile',
    },
    {
      key: 'faq',
      label: 'Preguntas frecuentes',
      icon: <HelpCircle className="h-5 w-5" />,
      to: '/faq',
    },
    {
      key: 'contact',
      label: 'Contacto',
      icon: <Phone className="h-5 w-5" />,
      to: '/contacto',
    },
  ];

  const isActive = (item: NavItem) => {
    if (!item.to) return false;
    if (item.to === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/tramite/');
    }
    return location.pathname === item.to;
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item);
    const sharedClassName = `group flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-notary-800 to-notary-700 text-white shadow-glow'
        : 'text-neutral-700 hover:bg-notary-50 hover:text-notary-800'
    }`;

    const content = (
      <>
        <div className="flex items-center gap-3">
          <span className={`${active ? 'text-white' : 'text-notary-700'}`}>
            {item.icon}
          </span>
          <span className="text-sm font-semibold">{item.label}</span>
        </div>
        <ChevronRight className={`h-4 w-4 ${active ? 'text-white/70' : 'text-neutral-400 group-hover:text-notary-600'}`} />
      </>
    );

    if (item.to) {
      return (
        <Link key={item.key} to={item.to} onClick={() => setShowMobileMenu(false)} className={sharedClassName}>
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        onClick={item.action}
        className={`${sharedClassName} w-full`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="min-h-screen text-neutral-900">
      <div
        className="fixed left-0 top-[88px] z-30 hidden h-[calc(100vh-88px)] w-5 xl:block"
        onMouseEnter={() => setShowDesktopSidebar(true)}
      />

      <aside
        className={`fixed left-0 top-[88px] z-40 hidden h-[calc(100vh-88px)] w-[292px] overflow-visible border-r border-white/70 bg-white/92 px-6 py-6 backdrop-blur-md transition-transform duration-300 xl:flex xl:flex-col ${
          showDesktopSidebar ? 'translate-x-0 shadow-panel' : '-translate-x-[calc(100%-18px)]'
        }`}
        onMouseEnter={() => setShowDesktopSidebar(true)}
        onMouseLeave={() => setShowDesktopSidebar(false)}
      >
        <div className={`pointer-events-none absolute right-0 top-0 h-full w-[18px] bg-gradient-to-r from-transparent to-notary-100/40 ${showDesktopSidebar ? 'opacity-0' : 'opacity-100'}`} />
        <div className={`absolute right-[-14px] top-1/2 hidden -translate-y-1/2 xl:flex`}>
          <div className="flex h-24 w-4 items-center justify-center rounded-r-full border border-l-0 border-notary-100 bg-white/95 text-notary-700 shadow-card">
            <ChevronRight className={`h-4 w-4 transition-transform ${showDesktopSidebar ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <div
          className={`flex h-full flex-col overflow-y-auto pr-2 transition-all duration-200 ${
            showDesktopSidebar ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0 pointer-events-none'
          }`}
        >
          <Link to="/dashboard" className="app-panel mb-6 flex items-center gap-4 px-5 py-5">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gold-300 bg-white shadow-card">
              <img src={logoSrc} alt="Logo Notaría Mendoza Vásquez" className="h-full w-full object-contain p-1.5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-neutral-900">Notaría Mendoza Vásquez</p>
              <p className="text-sm text-neutral-500">Portal Digital</p>
            </div>
          </Link>

          <div className="app-panel mb-6 px-5 py-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-notary-50 text-notary-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Portal seguro</p>
                <p className="text-xs text-neutral-500">Tu información está protegida</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-neutral-600">
              La información mostrada corresponde a los registros internos de la Notaría Mendoza Vásquez.
            </p>
          </div>

          <nav className="app-panel flex-1 space-y-2 px-4 py-4">
            {navItems.map(renderNavItem)}

            {isAdmin && (
              <Link
                to="/admin/clients"
                className={`mt-3 flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-gold-500 text-white shadow-card'
                    : 'bg-gold-50 text-gold-700 hover:bg-gold-100'
                }`}
              >
                <span>Panel administrativo</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </nav>

          <div className="app-panel mt-6 px-5 py-5">
            <p className="mb-2 text-sm font-semibold text-neutral-900">Aviso importante</p>
            <p className="text-xs leading-5 text-neutral-500">
              La información mostrada es referencial y corresponde a los registros internos de la Notaría Mendoza Vásquez.
              Para información registral oficial, consulte los canales oficiales de SUNARP.
            </p>
          </div>
        </div>
      </aside>

      <div className="min-h-screen">
        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-white/60 bg-[#f8f7f4]/85 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 shadow-sm xl:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <Link to="/dashboard" className="flex items-center gap-3 xl:hidden">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-gold-300 bg-white shadow-card">
                    <img src={logoSrc} alt="Logo Notaría Mendoza Vásquez" className="h-full w-full object-contain p-1" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-neutral-900">Notaría Mendoza Vásquez</p>
                    <p className="text-xs text-neutral-500">Portal Digital</p>
                  </div>
                </Link>

                <div className="hidden md:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Portal del Cliente</p>
                  <p className="text-sm text-neutral-600">{documentLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(true);
                    setShowUserMenu(false);
                  }}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:-translate-y-0.5 hover:border-notary-200 hover:text-notary-800"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-notary-700 px-1 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu((current) => !current);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-notary-200"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-notary-50 text-notary-700">
                      <UserCircle2 className="h-6 w-6" />
                    </div>
                    <div className="hidden text-left sm:block">
                      <p className="max-w-[220px] truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                      <p className="text-xs text-neutral-500">{roleLabel}</p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-16 z-50 w-72 rounded-3xl border border-white/70 bg-white p-3 shadow-panel">
                        <div className="rounded-2xl bg-neutral-50 px-4 py-4">
                          <p className="text-sm font-semibold text-neutral-900">{displayName}</p>
                          <p className="mt-1 text-xs text-neutral-500">{user?.email || 'Sin correo registrado'}</p>
                        </div>

                        <div className="mt-3 space-y-1">
                          <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                            <User className="h-4 w-4 text-notary-700" />
                            Mi perfil
                          </Link>
                          <Link to="/change-password" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                            <Lock className="h-4 w-4 text-notary-700" />
                            Cambiar contraseña
                          </Link>
                          <Link to="/faq" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                            <HelpCircle className="h-4 w-4 text-notary-700" />
                            Configuración y ayuda
                          </Link>
                        </div>

                        <div className="my-3 border-t border-neutral-100" />
                        <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-danger hover:bg-red-50">
                          <LogOut className="h-4 w-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      {showMobileMenu && (
        <>
          <div className="fixed inset-0 z-50 bg-neutral-900/45 xl:hidden" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed left-0 top-0 z-[60] h-full w-[86vw] max-w-[340px] overflow-y-auto border-r border-white/70 bg-[#f8f7f4] p-5 shadow-panel xl:hidden">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-gold-300 bg-white shadow-card">
                  <img src={logoSrc} alt="Logo Notaría Mendoza Vásquez" className="h-full w-full object-contain p-1" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-neutral-900">Notaría Mendoza Vásquez</p>
                  <p className="text-xs text-neutral-500">Portal Digital</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowMobileMenu(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="app-panel mb-5 px-4 py-4">
              <p className="text-sm font-semibold text-neutral-900">{displayName}</p>
              <p className="mt-1 text-xs text-neutral-500">{documentLabel}</p>
            </div>

            <div className="space-y-2">
              {navItems.map(renderNavItem)}
              {isAdmin && (
                <Link to="/admin/clients" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between rounded-2xl bg-gold-50 px-4 py-3.5 text-sm font-semibold text-gold-700">
                  <span>Panel administrativo</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <button type="button" onClick={() => void handleLogout()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-notary-800 px-4 py-3 text-sm font-semibold text-white">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </>
      )}

      {showNotifications && (
        <>
          <div className="fixed inset-0 z-50 bg-neutral-900/40" onClick={() => setShowNotifications(false)} />
          <aside className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col border-l border-white/70 bg-[#fbfaf7] shadow-panel">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
              <div>
                <p className="font-display text-lg font-bold text-neutral-900">Notificaciones</p>
                <p className="text-sm text-neutral-500">Mantente al tanto del avance de tus trámites.</p>
              </div>
              <button type="button" onClick={() => setShowNotifications(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div className="app-chip border-notary-100 bg-notary-50 text-notary-800">
                {unreadCount} pendientes
              </div>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllAsRead} className="text-sm font-semibold text-notary-800 hover:text-notary-700">
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {normalizeNotifications(notifications).length === 0 ? (
                <div className="app-card flex flex-col items-center px-8 py-14 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                    <Bell className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold text-neutral-900">No hay notificaciones</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
                    Cuando exista un cambio real en tus trámites, se mostrará aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {normalizeNotifications(notifications).map((notification) => {
                    const type = getNotificationType(`${notification.title} ${notification.message}`);
                    const tone =
                      type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : type === 'warning'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-blue-50 text-blue-700 border-blue-100';

                    return (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() => openNotification(notification)}
                        className={`w-full rounded-3xl border p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover ${
                          notification.is_read ? 'border-white/70 bg-white' : 'border-notary-100 bg-notary-50/40'
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tone}`}>
                            {type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                          </div>
                          {!notification.is_read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-notary-700" />}
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">{notification.title}</p>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">{notification.message}</p>
                        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
