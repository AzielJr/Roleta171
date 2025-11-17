import React, { useEffect } from 'react';
import { useTorreLogic } from '../hooks/useTorreLogic';

interface TorreIntegrationProps {
  avisosSonorosAtivos: boolean;
  onTorreStateChange: (state: {
    torrePendingEntrada: boolean;
    animatingTorre: 'yellow' | 'green' | undefined;
    torreWinCount: number;
    torreLossCount: number;
  }) => void;
  onEvaluateTorre: (evaluateFunction: (num: number, snapshot?: number[]) => void) => void;
}

const TorreIntegration: React.FC<TorreIntegrationProps> = ({
  avisosSonorosAtivos,
  onTorreStateChange,
  onEvaluateTorre
}) => {
  const {
    torrePendingEntrada,
    animatingTorre,
    torreWinCount,
    torreLossCount,
    evaluateTorre,
    resetTorre
  } = useTorreLogic(avisosSonorosAtivos);

  // Notificar mudanças de estado para o componente pai
  useEffect(() => {
    onTorreStateChange({
      torrePendingEntrada,
      animatingTorre,
      torreWinCount,
      torreLossCount
    });
  }, [torrePendingEntrada, animatingTorre, torreWinCount, torreLossCount, onTorreStateChange]);

  // Fornecer função de avaliação para o componente pai
  useEffect(() => {
    onEvaluateTorre(evaluateTorre);
  }, [evaluateTorre, onEvaluateTorre]);

  // Este componente não renderiza nada visualmente
  return null;
};

export default TorreIntegration;
