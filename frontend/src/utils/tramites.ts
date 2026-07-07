import type { TramiteListItem } from '../types';

type BaseTramite = Pick<
  TramiteListItem,
  | 'kardex'
  | 'referencia'
  | 'contrato'
  | 'contacto'
  | 'cliente_nombre'
  | 'numescritura'
  | 'fechaingreso'
  | 'fechacalificado'
  | 'fechaescritura'
  | 'fechaconclusion'
  | 'ultimo_estado_registral'
  | 'contratantes'
  | 'estado_notarial'
>;

export type ProgressStage = {
  key: string;
  label: string;
  description: string;
  date?: string;
  active: boolean;
  percent: number;
};

const normalizeValue = (value?: string | null) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeStatusKey = (value?: string | null) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

export const cleanTramiteLabel = (value?: string | null) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  return normalized
    .replace(/TR[ÁA]MITE\s+WEB\s+NRO\s*:?\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getDisplayActName = (tramite: Pick<BaseTramite, 'contrato' | 'referencia'>) => {
  const contrato = cleanTramiteLabel(tramite.contrato);
  if (contrato) return contrato;
  return cleanTramiteLabel(tramite.referencia) || 'Trámite notarial';
};

export const getLatestStatus = (tramite: Pick<BaseTramite, 'ultimo_estado_registral'>) =>
  normalizeStatusKey(tramite.ultimo_estado_registral);

export const isCompletedTramite = (tramite: Pick<BaseTramite, 'fechaconclusion' | 'ultimo_estado_registral'>) =>
  Boolean(tramite.fechaconclusion) || getLatestStatus(tramite) === 'INSCRITO';

export const isObservedTramite = (tramite: Pick<BaseTramite, 'ultimo_estado_registral'>) =>
  getLatestStatus(tramite) === 'OBSERVADO';

export const isInSunarpTramite = (tramite: Pick<BaseTramite, 'ultimo_estado_registral' | 'fechaconclusion'>) => {
  const latestStatus = getLatestStatus(tramite);
  if (!latestStatus || latestStatus === 'OBSERVADO' || isCompletedTramite(tramite)) {
    return false;
  }
  return ['PRESENTADO', 'LIQUIDADO', 'REINGRESADO', 'REINGRESO', 'APELADO', 'PRORROGADO', 'TACHADO', 'SUSPENDIDO', 'MAYOR DERECHO'].includes(latestStatus);
};

export const isInNotaryTramite = (tramite: Pick<BaseTramite, 'ultimo_estado_registral' | 'fechaconclusion'>) =>
  !isCompletedTramite(tramite) && !isObservedTramite(tramite) && !isInSunarpTramite(tramite);

export const getClientFacingStatus = (tramite: Pick<BaseTramite, 'ultimo_estado_registral' | 'fechaconclusion'>) => {
  if (isCompletedTramite(tramite)) return 'Finalizado';
  if (isObservedTramite(tramite)) return 'Observado';
  if (isInSunarpTramite(tramite)) return 'En Registros Públicos';
  return 'En Notaría';
};

export const getProgressStages = (tramite: Pick<BaseTramite, 'fechaingreso' | 'fechacalificado' | 'fechaescritura' | 'fechaconclusion' | 'ultimo_estado_registral' | 'estado_notarial'>): ProgressStage[] => {
  const isInscrito = isCompletedTramite(tramite);
  const inscriptionDate = tramite.fechaconclusion || (isInscrito ? undefined : undefined);

  return [
    {
      key: 'ingreso',
      label: 'Ingreso',
      description: 'Tu trámite fue recibido por la notaría.',
      date: tramite.fechaingreso,
      active: Boolean(tramite.fechaingreso),
      percent: 33,
    },
    {
      key: 'escritura',
      label: 'Escritura',
      description: 'El instrumento notarial ya fue emitido.',
      date: tramite.fechaescritura,
      active: Boolean(tramite.fechaescritura),
      percent: 67,
    },
    {
      key: 'inscrito',
      label: 'Inscrito / Concluido',
      description: 'El trámite registral fue finalizado correctamente.',
      date: inscriptionDate,
      active: isInscrito,
      percent: 100,
    },
  ];
};

export const getProgressSummary = (tramite: Pick<BaseTramite, 'fechaingreso' | 'fechacalificado' | 'fechaescritura' | 'fechaconclusion' | 'ultimo_estado_registral' | 'estado_notarial'>) => {
  const stages = getProgressStages(tramite);
  const activeStages = stages.filter((stage) => stage.active);
  const current = activeStages[activeStages.length - 1] || stages[0];

  return {
    stages,
    percentage: current?.percent || 0,
    currentLabel: current?.label || 'Ingreso',
    currentDescription: current?.description || '',
  };
};

export const getDashboardSummary = (tramites: TramiteListItem[]) => ({
  total: tramites.length,
  enNotaria: tramites.filter(isInNotaryTramite).length,
  enSunarp: tramites.filter(isInSunarpTramite).length,
  observados: tramites.filter(isObservedTramite).length,
  finalizados: tramites.filter(isCompletedTramite).length,
});

export const matchesTramiteSearch = (tramite: TramiteListItem, searchTerm: string) => {
  const term = normalizeValue(searchTerm);
  if (!term) return true;

  const haystack = [
    tramite.kardex,
    getDisplayActName(tramite),
    tramite.referencia,
    tramite.contrato,
    tramite.cliente_nombre,
    tramite.contacto,
    tramite.numescritura,
    ...(tramite.contratantes || []).map((contratante) => contratante.full_name),
    ...(tramite.contratantes || []).map((contratante) => contratante.document_number || ''),
  ]
    .map(normalizeValue)
    .join(' ');

  return haystack.includes(term);
};
