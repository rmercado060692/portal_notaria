export interface TramiteListItem {
  idkardex: number;
  kardex: string;
  fechaingreso: string;
  fechacalificado?: string;
  fechaconclusion?: string;
  fechaescritura?: string;
  numescritura?: string;
  referencia: string;
  contrato: string;
  contacto: string;
  cliente_nombre?: string | null;
  telecontacto?: string;
  mailcontacto?: string;
  estado?: string;
  ultimo_estado_registral?: string | null;
  estado_notarial?: EstadoNotarial | null;
  contratantes?: TramiteContratante[];
  estado_general: string;
  avance_porcentaje: number;
  etapa_actual: string;
}

export interface TramiteContratante {
  idcontratante?: string | null;
  full_name: string;
  document_number?: string | null;
  condition?: string | null;
}

export interface TramiteDocumentoDisponible {
  id: number;
  description: string;
  extension?: string | null;
  created_at?: string | null;
  movement_item?: number | null;
  title?: string | null;
  status?: string | null;
  movement_date?: string | null;
}

export interface HistorialRegistralItem {
  fecha: string;
  estado: string;
  idmovreg?: number;
  itemmov?: number;
}

export interface EstadoRegistral {
  titulo: string;
  tramite?: string;
  estado_actual: string;
  sede?: string;
  seccion?: string;
  fecha?: string;
  importe?: string;
  numeropartida?: string;
  registrador?: string;
  asiento?: string;
  fechainscripcion?: string;
  observaciones?: string;
  historial: HistorialRegistralItem[];
}

export interface EstadoNotarial {
  ingresado: boolean;
  calificado: boolean;
  calificado_observado: boolean;
  calificado_digitacion: boolean;
  generado_proyecto: boolean;
  confrontado: boolean;
  escriturado: boolean;
  firmas_proceso: boolean;
  firmas_concluidas: boolean;
  partes_terminados: boolean;
  presentado: boolean;
  inscrito: boolean;
}

export interface FirmasStatus {
  faltantes: number;
  total: number;
}

export interface TramiteDetail {
  idkardex: number;
  kardex: string;
  fechaingreso: string;
  referencia: string;
  contrato: string;
  contacto: string;
  cliente_nombre?: string | null;
  telecontacto?: string;
  mailcontacto?: string;
  fechacalificado?: string;
  fechainstrumento?: string;
  fechaconclusion?: string;
  numescritura?: string;
  fechaescritura?: string;
  numminuta?: string;
  estado?: string;
  responsable?: string;
  gestor?: string;
  estado_general: string;
  avance_porcentaje: number;
  etapa_actual: string;
  estado_notarial: EstadoNotarial;
  movimientos_rrpp: EstadoRegistral[];
  firmas_status: FirmasStatus;
  contratantes?: TramiteContratante[];
  documentos_disponibles?: TramiteDocumentoDisponible[];
}

export interface TramiteStatsSummary {
  total: number;
  en_proceso: number;
  completados: number;
  observados: number;
}

export interface TramitesResponse {
  resumen: {
    total: number;
    en_proceso: number;
    concluidos: number;
    observados: number;
    listos_entrega: number;
  };
  tramites: TramiteListItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  document_number?: string | null;
  role: 'CLIENT' | 'ADMIN' | 'SUPERADMIN';
  must_change_password: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login_at?: string | null;
  created_at?: string;
  client?: PortalClient | null;
}

export interface PortalUserDocument {
  id: number;
  document_type: string;
  document_number: string;
  relationship_type: string;
  created_at: string;
}

export interface PortalClient {
  id: number;
  document_type: string;
  document_number: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortalAdminUser extends User {
  documents?: PortalUserDocument[];
}

export interface PortalAdminClient extends PortalClient {
  users?: PortalAdminUser[];
}

export interface AdminCreateUserResponse {
  success: boolean;
  data: {
    user: PortalAdminUser;
    temporary_password: string;
  };
}

export interface AdminClientTramitesResponse {
  success: boolean;
  data: {
    client: PortalAdminClient;
    signo_client?: Record<string, unknown> | null;
    tramites: TramiteListItem[];
    total: number;
  };
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface UpdateProfileData {
  email?: string;
  phone?: string;
  address?: string;
}

export interface ForgotPasswordData {
  identifier: string;
}

export interface ResetPasswordConfirmData {
  uid: string;
  token: string;
  new_password: string;
  confirm_new_password: string;
}

export type TramiteListResponse = ApiResponse<TramitesResponse>;
