import React, { createContext, useContext, useState, ReactNode } from 'react';
import { R171Senha } from '../lib/api';

interface AuthContextType {
  user: R171Senha | null;
  login: (user: R171Senha) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<R171Senha | null>(null);

  const login = (userData: R171Senha) => {
    setUser(userData);
    // Salva no localStorage para persistir entre sessões
    localStorage.setItem('r171_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('r171_user');
  };

  // Verifica se há usuário salvo no localStorage ao inicializar
  React.useEffect(() => {
    const savedUser = localStorage.getItem('r171_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao recuperar usuário salvo:', error);
        localStorage.removeItem('r171_user');
      }
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};