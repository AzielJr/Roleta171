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
    console.log('[DEBUG TORRE RADICAL] *** WIN DETECTADO - MANTENDO BORDA VERDE POR 5 SEGUNDOS ***');
    setTorreWinCount(prev => prev + 1);
    
    // Configurar estado visual para VERDE
    globalTorreState.pending = false;
    globalTorreState.animating = 'green';
    
    // Aplicar visual verde imediatamente
    setAnimatingTorre('green');
    setTorrePendingEntrada(false);
    
    // Agendar limpeza após 5 segundos
    setTimeout(() => {
      // Verificar se não iniciou uma nova entrada neste meio tempo
      if (globalTorreState.animating === 'green') {
        console.log('[DEBUG TORRE RADICAL] Limpeza final após 5 segundos');
        setAnimatingTorre(undefined);
        globalTorreState.animating = undefined;
      }
    }, 5000);
  }
};
