// Utilitário para avaliação do P2 que pode ser usado em qualquer lugar
const P2_ENTRY_NUMBERS = [0, 3, 4, 7, 11, 15, 18, 21, 22, 25, 29, 33, 36];

// Variável global para controlar estado do P2
let globalP2State = {
  pending: false,
  animating: undefined as 'yellow' | 'green' | undefined
};

export const evaluateP2Number = (
  selectedNumber: number,
  p2PendingEntrada: boolean,
  setP2PendingEntrada: (value: boolean) => void,
  setAnimatingP2: (value: 'yellow' | 'green' | undefined) => void,
  setP2WinCount: (fn: (prev: number) => number) => void,
  setP2LossCount: (fn: (prev: number) => number) => void,
  currentNumbersSnapshot: number[],
  p2Mode: number
) => {
  console.log('[DEBUG P2 RADICAL] Avaliando número:', selectedNumber, 'Pending:', p2PendingEntrada, 'Global:', globalP2State, 'Mode:', p2Mode);

  const lastEvaluatedP2Key = `p2-${selectedNumber}-${currentNumbersSnapshot.length}-${currentNumbersSnapshot[currentNumbersSnapshot.length - 1] ?? 'none'}-${p2PendingEntrada ? 'pending' : 'idle'}-${p2Mode}`;

  const isEntry = P2_ENTRY_NUMBERS.includes(selectedNumber);
  const prev = currentNumbersSnapshot[currentNumbersSnapshot.length - 1];
  const prevIsEntry = P2_ENTRY_NUMBERS.includes(prev);

  if (!p2PendingEntrada && !globalP2State.pending) {
    const shouldActivate = p2Mode === 1 ? isEntry : (isEntry && prevIsEntry);
    if (shouldActivate) {
      console.log('[DEBUG P2 RADICAL] Entrada detectada - ativando borda amarela');
      globalP2State.pending = true;
      globalP2State.animating = 'yellow';
      setP2PendingEntrada(true);
      setAnimatingP2('yellow');
      return; // aguarda próximo para classificar
    }
    return;
  }

  // Já pendente: classificar próximo número
  if (P2_ENTRY_NUMBERS.includes(selectedNumber)) {
    console.log('[DEBUG P2 RADICAL] LOSS detectado');
    setP2LossCount(c => c + 1);
    setAnimatingP2('yellow');
  } else {
    console.log('[DEBUG P2 RADICAL] *** WIN DETECTADO - REMOVENDO BORDA ***');
    setP2WinCount(c => c + 1);
    
    // FORÇAR estado global
    globalP2State.pending = false;
    globalP2State.animating = undefined;
    
    // MÚLTIPLAS tentativas de remoção
    console.log('[DEBUG P2 RADICAL] Tentativa 1 - Removendo borda');
    setAnimatingP2(undefined);
    setP2PendingEntrada(false);
    
    setTimeout(() => {
      console.log('[DEBUG P2 RADICAL] Tentativa 2 - Forçando remoção');
      setAnimatingP2(undefined);
      setP2PendingEntrada(false);
    }, 50);
    
    setTimeout(() => {
      console.log('[DEBUG P2 RADICAL] Tentativa 3 - Garantindo remoção');
      setAnimatingP2(undefined);
      setP2PendingEntrada(false);
    }, 100);
  }
};
