import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database - GLOBAL EXCHANGE
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
    email: 'agent.usa@globalexchange.com', 
    name: 'John Smith', 
    role: 'sender_agent',
    phone: '+1 555 123 4567',
    country: 'USA',
    agentCode: 'USA-001',
    isActive: true,
    createdAt: '2024-01-15'
  },
  { 
    id: '4', 
    email: 'agent.burkina@globalexchange.com', 
    name: 'Amadou Ouédraogo', 
    role: 'payer_agent',
    phone: '+226 70 12 34 56',
    country: 'Burkina Faso',
    agentCode: 'BF-001',
    isActive: true,
    createdAt: '2024-01-15'
  },
  { 
    id: '5', 
    email: 'agent.france@globalexchange.com', 
    name: 'Pierre Dupont', 
    role: 'sender_agent',
    phone: '+33 6 12 34 56 78',
    country: 'France',
    agentCode: 'FR-001',
    isActive: true,
    createdAt: '2024-02-01'
  },
  { 
    id: '6', 
    email: 'agent.cote@globalexchange.com', 
    name: 'Kouassi Yao', 
    role: 'payer_agent',
    phone: '+225 07 12 34 56',
    country: 'Côte d\'Ivoire',
    agentCode: 'CI-001',
    isActive: true,
    createdAt: '2024-02-01'
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Mock authentication - any password works for demo
    const foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
