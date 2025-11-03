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
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
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
        .maybeSingle();

      if (todayRecord && !todayError) {
        setCurrentSaldoRecord(todayRecord);
        setBalance(todayRecord.saldo_atual || 0);
        return;
      }

      // Se não encontrou o registro de hoje, buscar o último registro disponível
      const { data: lastRecord, error: lastError } = await supabase
        .from('r171_saldo')
        .select('*')
        .eq('id_senha', user.id)
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastRecord && !lastError) {
        // Usar o último registro real diretamente
        setCurrentSaldoRecord(lastRecord);
        setBalance(lastRecord.saldo_atual || 0);
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

  // Cria um novo registro de saldo
  const createSaldoRecord = async (data: string, saldoInicial: number, saldoAtual: number) => {
    if (!user) return false;

    try {
      // Busca o último saldo para usar como saldo_anterior (excluindo a data atual)
      const { data: lastRecord } = await supabase
        .from('r171_saldo')
        .select('saldo_atual')
        .eq('id_senha', user.id)
        .neq('data', data)
        .order('data', { ascending: false })
        .limit(1);

      const saldoAnterior = lastRecord && lastRecord.length > 0 ? lastRecord[0].saldo_atual : 0;
      const vlrLucro = saldoAtual - saldoInicial;
      const perLucro = saldoInicial > 0 ? (vlrLucro / saldoInicial) * 100 : 0;

      const { data: newRecord, error } = await supabase
        .from('r171_saldo')
        .insert({
          id_senha: user.id,
          data: data,
          saldo_inicial: saldoInicial,
          saldo_atual: saldoAtual,
          vlr_lucro: vlrLucro,
          per_lucro: perLucro
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar registro de saldo:', error);
        return false;
      }

      // Atualizar o estado local se for o registro de hoje
      const today = new Date().toISOString().split('T')[0];
      if (data === today) {
        setCurrentSaldoRecord(newRecord);
        setBalance(saldoAtual);
      }

      return true;
    } catch (error) {
      console.error('Erro ao criar registro de saldo:', error);
      return false;
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
        .limit(1);

      const saldoAnterior = lastRecord && lastRecord.length > 0 ? lastRecord[0].saldo_atual : 0;

      const { data, error } = await supabase
        .from('r171_saldo')
        .insert({
          id_senha: user.id,
          data: today,
          saldo_inicial: initialBalance,
          saldo_atual: initialBalance,
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
        id: -1,
        id_senha: user.id,
        data: today,
        saldo_inicial: 0,
        saldo_atual: 0,
        vlr_lucro: 0,
        per_lucro: 0,
        created_at: new Date().toISOString()
      });
      setBalance(0);
    }
  };

  // Atualiza o saldo no banco
  const updateBalance = async (newBalance: number) => {
    if (!currentSaldoRecord) return false;

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

      // Atualizar o estado local com os novos valores
      setCurrentSaldoRecord({
        ...currentSaldoRecord,
        saldo_atual: newBalance,
        vlr_lucro: vlrLucro,
        per_lucro: perLucro
      });
      
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

  // Atualiza todos os campos do registro de saldo
  const updateSaldoRecord = async (updates: {
    data?: string;
    saldo_inicial?: number;
    saldo_atual?: number;
  }) => {
    if (!currentSaldoRecord) return false;

    try {
      const saldoInicial = updates.saldo_inicial ?? currentSaldoRecord.saldo_inicial;
      const saldoAtual = updates.saldo_atual ?? currentSaldoRecord.saldo_atual;
      const vlrLucro = saldoAtual - saldoInicial;
      const perLucro = saldoInicial > 0 ? (vlrLucro / saldoInicial) * 100 : 0;

      const updateData: any = {
        saldo_atual: saldoAtual,
        vlr_lucro: vlrLucro,
        per_lucro: perLucro
      };

      if (updates.saldo_inicial !== undefined) {
        updateData.saldo_inicial = updates.saldo_inicial;
      }

      if (updates.data) {
        updateData.data = updates.data;
      }

      const { error } = await supabase
        .from('r171_saldo')
        .update(updateData)
        .eq('id', currentSaldoRecord.id);

      if (error) {
        console.error('Erro ao atualizar registro de saldo:', error);
        return false;
      }

      // Atualizar o estado local
      setCurrentSaldoRecord(prev => prev ? {
        ...prev,
        ...updateData
      } : null);
      
      setBalance(saldoAtual);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar registro de saldo:', error);
      return false;
    }
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
    updateSaldoRecord,
    createSaldoRecord,
    currentSaldoRecord,
    lastSaldoRecord,
    refreshBalance: loadBalance
  };
};