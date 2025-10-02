import { useState, useCallback } from 'react';
import { RouletteState, RouletteEntry, Alert } from '../types/roulette';
import { getNumberColor, ROULETTE_CONFIG } from '../utils/rouletteConfig';
import { calculateStatistics } from '../utils/statisticsCalculator';
import { checkForRaceCondition, generateBettingSuggestion, checkFor171Pattern } from '../utils/alertLogic';

const initialStatistics = {
  colors: { red: 0, black: 0, green: 0 },
  evenOdd: { even: 0, odd: 0 },
  highLow: { high: 0, low: 0 },
  dozens: { first: 0, second: 0, third: 0 },
  columns: { first: 0, second: 0, third: 0 }
};

const initialState: RouletteState = {
  history: [],
  statistics: initialStatistics,
  alert: null
};

export function useRouletteState() {
  const [state, setState] = useState<RouletteState>(initialState);

  const addNumber = useCallback((number: number) => {
    if (number < 0 || number > 36) return;

    const newEntry: RouletteEntry = {
      number: number,
      color: getNumberColor(number),
      createdAt: new Date()
    };

    setState(prevState => {
      // Adiciona o novo número e mantém apenas os últimos 50
      const newHistory = [...prevState.history, newEntry].slice(-ROULETTE_CONFIG.MAX_HISTORY);
      
      // Recalcula estatísticas
      const newStatistics = calculateStatistics(newHistory);
      
      // Verifica condições de alerta
      const raceData = checkForRaceCondition(newHistory);
      const pattern171Data = checkFor171Pattern(newHistory);
      
      let newAlert: Alert | null = null;
      
      // Prioriza o alerta do padrão 171 sobre o alerta de race condition
      if (pattern171Data.hasPattern) {
        newAlert = {
          type: 'pattern171',
          hasPattern: true,
          numbers: pattern171Data.numbers,
          message: 'Padrão 171 detectado! Estratégia recomendada: Apostar no próximo número.'
        };
      } else if (raceData.hasRace) {
        newAlert = {
          ...raceData,
          message: generateBettingSuggestion(raceData)
        };
      }
      
      return {
        history: newHistory,
        statistics: newStatistics,
        alert: newAlert
      };
    });
    }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const dismissAlert = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      alert: null
    }));
  }, []);

  return {
    ...state,
    addNumber,
    resetState,
    dismissAlert
  };
}