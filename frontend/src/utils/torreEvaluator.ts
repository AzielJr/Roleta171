// Utilitário para avaliação da Torre que pode ser usado em qualquer lugar
const TORRE_ENTRY_NUMBERS = [1, 2, 3, 34, 35, 36];
const TORRE_LOSS_SET = new Set<number>([0, 1, 2, 3, 34, 35, 36]);

// Variável global para controlar estado da Torre
let globalTorreState = {
  pending: false,
  animating: undefined as 'yellow' | 'green' | undefined
};

export const evaluateTorreNumber = (
  selectedNumber: number,
  torrePendingEntrada: boolean,
  setTorrePendingEntrada: (value: boolean) => void,
  setAnimatingTorre: (value: 'yellow' | 'green' | undefined) => void,
  setTorreWinCount: (fn: (prev: number) => number) => void,
  setTorreLossCount: (fn: (prev: number) => number) => void,
  clearTorreVisuals: () => void
) => {
  const isSimulating = (window as any).isSimulatingRef?.current || false;
  console.log('[DEBUG TORRE RADICAL] Avaliando número:', selectedNumber, 'Pending:', torrePendingEntrada, 'Global:', globalTorreState, 'Simulando:', isSimulating);

  if (!torrePendingEntrada && !globalTorreState.pending) {
    if (TORRE_ENTRY_NUMBERS.includes(selectedNumber)) {
      console.log('[DEBUG TORRE RADICAL] Entrada detectada - ativando borda amarela');
      globalTorreState.pending = true;
      globalTorreState.animating = 'yellow';
      setTorrePendingEntrada(true);
      setAnimatingTorre('yellow');
    }
    return;
  }

  // Padrão ativo: LOSS se número for 0,1,2,3,34,35,36; WIN caso contrário
  if (TORRE_LOSS_SET.has(selectedNumber)) {
    console.log('[DEBUG TORRE RADICAL] LOSS detectado');
    setTorreLossCount(prev => prev + 1);
    // manter borda ativa até que ocorra um WIN
  } else {
    console.log('[DEBUG TORRE RADICAL] *** WIN DETECTADO - REMOÇÃO RADICAL DA BORDA ***');
    setTorreWinCount(prev => prev + 1);
    
    // FORÇAR estado global
    globalTorreState.pending = false;
    globalTorreState.animating = undefined;
    
    // MÚLTIPLAS tentativas de remoção
    console.log('[DEBUG TORRE RADICAL] Tentativa 1 - Removendo borda');
    setAnimatingTorre(undefined);
    setTorrePendingEntrada(false);
    
    setTimeout(() => {
      console.log('[DEBUG TORRE RADICAL] Tentativa 2 - Forçando remoção');
      setAnimatingTorre(undefined);
      setTorrePendingEntrada(false);
    }, 50);
    
    setTimeout(() => {
      console.log('[DEBUG TORRE RADICAL] Tentativa 3 - Garantindo remoção');
      setAnimatingTorre(undefined);
      setTorrePendingEntrada(false);
    }, 100);
    
    setTimeout(() => {
      console.log('[DEBUG TORRE RADICAL] Tentativa 4 - Limpeza final');
      setAnimatingTorre(undefined);
      setTorrePendingEntrada(false);
    }, 200);
  }
};
