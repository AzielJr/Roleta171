import { useMemo } from 'react';
import { Statistics } from '../types/roulette';

export function useStatistics(statistics: Statistics) {
  const totalNumbers = useMemo(() => {
    return statistics.colors.red + statistics.colors.black + statistics.colors.green;
  }, [statistics]);

  const colorPercentages = useMemo(() => {
    if (totalNumbers === 0) return { red: 0, black: 0, green: 0 };
    
    return {
      red: Math.round((statistics.colors.red / totalNumbers) * 100),
      black: Math.round((statistics.colors.black / totalNumbers) * 100),
      green: Math.round((statistics.colors.green / totalNumbers) * 100)
    };
  }, [statistics.colors, totalNumbers]);

  const evenOddPercentages = useMemo(() => {
    const total = statistics.evenOdd.even + statistics.evenOdd.odd;
    if (total === 0) return { even: 0, odd: 0 };
    
    return {
      even: Math.round((statistics.evenOdd.even / total) * 100),
      odd: Math.round((statistics.evenOdd.odd / total) * 100)
    };
  }, [statistics.evenOdd]);

  const highLowPercentages = useMemo(() => {
    const total = statistics.highLow.high + statistics.highLow.low;
    if (total === 0) return { high: 0, low: 0 };
    
    return {
      high: Math.round((statistics.highLow.high / total) * 100),
      low: Math.round((statistics.highLow.low / total) * 100)
    };
  }, [statistics.highLow]);

  const dozensPercentages = useMemo(() => {
    const total = statistics.dozens.first + statistics.dozens.second + statistics.dozens.third;
    if (total === 0) return { first: 0, second: 0, third: 0 };
    
    return {
      first: Math.round((statistics.dozens.first / total) * 100),
      second: Math.round((statistics.dozens.second / total) * 100),
      third: Math.round((statistics.dozens.third / total) * 100)
    };
  }, [statistics.dozens]);

  const columnsPercentages = useMemo(() => {
    const total = statistics.columns.first + statistics.columns.second + statistics.columns.third;
    if (total === 0) return { first: 0, second: 0, third: 0 };
    
    return {
      first: Math.round((statistics.columns.first / total) * 100),
      second: Math.round((statistics.columns.second / total) * 100),
      third: Math.round((statistics.columns.third / total) * 100)
    };
  }, [statistics.columns]);

  return {
    totalNumbers,
    colorPercentages,
    evenOddPercentages,
    highLowPercentages,
    dozensPercentages,
    columnsPercentages
  };
}