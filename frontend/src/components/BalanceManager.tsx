import React, { useState } from 'react';
import { useBalance } from '../hooks/useBalance';

interface BalanceManagerProps {
  className?: string;
}

export const BalanceManager: React.FC<BalanceManagerProps> = ({ className = '' }) => {
  const { 
    balance, 
    transactions, 
    isLoading, 
    addEntry, 
    addExit, 
    setBalanceManually,
    clearHistory,
    resetBalance 
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

  const handleAddExit = () => {
    const amount = parseFloat(exitAmount);
    if (amount > 0) {
      try {
        addExit(amount, exitDescription || 'Aposta');
        setExitAmount('');
        setExitDescription('');
      } catch (error) {
        alert('Saldo insuficiente!');
      }
    }
  };

  const handleSetManualBalance = () => {
    const amount = parseFloat(manualBalance);
    if (amount >= 0) {
      setBalanceManually(amount, 'Ajuste manual do saldo');
      setManualBalance('');
    }
  };

  if (isLoading) {
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
          <div className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Controles de Entrada e Saída */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Entrada */}
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">➕ Adicionar Entrada</h4>
          <div className="space-y-2">
            <input
              type="number"
              value={entryAmount}
              onChange={(e) => setEntryAmount(e.target.value)}
              placeholder="Valor (R$)"
              className="w-full p-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              step="0.01"
              min="0"
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
              type="number"
              value={exitAmount}
              onChange={(e) => setExitAmount(e.target.value)}
              placeholder="Valor (R$)"
              className="w-full p-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              step="0.01"
              min="0"
              max={balance}
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
      </div>

      {/* Ajuste Manual do Saldo */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
        <h4 className="font-semibold text-blue-800 mb-2">⚙️ Ajuste Manual</h4>
        <div className="flex gap-2">
          <input
            type="number"
            value={manualBalance}
            onChange={(e) => setManualBalance(e.target.value)}
            placeholder="Novo saldo (R$)"
            className="flex-1 p-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.01"
            min="0"
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
          onClick={clearHistory}
          className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded font-semibold transition-colors"
          title="Limpar histórico (manter saldo)"
        >
          Limpar Histórico
        </button>
        <button
          onClick={() => {
            if (confirm('Tem certeza que deseja resetar tudo? Esta ação não pode ser desfeita.')) {
              resetBalance();
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-semibold transition-colors"
          title="Resetar saldo e histórico"
        >
          Reset
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
                        transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'entrada' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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