import api from './client';
import {
  User,
  TramiteDetail,
  Notification,
  TramitesResponse,
  ApiResponse,
  LoginResponse,
  LoginCredentials,
  ChangePasswordData,
  UpdateProfileData,
  ForgotPasswordData,
  ResetPasswordConfirmData,
  PortalAdminClient,
  AdminCreateUserResponse,
  AdminClientTramitesResponse,
} from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  logout: async (refresh: string): Promise<void> => {
    await api.post('/auth/logout/', { refresh });
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/me/');
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.post('/auth/change-password/', data);
  },

  updateProfile: async (data: UpdateProfileData): Promise<void> => {
    await api.patch('/auth/me/update-profile/', data);
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<void> => {
    await api.post('/auth/forgot-password/', data);
  },

  resetPasswordConfirm: async (data: ResetPasswordConfirmData): Promise<void> => {
    await api.post('/auth/reset-password/confirm/', data);
  },
};

export const tramiteAPI = {
  getTramites: async (): Promise<ApiResponse<TramitesResponse>> => {
    const response = await api.get('/me/tramites/');
    return response.data;
  },

  getTramiteDetail: async (kardex: string): Promise<ApiResponse<TramiteDetail>> => {
    const response = await api.get(`/me/tramites/${kardex}/`);
    return response.data;
  },

  downloadDocument: async (kardex: string, documentId: number): Promise<Blob> => {
    const response = await api.get(`/me/tramites/${kardex}/documents/${documentId}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const notificationsService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/auth/notifications/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data?.results)) {
      return response.data.results;
    }
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    return [];
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.patch(`/auth/notifications/${id}/read/`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/auth/notifications/read-all/');
  },
};

export const adminClientService = {
  listClients: async (): Promise<PortalAdminClient[]> => {
    const response = await api.get('/admin/clients/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data?.results)) {
      return response.data.results;
    }
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    return [];
  },

  createClient: async (payload: Partial<PortalAdminClient>): Promise<PortalAdminClient> => {
    const response = await api.post('/admin/clients/', payload);
    return response.data;
  },

  getClient: async (id: number): Promise<PortalAdminClient> => {
    const response = await api.get(`/admin/clients/${id}/`);
    return response.data;
  },

  updateClient: async (id: number, payload: Partial<PortalAdminClient>): Promise<PortalAdminClient> => {
    const response = await api.patch(`/admin/clients/${id}/`, payload);
    return response.data;
  },

  createUser: async (clientId: number, payload: { username?: string; email?: string; password?: string; relationship_type?: string }): Promise<AdminCreateUserResponse> => {
    const response = await api.post(`/admin/clients/${clientId}/create-user/`, payload);
    return response.data;
  },

  getClientTramites: async (clientId: number): Promise<AdminClientTramitesResponse> => {
    const response = await api.get(`/admin/clients/${clientId}/tramites-signo/`);
    return response.data;
  },

  resetPassword: async (userId: number, password?: string): Promise<AdminCreateUserResponse> => {
    const response = await api.post(`/admin/users/${userId}/reset-password/`, password ? { password } : {});
    return response.data;
  },

  disableUser: async (userId: number, is_active = false): Promise<{ success: boolean; data: unknown }> => {
    const response = await api.post(`/admin/users/${userId}/disable/`, { is_active });
    return response.data;
  },
};

export const tramitesService = tramiteAPI;
