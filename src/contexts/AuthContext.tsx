import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { authAPI, setAuthToken, getAuthToken, checkAPIHealth } from '@/services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isBackendAvailable: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) return;
    const currentUser = await authAPI.getMe();
    setUser(currentUser);
  }, []);

  // Actualiser le menu quand un utilisateur revient après un changement de rôle.
  useEffect(() => {
    if (!token) return;
    const refresh = () => { void refreshUser().catch(() => undefined); };
    window.addEventListener('focus', refresh);
    const interval = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(interval); };
  }, [token, refreshUser]);

  // Check backend availability and restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Check if backend is available
      const backendUp = await checkAPIHealth();
      setIsBackendAvailable(backendUp);

      const storedToken = getAuthToken() || localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && backendUp) {
        setToken(storedToken);
        setAuthToken(storedToken);
        
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (err) {
          setAuthToken(null);
          setToken(null);
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else if (storedUser && storedToken && !backendUp) {
        // Backend indisponible : restaurer depuis localStorage (mode dégradé, token non validé)
        setAuthToken(storedToken);
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      // Pas de token valide → user reste null, l'utilisateur sera redirigé vers /login

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      // Check backend availability
      const backendUp = await checkAPIHealth();
      setIsBackendAvailable(backendUp);

      if (backendUp) {
        // Real API login
        const { token: authToken, user: userData } = await authAPI.login(email, password);
        
        // Debug: Log login info
        console.log('Login successful - User:', userData.name, 'ID:', userData.id, 'Token set:', !!authToken);
        
        setAuthToken(authToken);
        setToken(authToken);
        setUser(userData);
        setIsLoading(false);
        return true;
      } else {
        setError('Serveur indisponible. Réessayez lorsque la connexion sera rétablie.');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      setIsLoading(false);
      
      return false;
    }
  };

  const logout = async () => {
    try {
      if (isBackendAvailable) {
        await authAPI.logout();
      }
    } catch (err) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setToken(null);
      setAuthToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        token,
        login, 
        logout, 
        isAuthenticated: !!user && !!token,
        isLoading,
        error,
        isBackendAvailable,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
