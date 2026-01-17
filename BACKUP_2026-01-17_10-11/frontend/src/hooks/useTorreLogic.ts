import { useState, useRef, useCallback } from 'react';

const STREETS: { [key: number]: number[] } = {
  1: [1, 2, 3, 4, 5, 6],
  2: [7, 8, 9, 10, 11, 12],
  3: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  4: [25, 26, 27, 28, 29, 30],
  5: [31, 32, 33, 34, 35, 36]
};

export const useTorreLogic = (avisosSonorosAtivos: boolean) => {
  const [exposedNumbers, setExposedNumbers] = useState<number[]>([]);
  const [animatingTorre, setAnimatingTorre] = useState<'yellow' | 'green' | undefined>(undefined);
  const [torreWinCount, setTorreWinCount] = useState<number>(0);
  const [torreLossCount, setTorreLossCount] = useState<number>(0);
  const [torreEntradasCount, setTorreEntradasCount] = useState<number>(0);
  const [currentNegativeSequence, setCurrentNegativeSequence] = useState<number>(0);
  const [maxNegativeSequence, setMaxNegativeSequence] = useState<number>(0);
  const lastEvaluatedTorre = useRef<string>('');

  const clearTorreVisuals = useCallback(() => {
    // console.log('[DEBUG] Limpando visuais da Torre');
    setAnimatingTorre(undefined);
  }, []);

  const evaluateTorre = useCallback((selectedNumber: number, currentNumbersSnapshot?: number[]) => {
    // console.log('[DEBUG] Avaliando Torre para número:', selectedNumber);
    
    const snapshot = currentNumbersSnapshot ?? [];
    const lastPrevNumber = snapshot[snapshot.length - 1] ?? 'none';
    const evaluationKey = `torre-${selectedNumber}-${snapshot.length}-${lastPrevNumber}`;
    
    if (lastEvaluatedTorre.current === evaluationKey) {
      // console.log('[DEBUG] Avaliação duplicada evitada para Torre');
      return;
    }
    lastEvaluatedTorre.current = evaluationKey;

    // 1. Avaliar aposta anterior se houver números expostos
    if (exposedNumbers.length > 0) {
      setTorreEntradasCount(prev => prev + 1);
      
      // LOSS se o número sorteado estiver na rua exposta OU for Zero
      const isLoss = exposedNumbers.includes(selectedNumber) || selectedNumber === 0;
      
      if (isLoss) {
        // console.log('[DEBUG] LOSS da Torre Móvel detectado');
        setTorreLossCount(prev => prev + 1);
        setCurrentNegativeSequence(prev => {
          const newVal = prev + 1;
          setMaxNegativeSequence(currMax => Math.max(currMax, newVal));
          return newVal;
        });
        setAnimatingTorre('yellow'); // Amarelo indica LOSS/Atenção
      } else {
        // console.log('[DEBUG] WIN da Torre Móvel detectado');
        setTorreWinCount(prev => prev + 1);
        setCurrentNegativeSequence(0);
        setAnimatingTorre('green');
        setTimeout(() => {
          clearTorreVisuals();
        }, 350);
      }
    }

    // 2. Definir próxima exposição (Torre Móvel)
    // "o número que fizer parte da rua acima, a rua toda ficará exposta na aposta"
    let nextExposed: number[] = [];
    for (const key in STREETS) {
      if (STREETS[key].includes(selectedNumber)) {
        nextExposed = STREETS[key];
        break;
      }
    }
    
    setExposedNumbers(nextExposed);
    // Se for zero ou não estiver em nenhuma rua, nextExposed será vazio -> sem aposta na próxima

  }, [exposedNumbers, clearTorreVisuals]);

  const resetTorre = useCallback(() => {
    setTorreWinCount(0);
    setTorreLossCount(0);
    setTorreEntradasCount(0);
    setExposedNumbers([]);
    setCurrentNegativeSequence(0);
    setMaxNegativeSequence(0);
    setAnimatingTorre(undefined);
    lastEvaluatedTorre.current = '';
  }, []);

  return {
    torrePendingEntrada: exposedNumbers.length > 0,
    animatingTorre,
    torreWinCount,
    torreLossCount,
    torreEntradasCount,
    currentNegativeSequence,
    maxNegativeSequence,
    evaluateTorre,
    clearTorreVisuals,
    resetTorre
  };
};
