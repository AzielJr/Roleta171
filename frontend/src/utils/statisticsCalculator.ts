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