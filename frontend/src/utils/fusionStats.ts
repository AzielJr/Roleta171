// Números de entrada para Fusion
export const FUSION_ENTRY_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 7, 29, 18, 22, 9];

// Números de LOSS para Fusion (mesmos números de entrada)
export const FUSION_LOSS_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 7, 29, 18, 22, 9];

// Números de WIN para Fusion (todos os outros números)
export const FUSION_WIN_NUMBERS = [1, 3, 5, 6, 8, 10, 11, 12, 13, 14, 16, 17, 20, 23, 24, 26, 27, 28, 30, 31, 33, 34, 35, 36];

// Função para calcular estatísticas do Fusion (modo 1 - similar ao P2)
export const calculateFusionStats = (lastNumbers: number[]): { 
  entradas: number; 
  wins: number; 
  losses: number; 
  maxNegativeSequence: number;
  hasRecentEntry: boolean;
  suggestedNumbers: { first: number; second: number; third: number };
  hasConsecutiveEntries: boolean;
} => {
  console.log('🔍 FUSION MODE 1 CALC - Input:', lastNumbers.slice(-10));
  
  if (lastNumbers.length === 0) {
    return { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, currentNegativeSequence: 0, hasRecentEntry: false, hasConsecutiveEntries: false, suggestedNumbers: { first: 0, second: 0, third: 0 } };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxNegativeSequence = 0;
  let currentNegativeSequence = 0;
  let hasRecentEntry = false;
  let hasConsecutiveEntries = false;

  // Verificar se o número mais recente é uma entrada
  if (lastNumbers.length > 0 && FUSION_ENTRY_NUMBERS.includes(lastNumbers[lastNumbers.length - 1])) {
    hasRecentEntry = true;
  }

  // Verificar entradas consecutivas (2 ou mais)
  let consecutiveEntries = 0;
  for (let i = lastNumbers.length - 1; i >= 0 && consecutiveEntries < 10; i--) {
    if (FUSION_ENTRY_NUMBERS.includes(lastNumbers[i])) {
      consecutiveEntries++;
    } else {
      break;
    }
  }
  hasConsecutiveEntries = consecutiveEntries >= 2;

  // Calcular estatísticas baseadas nos números
  for (let i = 0; i < lastNumbers.length; i++) {
    const number = lastNumbers[i];
    
    // Se encontrou uma entrada Fusion, incrementa entradas e verifica o próximo número
    if (FUSION_ENTRY_NUMBERS.includes(number)) {
      entradas++;
      
      // Verificar se há um próximo número para determinar WIN/LOSS
      if (i < lastNumbers.length - 1) {
        const nextNumber = lastNumbers[i + 1];
        
        if (FUSION_LOSS_NUMBERS.includes(nextNumber)) {
          // LOSS: Se o próximo número após entrada Fusion for um dos números de LOSS
          losses++;
          currentNegativeSequence++;
          maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
        } else {
          // WIN: Se o próximo número após entrada Fusion NÃO for um número de LOSS
          wins++;
          currentNegativeSequence = 0; // Reset da sequência negativa
        }
      }
    }
  }

  const result = { entradas, wins, losses, maxNegativeSequence: Math.min(maxNegativeSequence, losses), hasRecentEntry, hasConsecutiveEntries };
  console.log('📊 FUSION MODE 1 RESULT:', result);
  return result;
};

// Função para calcular estatísticas Fusion no modo 2 (entradas consecutivas)
export const calculateFusionStatsMode2 = (lastNumbers: number[]): { 
  entradas: number; 
  wins: number; 
  losses: number; 
  maxNegativeSequence: number;
  hasRecentEntry: boolean;
  suggestedNumbers: { first: number; second: number; third: number };
  hasConsecutiveEntries: boolean;
} => {
  console.log('🔍 FUSION MODE 2 CALC - Input:', lastNumbers.slice(-10));
  
  if (lastNumbers.length === 0) {
    return { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, currentNegativeSequence: 0, hasRecentEntry: false, hasConsecutiveEntries: false, suggestedNumbers: { first: 0, second: 0, third: 0 } };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxNegativeSequence = 0;
  let currentNegativeSequence = 0;

  // Calcular sequência negativa atual (consecutiva de LOSS do final para trás)
  for (let i = lastNumbers.length - 1; i >= 0; i--) {
    if (FUSION_ENTRY_NUMBERS.includes(lastNumbers[i])) {
      currentNegativeSequence++;
    } else {
      break;
    }
  }

  // Calcular maior sequência negativa no histórico
  let tempSequence = 0;
  let hasRecentEntry = false;
  let hasConsecutiveEntries = false;

  // Verificar se há entrada recente
  if (lastNumbers.length > 0 && FUSION_ENTRY_NUMBERS.includes(lastNumbers[lastNumbers.length - 1])) {
    hasRecentEntry = true;
  }

  // Verificar se há entradas consecutivas
  let consecutiveEntries = 0;
  for (let i = lastNumbers.length - 1; i >= 0 && consecutiveEntries < 10; i--) {
    if (FUSION_ENTRY_NUMBERS.includes(lastNumbers[i])) {
      consecutiveEntries++;
    } else {
      break;
    }
  }
  hasConsecutiveEntries = consecutiveEntries >= 2;

  // LÓGICA MODO 2: Só incrementa ENTRADAS a partir do 2º número consecutivo
  for (let i = 0; i < lastNumbers.length; i++) {
    const number = lastNumbers[i];
    
    if (FUSION_ENTRY_NUMBERS.includes(number)) {
      // Só incrementa ENTRADAS se o número ANTERIOR também for Fusion
      let isValidEntry = (i > 0 && FUSION_ENTRY_NUMBERS.includes(lastNumbers[i - 1]));
      
      if (isValidEntry) {
        entradas++;
        
        if (i < lastNumbers.length - 1) {
          const nextNumber = lastNumbers[i + 1];
          
          if (FUSION_LOSS_NUMBERS.includes(nextNumber)) {
            losses++;
            currentNegativeSequence++;
            maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
          } else {
            wins++;
            currentNegativeSequence = 0;
          }
        }
      }
    }
  }

  const result = { 
    entradas, 
    wins, 
    losses, 
    maxNegativeSequence, 
    hasRecentEntry, 
    hasConsecutiveEntries 
  };
  console.log('📊 FUSION MODE 2 RESULT:', result);
  return result;
};








