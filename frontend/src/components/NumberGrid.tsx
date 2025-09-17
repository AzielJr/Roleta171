import React from 'react';
import { getNumberColor } from '../utils/rouletteConfig';

interface NumberGridProps {
  onNumberClick: (number: number) => void;
  riskNumbers?: number[];
}

export function NumberGrid({ onNumberClick, riskNumbers = [] }: NumberGridProps) {
  const getButtonClasses = (number: number) => {
    const baseClasses = 'w-8 h-8 rounded font-semibold text-white text-xs transition-all duration-200 hover:scale-105 active:scale-95';
    const color = getNumberColor(number);
    const isRisk = riskNumbers.includes(number);
    
    let colorClasses = '';
    switch (color) {
      case 'green':
        colorClasses = 'bg-green-500 hover:bg-green-600';
        break;
      case 'red':
        colorClasses = 'bg-red-500 hover:bg-red-600';
        break;
      case 'black':
        colorClasses = 'bg-gray-800 hover:bg-gray-900';
        break;
    }
    
    const riskClasses = isRisk ? 'ring-4 ring-yellow-400 ring-opacity-75' : '';
    
    return `${baseClasses} ${colorClasses} ${riskClasses}`;
  };

  const renderGrid = () => {
    const numbers = [];
    
    // Zero no topo (linha separada)
    numbers.push(
      <div key="zero-row" className="col-span-9 mb-1">
        <button
          onClick={() => onNumberClick(0)}
          className={`${getButtonClasses(0)} w-full h-8`}
        >
          0
        </button>
      </div>
    );
    
    // Layout horizontal otimizado: 9 colunas x 4 linhas para economizar espaço vertical
    // Primeira linha: 1-9
    // Segunda linha: 10-18
    // Terceira linha: 19-27
    // Quarta linha: 28-36
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 9; col++) {
        const number = row * 9 + col + 1;
        if (number <= 36) {
          numbers.push(
            <button
              key={number}
              onClick={() => onNumberClick(number)}
              className={getButtonClasses(number)}
            >
              {number}
            </button>
          );
        }
      }
    }
    
    return numbers;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3">
      <h3 className="text-lg font-bold mb-2 text-gray-800">Números</h3>
      <div className="grid grid-cols-9 gap-1 max-w-2xl">
        {renderGrid()}
      </div>
      {riskNumbers.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-800">
            <span className="font-semibold">Risco:</span> {riskNumbers.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}