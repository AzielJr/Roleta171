// Utilitário para avaliação do BET Terminais que pode ser usado em qualquer lugar

// Variável global para controlar estado do BET Terminais
let globalBetTerminaisState = {
  pending: false,
  animating: undefined as 'yellow' | 'green' | undefined,
  fixedLeastThree: [] as number[], // 3 menos frequentes FIXOS durante o padrão ativo
  waitingForClassification: false, // Se está aguardando classificação
  lastProcessedKey: '' // Chave do último número processado
};

export const evaluateBetTerminaisNumber = (
  selectedNumber: number,
  betTerminaisPendingEntrada: boolean,
  setBetTerminaisPendingEntrada: (value: boolean) => void,
  setAnimatingBetTerminais: (value: 'yellow' | 'green' | undefined) => void,
  setBetTerminaisWins: (fn: (prev: number) => number) => void,
  setBetTerminaisLosses: (fn: (prev: number) => number) => void,
  setBetTerminaisEntradas: (fn: (prev: number) => number) => void,
  setBetTerminaisNegSeqCurrent: (fn: (prev: number) => number) => void,
  setBetTerminaisNegSeqMax: (fn: (prev: number) => number) => void,
  setBetTerminaisPosSeqCurrent: (fn: (prev: number) => number) => void,
  setBetTerminaisPosSeqMax: (fn: (prev: number) => number) => void,
  currentNumbers: number[]
) => {
  console.log('=== [DEBUG BET TERMINAIS] INÍCIO ===');
  console.log('[DEBUG BET TERMINAIS] Número:', selectedNumber, 'Pending:', betTerminaisPendingEntrada);
  console.log('[DEBUG BET TERMINAIS] Global State:', globalBetTerminaisState);

  const terminal = Math.abs(selectedNumber) % 10;
  
  // Criar chave única para evitar processamento duplo
  const processKey = `${selectedNumber}-${currentNumbers.length}-${betTerminaisPendingEntrada ? 'pending' : 'idle'}`;
  
  if (globalBetTerminaisState.lastProcessedKey === processKey) {
    console.log('[DEBUG BET TERMINAIS] *** PROTEÇÃO *** - Número já processado com esta chave:', processKey);
    return;
  }
  
  globalBetTerminaisState.lastProcessedKey = processKey;
  console.log('[DEBUG BET TERMINAIS] Processando com chave:', processKey);

  // FASE 1: ATIVAÇÃO (quando não há padrão ativo)
  if (!betTerminaisPendingEntrada && !globalBetTerminaisState.pending) {
    console.log('[DEBUG BET TERMINAIS] === FASE ATIVAÇÃO ===');
    
    // Atualizar lista COM o novo número
    const updatedNumbers = [...currentNumbers, selectedNumber];
    const counts = Array(10).fill(0);
    updatedNumbers.forEach(n => { counts[Math.abs(n) % 10]++; });
    
    const terminais = counts.map((count, terminal) => ({ terminal, count }))
      .sort((a, b) => b.count - a.count || a.terminal - b.terminal);
    const leastThreeAfter = terminais.slice(-3).map(t => t.terminal);
    
    console.log('[DEBUG BET TERMINAIS] Lista atualizada:', updatedNumbers);
    console.log('[DEBUG BET TERMINAIS] 3 menos frequentes APÓS:', leastThreeAfter);
    console.log('[DEBUG BET TERMINAIS] Terminal', terminal, 'está nos 3?', leastThreeAfter.includes(terminal));
    
    if (leastThreeAfter.includes(terminal)) {
      console.log('[DEBUG BET TERMINAIS] *** ENTRADA DETECTADA ***');
      
      // FIXAR os 3 menos frequentes para próximas comparações
      globalBetTerminaisState.fixedLeastThree = [...leastThreeAfter];
      globalBetTerminaisState.pending = true;
      globalBetTerminaisState.animating = 'yellow';
      globalBetTerminaisState.waitingForClassification = true;
      
      setBetTerminaisPendingEntrada(true);
      setAnimatingBetTerminais('yellow');
      setBetTerminaisEntradas(prev => {
        console.log('[DEBUG BET TERMINAIS] Entradas: de', prev, 'para', prev + 1);
        return prev + 1;
      });
      
      console.log('[DEBUG BET TERMINAIS] 3 menos frequentes FIXADOS:', globalBetTerminaisState.fixedLeastThree);
    }
    return;
  }

  // FASE 2: CLASSIFICAÇÃO (quando há padrão ativo)
  console.log('[DEBUG BET TERMINAIS] === FASE CLASSIFICAÇÃO ===');
  console.log('[DEBUG BET TERMINAIS] 3 menos frequentes FIXOS:', globalBetTerminaisState.fixedLeastThree);
  console.log('[DEBUG BET TERMINAIS] Terminal', terminal, 'está nos fixos?', globalBetTerminaisState.fixedLeastThree.includes(terminal));
  
  const isInFixedThree = globalBetTerminaisState.fixedLeastThree.includes(terminal);

  if (isInFixedThree) {
    console.log('[DEBUG BET TERMINAIS] *** LOSS DETECTADO ***');
    
    // LOSS: incrementa LOSS + ENTRADA (continua padrão)
    setBetTerminaisLosses(prev => {
      console.log('[DEBUG BET TERMINAIS] LOSS: de', prev, 'para', prev + 1);
      return prev + 1;
    });
    
    setBetTerminaisEntradas(prev => {
      console.log('[DEBUG BET TERMINAIS] Entradas (LOSS): de', prev, 'para', prev + 1);
      return prev + 1;
    });
    
    // Atualizar sequência negativa
    setBetTerminaisNegSeqCurrent(prev => {
      const next = prev + 1;
      setBetTerminaisNegSeqMax(m => Math.max(m, next));
      console.log('[DEBUG BET TERMINAIS] Seq. Negativa atual:', next);
      return next;
    });
    setBetTerminaisPosSeqCurrent(() => 0);
    
    console.log('[DEBUG BET TERMINAIS] LOSS - mantém borda e continua padrão');
    
  } else {
    console.log('[DEBUG BET TERMINAIS] *** WIN DETECTADO ***');
    
    // WIN: incrementa WIN e ENCERRA padrão
    setBetTerminaisWins(prev => {
      console.log('[DEBUG BET TERMINAIS] WIN: de', prev, 'para', prev + 1);
      return prev + 1;
    });
    
    // Resetar sequência negativa e atualizar positiva
    setBetTerminaisNegSeqCurrent(() => 0);
    setBetTerminaisPosSeqCurrent(prev => {
      const next = prev + 1;
      setBetTerminaisPosSeqMax(m => Math.max(m, next));
      return next;
    });
    
    // ENCERRAR padrão e limpar estado
    globalBetTerminaisState.pending = false;
    globalBetTerminaisState.animating = undefined;
    globalBetTerminaisState.fixedLeastThree = [];
    globalBetTerminaisState.waitingForClassification = false;
    
    // Remover borda
    console.log('[DEBUG BET TERMINAIS] WIN - removendo borda');
    setAnimatingBetTerminais(undefined);
    setBetTerminaisPendingEntrada(false);
    
    setTimeout(() => {
      setAnimatingBetTerminais(undefined);
      setBetTerminaisPendingEntrada(false);
    }, 50);
  }
  
  console.log('=== [DEBUG BET TERMINAIS] FIM ===');
};
