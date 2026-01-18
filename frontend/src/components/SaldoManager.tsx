import React, { useState, useEffect } from 'react';
import { useBalance } from '../contexts/BalanceContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import HistoricoSaldos from './HistoricoSaldos';

interface SaldoManagerProps {
  className?: string;
}

export const SaldoManager: React.FC<SaldoManagerProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { currentSaldoRecord, loading, refreshBalance } = useBalance();
  const [saldoAtual, setSaldoAtual] = useState<string>('');
  const [saldoInicial, setSaldoInicial] = useState<string>('');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showAjustarLucro, setShowAjustarLucro] = useState(false);
  const [ajusteTipo, setAjusteTipo] = useState<'valor' | 'percentual'>('percentual');
  const [ajusteValor, setAjusteValor] = useState<string>('');
  const [ajusteSaving, setAjusteSaving] = useState(false);

  // Atualiza os campos quando o registro atual muda
  useEffect(() => {
    if (currentSaldoRecord) {
      // Verificar se é um registro real - qualquer valor diferente de zero ou ID não temporário
      const hasRealData = currentSaldoRecord.saldo_inicial !== 0 ||
          currentSaldoRecord.saldo_atual !== 0 ||
          currentSaldoRecord.vlr_lucro !== 0 ||
          (currentSaldoRecord.id && currentSaldoRecord.id !== -1);
      
      console.log('currentSaldoRecord:', currentSaldoRecord);
        console.log('hasRealData:', hasRealData);
        console.log('Data do registro:', currentSaldoRecord.data);
      
      if (hasRealData) {
        // Formatar com 2 casas decimais - garantir que sejam números
        const saldoAtualNum = Number(currentSaldoRecord.saldo_atual) || 0;
        const saldoInicialNum = Number(currentSaldoRecord.saldo_inicial) || 0;
        
        const saldoAtualFormatted = saldoAtualNum.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }).replace('.', '').replace(',', '.');
        const saldoInicialFormatted = saldoInicialNum.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }).replace('.', '').replace(',', '.');
        
        setSaldoAtual(saldoAtualFormatted);
        setSaldoInicial(saldoInicialFormatted);
        setData(currentSaldoRecord.data || new Date().toISOString().split('T')[0]);
        setShowCreateForm(false);
        setIsEditing(false); // Garantir que não está em modo edição
      } else {
        // Se é um registro vazio/temporário, mostrar formulário de criação
        setShowCreateForm(true);
        fetchLastBalance();
      }
    } else {
      // Se não há registro, mostrar formulário de criação automaticamente
      setShowCreateForm(true);
      // Buscar último saldo para usar como saldo inicial
      fetchLastBalance();
    }
  }, [currentSaldoRecord]);

  // Função para buscar o último saldo atual para usar como saldo inicial
  const fetchLastBalance = async (setSaldoAtualToo = false) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('r171_saldo')
        .select('saldo_atual')
        .eq('id_senha', user.id)
        .order('data', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        const saldoAtualNum = Number(data.saldo_atual) || 0;
        const saldoFormatted = saldoAtualNum.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }).replace('.', '').replace(',', '.');
        setSaldoInicial(saldoFormatted);
        
        // Se solicitado, também definir o saldo atual com o mesmo valor
        if (setSaldoAtualToo) {
          setSaldoAtual(saldoFormatted);
        }
      }
    } catch (error) {
      console.log('Nenhum saldo anterior encontrado, usando 0 como padrão');
      setSaldoInicial('0.00');
      if (setSaldoAtualToo) {
        setSaldoAtual('0.00');
      }
    }
  };

  // Calcula o lucro em tempo real
  const calcularLucro = (saldoAtualValue: number, saldoInicialValue: number) => {
    const vlrLucro = saldoAtualValue - saldoInicialValue;
    const perLucro = saldoInicialValue !== 0 ? (vlrLucro / saldoInicialValue) * 100 : 0;
    return { vlrLucro, perLucro };
  };

  const handleSave = async () => {
    if (!currentSaldoRecord && !showCreateForm) return;

    const saldoAtualNum = parseFloat(saldoAtual) || 0;
    const saldoInicialNum = parseFloat(saldoInicial) || 0;
    const { vlrLucro, perLucro } = calcularLucro(saldoAtualNum, saldoInicialNum);

    console.log('=== INÍCIO DO PROCESSO DE SALVAMENTO ===');
    console.log('Data selecionada:', data);
    console.log('Saldo Inicial:', saldoInicialNum);
    console.log('Saldo Atual:', saldoAtualNum);
    console.log('Valor Lucro:', vlrLucro);
    console.log('Percentual Lucro:', perLucro);
    console.log('ID do usuário:', user?.id);
    console.log('Registro atual existe?', !!currentSaldoRecord);
    console.log('Modo criação?', showCreateForm);

    setIsSaving(true);
    try {
      // Verificar se é um registro real (não temporário) e se não estamos no modo de criação
      const isRealRecord = currentSaldoRecord && currentSaldoRecord.id !== -1 && !showCreateForm;
      
      if (isRealRecord) {
        // Atualizar registro existente
        console.log('=== ATUALIZANDO REGISTRO EXISTENTE ===');
        console.log('ID do registro:', currentSaldoRecord.id);
        
        const { data: updateResult, error } = await supabase
          .from('r171_saldo')
          .update({
            data: data,
            saldo_inicial: saldoInicialNum,
            saldo_atual: saldoAtualNum,
            vlr_lucro: vlrLucro,
            per_lucro: perLucro
          })
          .eq('id', currentSaldoRecord.id)
          .select(); // Adicionar select para ver o resultado

        console.log('Resultado da atualização:', updateResult);
        
        if (error) {
          console.error('Erro ao atualizar saldo:', error);
          console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
          alert('Erro ao salvar os dados. Verifique o console para mais detalhes.');
          return;
        }
        
        console.log('Atualização realizada com sucesso!');
      } else {
        // Criar novo registro
        console.log('=== CRIANDO NOVO REGISTRO ===');
        console.log('Motivo da criação:', {
          'Não há registro atual': !currentSaldoRecord,
          'Registro é temporário': currentSaldoRecord?.id === -1,
          'Modo criação ativo': showCreateForm
        });
        
        const newRecord = {
          id_senha: user?.id,
          data: data,
          saldo_inicial: saldoInicialNum,
          saldo_atual: saldoAtualNum,
          vlr_lucro: vlrLucro,
          per_lucro: perLucro
        };
        
        console.log('Dados para inserção:', newRecord);
        
        const { data: insertResult, error } = await supabase
          .from('r171_saldo')
          .insert(newRecord)
          .select(); // Adicionar select para ver o resultado

        console.log('Resultado da inserção:', insertResult);

        if (error) {
          console.error('Erro ao criar saldo:', error);
          console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
          console.error('Código do erro:', error.code);
          console.error('Mensagem do erro:', error.message);
          alert('Erro ao criar registro. Verifique o console para mais detalhes.');
          return;
        }
        
        console.log('Inserção realizada com sucesso!');
      }

      console.log('=== ATUALIZANDO DADOS LOCAIS ===');
      // Atualiza os dados locais
      await refreshBalance();
      
      // Se foi um novo cadastro, ir para modo edição
      if (!isRealRecord) {
        setShowCreateForm(false);
        setIsEditing(true);
      } else {
        setIsEditing(false);
        setShowCreateForm(false);
      }
      
      alert('Saldo salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro inesperado ao salvar os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentSaldoRecord) {
      // Formatar com 2 casas decimais - garantir que sejam números
      const saldoAtualNum = Number(currentSaldoRecord.saldo_atual) || 0;
      const saldoInicialNum = Number(currentSaldoRecord.saldo_inicial) || 0;
      
      const saldoAtualFormatted = saldoAtualNum.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).replace('.', '').replace(',', '.');
      const saldoInicialFormatted = saldoInicialNum.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).replace('.', '').replace(',', '.');
      
      setSaldoAtual(saldoAtualFormatted);
      setSaldoInicial(saldoInicialFormatted);
    } else {
      // Se não há registro, limpar campos
      setSaldoAtual('0.00');
      setSaldoInicial('0.00');
    }
    
    // Sempre fechar os formulários e voltar para a tela de visualização
    setIsEditing(false);
    setShowCreateForm(false);
  };

  // Valores atuais para cálculo em tempo real
  const saldoAtualNum = parseFloat(saldoAtual) || 0;
  const saldoInicialNum = parseFloat(saldoInicial) || 0;
  
  // Se estiver no modo de criação e os campos ainda não foram preenchidos, mostrar valores zerados
  const shouldShowZeroValues = showCreateForm && saldoAtualNum === 0 && saldoInicialNum === 0;
  const { vlrLucro, perLucro } = shouldShowZeroValues ? { vlrLucro: 0, perLucro: 0 } : calcularLucro(saldoAtualNum, saldoInicialNum);

  const aplicarAjusteLucro = async () => {
    if (!currentSaldoRecord) return;
    const valor = parseFloat(ajusteValor.replace(',', '.')) || 0;
    const novoSaldoAtual = ajusteTipo === 'valor'
      ? (saldoInicialNum) + valor
      : (saldoInicialNum) * (1 + (valor / 100));
    const { vlrLucro: novoVlrLucro, perLucro: novoPerLucro } = calcularLucro(novoSaldoAtual, saldoInicialNum);
    setAjusteSaving(true);
    try {
      const { error } = await supabase
        .from('r171_saldo')
        .update({
          saldo_atual: novoSaldoAtual,
          vlr_lucro: novoVlrLucro,
          per_lucro: novoPerLucro
        })
        .eq('id', currentSaldoRecord.id);
      if (error) {
        alert('Erro ao ajustar lucro. Verifique os dados e tente novamente.');
        return;
      }
      await refreshBalance();
      setSaldoAtual(novoSaldoAtual.toFixed(2));
      setShowAjustarLucro(false);
      setAjusteValor('');
    } catch (e) {
      alert('Erro inesperado ao ajustar lucro.');
    } finally {
      setAjusteSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-600">Carregando dados do saldo...</div>
      </div>
    );
  }

  if (!currentSaldoRecord && !showCreateForm) {
    return (
      <div className={`bg-gray-100 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-600">
          <div className="text-4xl mb-2">💰</div>
          <p>Nenhum registro de saldo encontrado para hoje.</p>
          <p className="text-sm mt-2">Faça login para criar um registro automático.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ➕ Criar Registro de Saldo
          </button>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">💰 Criar Registro de Saldo</h3>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Campos de Entrada */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          {/* Data */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Data de Cadastro
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-3 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-lg font-semibold transition-colors"
            />
          </div>

          {/* Saldo Inicial */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Saldo Inicial (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={saldoInicial}
              onChange={(e) => {
                let value = e.target.value.replace(',', '.');
                // Remove caracteres não numéricos exceto ponto
                value = value.replace(/[^0-9.]/g, '');
                // Garante apenas um ponto decimal
                const parts = value.split('.');
                if (parts.length > 2) {
                  value = parts[0] + '.' + parts.slice(1).join('');
                }
                setSaldoInicial(value);
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setSaldoInicial(value.toFixed(2));
              }}
              className="w-full px-4 py-3 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-lg font-semibold transition-colors text-right"
              placeholder="0,00"
            />
          </div>

          {/* Saldo Atual */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Saldo Atual (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={saldoAtual}
              onChange={(e) => {
                let value = e.target.value.replace(',', '.');
                // Remove caracteres não numéricos exceto ponto
                value = value.replace(/[^0-9.]/g, '');
                // Garante apenas um ponto decimal
                const parts = value.split('.');
                if (parts.length > 2) {
                  value = parts[0] + '.' + parts.slice(1).join('');
                }
                setSaldoAtual(value);
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setSaldoAtual(value.toFixed(2));
              }}
              className="w-full px-4 py-3 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-lg font-semibold transition-colors text-right"
              placeholder="0,00"
            />
          </div>

          {/* Valor do Lucro */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Valor do Lucro (R$)
            </label>
            <div className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold bg-gray-50 text-right ${
              vlrLucro >= 0 ? 'text-green-600' : 'text-amber-900'
            }`}>
              {vlrLucro >= 0 ? '+' : ''}R$ {vlrLucro.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
          </div>

          {/* Percentual do Lucro */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Percentual do Lucro (%)
            </label>
            <div className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold bg-gray-50 text-right ${
              perLucro >= 0 ? 'text-green-600' : 'text-amber-900'
            }`}>
              {perLucro >= 0 ? '+' : ''}{perLucro.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}%
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3 mb-6">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
          >
            ❌ Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? '⏳ Salvando...' : '💾 Criar Registro'}
          </button>
        </div>



      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">💰 Saldo Atual</h3>
      </div>

      {!isEditing ? (
        /* Modo Visualização */
        <div className="space-y-6">
          {/* Todos os campos em uma linha */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Data */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-base font-medium text-gray-700 mb-1">
                Data
              </label>
              <div className="text-4xl font-bold text-gray-800">
                {currentSaldoRecord?.data ? (() => {
                  // CORREÇÃO: Usar formatação direta sem new Date() para evitar problemas de fuso horário
                  const [ano, mes, dia] = currentSaldoRecord.data.split('-');
                  return `${dia}/${mes}/${ano}`;
                })() : new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Saldo Inicial */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-base font-medium text-blue-700 mb-1">
                Saldo Inicial
              </label>
              <div className="text-4xl font-bold text-blue-800">
                R$ {(Number(currentSaldoRecord.saldo_inicial) || 0).toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <label className="block text-base font-medium text-green-700 mb-1">
                Saldo Atual
              </label>
              <div className={`text-4xl font-bold ${(Number(currentSaldoRecord.saldo_atual) || 0) >= 0 ? 'text-green-800' : 'text-amber-900'}`}>
                R$ {(Number(currentSaldoRecord.saldo_atual) || 0).toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            </div>

            {/* Valor do Lucro */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="block text-base font-medium text-yellow-700 mb-1">
                Valor do Lucro
              </label>
              <div className={`text-4xl font-bold text-right ${(() => {
                const vlrLucroDisplay = currentSaldoRecord.vlr_lucro !== null && currentSaldoRecord.vlr_lucro !== undefined 
                  ? currentSaldoRecord.vlr_lucro 
                  : (currentSaldoRecord.saldo_atual || 0) - (currentSaldoRecord.saldo_inicial || 0);
                return vlrLucroDisplay >= 0 ? 'text-green-600' : 'text-amber-900';
              })()}`}>
                {(() => {
                  const vlrLucroDisplay = currentSaldoRecord.vlr_lucro !== null && currentSaldoRecord.vlr_lucro !== undefined 
                    ? currentSaldoRecord.vlr_lucro 
                    : (currentSaldoRecord.saldo_atual || 0) - (currentSaldoRecord.saldo_inicial || 0);
                  return `${vlrLucroDisplay >= 0 ? '+' : ''}R$ ${Math.abs(vlrLucroDisplay).toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}`;
                })()}
              </div>
            </div>

            {/* Percentual do Lucro */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <label className="block text-base font-medium text-purple-700 mb-1">
                Percentual do Lucro
              </label>
              <div className={`text-4xl font-bold text-right ${(() => {
                const perLucroDisplay = currentSaldoRecord.per_lucro !== null && currentSaldoRecord.per_lucro !== undefined 
                  ? currentSaldoRecord.per_lucro 
                  : (currentSaldoRecord.saldo_inicial || 0) !== 0 
                    ? (((currentSaldoRecord.saldo_atual || 0) - (currentSaldoRecord.saldo_inicial || 0)) / (currentSaldoRecord.saldo_inicial || 0)) * 100 
                    : 0;
                return perLucroDisplay >= 0 ? 'text-green-600' : 'text-amber-900';
              })()}`}>
                {(() => {
                  const perLucroDisplay = currentSaldoRecord.per_lucro !== null && currentSaldoRecord.per_lucro !== undefined 
                    ? currentSaldoRecord.per_lucro 
                    : (currentSaldoRecord.saldo_inicial || 0) !== 0 
                      ? (((currentSaldoRecord.saldo_atual || 0) - (currentSaldoRecord.saldo_inicial || 0)) / (currentSaldoRecord.saldo_inicial || 0)) * 100 
                      : 0;
                  return `${perLucroDisplay >= 0 ? '+' : ''}${perLucroDisplay.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}%`;
                })()}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between space-x-3">
            <div className="flex space-x-3">
              <button
                onClick={() => setShowHistorico(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                📊 Histórico de Saldos
              </button>
              <button
                onClick={async () => {
                  // Inicializar campos para novo cadastro
                  setData(new Date().toISOString().split('T')[0]); // Data de hoje
                  await fetchLastBalance(true); // Buscar último saldo e definir tanto inicial quanto atual
                  setShowCreateForm(true);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ➕ Cadastrar Saldo
              </button>
              <button
                onClick={() => setShowAjustarLucro(true)}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                ⚙️ Ajustar Lucro
              </button>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ✏️ Editar Saldo
            </button>
          </div>
        </div>
      ) : (
        /* Modo Edição */
        <div>
          {/* Campos de Entrada */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            {/* Data */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Data de Cadastro
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg text-lg font-semibold text-right ${
                  isEditing 
                    ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                    : 'border-gray-300 bg-gray-50'
                } transition-colors`}
              />
            </div>

            {/* Saldo Inicial */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Saldo Inicial (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={saldoInicial}
                onChange={(e) => {
                  const value = e.target.value.replace(',', '.');
                  setSaldoInicial(value);
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg text-lg font-semibold text-right ${
                  isEditing 
                    ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                    : 'border-gray-300 bg-gray-50'
                } transition-colors`}
                placeholder="0,00"
              />
            </div>

            {/* Saldo Atual */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Saldo Atual (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={saldoAtual}
                onChange={(e) => {
                  const value = e.target.value.replace(',', '.');
                  setSaldoAtual(value);
                }}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg text-lg font-semibold text-right ${
                  isEditing 
                    ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                    : 'border-gray-300 bg-gray-50'
                } transition-colors`}
                placeholder="0,00"
              />
            </div>

            {/* Valor do Lucro */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Valor do Lucro (R$)
              </label>
              <div className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold bg-gray-50 text-right ${
                vlrLucro >= 0 ? 'text-green-600' : 'text-amber-900'
              }`}>
                {vlrLucro >= 0 ? '+' : ''}R$ {vlrLucro.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            </div>

            {/* Percentual do Lucro */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Percentual do Lucro (%)
              </label>
              <div className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold bg-gray-50 text-right ${
                perLucro >= 0 ? 'text-green-600' : 'text-amber-900'
              }`}>
                {perLucro >= 0 ? '+' : ''}{perLucro.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}%
              </div>
            </div>
          </div>



        {/* Botões de Ação no Modo Edição */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
          >
            ❌ Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? '⏳ Salvando...' : '💾 Salvar'}
          </button>
        </div>
        </div>
      )}

      {/* Modal de Histórico */}
      {showHistorico && (
        <HistoricoSaldos onClose={() => setShowHistorico(false)} />
      )}

      {showAjustarLucro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowAjustarLucro(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">⚙️ Ajustar Lucro</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAjustarLucro(false)}>×</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-700">Saldo Inicial</div>
                  <div className="text-xl font-bold text-blue-800">R$ {saldoInicialNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-right">
                  <div className="text-xs text-yellow-700">Lucro Atual</div>
                  <div className={`text-xl font-bold ${vlrLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`}>{vlrLucro >= 0 ? '+' : ''}R$ {Math.abs(vlrLucro).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAjusteTipo('valor')}
                  className={`flex-1 px-3 py-2 rounded border ${ajusteTipo === 'valor' ? 'bg-yellow-600 text-white border-yellow-700' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                >
                  Por valor (R$)
                </button>
                <button
                  onClick={() => setAjusteTipo('percentual')}
                  className={`flex-1 px-3 py-2 rounded border ${ajusteTipo === 'percentual' ? 'bg-yellow-600 text-white border-yellow-700' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                >
                  Por percentual (%)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{ajusteTipo === 'valor' ? 'Valor do Lucro (R$)' : 'Percentual do Lucro (%)'}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={ajusteValor}
                  onChange={(e) => {
                    let value = e.target.value.replace(',', '.');
                    value = value.replace(/[^0-9.\-]/g, '');
                    const parts = value.split('.');
                    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                    setAjusteValor(value);
                  }}
                  onBlur={(e) => {
                    const v = parseFloat(e.target.value.replace(',', '.')) || 0;
                    setAjusteValor(v.toFixed(2));
                  }}
                  className="w-full px-4 py-3 border border-yellow-300 rounded-lg text-lg font-semibold text-right focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  placeholder={ajusteTipo === 'valor' ? '0,00' : '0,00'}
                />
              </div>

              {(() => {
                const valor = parseFloat(ajusteValor.replace(',', '.')) || 0;
                const novoSaldo = ajusteTipo === 'valor' ? (saldoInicialNum) + valor : (saldoInicialNum) * (1 + (valor / 100));
                const { vlrLucro: nv, perLucro: np } = calcularLucro(novoSaldo, saldoInicialNum);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-xs text-green-700">Novo Saldo</div>
                      <div className={`text-xl font-bold ${novoSaldo >= 0 ? 'text-green-800' : 'text-amber-900'}`}>R$ {novoSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-right">
                      <div className="text-xs text-yellow-700">Novo Lucro</div>
                      <div className={`text-xl font-bold ${nv >= 0 ? 'text-green-600' : 'text-amber-900'}`}>{nv >= 0 ? '+' : ''}R$ {Math.abs(nv).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-right">
                      <div className="text-xs text-purple-700">Novo Percentual</div>
                      <div className={`text-xl font-bold ${np >= 0 ? 'text-green-600' : 'text-amber-900'}`}>{np >= 0 ? '+' : ''}{np.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowAjustarLucro(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancelar</button>
              <button
                onClick={aplicarAjusteLucro}
                disabled={ajusteSaving || !ajusteValor}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {ajusteSaving ? '⏳ Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaldoManager;
