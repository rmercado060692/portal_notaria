import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  FileSearch,
  FileText,
  Landmark,
  Search,
  ShieldCheck,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Layout, TramiteCard, StatsCard } from '../components';
import { tramiteAPI } from '../api/services';
import type { ApiResponse, TramiteListItem, TramitesResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardSummary, isCompletedTramite, isInNotaryTramite, isInSunarpTramite, isObservedTramite, matchesTramiteSearch } from '../utils/tramites';

type FilterState = 'all' | 'in-notary' | 'in-sunarp' | 'observed' | 'completed';

const statCards = [
  { key: 'total', label: 'Total de trámites', icon: <FileText className="h-5 w-5" />, color: 'notary' },
  { key: 'enNotaria', label: 'En Notaría', icon: <Building2 className="h-5 w-5" />, color: 'blue' },
  { key: 'enSunarp', label: 'En SUNARP', icon: <Landmark className="h-5 w-5" />, color: 'gold' },
  { key: 'observados', label: 'Observados', icon: <AlertTriangle className="h-5 w-5" />, color: 'orange' },
  { key: 'finalizados', label: 'Finalizados', icon: <ShieldCheck className="h-5 w-5" />, color: 'green' },
] as const;

const filters: Array<{ key: FilterState; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'in-notary', label: 'En Notaría' },
  { key: 'in-sunarp', label: 'En SUNARP' },
  { key: 'observed', label: 'Observados' },
  { key: 'completed', label: 'Finalizados' },
];

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="skeleton h-48 w-full rounded-[32px]" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton h-24 w-full rounded-[24px]" />
      ))}
    </div>
    <div className="skeleton h-24 w-full rounded-[28px]" />
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="skeleton h-48 w-full rounded-[28px]" />
      ))}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tramites, setTramites] = useState<TramiteListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterState>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response: ApiResponse<TramitesResponse> = await tramiteAPI.getTramites();
        if (response.success) {
          setTramites(response.data.tramites || []);
        } else {
          setError('No fue posible cargar tus trámites en este momento.');
        }
      } catch (requestError) {
        console.error('Error fetching tramites:', requestError);
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
  const displayName = user?.client?.full_name || user?.username || 'Cliente';
  const documentLabel = user?.client ? `${user.client.document_type} ${user.client.document_number}` : 'Documento no registrado';
  const publicAssetUrl = (assetPath: string) => `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;
  const logoSrc = publicAssetUrl('logo-em.png');

  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-notary-900 via-notary-800 to-notary-700 px-5 py-6 text-white shadow-panel sm:px-7 sm:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,132,61,0.25),transparent_35%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-white/10 shadow-panel">
              <img src={logoSrc} alt="Logo Notaría Enrique Mendoza Vásquez" className="h-full w-full object-contain p-2" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Bienvenido, <span className="break-words">{displayName}</span>
              </h1>
              <p className="mt-2 text-base font-semibold text-notary-100">{documentLabel}</p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-notary-100/90">
                Consulta el estado de tus trámites notariales de manera segura.
              </p>
            </div>
          </div>
        </section>

        {isAdmin && (
          <section className="app-card p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-card">
                  <Users className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold text-neutral-900 sm:text-2xl">Administración de Clientes</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Gestiona los usuarios del portal, clientes y sus asociaciones.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/clients"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-3.5 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover sm:w-auto sm:justify-start sm:px-6 sm:py-4"
              >
                Entrar al panel administrativo
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
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
        </section>

        <section className="app-panel px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-3xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por Kardex, tipo de acto, titular, escritura..."
                className="app-input pl-12"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    filter === item.key
                      ? 'bg-notary-800 text-white shadow-glow'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-notary-50 hover:text-notary-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <section className="app-card px-6 py-12 text-center sm:px-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-neutral-900 sm:text-2xl">No fue posible cargar tus trámites</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-neutral-500">{error}</p>
          </section>
        ) : filteredTramites.length > 0 ? (
          <section className="space-y-4">
            {filteredTramites.map((tramite) => (
              <TramiteCard key={`${tramite.kardex}-${tramite.idkardex}`} tramite={tramite} />
            ))}
          </section>
        ) : (
          <section className="app-card px-6 py-12 text-center sm:px-8 sm:py-14">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[28px] bg-neutral-100 text-neutral-400">
              <FileSearch className="h-8 w-8" />
            </div>
            <h2 className="font-display text-xl font-bold text-neutral-900 sm:text-2xl">
              {tramites.length === 0 ? 'Aún no tienes trámites visibles en el portal' : 'No encontramos resultados con ese filtro'}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-neutral-500">
              {tramites.length === 0
                ? 'Cuando la notaría registre trámites asociados a tu documento, aparecerán aquí automáticamente.'
                : 'Prueba con otro texto de búsqueda o cambia el filtro para ver más resultados.'}
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left text-sm leading-7 text-neutral-600 sm:px-6 sm:py-5">
              La información mostrada es referencial y corresponde a los registros internos de la Notaría Mendoza Vásquez.
              Para información registral oficial, puede consultar los canales oficiales de SUNARP.
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
