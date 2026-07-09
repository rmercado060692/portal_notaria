import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  Building2,
  File,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { tramiteAPI } from '../api/services';
import type { TramiteDetail, ApiResponse, EstadoRegistral, HistorialRegistralItem, TramiteDocumentoDisponible } from '../types';
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

type DetailSectionProps = {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const STATUS_THEMES: Record<string, StatusTheme> = {
  INSCRITO: {
    chip: 'border-green-200 bg-green-50 text-green-700',
    soft: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-600',
    line: 'bg-green-500',
  },
  PRESENTADO: {
    chip: 'border-blue-200 bg-blue-50 text-blue-700',
    soft: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
    line: 'bg-blue-500',
  },
  REINGRESO: {
    chip: 'border-blue-200 bg-blue-50 text-blue-700',
    soft: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
    line: 'bg-blue-500',
  },
  REINGRESADO: {
    chip: 'border-blue-200 bg-blue-50 text-blue-700',
    soft: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
    line: 'bg-blue-500',
  },
  APELADO: {
    chip: 'border-orange-200 bg-orange-50 text-orange-700',
    soft: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-600',
    line: 'bg-orange-500',
  },
  'EN PROCESO': {
    chip: 'border-neutral-200 bg-neutral-50 text-neutral-700',
    soft: 'bg-neutral-50 text-neutral-700 border-neutral-200',
    dot: 'bg-neutral-500',
    line: 'bg-neutral-400',
  },
  'EN CALIFICACION': {
    chip: 'border-purple-200 bg-purple-50 text-purple-700',
    soft: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-600',
    line: 'bg-purple-500',
  },
  'EN CALIFICACIÓN': {
    chip: 'border-purple-200 bg-purple-50 text-purple-700',
    soft: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-600',
    line: 'bg-purple-500',
  },
  DISTRIBUIDO: {
    chip: 'border-pink-200 bg-pink-50 text-pink-700',
    soft: 'bg-pink-50 text-pink-700 border-pink-200',
    dot: 'bg-pink-600',
    line: 'bg-pink-500',
  },
  LIQUIDADO: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-600',
    line: 'bg-emerald-500',
  },
  PRORROGADO: {
    chip: 'border-sky-200 bg-sky-50 text-sky-700',
    soft: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-600',
    line: 'bg-sky-500',
  },
  OBSERVADO: {
    chip: 'border-wine-200 bg-wine-50 text-wine-700',
    soft: 'bg-wine-50 text-wine-700 border-wine-200',
    dot: 'bg-wine-600',
    line: 'bg-wine-500',
  },
  SUSPENDIDO: {
    chip: 'border-wine-200 bg-wine-50 text-wine-700',
    soft: 'bg-wine-50 text-wine-700 border-wine-200',
    dot: 'bg-wine-600',
    line: 'bg-wine-500',
  },
  TACHADO: {
    chip: 'border-neutral-900 bg-neutral-900 text-white',
    soft: 'bg-neutral-100 text-neutral-900 border-neutral-300',
    dot: 'bg-neutral-900',
    line: 'bg-neutral-600',
  },
  CONCLUIDO: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-600',
    line: 'bg-emerald-500',
  },
  ESCRITURADO: {
    chip: 'border-gold-200 bg-gold-50 text-gold-700',
    soft: 'bg-gold-50 text-gold-700 border-gold-200',
    dot: 'bg-gold-500',
    line: 'bg-gold-400',
  },
  INGRESADO: {
    chip: 'border-neutral-200 bg-neutral-50 text-neutral-700',
    soft: 'bg-neutral-50 text-neutral-700 border-neutral-200',
    dot: 'bg-neutral-500',
    line: 'bg-neutral-400',
  },
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
    chip: 'border-gold-200 bg-gold-50 text-gold-700',
    soft: 'bg-gold-50 text-gold-700 border-gold-200',
    dot: 'bg-gold-500',
    line: 'bg-gold-400',
  };
};

const buildRegistralTitles = (titles: EstadoRegistral[]): RegistralTitleView[] => {
  const groupedTitles = new Map<string, RegistralTitleView>();

  [...titles].forEach((title, index) => {
    const history = [...(title.historial || [])].sort(
      (a, b) => (Number(b.fecha) || 0) - (Number(a.fecha) || 0) || (b.itemmov || 0) - (a.itemmov || 0)
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
      (a, b) => (Number(b.fecha) || 0) - (Number(a.fecha) || 0) || (b.itemmov || 0) - (a.itemmov || 0)
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

  return Array.from(groupedTitles.values()).sort((a, b) => (Number(b.fecha) || 0) - (Number(a.fecha) || 0));
};

const buildAvailablePdfDocuments = (tramite: TramiteDetail) => {
  return (tramite.documentos_disponibles || []).map((document) => ({
    ...document,
    key: String(document.id),
    label: normalizeText(document.description) || 'PDF RR.PP.',
  }));
};

const DetailSection: React.FC<DetailSectionProps> = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h3 className="flex items-center gap-3 text-lg font-bold text-neutral-900">
        {icon}
        {title}
      </h3>
      {isOpen ? <ChevronUp className="h-5 w-5 text-neutral-500" /> : <ChevronDown className="h-5 w-5 text-neutral-500" />}
    </button>
    {isOpen && <div className="mt-5">{children}</div>}
  </div>
);

const TramiteDetailPage: React.FC = () => {
  const { kardex } = useParams<{ kardex: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tramite, setTramite] = useState<TramiteDetail | null>(null);
  const [openTitle, setOpenTitle] = useState<string | null>(null);
  const [documentBusyId, setDocumentBusyId] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState({
    general: true,
    history: false,
    titles: false,
    documents: true,
    client: false,
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
  const currentStage = visibleNotarialStages[visibleNotarialStages.length - 1] || notarialStages[currentStageIndex];
  const progressPercentage = progressSummary?.percentage || 0;
  const registralTitles = useMemo(
    () => buildRegistralTitles(tramite?.movimientos_rrpp || []),
    [tramite?.movimientos_rrpp]
  );
  const latestRegistralActivity = registralTitles[0]?.latestHistory;
  const currentStateTheme = getStatusTheme(latestRegistralActivity?.estado || tramite?.estado_general || 'INGRESADO');
  const currentClientState = tramite ? getClientFacingStatus(tramite) : 'En Notaría';
  const availablePdfDocuments = useMemo(
    () => (tramite ? buildAvailablePdfDocuments(tramite) : []),
    [tramite]
  );
  const displayActName = useMemo(() => (tramite ? getDisplayActName(tramite) : 'Trámite notarial'), [tramite]);

  const handlePdfAction = async (pdfDocument: TramiteDocumentoDisponible & { key: string; label: string }, mode: 'view' | 'download') => {
    if (!kardex) return;
    try {
      setDocumentBusyId(pdfDocument.id);
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
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-notary-600 border-t-transparent" />
            <p className="text-neutral-600 text-base sm:text-lg">Cargando información del trámite...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tramite) {
    return (
      <Layout>
        <div className="py-12 text-center sm:py-16">
          <p className="text-neutral-600 text-base sm:text-lg">Trámite no encontrado</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition"
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-2 flex items-center text-neutral-600 hover:text-notary-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver al dashboard
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Detalle del trámite</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900">
              {displayActName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-notary-200 bg-notary-50 text-notary-800">
                {tramite.kardex}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentStateTheme.chip}`}>
                {latestRegistralActivity?.estado || currentClientState}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-notary-600 to-notary-700 rounded-2xl p-5 sm:p-6 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white`}>
                  Estado actual: {latestRegistralActivity?.estado || currentClientState}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white">
                  Kardex {tramite.kardex}
                </span>
              </div>
              <div className="font-display text-3xl sm:text-4xl font-bold mb-2">{progressPercentage}%</div>
              <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-white/20 sm:h-3">
                <div
                  className={`h-full w-full rounded-full transition-all duration-1000 bg-gradient-to-r from-gold-400 to-gold-500`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-base font-semibold mb-1 sm:text-lg">Etapa actual</div>
              <div className="font-display text-xl font-bold mb-2 sm:text-2xl">
                {currentStage?.label || 'Ingreso'}
              </div>
              <p className="text-sm leading-6 text-notary-100 mb-4 sm:text-base">{currentStage?.description || progressSummary?.currentDescription}</p>
              <div className="rounded-xl bg-white/10 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-notary-200 mb-1">Último movimiento registral</p>
                <p className="text-sm font-semibold text-white">{latestRegistralActivity?.fecha || 'No disponible'}</p>
                <p className="text-sm text-notary-100">{registralTitles[0]?.titulo || 'Sin movimiento SUNARP aún'}</p>
              </div>
            </div>
            <div className="w-full lg:max-w-xs rounded-2xl bg-white/10 border border-white/20 px-5 py-5">
              <h3 className="mb-4 font-display text-lg font-bold text-white">Estado del trámite</h3>
              <div className="space-y-3">
                {visibleNotarialStages.map((step: ProgressStage, index: number) => {
                  const isCompleted = step.active;
                  const isCurrent = index === visibleNotarialStages.length - 1;
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isCompleted ? 'bg-gold-500 text-white' : 'bg-white/30 text-white/70 border border-white/30'}`}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isCompleted ? 'text-white' : 'text-white/70'}`}>{step.label}</p>
                        <p className="mt-1 text-xs leading-5 text-white/70">{step.description}</p>
                        <p className="mt-1 text-xs text-white/70">{step.date || 'Fecha no disponible en SIGNO'}</p>
                      </div>
                      {isCurrent && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold bg-white text-notary-700`}>
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <DetailSection
              title="Información General"
              icon={<FileText className="h-6 w-6 text-notary-700" />}
              isOpen={openSections.general}
              onToggle={() => toggleSection('general')}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Tipo de acto
                  </p>
                  <p className="text-neutral-900 text-base font-semibold">{tramite.contrato}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Fecha de ingreso
                  </p>
                  <p className="text-neutral-900 text-base font-semibold">{tramite.fechaingreso}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Titular / razón social
                  </p>
                  <p className="text-neutral-900 text-base font-semibold">
                    {tramite.cliente_nombre || tramite.contratantes?.[0]?.full_name || 'No informado en SIGNO'}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Contratantes
                  </p>
                  {tramite.contratantes && tramite.contratantes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tramite.contratantes.map((contratante, index) => (
                        <span key={`${contratante.idcontratante || contratante.document_number || contratante.full_name}-${index}`} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-900">
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

            <DetailSection
              title="Historial SUNARP"
              icon={<Clock className="h-6 w-6 text-notary-700" />}
              isOpen={openSections.history}
              onToggle={() => toggleSection('history')}
            >
              {registralTitles.length > 0 ? (
                <div className="space-y-0">
                  {registralTitles.flatMap((title) => 
                    (title.historial || []).map((item, index) => {
                      const theme = getStatusTheme(item.estado);
                      const isLast = index === (title.historial?.length || 0) - 1;
                      const isLatestTitle = title === registralTitles[0] && index === 0;

                      return (
                        <div key={`${title.titulo}-${item.idmovreg || index}`} className={`relative pl-10 pb-6 ${isLast ? 'pb-0' : ''}`}>
                          {!isLast && <div className="absolute left-[11px] top-7 w-0.5 h-full bg-neutral-200" />}
                          <div className={`absolute left-0 top-2 h-6 w-6 rounded-full ${theme.dot} ring-4 ring-white`} />

                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <p className="text-base font-semibold text-neutral-900">{item.estado}</p>
                              {isLatestTitle && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.chip}`}>
                                  Último movimiento
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-neutral-600">
                              <p><span className="font-medium text-neutral-700">Fecha:</span> {item.fecha || 'No disponible'}</p>
                              <p><span className="font-medium text-neutral-700">Título:</span> {title.titulo}</p>
                              {title.tramite && <p><span className="font-medium text-neutral-700">Acto:</span> {title.tramite}</p>}
                              {title.seccion && <p><span className="font-medium text-neutral-700">Área:</span> {title.seccion}</p>}
                              {normalizeText(title.observaciones) && (
                                <p><span className="font-medium text-neutral-700">Observación:</span> {normalizeText(title.observaciones)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-6 text-sm text-neutral-500">
                  Aún no existen movimientos registrales reales para este trámite.
                </div>
              )}
            </DetailSection>
          </div>

          <div className="space-y-5">
            <DetailSection
              title="Títulos Registrales"
              icon={<Building2 className="h-6 w-6 text-notary-700" />}
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
                          className="w-full flex items-center justify-between px-5 py-4 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-base font-bold text-neutral-900 truncate">{movimiento.titulo}</p>
                            <p className="text-sm text-neutral-500">{movimiento.tramite}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.chip}`}>
                              {movimiento.estado_actual}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="h-5 w-5 text-neutral-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-neutral-500" />
                            )}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-5 py-4 border-t border-neutral-200 space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {movimiento.sede && (
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                                    Oficina
                                  </p>
                                  <p className="text-sm text-neutral-900">{movimiento.sede}</p>
                                </div>
                              )}
                              {movimiento.seccion && (
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                                    Sección
                                  </p>
                                  <p className="text-sm text-neutral-900">{movimiento.seccion}</p>
                                </div>
                              )}
                              {movimiento.numeropartida && (
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                                    Partida
                                  </p>
                                  <p className="text-sm text-neutral-900">{movimiento.numeropartida}</p>
                                </div>
                              )}
                              {movimiento.importe && (
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                                    Importe
                                  </p>
                                  <p className="text-sm text-neutral-900">{movimiento.importe}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-neutral-500">No hay títulos registrales aún</p>
                </div>
              )}
            </DetailSection>

            <DetailSection
              title="Documentos Disponibles"
              icon={<File className="h-6 w-6 text-notary-700" />}
              isOpen={openSections.documents}
              onToggle={() => toggleSection('documents')}
            >
              {availablePdfDocuments.length > 0 ? (
                <div className="space-y-4">
                  {availablePdfDocuments.map((document) => (
                    <div key={document.key} className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-neutral-200 text-notary-700">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate">{document.label}</p>
                          {document.title && <p className="text-sm text-neutral-700 truncate">Título: {document.title}</p>}
                          {document.status && <p className="text-xs text-neutral-500 mt-1">Estado asociado: {document.status}</p>}
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <button
                              type="button"
                              onClick={() => handlePdfAction(document, 'view')}
                              disabled={documentBusyId === document.id}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 w-full sm:w-auto"
                            >
                              <Eye className="h-4 w-4" />
                              Ver PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePdfAction(document, 'download')}
                              disabled={documentBusyId === document.id}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-notary-600 hover:bg-notary-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 w-full sm:w-auto"
                            >
                              <Download className="h-4 w-4" />
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

            <DetailSection
              title="Datos del Cliente"
              icon={<User className="h-6 w-6 text-notary-700" />}
              isOpen={openSections.client}
              onToggle={() => toggleSection('client')}
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Titular principal
                  </p>
                  <p className="text-neutral-900 text-base font-semibold">
                    {tramite.cliente_nombre || tramite.contratantes?.[0]?.full_name || 'No informado en SIGNO'}
                  </p>
                </div>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TramiteDetailPage;
