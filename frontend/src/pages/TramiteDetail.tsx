import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  FolderOpen,
  File,
  Eye,
  Download,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { tramiteAPI } from '../api/services';
import type { TramiteDetail, ApiResponse, EstadoRegistral, HistorialRegistralItem, TramiteContratante, TramiteDocumentoDisponible } from '../types';
import { cleanTramiteLabel, getClientFacingStatus, getDisplayActName, getProgressSummary } from '../utils/tramites';
import type { ProgressStage } from '../utils/tramites';

type StatusTheme = {
  chip: string;
  soft: string;
  dot: string;
  line: string;
};

type RegistralTitleView = EstadoRegistral & {
  latestHistory?: HistorialRegistralItem;
};

type RegistralTimelineItem = {
  key: string;
  title: string;
  tramite?: string;
  fecha: string;
  estado: string;
  area?: string;
  responsable?: string;
  observaciones?: string;
  isLatest: boolean;
};

type AvailablePdfDocument = TramiteDocumentoDisponible & {
  key: string;
  label: string;
};

type DetailSectionProps = {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const STATUS_THEMES: Record<string, StatusTheme> = {
  INSCRITO: {
    chip: 'bg-lime-100 text-lime-800 border-lime-200',
    soft: 'bg-lime-50 text-lime-800 border-lime-200',
    dot: 'bg-lime-500',
    line: 'bg-lime-400',
  },
  PRESENTADO: {
    chip: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    soft: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    dot: 'bg-cyan-500',
    line: 'bg-cyan-400',
  },
  REINGRESO: {
    chip: 'bg-blue-100 text-blue-800 border-blue-200',
    soft: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    line: 'bg-blue-400',
  },
  REINGRESADO: {
    chip: 'bg-blue-100 text-blue-800 border-blue-200',
    soft: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    line: 'bg-blue-400',
  },
  APELADO: {
    chip: 'bg-orange-100 text-orange-800 border-orange-200',
    soft: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
    line: 'bg-orange-400',
  },
  'EN PROCESO': {
    chip: 'bg-slate-100 text-slate-800 border-slate-200',
    soft: 'bg-slate-50 text-slate-800 border-slate-200',
    dot: 'bg-slate-500',
    line: 'bg-slate-400',
  },
  'EN CALIFICACION': {
    chip: 'bg-violet-100 text-violet-800 border-violet-200',
    soft: 'bg-violet-50 text-violet-800 border-violet-200',
    dot: 'bg-violet-500',
    line: 'bg-violet-400',
  },
  'EN CALIFICACIÓN': {
    chip: 'bg-violet-100 text-violet-800 border-violet-200',
    soft: 'bg-violet-50 text-violet-800 border-violet-200',
    dot: 'bg-violet-500',
    line: 'bg-violet-400',
  },
  DISTRIBUIDO: {
    chip: 'bg-pink-100 text-pink-800 border-pink-200',
    soft: 'bg-pink-50 text-pink-800 border-pink-200',
    dot: 'bg-pink-500',
    line: 'bg-pink-400',
  },
  LIQUIDADO: {
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    soft: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    line: 'bg-emerald-400',
  },
  PRORROGADO: {
    chip: 'bg-sky-100 text-sky-800 border-sky-200',
    soft: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    line: 'bg-sky-400',
  },
  OBSERVADO: {
    chip: 'bg-rose-100 text-rose-800 border-rose-200',
    soft: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    line: 'bg-rose-400',
  },
  SUSPENDIDO: {
    chip: 'bg-red-100 text-red-800 border-red-200',
    soft: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-600',
    line: 'bg-red-500',
  },
  TACHADO: {
    chip: 'bg-neutral-900 text-white border-neutral-900',
    soft: 'bg-neutral-100 text-neutral-900 border-neutral-300',
    dot: 'bg-neutral-900',
    line: 'bg-neutral-600',
  },
  CONCLUIDO: {
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    soft: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    line: 'bg-emerald-400',
  },
  ESCRITURADO: {
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
    soft: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    line: 'bg-amber-400',
  },
  INGRESADO: {
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    soft: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    line: 'bg-slate-300',
  },
};

const parseDateValue = (value?: string) => {
  if (!value) return 0;
  const normalized = value.trim();
  if (/^\d{2}\/\d{2}\/\d{4}/.test(normalized)) {
    const [datePart, timePart] = normalized.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours = 0, minutes = 0, seconds = 0] = (timePart || '00:00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
  }
  const timestamp = new Date(normalized).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const normalizeText = (value?: string | null) => {
  const stringValue = String(value ?? '').trim();
  return stringValue === '' || stringValue === '0' ? null : stringValue;
};

const normalizeStatusKey = (status?: string | null) => {
  return String(status ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const normalizeRegistralKey = (value?: string | null) => {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
};

const getStatusTheme = (status?: string | null): StatusTheme => {
  return STATUS_THEMES[normalizeStatusKey(status)] || {
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
    soft: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    line: 'bg-amber-400',
  };
};

const buildRegistralTitles = (titles: EstadoRegistral[]): RegistralTitleView[] => {
  const groupedTitles = new Map<string, RegistralTitleView>();

  [...titles].forEach((title, index) => {
    const history = [...(title.historial || [])].sort(
      (a, b) => parseDateValue(b.fecha) - parseDateValue(a.fecha) || (b.itemmov || 0) - (a.itemmov || 0)
    );
    const latest = history[0];
    const normalizedKey = normalizeRegistralKey(title.titulo) || `SIN-TITULO-${index}`;
    const current: RegistralTitleView = {
      ...title,
      estado_actual: latest?.estado || title.estado_actual,
      fecha: latest?.fecha || title.fecha,
      historial: history,
      latestHistory: latest,
    };

    const existing = groupedTitles.get(normalizedKey);
    if (!existing) {
      groupedTitles.set(normalizedKey, current);
      return;
    }

    const mergedHistory = [...(existing.historial || []), ...history].sort(
      (a, b) => parseDateValue(b.fecha) - parseDateValue(a.fecha) || (b.itemmov || 0) - (a.itemmov || 0)
    );
    const mergedLatest = mergedHistory[0];

    groupedTitles.set(normalizedKey, {
      ...existing,
      titulo: existing.titulo || current.titulo,
      tramite: existing.tramite || current.tramite,
      sede: existing.sede || current.sede,
      seccion: existing.seccion || current.seccion,
      importe: existing.importe || current.importe,
      numeropartida: existing.numeropartida || current.numeropartida,
      registrador: existing.registrador || current.registrador,
      asiento: existing.asiento || current.asiento,
      fechainscripcion: existing.fechainscripcion || current.fechainscripcion,
      observaciones: existing.observaciones || current.observaciones,
      fecha: mergedLatest?.fecha || existing.fecha || current.fecha,
      estado_actual: mergedLatest?.estado || existing.estado_actual || current.estado_actual,
      historial: mergedHistory,
      latestHistory: mergedLatest,
    });
  });

  return Array.from(groupedTitles.values()).sort((a, b) => parseDateValue(b.fecha) - parseDateValue(a.fecha));
};

const buildRegistralTimeline = (titles: RegistralTitleView[]): RegistralTimelineItem[] => {
  const items = titles.flatMap((title) =>
    (title.historial || []).map((historyItem, index) => ({
      key: `${title.titulo}-${historyItem.idmovreg ?? 'mov'}-${historyItem.itemmov ?? index}`,
      title: title.titulo,
      tramite: title.tramite,
      fecha: historyItem.fecha,
      estado: historyItem.estado,
      area: title.seccion,
      responsable: title.registrador,
      observaciones: title.observaciones,
      isLatest: false,
    }))
  );

  const sortedItems = items.sort(
    (a, b) => parseDateValue(b.fecha) - parseDateValue(a.fecha)
  );

  if (sortedItems.length > 0) {
    sortedItems[0].isLatest = true;
  }

  return sortedItems;
};

const buildAvailablePdfDocuments = (tramite: TramiteDetail): AvailablePdfDocument[] => {
  return (tramite.documentos_disponibles || []).map((document) => ({
    ...document,
    key: String(document.id),
    label: normalizeText(document.description) || 'PDF RR.PP.',
  }));
};

const DetailSection: React.FC<DetailSectionProps> = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="app-card p-8">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h3 className="flex items-center gap-3 text-xl font-semibold text-neutral-900">
        {icon}
        {title}
      </h3>
      {isOpen ? <ChevronUp className="h-5 w-5 text-neutral-500" /> : <ChevronDown className="h-5 w-5 text-neutral-500" />}
    </button>
    {isOpen && <div className="mt-7">{children}</div>}
  </div>
);

const getReadableCondition = (value?: string | null) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }
  if (/[0-9]/.test(normalized) || normalized.includes('/') || normalized.includes('.')) {
    return null;
  }
  return normalized;
};

const TramiteDetailPage: React.FC = () => {
  const { kardex } = useParams<{ kardex: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tramite, setTramite] = useState<TramiteDetail | null>(null);
  const [openTitle, setOpenTitle] = useState<string | null>(null);
  const [documentBusyId, setDocumentBusyId] = useState<number | null>(null);
  const [documentError, setDocumentError] = useState('');
  const [openSections, setOpenSections] = useState({
    general: true,
    history: false,
    internal: false,
    titles: false,
    documents: true,
    client: false,
    contractors: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!kardex) return;
      try {
        setLoading(true);
        const response: ApiResponse<TramiteDetail> = await tramiteAPI.getTramiteDetail(kardex);
        if (response.success) {
          setTramite(response.data);
        }
      } catch (error) {
        console.error('Error fetching tramite detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [kardex]);

  const progressSummary = useMemo(() => (tramite ? getProgressSummary(tramite) : null), [tramite]);
  const notarialStages = useMemo(
    () => progressSummary?.stages ?? [],
    [progressSummary]
  );
  const visibleNotarialStages = useMemo(
    () => notarialStages.filter((stage: ProgressStage) => Boolean(stage.date)),
    [notarialStages]
  );
  const currentStageIndex = notarialStages.length
    ? Math.max(
        0,
        notarialStages.reduce(
          (lastIndex: number, stage: ProgressStage, index: number) => (stage.active ? index : lastIndex),
          0
        )
      )
    : 0;
  const currentStage = (visibleNotarialStages[visibleNotarialStages.length - 1] || notarialStages[currentStageIndex]);
  const progressPercentage = progressSummary?.percentage || 0;
  const registralTitles = useMemo(
    () => buildRegistralTitles(tramite?.movimientos_rrpp || []),
    [tramite?.movimientos_rrpp]
  );
  const registralTimeline = useMemo(
    () => buildRegistralTimeline(registralTitles),
    [registralTitles]
  );
  const latestRegistralActivity = registralTimeline[0];
  const currentStateTheme = getStatusTheme(latestRegistralActivity?.estado || tramite?.estado_general || 'INGRESADO');
  const currentClientState = tramite ? getClientFacingStatus(tramite) : 'En Notaría';
  const availablePdfDocuments = useMemo(
    () => (tramite ? buildAvailablePdfDocuments(tramite) : []),
    [tramite]
  );
  const primaryParticipant = useMemo<TramiteContratante | null>(() => {
    if (!tramite?.contratantes?.length) {
      return null;
    }
    return (
      tramite.contratantes.find((contratante) => contratante.full_name === tramite.cliente_nombre) ||
      tramite.contratantes[0] ||
      null
    );
  }, [tramite]);
  const displayActName = useMemo(() => (tramite ? getDisplayActName(tramite) : 'Trámite notarial'), [tramite]);

  const handlePdfAction = async (pdfDocument: AvailablePdfDocument, mode: 'view' | 'download') => {
    if (!kardex) return;
    try {
      setDocumentBusyId(pdfDocument.id);
      setDocumentError('');
      const blob = await tramiteAPI.downloadDocument(kardex, pdfDocument.id);
      const url = window.URL.createObjectURL(blob);
      const safeName = `${kardex}_${cleanTramiteLabel(pdfDocument.status || 'rrpp') || 'rrpp'}_${cleanTramiteLabel(pdfDocument.title || pdfDocument.label) || 'documento'}.pdf`
        .replace(/\s+/g, '_');

      if (mode === 'download') {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = safeName;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          const link = window.document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          window.document.body.appendChild(link);
          link.click();
          link.remove();
        }
      }

      window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Error descargando documento PDF:', error);
      setDocumentError('No se pudo obtener el PDF desde SIGNO. Verifica la conexión VPN y vuelve a intentar.');
    } finally {
      setDocumentBusyId(null);
    }
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-notary-700 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <p className="text-neutral-600 text-lg">Cargando información del trámite...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tramite) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <p className="text-neutral-600 text-lg">Trámite no encontrado</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-5 flex items-center text-neutral-600 transition-colors hover:text-notary-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al dashboard
        </button>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">Detalle del trámite</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              {displayActName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="app-chip border-notary-100 bg-notary-800 text-white">
                {tramite.kardex}
              </span>
              <span className={`app-chip ${currentStateTheme.chip}`}>
                {latestRegistralActivity?.estado || currentClientState}
              </span>
            </div>
            </div>
        </div>
      </div>

      <div className="app-panel mb-8 px-6 py-6 sm:px-8">
        <div className="flex flex-col xl:flex-row items-start gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`app-chip ${currentStateTheme.chip}`}>
                Estado actual: {latestRegistralActivity?.estado || currentClientState}
              </span>
              <span className="app-chip border-neutral-200 bg-neutral-50 text-neutral-600">
                Kardex {tramite.kardex}
              </span>
            </div>
            <div className="font-display text-5xl font-extrabold tracking-tight text-neutral-900 mb-3">{progressPercentage}%</div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${currentStateTheme.line}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xl font-bold text-neutral-900 mb-2">Etapa actual</div>
            <div className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 mb-2">
              {currentStage?.label || 'Ingreso'}
            </div>
            <p className="mb-5 max-w-2xl text-sm leading-7 text-neutral-600">{currentStage?.description || progressSummary?.currentDescription}</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Último movimiento registral</p>
                <p className="text-sm font-semibold text-neutral-900">{latestRegistralActivity?.fecha || 'No disponible'}</p>
                <p className="text-sm text-neutral-600">{latestRegistralActivity?.title || 'Sin movimiento SUNARP aún'}</p>
              </div>
            </div>
          </div>
          <div className="w-full xl:max-w-md rounded-[28px] border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="font-display text-xl font-bold tracking-tight text-neutral-900 mb-4">Estado del trámite</h3>
            <div className="space-y-4">
              {visibleNotarialStages.map((step: ProgressStage, index: number) => {
                const isCompleted = step.active;
                const isCurrent = index === visibleNotarialStages.length - 1;
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? `${currentStateTheme.soft} border ${currentStateTheme.chip.split(' ').find(cls => cls.startsWith('border-')) || 'border-transparent'}`
                        : 'bg-white text-neutral-300 border border-neutral-200'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isCompleted ? 'text-neutral-900' : 'text-neutral-400'}`}>{step.label}</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">{step.description}</p>
                      <p className="mt-1 text-xs text-neutral-500">{step.date || 'Fecha no disponible en SIGNO'}</p>
                    </div>
                    {isCurrent && (
                      <span className={`text-xs px-2 py-1 rounded-full font-bold border ${currentStateTheme.chip}`}>
                        Actual
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Información General */}
          <DetailSection
            title="Información General"
            icon={<FileText className="w-6 h-6 text-notary-700" />}
            isOpen={openSections.general}
            onToggle={() => toggleSection('general')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
                  Tipo de acto
                </p>
                <p className="text-neutral-900 text-lg font-semibold">{tramite.contrato}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
                  Fecha de ingreso
                </p>
                <p className="text-neutral-900 text-lg font-semibold">{tramite.fechaingreso}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
                  Titular / razón social
                </p>
                <p className="text-neutral-900 text-lg font-semibold">
                  {tramite.cliente_nombre || primaryParticipant?.full_name || 'No informado en SIGNO'}
                </p>
              </div>

              {tramite.fechaescritura && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
                    Fecha de escritura
                  </p>
                  <p className="text-neutral-900 text-lg font-semibold">{tramite.fechaescritura}</p>
                </div>
              )}

              {/* Contratantes */}
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
                  Contratantes
                </p>
                {tramite.contratantes && tramite.contratantes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tramite.contratantes.map((contratante, index) => (
                      <span key={`${contratante.idcontratante || contratante.document_number || contratante.full_name}-${index}`} className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-900">
                        {contratante.full_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600">No hay contratantes informados en SIGNO</p>
                )}
              </div>
            </div>
          </DetailSection>

          {/* Timeline registral real */}
          <DetailSection
            title="Historial SUNARP"
            icon={<Clock className="w-6 h-6 text-notary-700" />}
            isOpen={openSections.history}
            onToggle={() => toggleSection('history')}
          >
            {registralTimeline.length > 0 ? (
              <div className="space-y-0">
                {registralTimeline.map((item, index) => {
                  const theme = getStatusTheme(item.estado);
                  const isLast = index === registralTimeline.length - 1;

                  return (
                    <div key={item.key} className={`relative pl-10 pb-8 ${isLast ? 'pb-0' : ''}`}>
                      {!isLast && <div className="absolute left-[11px] top-7 w-0.5 h-full bg-neutral-200" />}
                      <div className={`absolute left-0 top-2 w-6 h-6 rounded-full ${theme.dot} ring-4 ring-white`} />

                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <p className="text-base font-semibold text-neutral-900">{item.estado}</p>
                          {item.isLatest && (
                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${theme.chip}`}>
                              Último movimiento
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-neutral-600">
                          <p><span className="font-medium text-neutral-900">Fecha:</span> {item.fecha || 'No disponible'}</p>
                          <p><span className="font-medium text-neutral-900">Título:</span> {item.title}</p>
                          {item.tramite && <p><span className="font-medium text-neutral-900">Acto:</span> {item.tramite}</p>}
                          {item.area && <p><span className="font-medium text-neutral-900">Área:</span> {item.area}</p>}
                          {normalizeText(item.observaciones) && (
                            <p><span className="font-medium text-neutral-900">Observación:</span> {normalizeText(item.observaciones)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-6 text-sm text-neutral-500">
                Aún no existen movimientos registrales reales para este trámite.
              </div>
            )}
          </DetailSection>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Títulos Registrales con acordeones */}
          <DetailSection
            title="Títulos Registrales"
            icon={<Building2 className="w-6 h-6 text-notary-700" />}
            isOpen={openSections.titles}
            onToggle={() => toggleSection('titles')}
          >
            {registralTitles.length > 0 ? (
              <div className="space-y-4">
                {registralTitles.map((movimiento, index) => {
                  const key = movimiento.titulo || `titulo-${index}`;
                  const isOpen = openTitle === key;
                  const theme = getStatusTheme(movimiento.estado_actual);

                  return (
                    <div
                      key={key}
                      className="border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-300 transition-colors"
                    >
                      <button
                        onClick={() => setOpenTitle(isOpen ? null : key)}
                        className="w-full flex items-center justify-between p-5 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-base font-bold text-neutral-900">{movimiento.titulo}</p>
                          <p className="text-sm text-neutral-500">{movimiento.tramite}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${theme.chip}`}>
                            {movimiento.estado_actual}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-neutral-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-500" />
                          )}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="p-5 space-y-4 border-t border-neutral-200">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {movimiento.sede && (
                              <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                                  Oficina
                                </p>
                                <p className="text-sm text-neutral-900">{movimiento.sede}</p>
                              </div>
                            )}
                            {movimiento.seccion && (
                              <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                                  Sección
                                </p>
                                <p className="text-sm text-neutral-900">{movimiento.seccion}</p>
                              </div>
                            )}
                            {movimiento.numeropartida && (
                              <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                                  Partida
                                </p>
                                <p className="text-sm text-neutral-900">{movimiento.numeropartida}</p>
                              </div>
                            )}
                            {movimiento.importe && (
                              <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                                  Importe
                                </p>
                                <p className="text-sm text-neutral-900">{movimiento.importe}</p>
                              </div>
                            )}
                          </div>

                          {/* Historial del título */}
                          {movimiento.historial?.length > 0 && (
                            <div className="pt-4 border-t border-neutral-100">
                              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                                Historial del título
                              </p>
                              <div className="space-y-2">
                                {movimiento.historial.map((histItem, hIndex) => (
                                  <div key={hIndex} className="flex items-start gap-2">
                                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${getStatusTheme(histItem.estado).dot}`} />
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-neutral-900">{histItem.estado}</p>
                                        {hIndex === 0 && (
                                          <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-full border ${theme.chip}`}>
                                            Actual
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-neutral-500">{histItem.fecha || 'Fecha no disponible'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-500">No hay títulos registrales aún</p>
              </div>
            )}
          </DetailSection>

          {/* Documentos reales disponibles */}
          <DetailSection
            title="Documentos Disponibles"
            icon={<File className="w-6 h-6 text-notary-700" />}
            isOpen={openSections.documents}
            onToggle={() => toggleSection('documents')}
          >
            {documentError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {documentError}
              </div>
            )}

            {availablePdfDocuments.length > 0 ? (
              <div className="space-y-4">
                {availablePdfDocuments.map((document) => (
                  <div key={document.key} className="rounded-xl border border-neutral-200 p-5 bg-neutral-50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-notary-700 flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-900">{document.label}</p>
                        {document.title && <p className="text-sm text-neutral-700">Título: {document.title}</p>}
                        {document.status && <p className="text-xs text-neutral-500 mt-1">Estado asociado: {document.status}</p>}
                        {document.movement_date && <p className="text-xs text-neutral-500 mt-1">Fecha de movimiento: {document.movement_date}</p>}
                        {document.created_at && <p className="text-xs text-neutral-500 mt-1">Cargado en SIGNO: {document.created_at}</p>}
                        <p className="text-xs text-neutral-500 mt-2">
                          PDF real registrado en SIGNO para el movimiento RR.PP. correspondiente.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handlePdfAction(document, 'view')}
                            disabled={documentBusyId === document.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                          >
                            <Eye className="w-4 h-4" />
                            Ver PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePdfAction(document, 'download')}
                            disabled={documentBusyId === document.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-notary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-notary-800 disabled:opacity-60"
                          >
                            <Download className="w-4 h-4" />
                            {documentBusyId === document.id ? 'Procesando...' : 'Descargar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-6 text-sm text-neutral-500">
                No existen PDF RR.PP. disponibles en SIGNO para este trámite.
              </div>
            )}
          </DetailSection>

          {/* Datos del Cliente */}
          <DetailSection
            title="Datos del Cliente"
            icon={<User className="w-6 h-6 text-notary-700" />}
            isOpen={openSections.client}
            onToggle={() => toggleSection('client')}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                  Titular principal
                </p>
                <p className="text-neutral-900 text-base font-semibold">
                  {tramite.cliente_nombre || primaryParticipant?.full_name || 'No informado en SIGNO'}
                </p>
              </div>
              {primaryParticipant?.document_number && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                    Documento
                  </p>
                  <p className="text-neutral-900 text-base font-semibold">{primaryParticipant.document_number}</p>
                </div>
              )}
              {normalizeText(tramite.contacto) && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                    Contacto del expediente
                  </p>
                  <p className="text-neutral-900 text-base font-semibold">{tramite.contacto}</p>
                </div>
              )}
              {tramite.telecontacto && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                    Teléfono de contacto
                  </p>
                  <p className="text-neutral-900 text-base font-semibold">{tramite.telecontacto}</p>
                </div>
              )}
              {tramite.mailcontacto && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                    Correo de contacto
                  </p>
                  <p className="text-neutral-900 text-base font-semibold">{tramite.mailcontacto}</p>
                </div>
              )}
            </div>
          </DetailSection>
        </div>
      </div>
    </Layout>
  );
};

export default TramiteDetailPage;
