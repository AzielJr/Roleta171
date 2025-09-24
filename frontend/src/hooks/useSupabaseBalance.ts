import { useState, useEffect } from 'react';
import { supabase, R171Saldo } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  timestamp: Date;
}

export const useSupabaseBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Iniciar com true para mostrar loading
  const [currentSaldoRecord, setCurrentSaldoRecord] = useState<R171Saldo | null>(null);
  const [lastSaldoRecord, setLastSaldoRecord] = useState<R171Saldo | null>(null);

  const loadBalance = async () => {
    if (!user) return;
    
    // Usar data local para evitar problemas de fuso horário
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    setLoading(true);
    try {
      // Primeiro, tentar buscar o registro do dia atual
      const { data: todayRecord, error: todayError } = await supabase
        .from('r171_saldo')
        .select('*')
        .eq('id_senha', user.id)
        .eq('data', today)
        .single();

      if (todayRecord && !todayError) {
        setCurrentSaldoRecord(todayRecord);
        return;
      }

      // Se não encontrou o registro de hoje, buscar o último registro disponível
      const { data: lastRecord, error: lastError } = await supabase
        .from('r171_saldo')
        .select('*')
        .eq('id_senha', user.id)
        .order('data', { ascending: false })
        .limit(1)
        .single();

      if (lastRecord && !lastError) {
        // Usar o último registro real diretamente
        setCurrentSaldoRecord(lastRecord);
        return;
      }

      // Se chegou até aqui, não há nenhum registro
      setCurrentSaldoRecord(null);

    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
      setCurrentSaldoRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Cria um novo registro para o dia atual
  const createTodayRecord = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const initialBalance = 0;

    try {
      // Busca o último saldo para usar como saldo_anterior (excluindo o dia atual)
      const { data: lastRecord } = await supabase
        .from('r171_saldo')
        .select('saldo_atual')
        .eq('id_senha', user.id)
        .neq('data', today)
        .order('data', { ascending: false })
        .limit(1)
        .single();

      const saldoAnterior = lastRecord?.saldo_atual || 0;

      const { data, error } = await supabase
        .from('r171_saldo')
        .insert({
          id_senha: user.id,
          data: today,
          saldo_inicial: initialBalance,
          saldo_atual: initialBalance,
          saldo_anterior: saldoAnterior,
          vlr_lucro: 0,
          per_lucro: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar registro do dia:', error);
        return;
      }

      setCurrentSaldoRecord(data);
      setBalance(initialBalance);
    } catch (error) {
      console.error('Erro ao criar registro do dia:', error);
      // Criar um registro temporário para não quebrar a interface
      setCurrentSaldoRecord({
        id: 'temp',
        id_senha: user.id,
        data: today,
        saldo_inicial: 0,
        saldo_atual: 0,
        saldo_anterior: 0,
        vlr_lucro: 0,
        per_lucro: 0,
        created_at: new Date().toISOString()
      });
      setBalance(0);
    }
  };

  // Atualiza o saldo no banco
  const updateBalance = async (newBalance: number) => {
    if (!currentSaldoRecord) return;

    try {
      const vlrLucro = newBalance - (currentSaldoRecord.saldo_inicial || 0);
      const perLucro = currentSaldoRecord.saldo_inicial 
        ? (vlrLucro / currentSaldoRecord.saldo_inicial) * 100 
        : 0;

      const { error } = await supabase
        .from('r171_saldo')
        .update({
          saldo_atual: newBalance,
          vlr_lucro: vlrLucro,
          per_lucro: perLucro
        })
        .eq('id', currentSaldoRecord.id);

      if (error) {
        console.error('Erro ao atualizar saldo:', error);
        return false;
      }

      setBalance(newBalance);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      return false;
    }
  };

  // Adiciona entrada
  const addEntry = async (amount: number, description: string = 'Entrada') => {
    const newBalance = balance + amount;
    const success = await updateBalance(newBalance);
    
    if (success) {
      // Adiciona à lista local de transações (para exibição imediata)
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'entrada',
        amount,
        description,
        timestamp: new Date()
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    return success;
  };

  // Remove saída
  const removeEntry = async (amount: number, description: string = 'Saída') => {
    const newBalance = balance - amount;
    const success = await updateBalance(newBalance);
    
    if (success) {
      // Adiciona à lista local de transações (para exibição imediata)
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'saida',
        amount,
        description,
        timestamp: new Date()
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    return success;
  };

  // Ajuste manual do saldo
  const adjustBalance = async (newBalance: number, description: string = 'Ajuste manual') => {
    const success = await updateBalance(newBalance);
    
    if (success) {
      const difference = newBalance - balance;
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: difference >= 0 ? 'entrada' : 'saida',
        amount: Math.abs(difference),
        description,
        timestamp: new Date()
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    return success;
  };

  useEffect(() => {
    if (user) {
      loadBalance();
      
      // Listener para atualizações em tempo real
      const subscription = supabase
        .channel('saldo_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'r171_saldo',
            filter: `id_senha=eq.${user.id}`
          }, 
          (payload) => {
            loadBalance();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setBalance(0);
      setCurrentSaldoRecord(null);
      setLastSaldoRecord(null);
      setLoading(false);
    }
  }, [user]);

  return {
    balance,
    transactions,
    loading,
    addEntry,
    removeEntry,
    adjustBalance,
    currentSaldoRecord,
    lastSaldoRecord,
    refreshBalance: loadBalance
  };
};