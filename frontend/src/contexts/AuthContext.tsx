import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../api/services';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = !!user && (user.is_superuser || user.is_staff || user.role === 'ADMIN' || user.role === 'SUPERADMIN');

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authService.getMe();
          console.log('Datos del usuario autenticado:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          await logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authService.login({ username, password });
    
    console.log('Respuesta del login:', response);
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    setUser(response.user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error('Error closing session on server:', error);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();
    setUser(null);
  };

  const refreshUser = async () => {
    if (user) {
      const userData = await authService.getMe();
      console.log('Datos del usuario actualizados:', userData);
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
