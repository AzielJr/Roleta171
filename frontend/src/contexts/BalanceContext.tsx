import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseBalance, Transaction } from '../hooks/useSupabaseBalance';
import { R171Saldo } from '../lib/supabase';

interface BalanceContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  currentSaldoRecord: R171Saldo | null;
  lastSaldoRecord: R171Saldo | null;
  addEntry: (amount: number, description: string) => Promise<void>;
  removeEntry: (amount: number, description: string) => Promise<void>;
  adjustBalance: (newBalance: number, description: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

interface BalanceProviderProps {
  children: ReactNode;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  const balanceData = useSupabaseBalance();

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