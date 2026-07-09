import React, { useEffect, useMemo, useState } from 'react';
import { Bell, BellRing, CheckCheck, ChevronRight } from 'lucide-react';

import { Layout } from '../components/Layout';
import { notificationsService } from '../api/services';
import type { Notification } from '../types';

const NotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await notificationsService.getNotifications();
        setNotifications(data);
      } catch (requestError) {
        console.error('Error fetching notifications:', requestError);
        setError('No se pudieron cargar las notificaciones en este momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setSaving(true);
      const updated = await notificationsService.markAsRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, ...updated, is_read: true } : notification
        )
      );
    } catch (requestError) {
      console.error('Error marking notification as read:', requestError);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setSaving(true);
      await notificationsService.markAllAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: true }))
      );
    } catch (requestError) {
      console.error('Error marking all notifications as read:', requestError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-notary-500 border-t-transparent" />
            <p className="text-neutral-600">Cargando notificaciones...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Comunicación del portal</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-neutral-900">Notificaciones</h1>
              <p className="mt-3 text-sm leading-7 text-neutral-600 max-w-3xl">
                Revisa los avisos generados por el portal y confirma cuáles ya fueron atendidos.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl bg-notary-50 px-4 py-3 text-sm font-semibold text-notary-700">
                <BellRing className="h-4 w-4" />
                {unreadCount} sin leer
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMarkAllAsRead()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <section className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <Bell className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">No fue posible cargar las notificaciones</h2>
            <p className="text-neutral-500">{error}</p>
          </section>
        ) : notifications.length > 0 ? (
          <section className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-2xl border p-5 sm:p-6 ${
                  notification.is_read
                    ? 'border-neutral-200 bg-white'
                    : 'border-notary-200 bg-notary-50/40'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-neutral-900">{notification.title}</h2>
                      {!notification.is_read && (
                        <span className="inline-flex items-center rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">
                          Nueva
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-neutral-600">{notification.message}</p>
                    <p className="mt-4 text-xs font-medium text-neutral-400">
                      {new Date(notification.created_at).toLocaleString('es-PE')}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAsRead(notification.id)}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-notary-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-notary-800 disabled:opacity-60"
                    >
                      Marcar como leída
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
            <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">No tienes notificaciones</h2>
            <p className="text-neutral-500">Cuando el portal registre avisos relevantes, aparecerán aquí automáticamente.</p>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
