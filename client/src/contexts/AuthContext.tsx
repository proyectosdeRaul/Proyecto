import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, verifyToken } from '../services/api.ts';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  permissions: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('Token encontrado, verificando...');
          const userData = await verifyToken();
          setUser(userData);
          console.log('Usuario verificado:', userData);
        } else {
          console.log('No hay token almacenado');
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('Iniciando login con:', { username });
      console.log('API URL:', process.env.REACT_APP_API_URL);
      
      const response = await loginUser(username, password);
      console.log('Respuesta del login:', response);
      
      const { token, user: userData } = response;
      
      localStorage.setItem('token', token);
      setUser(userData);
      console.log('Login exitoso');
    } catch (error: any) {
      console.error('Error en login:', error);
      
      // Mejorar manejo de errores
      if (error.response?.status === 401) {
        throw new Error('Credenciales incorrectas. Inténtalo de nuevo.');
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose.');
      } else if (error.response?.status === 404) {
        throw new Error('Servidor no encontrado. Verifica que el backend esté ejecutándose.');
      } else {
        throw new Error('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
