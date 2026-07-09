import React, { useEffect, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  Shield,
  User,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatsCard } from '../components/StatsCard';
import { TramiteCard } from '../components/TramiteCard';
import { tramiteAPI } from '../api/services';
import { AuthContext } from '../contexts/AuthContext';
import { cleanTramiteLabel, getClientFacingStatus } from '../utils/tramites';
import type { TramiteListItem, TramiteStatsSummary } from '../types';

const publicAssetUrl = (assetPath: string) =>
  `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tramites, setTramites] = useState<TramiteListItem[]>([]);
  const [summary, setSummary] = useState<TramiteStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tramitesRes, summaryRes] = await Promise.all([
          tramiteAPI.getTramites(),
          tramiteAPI.getStatsSummary(),
        ]);
        if (tramitesRes.success) {
          setTramites(tramitesRes.data.results || tramitesRes.data || []);
        }
        if (summaryRes.success) {
          setSummary(summaryRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      key: 'total',
      label: 'Total Trámites',
      icon: <FolderOpen className="w-6 h-6" />,
      color: 'notary' as const,
    },
    {
      key: 'completados',
      label: 'Completados',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green' as const,
    },
    {
      key: 'en_proceso',
      label: 'En Proceso',
      icon: <Clock className="w-6 h-6" />,
      color: 'gold' as const,
    },
    {
      key: 'observados',
      label: 'Observados',
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'neutral' as const,
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-notary-500 border-t-transparent" />
            <p className="text-neutral-600">Cargando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-notary-700 to-notary-600 rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gold-200 mb-2 uppercase tracking-wider">
                Bienvenido(a)
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
                {user?.first_name || user?.username || 'Cliente'}
              </h1>
              <p className="text-notary-100 text-base sm:text-lg max-w-2xl">
                Consulta el estado de tus trámites notariales en tiempo real y accede a la documentación disponible.
              </p>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <img
                  src={publicAssetUrl('logo-em.png')}
                  alt="Logo"
                  className="w-28 h-28 object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Card (if applicable) */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-wine-600 to-wine-500 rounded-2xl p-5 sm:p-6 text-white shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold mb-1">
                  Panel de Administración
                </h3>
                <p className="text-wine-100 text-sm">
                  Gestiona clientes, usuarios y configura el portal digital.
                </p>
              </div>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-wine-700 font-semibold rounded-xl hover:bg-wine-50 transition-colors"
              >
                Ir al panel
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {statCards.map((item) => {
              const value = summary ? summary[item.key] : 0;
              return (
                <StatsCard
                  key={item.key}
                  title={item.label}
                  value={value}
                  icon={item.icon}
                  color={item.color}
                />
              );
            })}
          </div>
        </section>

        {/* Recent Tramites */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-neutral-900">
              Trámites Recientes
            </h2>
            {tramites.length > 3 && (
              <Link
                to="/tramites"
                className="text-sm font-semibold text-notary-600 hover:text-notary-700 flex items-center gap-1"
              >
                Ver todos
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {tramites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tramites.slice(0, 3).map((tramite) => (
                <TramiteCard
                  key={tramite.kardex}
                  tramite={tramite}
                  onClick={() => navigate(`/tramite/${tramite.kardex}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
              <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No tienes trámites aún
              </h3>
              <p className="text-neutral-500">
                Cuando tengas trámites activos, los verás aquí.
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default DashboardPage;
