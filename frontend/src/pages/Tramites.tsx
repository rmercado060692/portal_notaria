import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileSearch,
  FileText,
  Landmark,
  Search,
} from 'lucide-react';

import { Layout } from '../components/Layout';
import { TramiteCard } from '../components/TramiteCard';
import { tramiteAPI } from '../api/services';
import type { ApiResponse, TramiteListItem, TramitesResponse } from '../types';
import {
  getDashboardSummary,
  isCompletedTramite,
  isInNotaryTramite,
  isInSunarpTramite,
  isObservedTramite,
  matchesTramiteSearch,
} from '../utils/tramites';

type FilterState = 'all' | 'in-notary' | 'in-sunarp' | 'observed' | 'completed';

const TramitesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterState>('all');
  const [tramites, setTramites] = useState<TramiteListItem[]>([]);

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

  const summary = useMemo(() => getDashboardSummary(tramites), [tramites]);

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
            <p className="text-neutral-600">Cargando trámites...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Consulta integral</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-neutral-900">Mis Trámites</h1>
              <p className="mt-3 text-sm leading-7 text-neutral-600 max-w-3xl">
                Revisa el listado completo de tus trámites y filtra por estado, SUNARP o búsqueda por Kardex, titular y acto notarial.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            >
              Volver al dashboard
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <article className="rounded-2xl border border-notary-200 bg-notary-50 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-notary-100 p-2.5 text-notary-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-notary-700">{summary.total}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">En Notaría</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{summary.enNotaria}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-gold-200 bg-gold-50 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gold-100 p-2.5 text-gold-600">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">En SUNARP</p>
                <p className="text-xl sm:text-2xl font-bold text-gold-700">{summary.enSunarp}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-neutral-100 p-2.5 text-neutral-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Observados</p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-700">{summary.observados}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Finalizados</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{summary.finalizados}</p>
              </div>
            </div>
          </article>
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

        {error ? (
          <section className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">No fue posible cargar tus trámites</h2>
            <p className="text-neutral-500">{error}</p>
          </section>
        ) : filteredTramites.length > 0 ? (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTramites.map((tramite) => (
              <TramiteCard key={`${tramite.kardex}-${tramite.idkardex}`} tramite={tramite} />
            ))}
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
            <FileSearch className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              {tramites.length === 0 ? 'Aún no tienes trámites visibles en el portal' : 'No encontramos resultados con ese filtro'}
            </h2>
            <p className="text-neutral-500">
              {tramites.length === 0
                ? 'Cuando la notaría registre trámites asociados a tu documento, aparecerán aquí automáticamente.'
                : 'Prueba con otro texto de búsqueda o cambia el filtro para ver más resultados.'}
            </p>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default TramitesPage;
