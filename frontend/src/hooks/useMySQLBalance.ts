import { useState, useEffect, useRef } from 'react';
import { saldoAPI, R171Saldo } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  timestamp: Date;
}

export const useMySQLBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSaldoRecord, setCurrentSaldoRecord] = useState<R171Saldo | null>(null);
  const [lastSaldoRecord, setLastSaldoRecord] = useState<R171Saldo | null>(null);
  const updatingRef = useRef<boolean>(false);

  const withRetry = async <T,>(fn: () => Promise<T>, maxAttempts = 3, baseDelayMs = 150): Promise<T> => {
    let attempt = 0;
    let lastError: any;
    while (attempt < maxAttempts) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const wait = baseDelayMs * Math.pow(2, attempt);
        await new Promise(res => setTimeout(res, wait));
        attempt++;
      }
    }
    throw lastError;
  };

  const loadBalance = async () => {
    if (!user) return;
    
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    setLoading(true);
    try {
      // Buscar último saldo do usuário
      const { saldo: lastSaldo } = await saldoAPI.getLast(user.id);
      
      if (lastSaldo) {
        setLastSaldoRecord(lastSaldo);
        
        // Se o último saldo é de hoje, usar ele
        if (lastSaldo.data === today) {
          setCurrentSaldoRecord(lastSaldo);
          setBalance(lastSaldo.saldo_atual || 0);
        } else {
          // Criar novo registro para hoje baseado no saldo anterior
          const newSaldo = await saldoAPI.create({
            id_senha: user.id,
            data: today,
            saldo_inicial: lastSaldo.saldo_atual || 0,
            saldo_atual: lastSaldo.saldo_atual || 0,
            vlr_lucro: 0,
            per_lucro: 0
          });
          
          setCurrentSaldoRecord(newSaldo.saldo);
          setBalance(newSaldo.saldo.saldo_atual || 0);
        }
      } else {
        // Primeiro acesso - criar registro inicial
        const newSaldo = await saldoAPI.create({
          id_senha: user.id,
          data: today,
          saldo_inicial: 0,
          saldo_atual: 0,
          vlr_lucro: 0,
          per_lucro: 0
        });
        
        setCurrentSaldoRecord(newSaldo.saldo);
        setLastSaldoRecord(newSaldo.saldo);
        setBalance(0);
      }
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [user]);

  const updateBalance = async (newBalance: number, description?: string): Promise<boolean> => {
    if (!user || !currentSaldoRecord) return false;
    
    while (updatingRef.current) {
      await new Promise(res => setTimeout(res, 100));
    }
    updatingRef.current = true;

    try {
      const saldoInicial = currentSaldoRecord.saldo_inicial || 0;
      const vlrLucro = newBalance - saldoInicial;
      const perLucro = saldoInicial !== 0 ? (vlrLucro / saldoInicial) * 100 : 0;

      const updated = await saldoAPI.update(currentSaldoRecord.id, {
        saldo_atual: newBalance,
        vlr_lucro: vlrLucro,
        per_lucro: perLucro
      });

      setCurrentSaldoRecord(updated.saldo);
      setBalance(newBalance);

      if (description) {
        const transaction: Transaction = {
          id: Date.now().toString(),
          type: newBalance > balance ? 'entrada' : 'saida',
          amount: Math.abs(newBalance - balance),
          description,
          timestamp: new Date()
        };
        setTransactions(prev => [transaction, ...prev]);
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      return false;
    } finally {
      updatingRef.current = false;
    }
  };

  const addEntry = async (amount: number, description: string = 'Entrada'): Promise<boolean> => {
    const newBalance = balance + amount;
    return updateBalance(newBalance, description);
  };

  const removeEntry = async (amount: number, description: string = 'Saída'): Promise<boolean> => {
    const newBalance = balance - amount;
    return updateBalance(newBalance, description);
  };

  const adjustBalance = async (newBalance: number, description: string = 'Ajuste de saldo'): Promise<boolean> => {
    return updateBalance(newBalance, description);
  };

  const updateSaldoRecord = async (updates: { data?: string; saldo_inicial?: number; saldo_atual?: number; }): Promise<boolean> => {
    if (!currentSaldoRecord) return false;
    
    try {
      const updated = await saldoAPI.update(currentSaldoRecord.id, updates);
      setCurrentSaldoRecord(updated.saldo);
      if (updates.saldo_atual !== undefined) {
        setBalance(updates.saldo_atual);
      }
      return true;
    } catch (error) {
      console.error('Erro ao atualizar registro de saldo:', error);
      return false;
    }
  };

  const createSaldoRecord = async (data: string, saldoInicial: number, saldoAtual: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const newSaldo = await saldoAPI.create({
        id_senha: user.id,
        data,
        saldo_inicial: saldoInicial,
        saldo_atual: saldoAtual,
        vlr_lucro: saldoAtual - saldoInicial,
        per_lucro: saldoInicial !== 0 ? ((saldoAtual - saldoInicial) / saldoInicial) * 100 : 0
      });
      
      setCurrentSaldoRecord(newSaldo.saldo);
      setBalance(saldoAtual);
      return true;
    } catch (error) {
      console.error('Erro ao criar registro de saldo:', error);
      return false;
    }
  };

  const refreshBalance = async (): Promise<void> => {
    await loadBalance();
  };

  return {
    balance,
    transactions,
    loading,
    currentSaldoRecord,
    lastSaldoRecord,
    addEntry,
    removeEntry,
    adjustBalance,
    loadBalance,
    updateSaldoRecord,
    createSaldoRecord,
    refreshBalance
  };
};
