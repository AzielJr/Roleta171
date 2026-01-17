import { RouletteEntry, Statistics } from '../types/roulette';
import { getNumberColor } from './rouletteConfig';

export function calculateStatistics(history: RouletteEntry[]): Statistics {
  const stats: Statistics = {
    colors: { red: 0, black: 0, green: 0 },
    evenOdd: { even: 0, odd: 0 },
    highLow: { high: 0, low: 0 },
    dozens: { first: 0, second: 0, third: 0 },
    columns: { first: 0, second: 0, third: 0 }
  };

  history.forEach(({ number }) => {
    // Cores
    const color = getNumberColor(number);
    stats.colors[color]++;

    // Par/Ímpar (0 não conta)
    if (number !== 0) {
      if (number % 2 === 0) {
        stats.evenOdd.even++;
      } else {
        stats.evenOdd.odd++;
      }
    }

    // Alto/Baixo (0 não conta)
    if (number >= 1 && number <= 18) {
      stats.highLow.low++;
    } else if (number >= 19 && number <= 36) {
      stats.highLow.high++;
    }

    // Dúzias
    if (number >= 1 && number <= 12) {
      stats.dozens.first++;
    } else if (number >= 13 && number <= 24) {
      stats.dozens.second++;
    } else if (number >= 25 && number <= 36) {
      stats.dozens.third++;
    }

    // Colunas
    if (number !== 0) {
      const column = (number - 1) % 3;
      if (column === 0) {
        stats.columns.first++;
      } else if (column === 1) {
        stats.columns.second++;
      } else {
        stats.columns.third++;
      }
    }
  });

  return stats;
}

// Função para determinar a dúzia de um número
function getNumberDozen(number: number): 1 | 2 | 3 | null {
  if (number >= 1 && number <= 12) return 1;
  if (number >= 13 && number <= 24) return 2;
  if (number >= 25 && number <= 36) return 3;
  return null; // Para o zero
}

// Função para calcular ausências atuais das dúzias
export function calculateDozenAbsences(lastNumbers: number[]): {
  first: { current: number; max: number };
  second: { current: number; max: number };
  third: { current: number; max: number };
} {
  const result = {
    first: { current: 0, max: 0 },
    second: { current: 0, max: 0 },
    third: { current: 0, max: 0 }
  };

  if (lastNumbers.length === 0) return result;

  // Calcular ausências atuais (do final para o início)
  const calculateCurrentAbsence = (dozenNumber: 1 | 2 | 3): number => {
    let count = 0;
    for (let i = lastNumbers.length - 1; i >= 0; i--) {
      const dozen = getNumberDozen(lastNumbers[i]);
      if (dozen === dozenNumber) break;
      count++;
    }
    return count;
  };

  // Calcular ausências máximas no histórico
  const calculateMaxAbsence = (dozenNumber: 1 | 2 | 3): number => {
    let maxAbsence = 0;
    let currentAbsence = 0;

    for (let i = 0; i < lastNumbers.length; i++) {
      const dozen = getNumberDozen(lastNumbers[i]);
      if (dozen === dozenNumber) {
        maxAbsence = Math.max(maxAbsence, currentAbsence);
        currentAbsence = 0;
      } else {
        currentAbsence++;
      }
    }
    
    // Considerar a sequência atual se ainda estiver em ausência
    maxAbsence = Math.max(maxAbsence, currentAbsence);
    
    return maxAbsence;
  };

  // Calcular para cada dúzia
  result.first.current = calculateCurrentAbsence(1);
  result.first.max = calculateMaxAbsence(1);
  
  result.second.current = calculateCurrentAbsence(2);
  result.second.max = calculateMaxAbsence(2);
  
  result.third.current = calculateCurrentAbsence(3);
  result.third.max = calculateMaxAbsence(3);

  return result;
}

// Função para determinar a coluna de um número
function getNumberColumn(number: number): 1 | 2 | 3 | null {
  if (number === 0) return null;
  return ((number - 1) % 3 + 1) as 1 | 2 | 3;
}

// Função para calcular ausências atuais das colunas
export function calculateColumnAbsences(lastNumbers: number[]): {
  first: { current: number; max: number };
  second: { current: number; max: number };
  third: { current: number; max: number };
} {
  const result = {
    first: { current: 0, max: 0 },
    second: { current: 0, max: 0 },
    third: { current: 0, max: 0 }
  };

  if (lastNumbers.length === 0) return result;

  // Calcular ausências atuais (do final para o início)
  const calculateCurrentAbsence = (columnNumber: 1 | 2 | 3): number => {
    let count = 0;
    for (let i = lastNumbers.length - 1; i >= 0; i--) {
      const column = getNumberColumn(lastNumbers[i]);
      if (column === columnNumber) break;
      count++;
    }
    return count;
  };

  // Calcular ausências máximas no histórico
  const calculateMaxAbsence = (columnNumber: 1 | 2 | 3): number => {
    let maxAbsence = 0;
    let currentAbsence = 0;

    for (let i = 0; i < lastNumbers.length; i++) {
      const column = getNumberColumn(lastNumbers[i]);
      if (column === columnNumber) {
        maxAbsence = Math.max(maxAbsence, currentAbsence);
        currentAbsence = 0;
      } else {
        currentAbsence++;
      }
    }
    
    // Considerar a sequência atual se ainda estiver em ausência
    maxAbsence = Math.max(maxAbsence, currentAbsence);
    
    return maxAbsence;
  };

  // Calcular para cada coluna
  result.first.current = calculateCurrentAbsence(1);
  result.first.max = calculateMaxAbsence(1);
  
  result.second.current = calculateCurrentAbsence(2);
  result.second.max = calculateMaxAbsence(2);
  
  result.third.current = calculateCurrentAbsence(3);
  result.third.max = calculateMaxAbsence(3);

  return result;
}