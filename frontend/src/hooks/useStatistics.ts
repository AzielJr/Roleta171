import { useMemo } from 'react';
import { Statistics } from '../types/roulette';

export function useStatistics(statistics: Statistics) {
  const totalNumbers = useMemo(() => {
    if (!statistics || !statistics.colors) return 0;
    return statistics.colors.red + statistics.colors.black + statistics.colors.green;
  }, [statistics]);

  const colorPercentages = useMemo(() => {
    if (totalNumbers === 0 || !statistics || !statistics.colors) return { red: 0, black: 0, green: 0 };
    
    return {
      red: Math.round(((statistics.colors.red || 0) / totalNumbers) * 100),
      black: Math.round(((statistics.colors.black || 0) / totalNumbers) * 100),
      green: Math.round(((statistics.colors.green || 0) / totalNumbers) * 100)
    };
  }, [statistics, totalNumbers]);

  const evenOddPercentages = useMemo(() => {
    if (!statistics || !statistics.evenOdd) return { even: 0, odd: 0 };
    const total = (statistics.evenOdd.even || 0) + (statistics.evenOdd.odd || 0);
    if (total === 0) return { even: 0, odd: 0 };
    
    return {
      even: Math.round(((statistics.evenOdd.even || 0) / total) * 100),
      odd: Math.round(((statistics.evenOdd.odd || 0) / total) * 100)
    };
  }, [statistics]);

  const highLowPercentages = useMemo(() => {
    if (!statistics || !statistics.highLow) return { high: 0, low: 0 };
    const total = (statistics.highLow.high || 0) + (statistics.highLow.low || 0);
    if (total === 0) return { high: 0, low: 0 };
    
    return {
      high: Math.round(((statistics.highLow.high || 0) / total) * 100),
      low: Math.round(((statistics.highLow.low || 0) / total) * 100)
    };
  }, [statistics]);

  const dozensPercentages = useMemo(() => {
    if (!statistics || !statistics.dozens) return { first: 0, second: 0, third: 0 };
    const total = (statistics.dozens.first || 0) + (statistics.dozens.second || 0) + (statistics.dozens.third || 0);
    if (total === 0) return { first: 0, second: 0, third: 0 };
    
    return {
      first: Math.round(((statistics.dozens.first || 0) / total) * 100),
      second: Math.round(((statistics.dozens.second || 0) / total) * 100),
      third: Math.round(((statistics.dozens.third || 0) / total) * 100)
    };
  }, [statistics]);

  const columnsPercentages = useMemo(() => {
    if (!statistics || !statistics.columns) return { first: 0, second: 0, third: 0 };
    const total = (statistics.columns.first || 0) + (statistics.columns.second || 0) + (statistics.columns.third || 0);
    if (total === 0) return { first: 0, second: 0, third: 0 };
    
    return {
      first: Math.round(((statistics.columns.first || 0) / total) * 100),
      second: Math.round(((statistics.columns.second || 0) / total) * 100),
      third: Math.round(((statistics.columns.third || 0) / total) * 100)
    };
  }, [statistics]);

  return {
    totalNumbers,
    colorPercentages,
    evenOddPercentages,
    highLowPercentages,
    dozensPercentages,
    columnsPercentages
  };
}