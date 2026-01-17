import { useState, useEffect } from 'react';

interface BalanceTransaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  timestamp: Date;
}

interface BalanceData {
  currentBalance: number;
  transactions: BalanceTransaction[];
}

const STORAGE_KEY = 'roleta171_balance';

export const useBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data: BalanceData = JSON.parse(savedData);
        setBalance(data.currentBalance || 0);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar saldo do localStorage:', error);
      // Em caso de erro, inicializar com valores padrão
      setBalance(0);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar dados no localStorage sempre que houver mudanças
  const saveToStorage = (newBalance: number, newTransactions: BalanceTransaction[]) => {
    try {
      const data: BalanceData = {
        currentBalance: newBalance,
        transactions: newTransactions
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar saldo no localStorage:', error);
    }
  };

  // Adicionar entrada (depósito)
  const addEntry = (amount: number, description: string = 'Depósito') => {
    const transaction: BalanceTransaction = {
      id: Date.now().toString(),
      type: 'entrada',
      amount,
      description,
      timestamp: new Date()
    };

    const newBalance = balance + amount;
    const newTransactions = [transaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    saveToStorage(newBalance, newTransactions);

    return newBalance;
  };

  // Adicionar saída (aposta/retirada)
  const addExit = (amount: number, description: string = 'Aposta') => {
    if (amount > balance) {
      throw new Error('Saldo insuficiente');
    }

    const transaction: BalanceTransaction = {
      id: Date.now().toString(),
      type: 'saida',
      amount,
      description,
      timestamp: new Date()
    };

    const newBalance = balance - amount;
    const newTransactions = [transaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    saveToStorage(newBalance, newTransactions);

    return newBalance;
  };

  // Definir saldo manualmente
  const setBalanceManually = (newBalance: number, description: string = 'Ajuste manual') => {
    const transaction: BalanceTransaction = {
      id: Date.now().toString(),
      type: newBalance > balance ? 'entrada' : 'saida',
      amount: Math.abs(newBalance - balance),
      description,
      timestamp: new Date()
    };

    const newTransactions = [transaction, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);
    saveToStorage(newBalance, newTransactions);

    return newBalance;
  };

  // Limpar histórico (manter saldo atual)
  const clearHistory = () => {
    setTransactions([]);
    saveToStorage(balance, []);
  };

  // Reset completo (zerar tudo)
  const resetBalance = () => {
    setBalance(0);
    setTransactions([]);
    saveToStorage(0, []);
  };

  return {
    balance,
    transactions,
    isLoading,
    addEntry,
    addExit,
    setBalanceManually,
    clearHistory,
    resetBalance
  };
};