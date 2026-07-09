import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileBadge2,
  FileSignature,
  Home,
  Landmark,
  Scale,
  ScrollText,
  UserRound,
} from 'lucide-react';

import type { TramiteListItem } from '../types';
import { getClientFacingStatus, getDisplayActName, getProgressSummary, getLatestStatus } from '../utils/tramites';

interface TramiteCardProps {
  tramite: TramiteListItem;
}

const getStatusTheme = (status: string) => {
  switch (status) {
    case 'Finalizado':
      return {
        chip: 'border-green-100 bg-green-50 text-success',
        bar: 'from-green-600 to-green-500',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };
    case 'En Registros Públicos':
      return {
        chip: 'border-gold-100 bg-gold-50 text-gold-700',
        bar: 'from-gold-600 to-gold-500',
        icon: <Landmark className="h-3.5 w-3.5" />,
      };
    case 'Observado':
      return {
        chip: 'border-red-100 bg-red-50 text-danger',
        bar: 'from-red-700 to-red-500',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      };
    default:
      return {
        chip: 'border-blue-100 bg-blue-50 text-info',
        bar: 'from-info to-blue-500',
        icon: <Building2 className="h-3.5 w-3.5" />,
      };
  }
};

export const TramiteCard: React.FC<TramiteCardProps> = ({ tramite }) => {
  const navigate = useNavigate();
  const displayClientName = tramite.cliente_nombre || tramite.contratantes?.[0]?.full_name || 'Titular no informado';
  const { percentage, currentLabel } = getProgressSummary(tramite);
  const actName = getDisplayActName(tramite);
  const statusLabel = getClientFacingStatus(tramite);
  const latestStatus = getLatestStatus(tramite);
  const lastMovement = tramite.fechaconclusion || tramite.fechaescritura || tramite.fechacalificado || tramite.fechaingreso;
  const theme = getStatusTheme(statusLabel);
  const actVisual = useMemo(() => {
    const normalized = actName.toLowerCase();

    if (normalized.includes('compra') || normalized.includes('venta') || normalized.includes('inmueble')) {
      return {
        icon: <Home className="h-6 w-6" />,
        classes: 'bg-gold-50 text-gold-700 border-gold-100',
      };
    }
    if (normalized.includes('constituci') || normalized.includes('sociedad') || normalized.includes('s.a.c')) {
      return {
        icon: <Building2 className="h-6 w-6" />,
        classes: 'bg-notary-50 text-notary-800 border-notary-100',
      };
    }
    if (normalized.includes('poder')) {
      return {
        icon: <FileSignature className="h-6 w-6" />,
        classes: 'bg-blue-50 text-info border-blue-100',
      };
    }
    if (normalized.includes('divorcio') || normalized.includes('ratificacion') || normalized.includes('audiencia')) {
      return {
        icon: <Scale className="h-6 w-6" />,
        classes: 'bg-green-50 text-success border-green-100',
      };
    }

    return {
      icon: <ScrollText className="h-6 w-6" />,
      classes: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    };
  }, [actName]);

  return (
    <article className="app-card overflow-hidden px-6 py-6 transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex gap-4">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[22px] border ${actVisual.classes}`}>
              {actVisual.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="app-chip border-notary-100 bg-notary-50 text-notary-800">
                  <FileBadge2 className="h-3.5 w-3.5" />
                  {tramite.kardex}
                </span>
                <span className={`app-chip ${theme.chip}`}>
                  {theme.icon}
                  {statusLabel}
                </span>
                {latestStatus === 'OBSERVADO' && (
                  <span className="app-chip border-red-100 bg-red-50 text-danger">
                    Requiere revisión
                  </span>
                )}
              </div>

              <h3 className="font-display text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                {actName}
              </h3>

              <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                <UserRound className="h-3.5 w-3.5 text-notary-700" />
                <span className="font-medium">Titular:</span>
                <span className="truncate">{displayClientName}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Ingreso: {tramite.fechaingreso || 'No disponible'}
                </span>
                {tramite.fechaescritura && (
                  <span className="inline-flex items-center gap-2">
                    <FileBadge2 className="h-3.5 w-3.5" />
                    Escritura: {tramite.fechaescritura}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:max-w-[280px]">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 px-4 py-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Avance del trámite</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                  <CalendarDays className="h-3.5 w-3.5 text-notary-700" />
                  {currentLabel}
                </p>
              </div>
              <span className="font-display text-3xl font-extrabold text-neutral-900">{percentage}%</span>
            </div>

            <div className="h-2.5 rounded-full bg-white">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                {lastMovement || 'Sin fecha visible'}
              </span>
              <span>{latestStatus || 'Sin estado registral'}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/tramite/${tramite.kardex}`)}
              className="app-button-primary mt-4 w-full"
            >
              Ver detalle
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TramiteCard;
