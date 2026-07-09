import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  FileSearch,
  ChevronRight,
  Landmark,
  Search,
  Shield,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatsCard } from '../components/StatsCard';
import { TramiteCard } from '../components/TramiteCard';
import { tramiteAPI } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import type { ApiResponse, TramiteListItem, TramitesResponse, User } from '../types';
import {
  getDashboardSummary,
  isCompletedTramite,
  isInNotaryTramite,
  isInSunarpTramite,
  isObservedTramite,
  matchesTramiteSearch,
} from '../utils/tramites';

const publicAssetUrl = (assetPath: string) =>
  `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;

type FilterState = 'all' | 'in-notary' | 'in-sunarp' | 'observed' | 'completed';

const buildDisplayName = (user?: User | null) => {
  const clientName = user?.client?.full_name?.trim();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return clientName || fullName || user?.username || 'Cliente';
};

const buildDocumentLabel = (user?: User | null) => {
  if (user?.client?.document_number) {
    return `${user.client.document_type || 'DNI'} ${user.client.document_number}`;
  }
  if (user?.document_number) {
    return `DNI ${user.document_number}`;
  }
  return 'Documento no registrado';
};

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterState>('all');
  const [tramites, setTramites] = useState<TramiteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const tramitesRes: ApiResponse<TramitesResponse> = await tramiteAPI.getTramites();
        if (tramitesRes.success) {
          const tramitesData = tramitesRes.data;
          setTramites(tramitesData.tramites || []);
        } else {
          setError('No fue posible cargar tus trámites en este momento.');
        }
      } catch (requestError) {
        console.error('Error fetching dashboard data:', requestError);
        setError('No se pudo conectar con el portal. Verifica tu sesión o intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTramites = useMemo(() => {
    return tramites.filter((tramite) => {
      const matchesSearch = matchesTramiteSearch(tramite, searchTerm);
      if (!matchesSearch) return false;

      switch (filter) {
        case 'in-notary':
          return isInNotaryTramite(tramite);
        case 'in-sunarp':
          return isInSunarpTramite(tramite);
        case 'observed':
          return isObservedTramite(tramite);
        case 'completed':
          return isCompletedTramite(tramite);
        default:
          return true;
      }
    });
  }, [filter, searchTerm, tramites]);

  const summary = useMemo(() => getDashboardSummary(tramites), [tramites]);
  const displayName = buildDisplayName(user).toUpperCase();
  const documentLabel = buildDocumentLabel(user);

  const statCards: {
    key: keyof typeof summary;
    label: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'gold' | 'notary' | 'neutral';
  }[] = [
    {
      key: 'total',
      label: 'Total Trámites',
      icon: <FolderOpen className="w-6 h-6" />,
      color: 'notary' as const,
    },
    {
      key: 'enNotaria',
      label: 'En Notaría',
      icon: <Building2 className="w-6 h-6" />,
      color: 'blue' as const,
    },
    {
      key: 'enSunarp',
      label: 'En SUNARP',
      icon: <Landmark className="w-6 h-6" />,
      color: 'gold' as const,
    },
    {
      key: 'observados',
      label: 'Observados',
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'neutral' as const,
    },
    {
      key: 'finalizados',
      label: 'Finalizados',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green' as const,
    },
  ];

  const filters: Array<{ key: FilterState; label: string }> = [
    { key: 'all', label: 'Todos' },
    { key: 'in-notary', label: 'En Notaría' },
    { key: 'in-sunarp', label: 'En SUNARP' },
    { key: 'observed', label: 'Observados' },
    { key: 'completed', label: 'Finalizados' },
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
                {displayName}
              </h1>
              <p className="text-gold-100 text-sm sm:text-base font-semibold mb-3">
                {documentLabel}
              </p>
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
                to="/admin/clients"
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {statCards.map((item) => {
              const value = summary[item.key];
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

        <section className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-3xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por Kardex, tipo de acto, titular, escritura..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-12 pr-4 text-sm text-neutral-900 outline-none transition focus:border-notary-300 focus:bg-white focus:ring-2 focus:ring-notary-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    filter === item.key
                      ? 'bg-notary-700 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-notary-50 hover:text-notary-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-neutral-900">
              Mis Trámites
            </h2>
            {tramites.length > 0 && (
              <Link
                to="/tramites"
                className="text-sm font-semibold text-notary-600 hover:text-notary-700 flex items-center gap-1"
              >
                Ver listado completo
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {error ? (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No fue posible cargar tus trámites
              </h3>
              <p className="text-neutral-500">
                {error}
              </p>
            </div>
          ) : filteredTramites.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTramites.map((tramite) => (
                <TramiteCard
                  key={`${tramite.kardex}-${tramite.idkardex}`}
                  tramite={tramite}
                  onClick={() => navigate(`/tramite/${tramite.kardex}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
              <FileSearch className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {tramites.length === 0 ? 'Aún no tienes trámites visibles en el portal' : 'No encontramos resultados con ese filtro'}
              </h3>
              <p className="text-neutral-500">
                {tramites.length === 0
                  ? 'Cuando la notaría registre trámites asociados a tu documento, aparecerán aquí automáticamente.'
                  : 'Prueba con otro texto de búsqueda o cambia el filtro para ver más resultados.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default DashboardPage;
