import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  FileSearch,
  FileText,
  Landmark,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Layout, TramiteCard } from '../components';
import { tramiteAPI } from '../api/services';
import type { ApiResponse, TramiteListItem, TramitesResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardSummary, isCompletedTramite, isInNotaryTramite, isInSunarpTramite, isObservedTramite, matchesTramiteSearch } from '../utils/tramites';

type FilterState = 'all' | 'in-notary' | 'in-sunarp' | 'observed' | 'completed';

const statCards = [
  { key: 'total', label: 'Total de trámites', icon: FileText, color: 'text-notary-800 bg-notary-50 border-notary-100' },
  { key: 'enNotaria', label: 'En Notaría', icon: Building2, color: 'text-info bg-blue-50 border-blue-100' },
  { key: 'enSunarp', label: 'En SUNARP', icon: Landmark, color: 'text-gold-700 bg-gold-50 border-gold-100' },
  { key: 'observados', label: 'Observados', icon: AlertTriangle, color: 'text-danger bg-red-50 border-red-100' },
  { key: 'finalizados', label: 'Finalizados', icon: ShieldCheck, color: 'text-success bg-green-50 border-green-100' },
] as const;

const filters: Array<{ key: FilterState; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'in-notary', label: 'En Notaría' },
  { key: 'in-sunarp', label: 'En SUNARP' },
  { key: 'observed', label: 'Observados' },
  { key: 'completed', label: 'Finalizados' },
];

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="skeleton h-56 w-full rounded-[32px]" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton h-36 w-full rounded-[28px]" />
      ))}
    </div>
    <div className="skeleton h-24 w-full rounded-[28px]" />
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="skeleton h-52 w-full rounded-[28px]" />
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
  const logoSrc = publicAssetUrl('logo-notaria.jpeg');

  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-notary-900 via-notary-800 to-notary-700 px-6 py-7 text-white shadow-panel sm:px-8 sm:py-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,132,61,0.25),transparent_35%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-[28px] border-2 border-white/20 bg-white/10 shadow-panel">
              <img src={logoSrc} alt="Logo Notaría Mendoza Vásquez" className="h-full w-full object-contain p-2" />
            </div>
            
            <div className="flex-1">
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-[34px]">
                Bienvenido, {displayName}
              </h1>
              <p className="mt-2 text-base font-semibold text-notary-100">{documentLabel}</p>
              <p className="mt-4 max-w-xl text-sm leading-6 text-notary-100/90">
                Consulta el estado de tus trámites notariales de manera segura.
              </p>
            </div>
          </div>
        </section>

        {isAdmin && (
          <section className="app-card p-8 transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-card">
                  <Users className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-neutral-900">Administración de Clientes</h2>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">
                    Gestiona los usuarios del portal, clientes y sus asociaciones.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/clients"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-4 text-sm font-bold text-white shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
              >
                Entrar al panel administrativo
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((item) => {
            const Icon = item.icon;
            const value = summary[item.key];
            return (
              <article key={item.key} className="app-card px-5 py-5 transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="mb-5 flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-display text-4xl font-extrabold tracking-tight text-neutral-900">{value}</p>
                </div>
                <p className="text-sm font-semibold text-neutral-700">{item.label}</p>
              </article>
            );
          })}
        </section>

        <section className="app-panel px-5 py-5 sm:px-7">
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
          <section className="app-card px-8 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-danger">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold text-neutral-900">No fue posible cargar tus trámites</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-neutral-500">{error}</p>
          </section>
        ) : filteredTramites.length > 0 ? (
          <section className="space-y-5">
            {filteredTramites.map((tramite) => (
              <TramiteCard key={`${tramite.kardex}-${tramite.idkardex}`} tramite={tramite} />
            ))}
          </section>
        ) : (
          <section className="app-card px-8 py-14 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-neutral-100 text-neutral-400">
              <FileSearch className="h-9 w-9" />
            </div>
            <h2 className="font-display text-2xl font-bold text-neutral-900">
              {tramites.length === 0 ? 'Aún no tienes trámites visibles en el portal' : 'No encontramos resultados con ese filtro'}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-neutral-500">
              {tramites.length === 0
                ? 'Cuando la notaría registre trámites asociados a tu documento, aparecerán aquí automáticamente.'
                : 'Prueba con otro texto de búsqueda o cambia el filtro para ver más resultados.'}
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-5 text-left text-sm leading-7 text-neutral-600">
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
