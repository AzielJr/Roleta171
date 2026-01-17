import React, { createContext, useContext, ReactNode } from 'react';
import { useMySQLBalance, Transaction } from '../hooks/useMySQLBalance';
import { R171Saldo } from '../lib/api';

interface BalanceContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  currentSaldoRecord: R171Saldo | null;
  lastSaldoRecord: R171Saldo | null;
  addEntry: (amount: number, description?: string) => Promise<boolean>;
  removeEntry: (amount: number, description?: string) => Promise<boolean>;
  adjustBalance: (newBalance: number, description?: string) => Promise<boolean>;
  updateSaldoRecord: (updates: { data?: string; saldo_inicial?: number; saldo_atual?: number; }) => Promise<boolean>;
  createSaldoRecord: (data: string, saldoInicial: number, saldoAtual: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

interface BalanceProviderProps {
  children: ReactNode;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  const balanceData = useMySQLBalance();

  return (
    <BalanceContext.Provider value={balanceData}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = (): BalanceContextType => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};