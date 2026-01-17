import React from 'react';
import { RouletteNumber } from '../types/roulette';

interface HistoryDisplayProps {
  history: RouletteNumber[];
}

export function HistoryDisplay({ history }: HistoryDisplayProps) {
  const getColorClasses = (color: 'green' | 'red' | 'black') => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'red':
        return 'bg-red-500';
      case 'black':
        return 'bg-gray-800';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Histórico (Últimos {history.length} números)
      </h2>
      
      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum número sorteado ainda</p>
          <p className="text-sm mt-1">Clique nos números acima para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Linha de números mais recentes */}
          <div className="flex flex-wrap gap-2 justify-start">
            {history.slice(-25).map((number, index) => (
              <div
                key={`${number.value}-${number.createdAt.getTime()}`}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                  ${getColorClasses(number.color)}
                  ${index === history.slice(-25).length - 1 ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                `}
                title={`Número ${number.value} - ${number.createdAt.toLocaleTimeString()}`}
              >
                {number.value}
              </div>
            ))}
          </div>
          
          {/* Estatísticas rápidas do histórico */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {history.filter(n => n.color === 'red').length}
              </div>
              <div className="text-xs text-gray-600">Vermelhos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {history.filter(n => n.color === 'black').length}
              </div>
              <div className="text-xs text-gray-600">Pretos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {history.filter(n => n.color === 'green').length}
              </div>
              <div className="text-xs text-gray-600">Zeros</div>
            </div>
          </div>
          
          {/* Último número destacado */}
          {history.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Último número:</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold
                      ${getColorClasses(history[history.length - 1].color)}
                    `}
                  >
                    {history[history.length - 1].value}
                  </div>
                  <span className="text-sm text-gray-500">
                    {history[history.length - 1].createdAt.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}