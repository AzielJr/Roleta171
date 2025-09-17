import React from 'react';
import { useAlertSystem } from '../hooks/useAlertSystem';
import { Alert } from '../types/roulette';
import { getNumberColor } from '../utils/rouletteConfig';

interface AlertPanelProps {
  alert: Alert | null;
  onDismiss: () => void;
}

export function AlertPanel({ alert, onDismiss }: AlertPanelProps) {
  const { hasActiveAlert, bettingSuggestion, alertSeverity, coveragePercentage } = useAlertSystem(alert);

  if (!hasActiveAlert || !alert) {
    return (
      <div className="bg-gray-50 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Sistema de Alertas
        </h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <p>Aguardando padrões...</p>
          <p className="text-sm mt-1">O sistema monitora automaticamente os números sorteados</p>
        </div>
      </div>
    );
  }

  const getSeverityClasses = () => {
    switch (alertSeverity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'low':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = () => {
    switch (alertSeverity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return '💡';
      default:
        return '📊';
    }
  };

  const getNumberColorClasses = (number: number) => {
    const color = getNumberColor(number);
    switch (color) {
      case 'green':
        return 'bg-green-500 text-white';
      case 'red':
        return 'bg-red-500 text-white';
      case 'black':
        return 'bg-gray-800 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 border-2 ${getSeverityClasses()}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">{getSeverityIcon()}</span>
          Alerta de Race!
        </h2>
        <button
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          title="Dispensar alerta"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white bg-opacity-50 rounded-lg p-4">
          <p className="font-medium mb-2">{alert.message}</p>
          
          <div className="flex items-center gap-4 mb-3">
            <div>
              <span className="text-sm font-medium">Números da race:</span>
              <div className="flex gap-2 mt-1">
                {alert.raceNumbers.map(num => (
                  <div
                    key={num}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getNumberColorClasses(num)}`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">{coveragePercentage}%</div>
              <div className="text-xs">Cobertura</div>
            </div>
          </div>
        </div>

        {bettingSuggestion && (
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">💰 Sugestão de Aposta:</p>
            <p className="text-sm">{bettingSuggestion}</p>
          </div>
        )}

        {alert.riskNumbers.length > 0 && (
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">⚠️ Números de Risco ({alert.riskNumbers.length}):</p>
            <div className="flex flex-wrap gap-1">
              {alert.riskNumbers.map(num => (
                <span
                  key={num}
                  className="inline-block w-6 h-6 bg-yellow-400 text-yellow-900 text-xs font-bold rounded text-center leading-6"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Severidade: {alertSeverity.toUpperCase()}</span>
          <span>Números cobertos: {37 - alert.riskNumbers.length}/37</span>
        </div>
      </div>
    </div>
  );
}