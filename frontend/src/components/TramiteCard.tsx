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
  onClick?: () => void;
}

const getStatusTheme = (status: string) => {
  switch (status) {
    case 'Finalizado':
      return {
        chip: 'border-green-200 bg-green-50 text-green-700',
        bar: 'from-green-600 to-green-500',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };
    case 'En Registros Públicos':
      return {
        chip: 'border-gold-200 bg-gold-50 text-gold-700',
        bar: 'from-gold-500 to-gold-400',
        icon: <Landmark className="h-3.5 w-3.5" />,
      };
    case 'Observado':
      return {
        chip: 'border-red-200 bg-red-50 text-red-700',
        bar: 'from-wine-600 to-wine-500',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      };
    default:
      return {
        chip: 'border-notary-200 bg-notary-50 text-notary-700',
        bar: 'from-notary-600 to-notary-500',
        icon: <Building2 className="h-3.5 w-3.5" />,
      };
  }
};

export const TramiteCard: React.FC<TramiteCardProps> = ({ tramite, onClick }) => {
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
        classes: 'bg-gold-100 text-gold-700 border-gold-200',
      };
    }
    if (normalized.includes('constituci') || normalized.includes('sociedad') || normalized.includes('s.a.c')) {
      return {
        icon: <Building2 className="h-6 w-6" />,
        classes: 'bg-notary-100 text-notary-700 border-notary-200',
      };
    }
    if (normalized.includes('poder')) {
      return {
        icon: <FileSignature className="h-6 w-6" />,
        classes: 'bg-blue-100 text-blue-700 border-blue-200',
      };
    }
    if (normalized.includes('divorcio') || normalized.includes('ratificacion') || normalized.includes('audiencia')) {
      return {
        icon: <Scale className="h-6 w-6" />,
        classes: 'bg-green-100 text-green-700 border-green-200',
      };
    }

    return {
      icon: <ScrollText className="h-6 w-6" />,
      classes: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    };
  }, [actName]);

  const handleClick = onClick || (() => navigate(`/tramite/${tramite.kardex}`));

  return (
    <article
      onClick={handleClick}
      className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border ${actVisual.classes}`}>
            {actVisual.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-notary-200 bg-notary-50 text-notary-800">
                <FileBadge2 className="h-3.5 w-3.5" />
                {tramite.kardex}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.chip}`}>
                {theme.icon}
                {statusLabel}
              </span>
              {latestStatus === 'OBSERVADO' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-wine-200 bg-wine-50 text-wine-700">
                  Requiere revisión
                </span>
              )}
            </div>

            <h3 className="font-display text-xl font-bold text-neutral-900">
              {actName}
            </h3>

            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
              <UserRound className="h-3.5 w-3.5 text-notary-600" />
              <span className="font-medium text-neutral-700">Titular:</span>
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

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Avance del trámite
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                  <CalendarDays className="h-3.5 w-3.5 text-notary-600" />
                  {currentLabel}
                </p>
              </div>
              <span className="font-display text-3xl font-bold text-neutral-900">
                {percentage}%
              </span>
            </div>

            <div className="h-2.5 rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-notary-600 hover:bg-notary-700 text-white font-semibold transition-colors"
          >
            Ver detalle
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default TramiteCard;
