import { useMemo } from 'react';
import { Alert } from '../types/roulette';
import { generateBettingSuggestion } from '../utils/alertLogic';

export function useAlertSystem(alert: Alert | null) {
  const hasActiveAlert = useMemo(() => {
    return alert !== null && alert.hasRace;
  }, [alert]);

  const bettingSuggestion = useMemo(() => {
    if (!alert) return null;
    return alert.message;
  }, [alert]);

  const alertSeverity = useMemo(() => {
    if (!alert) return 'none';
    
    // Determina a severidade baseada no número de números de risco
    const riskCount = alert.riskNumbers.length;
    
    if (riskCount <= 3) return 'high'; // Muito poucos números de risco = alta confiança
    if (riskCount <= 6) return 'medium'; // Risco moderado
    return 'low'; // Muitos números de risco = baixa confiança
  }, [alert]);

  const coveragePercentage = useMemo(() => {
    if (!alert) return 0;
    
    const coveredNumbers = alert.coveredNumbers.length;
    return Math.round((coveredNumbers / 37) * 100);
  }, [alert]);

  return {
    hasActiveAlert,
    bettingSuggestion,
    alertSeverity,
    coveragePercentage,
    alert
  };
}