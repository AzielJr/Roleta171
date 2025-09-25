import React, { useState, useEffect } from 'react';
import { useBalance } from '../contexts/BalanceContext';

interface BalanceManagerProps {
  className?: string;
}

export const BalanceManager: React.FC<BalanceManagerProps> = ({ className = '' }) => {
  const { 
    balance, 
    transactions, 
    loading, 
    addEntry, 
    removeEntry, 
    adjustBalance,
    currentSaldoRecord,
    refreshBalance 
  } = useBalance();

  const [showTransactions, setShowTransactions] = useState(false);
  const [entryAmount, setEntryAmount] = useState('');
  const [exitAmount, setExitAmount] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [exitDescription, setExitDescription] = useState('');
  const [manualBalance, setManualBalance] = useState('');

  const handleAddEntry = () => {
    const amount = parseFloat(entryAmount);
    if (amount > 0) {
      addEntry(amount, entryDescription || 'Depósito');
      setEntryAmount('');
      setEntryDescription('');
    }
  };

  const handleAddExit = async () => {
    const amount = parseFloat(exitAmount);
    if (amount > 0) {
      const success = await removeEntry(amount, exitDescription || 'Aposta');
      if (success) {
        setExitAmount('');
        setExitDescription('');
      } else {
        alert('Erro ao registrar saída. Tente novamente.');
      }
    }
  };

  const handleSetManualBalance = async () => {
    const amount = parseFloat(manualBalance);
    if (amount >= 0) {
      const success = await adjustBalance(amount, 'Ajuste manual do saldo');
      if (success) {
        setManualBalance('');
      } else {
        alert('Erro ao ajustar saldo. Tente novamente.');
      }
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-600">Carregando saldo...</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {/* Cabeçalho com Saldo Atual */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">💰 Gerenciador de Saldo</h3>
        <div className="text-right">
          <div className="text-sm text-gray-600">Saldo Atual</div>
          <div className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-amber-900'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {currentSaldoRecord && (
            <div className="text-xs text-gray-500">
              {(() => {
              const [ano, mes, dia] = currentSaldoRecord.data.split('-');
              return `${dia}/${mes}/${ano}`;
            })()}
              {currentSaldoRecord.vlr_lucro !== 0 && (
                <span className={`ml-2 ${currentSaldoRecord.vlr_lucro >= 0 ? 'text-green-600' : 'text-amber-900'}`}>
                  ({currentSaldoRecord.vlr_lucro >= 0 ? '+' : ''}R$ {currentSaldoRecord.vlr_lucro?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controles de Entrada, Saída e Sugestões */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Entrada */}
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">➕ Adicionar Entrada</h4>
          <div className="space-y-2">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={entryAmount}
              onChange={(e) => {
                let value = e.target.value.replace(',', '.');
                // Remove caracteres não numéricos exceto ponto
                value = value.replace(/[^0-9.]/g, '');
                // Garante apenas um ponto decimal
                const parts = value.split('.');
                if (parts.length > 2) {
                  value = parts[0] + '.' + parts.slice(1).join('');
                }
                setEntryAmount(value);
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  const value = parseFloat(e.target.value) || 0;
                  setEntryAmount(value.toFixed(2));
                }
              }}
              placeholder="Valor (R$)"
              className="w-full p-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              value={entryDescription}
              onChange={(e) => setEntryDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full p-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleAddEntry}
              disabled={!entryAmount || parseFloat(entryAmount) <= 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded font-semibold transition-colors"
            >
              Adicionar Entrada
            </button>
          </div>
        </div>

        {/* Saída */}
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">➖ Registrar Saída</h4>
          <div className="space-y-2">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={exitAmount}
              onChange={(e) => {
                let value = e.target.value.replace(',', '.');
                // Remove caracteres não numéricos exceto ponto
                value = value.replace(/[^0-9.]/g, '');
                // Garante apenas um ponto decimal
                const parts = value.split('.');
                if (parts.length > 2) {
                  value = parts[0] + '.' + parts.slice(1).join('');
                }
                setExitAmount(value);
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  const value = parseFloat(e.target.value) || 0;
                  setExitAmount(value.toFixed(2));
                }
              }}
              placeholder="Valor (R$)"
              className="w-full p-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              value={exitDescription}
              onChange={(e) => setExitDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full p-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={handleAddExit}
              disabled={!exitAmount || parseFloat(exitAmount) <= 0 || parseFloat(exitAmount) > balance}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded font-semibold transition-colors"
            >
              Registrar Saída
            </button>
          </div>
        </div>

        {/* Sugestões de Lucro */}
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2">💡 Sugestões</h4>
          <div className="space-y-2">
            {/* Lucro de 3% */}
            <div className="bg-white p-2 rounded border border-purple-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-purple-700">Lucro de 3%</span>
                <div className="text-right">
                  <div className="text-xs text-gray-600">
                    +R$ {(balance * 0.03).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm font-bold text-purple-600">
                    R$ {(balance * 1.03).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Lucro de 5% */}
            <div className="bg-white p-2 rounded border border-purple-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-purple-700">Lucro de 5%</span>
                <div className="text-right">
                  <div className="text-xs text-gray-600">
                    +R$ {(balance * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm font-bold text-purple-600">
                    R$ {(balance * 1.05).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Lucro de 10% */}
            <div className="bg-white p-2 rounded border border-purple-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-purple-700">Lucro de 10%</span>
                <div className="text-right">
                  <div className="text-xs text-gray-600">
                    +R$ {(balance * 0.10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm font-bold text-purple-600">
                    R$ {(balance * 1.10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ajuste Manual do Saldo */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
        <h4 className="font-semibold text-blue-800 mb-2">⚙️ Ajuste Manual</h4>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={manualBalance}
            onChange={(e) => {
              let value = e.target.value.replace(',', '.');
              // Remove caracteres não numéricos exceto ponto
              value = value.replace(/[^0-9.]/g, '');
              // Garante apenas um ponto decimal
              const parts = value.split('.');
              if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
              }
              setManualBalance(value);
            }}
            onBlur={(e) => {
              if (e.target.value) {
                const value = parseFloat(e.target.value) || 0;
                setManualBalance(value.toFixed(2));
              }
            }}
            placeholder="Novo saldo (R$)"
            className="flex-1 p-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSetManualBalance}
            disabled={!manualBalance || parseFloat(manualBalance) < 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded font-semibold transition-colors"
          >
            Definir
          </button>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-semibold transition-colors"
        >
          {showTransactions ? 'Ocultar' : 'Ver'} Histórico ({transactions.length})
        </button>
        <button
          onClick={refreshBalance}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-semibold transition-colors"
          title="Atualizar saldo do banco de dados"
        >
          Atualizar
        </button>
      </div>

      {/* Histórico de Transações */}
      {showTransactions && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-800 mb-3">📋 Histórico de Transações</h4>
          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Nenhuma transação registrada
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`p-3 rounded-lg border ${
                      transaction.type === 'entrada'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`font-semibold ${
                          transaction.type === 'entrada' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {transaction.type === 'entrada' ? '➕' : '➖'} {transaction.description}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(transaction.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'entrada' ? 'text-green-600' : 'text-amber-900'
                      }`}>
                        {transaction.type === 'entrada' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};