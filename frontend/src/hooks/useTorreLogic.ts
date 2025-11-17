import { useState, useRef, useCallback } from 'react';

const TORRE_ENTRY_NUMBERS = [1, 2, 3, 34, 35, 36];
const TORRE_LOSS_SET = new Set<number>([0, 1, 2, 3, 34, 35, 36]);

export const useTorreLogic = (avisosSonorosAtivos: boolean) => {
  const [torrePendingEntrada, setTorrePendingEntrada] = useState<boolean>(false);
  const [animatingTorre, setAnimatingTorre] = useState<'yellow' | 'green' | undefined>(undefined);
  const [torreWinCount, setTorreWinCount] = useState<number>(0);
  const [torreLossCount, setTorreLossCount] = useState<number>(0);
  const lastEvaluatedTorre = useRef<string>('');

  const clearTorreVisuals = useCallback(() => {
    console.log('[DEBUG] Limpando visuais da Torre');
    setAnimatingTorre(undefined);
    setTorrePendingEntrada(false);
  }, []);

  const evaluateTorre = useCallback((selectedNumber: number, currentNumbersSnapshot?: number[]) => {
    console.log('[DEBUG] Avaliando Torre para número:', selectedNumber);
    
    const snapshot = currentNumbersSnapshot ?? [];
    const lastPrevNumber = snapshot[snapshot.length - 1] ?? 'none';
    const evaluationKey = `torre-${selectedNumber}-${snapshot.length}-${lastPrevNumber}-${torrePendingEntrada ? 'pending' : 'idle'}`;
    
    if (lastEvaluatedTorre.current === evaluationKey) {
      console.log('[DEBUG] Avaliação duplicada evitada para Torre');
      return;
    }
    lastEvaluatedTorre.current = evaluationKey;

    if (!torrePendingEntrada) {
      if (TORRE_ENTRY_NUMBERS.includes(selectedNumber)) {
        console.log('[DEBUG] Entrada da Torre detectada');
        setTorrePendingEntrada(true);
        setAnimatingTorre('yellow');
      }
      return;
    }

    // Padrão ativo: LOSS se número for 0,1,2,3,34,35,36; WIN caso contrário
    if (TORRE_LOSS_SET.has(selectedNumber)) {
      console.log('[DEBUG] LOSS da Torre detectado');
      setTorreLossCount(prev => prev + 1);
      // manter borda ativa até que ocorra um WIN
    } else {
      console.log('[DEBUG] WIN da Torre detectado - removendo borda');
      setTorreWinCount(prev => prev + 1);
      // Mostrar verde breve no WIN e limpar após pequeno atraso
      setAnimatingTorre('green');
      setTorrePendingEntrada(false);
      setTimeout(() => {
        clearTorreVisuals();
        console.log('[DEBUG] Borda da Torre removida após WIN');
      }, 350);
    }
  }, [torrePendingEntrada, avisosSonorosAtivos, clearTorreVisuals]);

  const resetTorre = useCallback(() => {
    setTorreWinCount(0);
    setTorreLossCount(0);
    setTorrePendingEntrada(false);
    setAnimatingTorre(undefined);
    lastEvaluatedTorre.current = '';
  }, []);

  return {
    torrePendingEntrada,
    animatingTorre,
    torreWinCount,
    torreLossCount,
    evaluateTorre,
    clearTorreVisuals,
    resetTorre
  };
};
