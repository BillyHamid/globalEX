import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Mock users - fallback when backend is not available
const MOCK_USERS: User[] = [
  { 
    id: '1', 
    email: 'admin@globalexchange.com', 
    name: 'Admin Système', 
    role: 'admin',
    phone: '+1 555 000 0001',
    country: 'USA',
    isActive: true,
    createdAt: '2024-01-01'
  },
  { 
    id: '2', 
    email: 'superviseur@globalexchange.com', 
    name: 'Jean Superviseur', 
    role: 'supervisor',
    phone: '+1 555 000 0002',
    country: 'USA',
    isActive: true,
    createdAt: '2024-01-01'
  },
  { 
    id: '3', 
    email: 'razack@globalexchange.com', 
    name: 'Zongo Razack', 
    role: 'sender_agent',
    phone: '+1 555 123 4567',
    country: 'USA',
    agentCode: 'USA-001',
    isActive: true,
    createdAt: '2024-01-15'
  },
  { 
    id: '4', 
    email: 'bernadette@globalexchange.com', 
    name: 'Bernadette Tassembedo', 
    role: 'payer_agent',
    phone: '+226 70 00 00 01',
    country: 'Burkina Faso',
    agentCode: 'BF-001',
    isActive: true,
    createdAt: '2024-01-15'
  },
  { 
    id: '5', 
    email: 'abibata@globalexchange.com', 
    name: 'Abibata Zougrana', 
    role: 'payer_agent',
    phone: '+226 70 00 00 02',
    country: 'Burkina Faso',
    agentCode: 'BF-002',
    isActive: true,
    createdAt: '2024-01-15'
  },
  { 
    id: '6', 
    email: 'mohamadi@globalexchange.com', 
    name: 'Mohamadi Sana', 
    role: 'payer_agent',
    phone: '+226 70 00 00 03',
    country: 'Burkina Faso',
    agentCode: 'BF-003',
    isActive: true,
    createdAt: '2024-01-15'
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);

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
        // Update token state
        setToken(storedToken);
        setAuthToken(storedToken);
        
        // Try to restore session from backend
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (err) {
          // Token expired or invalid
          setAuthToken(null);
          setToken(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          
          // Fall back to stored user if backend failed after login
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } else if (storedUser) {
        // Fallback to localStorage user (mock mode)
        setUser(JSON.parse(storedUser));
        // Keep the token if it exists
        if (storedToken) {
          setToken(storedToken);
        }
      }

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
        // Fallback to mock login
        console.warn('Backend non disponible - mode demo activé');
        const foundUser = MOCK_USERS.find(u => u.email === email.toLowerCase());
        if (foundUser) {
          setUser(foundUser);
          setIsLoading(false);
          return true;
        }
        setError('Email ou mot de passe incorrect');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      setIsLoading(false);
      
      // Try mock login as fallback
      const foundUser = MOCK_USERS.find(u => u.email === email.toLowerCase());
      if (foundUser) {
        console.warn('Fallback to mock login');
        setUser(foundUser);
        setError(null);
        return true;
      }
      
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
        isAuthenticated: !!user, 
        isLoading,
        error,
        isBackendAvailable
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
