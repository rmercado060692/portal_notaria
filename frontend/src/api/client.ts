import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/portal-api';
const APP_BASE_PATH = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

const buildAppUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_BASE_PATH}${normalizedPath}` || normalizedPath;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar refresh de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresh, limpiar tokens y redirigir a login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = buildAppUrl('/login');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
