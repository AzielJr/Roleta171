import React, { useState, useEffect, useRef } from 'react';
import { Statistics } from '../types/roulette';
import { useStatistics } from '../hooks/useStatistics';
import { soundGenerator } from '../utils/soundUtils';
import { calculateFusionStats, FUSION_ENTRY_NUMBERS } from '../utils/fusionStats';

// Sequência real da roleta (Race)
const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

interface StatisticsCardsProps {
  statistics: Statistics;
  rowOrder?: number; // 0, 1, 2 para diferentes ordens das linhas
  patternDetectedCount?: number;
  winCount?: number;
  lossCount?: number;
  numbersWithoutPattern?: number;
  totalNumbersWithoutPattern?: number;
  lastNumbers?: number[]; // Adicionar para detectar colunas repetidas
  pattern171Stats?: {
    entradas: number;
    wins: number;
    losses: number;
  };
  pattern171ForcedStats?: {
    wins: number;
    losses: number;
  };
  // Novos props para P2 persistente
  p2WinCount?: number;
  p2LossCount?: number;
  setP2WinCount?: (value: number | ((prev: number) => number)) => void;
  setP2LossCount?: (value: number | ((prev: number) => number)) => void;
  // Props para configurações do sistema
  avisosSonorosAtivos?: boolean;
  mostrarPadrao5x3Race?: boolean;
  // Novos props para Torre
  torreWinCount?: number;
  torreLossCount?: number;
  setTorreWinCount?: (value: number | ((prev: number) => number)) => void;
  setTorreLossCount?: (value: number | ((prev: number) => number)) => void;
  // Props para BET Terminais
  betTerminaisStats?: {
    wins: number;
    losses: number;
    winPercentage: number;
    lossPercentage: number;
    negativeSequenceCurrent: number;
    negativeSequenceMax: number;
    positiveSequenceCurrent: number;
    positiveSequenceMax: number;
  };
}

// Função para calcular números expostos no padrão 171 Forçado
const calculate171ForcedExposedNumbers = (selectedNumber: number): number[] => {
  const position = ROULETTE_SEQUENCE.indexOf(selectedNumber);
  if (position === -1) return [];
  
  // Voltar 3 posições e pegar 7 números consecutivos
  const startIndex = (position - 3 + 37) % 37;
  const exposedNumbers: number[] = [];
  
  for (let i = 0; i < 7; i++) {
    const index = (startIndex + i) % 37;
    exposedNumbers.push(ROULETTE_SEQUENCE[index]);
  }
  
  return exposedNumbers;
};

// Função para determinar WIN ou LOSS no padrão 171 Forçado
const determine171ForcedResult = (selectedNumber: number, nextNumber: number): 'WIN' | 'LOSS' | null => {
  const exposedNumbers = calculate171ForcedExposedNumbers(selectedNumber);
  if (exposedNumbers.length === 0) return null;
  
  // Os 30 números apostados são todos os outros (não expostos)
  const betNumbers = ROULETTE_SEQUENCE.filter(num => !exposedNumbers.includes(num));
  
  // Primeiro e último dos números expostos (também são WIN)
  const firstExposed = exposedNumbers[0];
  const lastExposed = exposedNumbers[6];
  
  // Os 5 números do meio dos expostos (são LOSS)
  const middleExposed = exposedNumbers.slice(1, 6); // índices 1, 2, 3, 4, 5
  
  // WIN: próximo número é um dos 30 apostados OU primeiro/último exposto
  if (betNumbers.includes(nextNumber) || nextNumber === firstExposed || nextNumber === lastExposed) {
    return 'WIN';
  }
  
  // LOSS: próximo número é um dos 5 números do meio dos expostos
  if (middleExposed.includes(nextNumber)) {
    return 'LOSS';
  }
  
  return null;
};

// Função para calcular estatísticas do 171 Forçado baseado nos últimos números
const calculate171ForcedStats = (lastNumbers: number[]): { wins: number; losses: number; maxPositiveSequence: number; currentPositiveSequence: number } => {
  let wins = 0;
  let losses = 0;
  let maxPositiveSequence = 0;
  let currentPositiveSequence = 0;
  
  // Precisa de pelo menos 2 números para fazer a análise
  if (lastNumbers.length < 2) {
    return { wins, losses, maxPositiveSequence, currentPositiveSequence };
  }
  
  // Analisar cada par de números consecutivos
  // lastNumbers[0] é o mais recente, lastNumbers[1] é o anterior, etc.
  for (let i = 1; i < lastNumbers.length; i++) {
    const currentNumber = lastNumbers[i]; // Número que foi selecionado
    const nextNumber = lastNumbers[i - 1]; // Próximo número que saiu
    
    const result = determine171ForcedResult(currentNumber, nextNumber);
    
    if (result === 'WIN') {      wins++;      currentPositiveSequence++;      if (currentPositiveSequence > maxPositiveSequence) {        maxPositiveSequence = currentPositiveSequence;      }    } else if (result === 'LOSS') {      losses++;      currentPositiveSequence = 0;    }
  }
  
  return { wins, losses, maxPositiveSequence, currentPositiveSequence };
};

// Cores reais da roleta para cada número
const ROULETTE_COLORS: { [key: number]: 'red' | 'black' | 'green' } = {
  0: 'green',
  1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red', 10: 'black',
  11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red', 19: 'red', 20: 'black',
  21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
  31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};

// Números de entrada para P2
const P2_ENTRY_NUMBERS = [3, 4, 7, 11, 15, 18, 21, 22, 25, 29, 33, 36];

// Números de LOSS para P2 (mesmos números de entrada)
const P2_LOSS_NUMBERS = [3, 4, 7, 11, 15, 18, 21, 22, 25, 29, 33, 36];

// Números de WIN para P2
const P2_WIN_NUMBERS = [0, 1, 2, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 19, 20, 23, 24, 26, 27, 28, 30, 31, 32, 34, 35];

// Números de entrada para Torre (conforme especificado pelo usuário)
const TORRE_ENTRY_NUMBERS = [1, 2, 3, 34, 35, 36];

// Números de LOSS para Torre (entrada + zero)
const TORRE_LOSS_NUMBERS = [0, 1, 2, 3, 34, 35, 36];

// Números de WIN para Torre (todos os outros números)
const TORRE_WIN_NUMBERS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];

// Números de LOSS para Fusion (mesmos números de entrada)
// Números de WIN para Fusion (todos os outros números)
// Função para calcular números sugeridos do 5x3
const calculatepadrao5x3Numbers = (lastNumber: number): { first: number; second: number; third: number } => {
  const lastIndex = ROULETTE_SEQUENCE.indexOf(lastNumber);
  if (lastIndex === -1) return { first: 0, second: 0, third: 0 };
  
  // Primeiro número: +6 índices à frente (sentido horário)
  const firstIndex = (lastIndex + 6) % ROULETTE_SEQUENCE.length;
  const first = ROULETTE_SEQUENCE[firstIndex];
  
  // Segundo número: +18 índices à frente (sentido horário)
  const secondIndex = (lastIndex + 18) % ROULETTE_SEQUENCE.length;
  const second = ROULETTE_SEQUENCE[secondIndex];
  
  // Terceiro número: +30 índices à frente (sentido horário)
  const thirdIndex = (lastIndex + 30) % ROULETTE_SEQUENCE.length;
  const third = ROULETTE_SEQUENCE[thirdIndex];
  
  return { first, second, third };
};

// Função para calcular números expostos (LOSS) do 5x3
const calculatepadrao5x3LossNumbers = (baseNumber: number): number[] => {
  const baseIndex = ROULETTE_SEQUENCE.indexOf(baseNumber);
  if (baseIndex === -1) return [];
  
  // Os 4 números expostos são os índices: 0, 12, 24, 36
  const exposedIndices = [0, 12, 24, 36];
  const exposedNumbers: number[] = [];
  
  exposedIndices.forEach(offset => {
    const targetIndex = (baseIndex + offset) % ROULETTE_SEQUENCE.length;
    exposedNumbers.push(ROULETTE_SEQUENCE[targetIndex]);
  });
  
  return exposedNumbers;
};

// Função para calcular estatísticas do 5x3
const calculatepadrao5x3Stats = (lastNumbers: number[]): { 
  entradas: number; 
  wins: number; 
  losses: number;
  maxPositiveSequence: number;
  currentPositiveSequence: number;
  suggestedNumbers: { first: number; second: number; third: number };
} => {
  if (lastNumbers.length === 0) {
    return { entradas: 0, wins: 0, losses: 0, maxPositiveSequence: 0, currentPositiveSequence: 0, suggestedNumbers: { first: 0, second: 0, third: 0 } };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxPositiveSequence = 0;
  let currentPositiveSequence = 0;
  // Calcular números sugeridos baseado no último número
  const lastNumber = lastNumbers[lastNumbers.length - 1];
  const suggestedNumbers = calculatepadrao5x3Numbers(lastNumber);

  // Analisar todos os números para calcular estatísticas
  // Cada número é uma 'entrada' no 5x3
  for (let i = 0; i < lastNumbers.length - 1; i++) {
    const currentNumber = lastNumbers[i];
    const nextNumber = lastNumbers[i + 1];
    
    entradas++;
    
    // Calcular números de LOSS para o número atual
    const lossNumbers = calculatepadrao5x3LossNumbers(currentNumber);
    
    // Verificar se o próximo número é LOSS ou WIN
    if (lossNumbers.includes(nextNumber)) {
      losses++;
      // LOSS: resetar sequência positiva atual
      currentPositiveSequence = 0;
    } else {
      wins++;
      // WIN: incrementar sequência positiva atual
      currentPositiveSequence++;
      // Atualizar maior sequência se necessário
      if (currentPositiveSequence > maxPositiveSequence) {
        maxPositiveSequence = currentPositiveSequence;
      }
    }
  }
  // Se há pelo menos um número, contar como entrada (para o último número)
  if (lastNumbers.length > 0) {
    entradas++;
  }

  // Manter sequência atual se terminou com WIN

  if (lastNumbers.length > 1) {

    const lastNumber = lastNumbers[lastNumbers.length - 2];

    const nextNumber = lastNumbers[lastNumbers.length - 1];

    const lossNumbers = calculatepadrao5x3LossNumbers(lastNumber);

    if (!lossNumbers.includes(nextNumber)) {

      // Último foi WIN, manter currentPositiveSequence

    } else {

      // Último foi LOSS, resetar

      currentPositiveSequence = 0;

    }

  }

  


  // Calcular números sugeridos baseado no último número

  return { entradas, wins, losses, maxPositiveSequence, currentPositiveSequence, suggestedNumbers };
};

// Função para calcular estatísticas do Torre
const calculateTorreStats = (lastNumbers: number[]): { 
  entradas: number; 
  wins: number; 
  losses: number; 
  maxNegativeSequence: number;
  currentNegativeSequence: number;
  hasRecentEntry: boolean;
  hasConsecutiveEntries: boolean;
} => {
  console.log('🔍 TORRE CALC - Input:', lastNumbers.slice(-10)); // Mostrar apenas os últimos 10
  
  if (lastNumbers.length === 0) {
    return { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, currentNegativeSequence: 0, hasRecentEntry: false, hasConsecutiveEntries: false };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxNegativeSequence = 0;
  let currentNegativeSequence = 0;
  let hasRecentEntry = false;
  let hasConsecutiveEntries = false;

  // Verificar se o número mais recente é uma entrada (último do array)
  if (lastNumbers.length > 0 && TORRE_ENTRY_NUMBERS.includes(lastNumbers[lastNumbers.length - 1])) {
    hasRecentEntry = true;
  }

  // Verificar entradas consecutivas (2 ou mais) - começar do final do array
  let consecutiveEntries = 0;
  for (let i = lastNumbers.length - 1; i >= 0 && consecutiveEntries < 10; i--) {
    if (TORRE_ENTRY_NUMBERS.includes(lastNumbers[i])) {
      consecutiveEntries++;
    } else {
      break;
    }
  }
  hasConsecutiveEntries = consecutiveEntries >= 2;

  // Calcular estatísticas baseadas nos números
  // WIN/LOSS só é computado APÓS cada ENTRADA específica (padrão Torre)
  // lastNumbers[length-1] é o mais recente, percorrer do mais antigo para o mais recente
  
  for (let i = 0; i < lastNumbers.length; i++) { // Percorrer do mais antigo para o mais recente
    const number = lastNumbers[i];
    
    // Se encontrou uma entrada Torre, incrementa entradas e verifica o próximo número
    if (TORRE_ENTRY_NUMBERS.includes(number)) {
      entradas++;
      
      // Verificar se há um próximo número (mais recente) para determinar WIN/LOSS
      if (i < lastNumbers.length - 1) { // Se não é o número mais recente
        const nextNumber = lastNumbers[i + 1]; // Próximo número (mais recente)
        
        if (TORRE_LOSS_NUMBERS.includes(nextNumber)) {
          // LOSS: Se o próximo número após entrada Torre for um dos números de LOSS (01,02,03,34,35,36,0)
          losses++;
          // Incrementa sequência NEGATIVA ao ocorrer um LOSS após uma entrada Torre
          currentNegativeSequence++;
          maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
        } else if (TORRE_WIN_NUMBERS.includes(nextNumber)) {
          // WIN: Se o próximo número após entrada Torre for qualquer outro número
          wins++;
          // Zera sequência NEGATIVA ao ocorrer um WIN após uma entrada Torre
          currentNegativeSequence = 0;
        }
      }
    } else {
      // Não é um número de entrada Torre; sequência negativa depende apenas do resultado após entradas.
    }
  }

  const result = { entradas, wins, losses, maxNegativeSequence, currentNegativeSequence, hasRecentEntry, hasConsecutiveEntries };
  console.log('📊 TORRE RESULT:', result);
  return result;
};

// Função para calcular estatísticas do P2 (modo 1 - original)
const calculateP2Stats = (lastNumbers: number[]): { 
  entradas: number; 
  wins: number; 
  losses: number; 
  maxNegativeSequence: number;
  hasRecentEntry: boolean;
  hasConsecutiveEntries: boolean;
} => {
  console.log('🔍 P2 MODE 1 CALC - Input:', lastNumbers.slice(-10)); // Mostrar apenas os últimos 10
  
  if (lastNumbers.length === 0) {
    return { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, hasRecentEntry: false, hasConsecutiveEntries: false };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxPositiveSequence = 0;
  let currentPositiveSequence = 0;
  let maxNegativeSequence = 0;
  let currentNegativeSequence = 0;
  let hasRecentEntry = false;
  let hasConsecutiveEntries = false;

  // Verificar se o número mais recente é uma entrada (CORREÇÃO: último do array)
  if (lastNumbers.length > 0 && P2_ENTRY_NUMBERS.includes(lastNumbers[lastNumbers.length - 1])) {
    hasRecentEntry = true;
  }

  // Verificar entradas consecutivas (2 ou mais) - CORREÇÃO: começar do final do array
  let consecutiveEntries = 0;
  for (let i = lastNumbers.length - 1; i >= 0 && consecutiveEntries < 10; i--) {
    if (P2_ENTRY_NUMBERS.includes(lastNumbers[i])) {
      consecutiveEntries++;
    } else {
      break;
    }
  }
  hasConsecutiveEntries = consecutiveEntries >= 2;

  // Calcular estatísticas baseadas nos números
  // WIN/LOSS só é computado APÓS cada ENTRADA específica (padrão P2)
  // lastNumbers[length-1] é o mais recente, percorrer do mais antigo para o mais recente
  
  for (let i = 0; i < lastNumbers.length; i++) { // Percorrer do mais antigo para o mais recente
    const number = lastNumbers[i];
    
    // Se encontrou uma entrada P2, incrementa entradas e verifica o próximo número
    if (P2_ENTRY_NUMBERS.includes(number)) {
      entradas++;
      
      // Verificar se há um próximo número (mais recente) para determinar WIN/LOSS
      if (i < lastNumbers.length - 1) { // Se não é o número mais recente
        const nextNumber = lastNumbers[i + 1]; // Próximo número (mais recente)
        
        if (P2_ENTRY_NUMBERS.includes(nextNumber)) {
          // LOSS: Se o próximo número após entrada P2 for outro número P2 (consecutivo)
          losses++;
          currentNegativeSequence++;
          maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
        } else {
          // WIN: Se o próximo número após entrada P2 NÃO for um número P2
          wins++;
          currentNegativeSequence = 0; // Reset sequência negativa
        }
      }
    }
  }

  const result = { entradas, wins, losses, maxNegativeSequence, hasRecentEntry, hasConsecutiveEntries };
  console.log('📊 P2 MODE 1 RESULT:', result);
  return result;
};

// Função para calcular estatísticas P2 no modo 2 (entradas consecutivas)
const calculateP2StatsMode2 = (lastNumbers: number[]): { 
  entradas: number; 
  wins: number; 
  losses: number; 
  maxNegativeSequence: number;
  hasRecentEntry: boolean;
  hasConsecutiveEntries: boolean;
} => {
  console.log('🔍 P2 MODE 2 CALC - Input:', lastNumbers.slice(-10)); // Mostrar apenas os últimos 10
  
  if (lastNumbers.length === 0) {
    return { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, hasRecentEntry: false, hasConsecutiveEntries: false };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxPositiveSequence = 0;
  let currentPositiveSequence = 0;
  let maxNegativeSequence = 0;
  let currentNegativeSequence = 0;
  let hasRecentEntry = false;
  let hasConsecutiveEntries = false;

  // Verificar se há entrada recente (último número é P2) - CORREÇÃO: último do array
  if (lastNumbers.length > 0 && P2_ENTRY_NUMBERS.includes(lastNumbers[lastNumbers.length - 1])) {
    hasRecentEntry = true;
  }

  // Verificar se há entradas consecutivas (2 ou mais P2 consecutivos do final)
  let consecutiveEntries = 0;
  for (let i = lastNumbers.length - 1; i >= 0 && consecutiveEntries < 10; i--) {
    if (P2_ENTRY_NUMBERS.includes(lastNumbers[i])) {
      consecutiveEntries++;
    } else {
      break;
    }
  }
  hasConsecutiveEntries = consecutiveEntries >= 2;

  // LÓGICA MODO 2: Só incrementa ENTRADAS a partir do 2º número consecutivo P2
  // Percorrer do mais antigo para o mais recente
  for (let i = 0; i < lastNumbers.length; i++) {
    const number = lastNumbers[i];
    
    // Se encontrou uma entrada P2
    if (P2_ENTRY_NUMBERS.includes(number)) {
      
      // DIFERENÇA DO MODO 2: Só incrementa ENTRADAS se o número ANTERIOR também for P2
      // (ou seja, a partir do 2º número de uma sequência consecutiva)
      let isValidEntry = (i > 0 && P2_ENTRY_NUMBERS.includes(lastNumbers[i - 1]));
      
      if (isValidEntry) {
        entradas++;
        
        // WIN/LOSS só é computado para entradas válidas no modo 2
        if (i < lastNumbers.length - 1) {
          const nextNumber = lastNumbers[i + 1];
          
          if (P2_ENTRY_NUMBERS.includes(nextNumber)) {
            // LOSS: Se o próximo número após entrada P2 for outro número P2 (consecutivo)
            losses++;
            currentNegativeSequence++;
            maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
          } else {
            // WIN: Se o próximo número após entrada P2 NÃO for um número P2
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
  console.log('📊 P2 MODE 2 RESULT:', result);
  return result;
};

// Função para obter a cor de fundo baseada na cor da roleta
const getRouletteColor = (number: number): string => {
  const color = ROULETTE_COLORS[number];
  switch (color) {
    case 'red':
      return 'bg-red-600';
    case 'black':
      return 'bg-gray-900';
    case 'green':
      return 'bg-green-600';
    default:
      return 'bg-gray-600';
  }
};

// Componente para renderizar uma bola de número da roleta
const RouletteBall = ({ number }: { number: number }) => (
  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-gray-300 ${getRouletteColor(number)}`}>
    {number.toString().padStart(2, '0')}
  </div>
);

// Helper: obter coluna do número (1, 2, 3) ou null para 0
const getNumberColumn = (num: number): 1 | 2 | 3 | null => {
  if (num === 0) return null;
  const firstColumn = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
  const secondColumn = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
  const thirdColumn = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
  if (firstColumn.includes(num)) return 1;
  if (secondColumn.includes(num)) return 2;
  if (thirdColumn.includes(num)) return 3;
  return null;
};

export function StatisticsCards({ statistics, rowOrder = 0, patternDetectedCount = 0, winCount = 0, lossCount = 0, numbersWithoutPattern = 0, totalNumbersWithoutPattern = 0, lastNumbers = [], pattern171Stats = { entradas: 0, wins: 0, losses: 0 }, pattern171ForcedStats = { wins: 11, losses: 0 }, p2WinCount = 0, p2LossCount = 0, setP2WinCount, setP2LossCount, avisosSonorosAtivos = true, mostrarPadrao5x3Race = false, torreWinCount = 0, torreLossCount = 0, setTorreWinCount, setTorreLossCount, betTerminaisStats = { wins: 52, losses: 7, winPercentage: 88, lossPercentage: 12, negativeSequenceCurrent: 6, negativeSequenceMax: 16, positiveSequenceCurrent: 0, positiveSequenceMax: 0 } }: StatisticsCardsProps) {
  const [showP2Modal, setShowP2Modal] = useState(false);
  const [showTorreModal, setShowTorreModal] = useState(false);
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [showRaceTrackModal, setShowRaceTrackModal] = useState(false);
  const [showTriangulacaoModal, setShowTriangulacaoModal] = useState(false);
  const [p2Mode, setP2Mode] = useState<1 | 2>(1); // Estado para controlar o modo do toggle P2
  const lastP2ConsecutiveState = useRef(false);

  // Calcular estatísticas do P2 baseado nos últimos números
  const calculatedP2Stats = React.useMemo(() => {
    return p2Mode === 1 ? calculateP2Stats(lastNumbers) : calculateP2StatsMode2(lastNumbers);
  }, [lastNumbers, p2Mode]);

  // Calcular estatísticas do 5x3
  const calculatedFusionStats = React.useMemo(() => {
    return calculateFusionStats(lastNumbers);
  }, [lastNumbers]);

  // Calcular estatísticas do Torre baseado nos últimos números
  const calculatedTorreStats = React.useMemo(() => {
    return calculateTorreStats(lastNumbers);
  }, [lastNumbers]);

  const {
    totalNumbers,
    colorPercentages,
    evenOddPercentages,
    highLowPercentages,
    dozensPercentages,
    columnsPercentages
  } = useStatistics(statistics);

  // Calcular estatísticas do 171 Forçado baseado nos últimos números
  const calculated171ForcedStats = React.useMemo(() => {
    return calculate171ForcedStats(lastNumbers);
  }, [lastNumbers]);

  // Janela selecionada para os cards 32P1 e Castelo (0 = Todos)
  const [window32P1, setWindow32P1] = useState<number>(50);
  const [windowCastelo, setWindowCastelo] = useState<number>(0);

  // Calcular estatísticas dos cards 32P1 e Castelo conforme regras fornecidas
  const calculated32P1Stats = React.useMemo(() => {
    const slice = window32P1 && window32P1 > 0 ? lastNumbers.slice(-window32P1) : lastNumbers;
    let winTotal = 0;
    let wins = 0;
    let losses = 0;
    const winTotalSet = new Set([6, 15, 24, 33]);
    for (const num of slice) {
      const color = ROULETTE_COLORS[num];
      const col = getNumberColumn(num);
      if (winTotalSet.has(num)) winTotal++;
      if (color === 'black' || (color === 'red' && col === 3)) {
        wins++;
      }
      if (num === 0 || (color === 'red' && (col === 1 || col === 2))) {
        losses++;
      }
    }
    return { winTotal, wins, losses, total: slice.length };
  }, [lastNumbers, window32P1]);

  const calculatedCasteloStats = React.useMemo(() => {
    const slice = windowCastelo && windowCastelo > 0 ? lastNumbers.slice(-windowCastelo) : lastNumbers;
    let wins = 0;
    let losses = 0;
    let positiveSequenceCurrent = 0;
    let positiveSequenceMax = 0;
    let negativeSequenceCurrent = 0;
    let negativeSequenceMax = 0;

    for (const num of slice) {
      const isLoss = (num === 0 || num === 15 || num === 24);
      if (isLoss) {
        losses++;
        negativeSequenceCurrent += 1;
        if (negativeSequenceCurrent > negativeSequenceMax) negativeSequenceMax = negativeSequenceCurrent;
        // resetar positiva
        positiveSequenceCurrent = 0;
      } else {
        wins++;
        positiveSequenceCurrent += 1;
        if (positiveSequenceCurrent > positiveSequenceMax) positiveSequenceMax = positiveSequenceCurrent;
        // resetar negativa
        negativeSequenceCurrent = 0;
      }
    }

    return {
      wins,
      losses,
      total: slice.length,
      positiveSequenceCurrent,
      positiveSequenceMax,
      negativeSequenceCurrent,
      negativeSequenceMax
    };
  }, [lastNumbers, windowCastelo]);

  // Estados para animações dos cards
  const [animatingColumns, setAnimatingColumns] = useState<Set<number>>(new Set());
  const [animatingDozens, setAnimatingDozens] = useState<Set<number>>(new Set());
  const [animatingHighLow, setAnimatingHighLow] = useState<Set<string>>(new Set());
  const [animatingEvenOdd, setAnimatingEvenOdd] = useState<Set<string>>(new Set());
  const [animatingColors, setAnimatingColors] = useState<Set<string>>(new Set());
  const [animatingP2, setAnimatingP2] = useState<'none' | 'green' | 'yellow'>('none');
  const [animatingTorre, setAnimatingTorre] = useState<'none' | 'green' | 'yellow'>('none');
  const lastTorreConsecutiveState = useRef(false);
  const [animatingFusion, setAnimatingFusion] = useState<'none' | 'green' | 'yellow'>('none');
  const lastFusionConsecutiveState = useRef(false);
  // Remover animações do Padrão 72 (não há alertas sonoros no 7x7)

  // Função para detectar 3 ou mais números consecutivos da mesma categoria
  const detectRepeatedCategories = () => {
    if (lastNumbers.length < 3) {
      return {
        columns: new Set<number>(),
        dozens: new Set<number>(),
        highLow: new Set<number>(),
        evenOdd: new Set<number>(),
        colors: new Set<string>()
      };
    }

    // Inicializar com sets vazios (estado padrão = sem alertas)
    const repeatedColumns = new Set<number>();
    const repeatedDozens = new Set<number>();
    const repeatedHighLow = new Set<string>();
    const repeatedEvenOdd = new Set<string>();
    const repeatedColors = new Set<string>();

    // Verificar se há padrão contínuo a partir dos números mais recentes
    // Começar com os 3 primeiros números (mais recentes) e expandir se necessário
    let maxSequenceLength = 3;
    
    // Encontrar a maior sequência contínua possível
    for (let len = 3; len <= lastNumbers.length; len++) {
      const sequenceNumbers = lastNumbers.slice(-len);
      
      // Verificar se todos os números da sequência são da mesma categoria
      const firstNum = sequenceNumbers[0];
      
      // COLUNAS
      const firstColumn = firstNum === 0 ? 0 : ((firstNum - 1) % 3) + 1;
      if (firstColumn !== 0) {
        const allSameColumn = sequenceNumbers.every(num => {
          const col = num === 0 ? 0 : ((num - 1) % 3) + 1;
          return col === firstColumn;
        });
        if (allSameColumn) {
          repeatedColumns.add(firstColumn);
          maxSequenceLength = Math.max(maxSequenceLength, len);
        }
      }
      
      // DÚZIAS
      const firstDozen = firstNum === 0 ? 0 : Math.ceil(firstNum / 12);
      if (firstDozen !== 0) {
        const allSameDozen = sequenceNumbers.every(num => {
          const dozen = num === 0 ? 0 : Math.ceil(num / 12);
          return dozen === firstDozen;
        });
        if (allSameDozen) {
          repeatedDozens.add(firstDozen);
          maxSequenceLength = Math.max(maxSequenceLength, len);
        }
      }
      
      // ALTO/BAIXO
      const firstHighLow = firstNum === 0 ? 'green' : (firstNum >= 1 && firstNum <= 18 ? 'low' : 'high');
      if (firstHighLow !== 'green') {
        const allSameHighLow = sequenceNumbers.every(num => {
          const highLow = num === 0 ? 'green' : (num >= 1 && num <= 18 ? 'low' : 'high');
          return highLow === firstHighLow;
        });
        if (allSameHighLow) {
          repeatedHighLow.add(firstHighLow);
          maxSequenceLength = Math.max(maxSequenceLength, len);
        }
      }
      
      // PAR/ÍMPAR
      const firstEvenOdd = firstNum === 0 ? 'green' : (firstNum % 2 === 0 ? 'even' : 'odd');
      if (firstEvenOdd !== 'green') {
        const allSameEvenOdd = sequenceNumbers.every(num => {
          const evenOdd = num === 0 ? 'green' : (num % 2 === 0 ? 'even' : 'odd');
          return evenOdd === firstEvenOdd;
        });
        if (allSameEvenOdd) {
          repeatedEvenOdd.add(firstEvenOdd);
          maxSequenceLength = Math.max(maxSequenceLength, len);
        }
      }
      
      // CORES
      const firstColor = firstNum === 0 ? 'green' : ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(firstNum) ? 'red' : 'black');
      if (firstColor !== 'green') {
        const allSameColor = sequenceNumbers.every(num => {
          const color = num === 0 ? 'green' : ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'red' : 'black');
          return color === firstColor;
        });
        if (allSameColor) {
          repeatedColors.add(firstColor);
          maxSequenceLength = Math.max(maxSequenceLength, len);
        }
      }
    }
    
    return {
      columns: repeatedColumns,
      dozens: repeatedDozens,
      highLow: repeatedHighLow,
      evenOdd: repeatedEvenOdd,
      colors: repeatedColors
    };
  };

  // Efeito para detectar e animar todas as categorias repetidas
  useEffect(() => {
    if (lastNumbers.length >= 3) {
      const repeated = detectRepeatedCategories();
      
      // Manter alertas ativos apenas se há padrões contínuos de 3 ou mais
      setAnimatingColumns(repeated.columns.size > 0 ? repeated.columns : new Set());
      setAnimatingDozens(repeated.dozens.size > 0 ? repeated.dozens : new Set());
      setAnimatingHighLow(repeated.highLow.size > 0 ? repeated.highLow as Set<string> : new Set<string>());
      setAnimatingEvenOdd(repeated.evenOdd.size > 0 ? repeated.evenOdd as Set<string> : new Set<string>());
      setAnimatingColors(repeated.colors.size > 0 ? repeated.colors : new Set());
    } else {
      // Limpar todos os alertas se não há números suficientes
      setAnimatingColumns(new Set<number>());
      setAnimatingDozens(new Set<number>());
      setAnimatingHighLow(new Set<string>());
      setAnimatingEvenOdd(new Set<string>());
      setAnimatingColors(new Set<string>());
    }
  }, [lastNumbers.join(',')]); // Monitorar todos os números, não apenas os últimos 3

  // CORREÇÃO: Usar diretamente os valores calculados ao invés de contadores persistentes
  // Os contadores persistentes estavam causando acumulação incorreta
  
  // Efeito para controlar animações do P2 e tocar som
  useEffect(() => {
    if (calculatedP2Stats.hasConsecutiveEntries) {
      setAnimatingP2('yellow'); // Borda laranja para P2 consecutivos (LOSS)
      
      // Tocar som APENAS quando P2 muda para consecutivo (borda laranja) E avisos sonoros estão ativos
      if (!lastP2ConsecutiveState.current && avisosSonorosAtivos) {
        soundGenerator.playBellSound();
        lastP2ConsecutiveState.current = true;
      }
    } else if (calculatedP2Stats.hasRecentEntry) {
      setAnimatingP2('green'); // Borda verde para primeira entrada P2 (SEM SOM)
      lastP2ConsecutiveState.current = false; // Reset quando não é mais consecutivo
    } else {
      setAnimatingP2('none');
      lastP2ConsecutiveState.current = false;
    }
  }, [calculatedP2Stats.hasConsecutiveEntries, calculatedP2Stats.hasRecentEntry]);

  // 5x3 não tem alertas sonoros ou animações

  // Efeito para controlar animações do Torre e tocar som
  useEffect(() => {
    if (calculatedTorreStats.hasConsecutiveEntries) {
      setAnimatingTorre('yellow'); // Borda laranja para Torre consecutivos (LOSS)
      
      // Tocar som APENAS quando Torre muda para consecutivo (borda laranja) E avisos sonoros estão ativos
      if (!lastTorreConsecutiveState.current && avisosSonorosAtivos) {
        soundGenerator.playBellSound();
        lastTorreConsecutiveState.current = true;
      }
    } else if (calculatedTorreStats.hasRecentEntry) {
      setAnimatingTorre('green'); // Borda verde para primeira entrada Torre (SEM SOM)
      lastTorreConsecutiveState.current = false; // Reset quando não é mais consecutivo
    } else {
      setAnimatingTorre('none');
      lastTorreConsecutiveState.current = false;
    }
  }, [calculatedTorreStats.hasConsecutiveEntries, calculatedTorreStats.hasRecentEntry]);

  // Efeito para controlar animações do Fusion e tocar som
  useEffect(() => {
    if (calculatedFusionStats.hasConsecutiveEntries) {
      setAnimatingFusion('yellow'); // Borda laranja para Fusion consecutivos (LOSS)
      
      // Tocar som APENAS quando Fusion muda para consecutivo (borda laranja) E avisos sonoros estão ativos
      if (!lastFusionConsecutiveState.current && avisosSonorosAtivos) {
        soundGenerator.playBellSound();
        lastFusionConsecutiveState.current = true;
      }
    } else if (calculatedFusionStats.hasRecentEntry) {
      setAnimatingFusion('green'); // Borda verde para primeira entrada Fusion (SEM SOM)
      lastFusionConsecutiveState.current = false; // Reset quando não é mais consecutivo
    } else {
      setAnimatingFusion('none');
      lastFusionConsecutiveState.current = false;
    }
  }, [calculatedFusionStats.hasConsecutiveEntries, calculatedFusionStats.hasRecentEntry]);

  const StatCard = ({ title, data, colors, cardType = 'default', containerClassName = '' }: {
    title: string | React.ReactNode;
    data: Array<{ label: string; value: number; percentage: number; hidePercentage?: boolean; customValue?: string }>;
    colors: string[];
    cardType?: 'columns' | 'dozens' | 'highLow' | 'evenOdd' | 'colors' | 'default';
    containerClassName?: string;
  }) => (
    <div className={`bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24 ${containerClassName}`}>
      <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">{title}</h3>
      <div className="space-y-0.5 lg:space-y-1">
        {data.map((item, index) => {
          // Verificar se o item está repetido baseado no tipo de card
          let isRepeated = false;
          
          switch (cardType) {
            case 'columns':
              isRepeated = animatingColumns.has(index === 0 ? 3 : index === 1 ? 2 : 1);
              break;
            case 'dozens':
              isRepeated = animatingDozens.has(index + 1);
              break;
            case 'highLow':
              const highLowKey = index === 0 ? 'high' : index === 1 ? 'low' : 'green';
              isRepeated = animatingHighLow.has(highLowKey);
              break;
            case 'evenOdd':
              const evenOddKey = index === 0 ? 'even' : index === 1 ? 'odd' : 'green';
              isRepeated = animatingEvenOdd.has(evenOddKey);
              break;
            case 'colors':
              const colorKey = index === 0 ? 'red' : index === 1 ? 'black' : 'green';
              isRepeated = animatingColors.has(colorKey);
              break;
            default:
              isRepeated = false;
          }
          
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 lg:gap-1">
                <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${colors[index]}`}></div>
                <span className="text-xs lg:text-xs text-gray-600 truncate">{item.label}</span>
              </div>
              <div className="text-right">
                <div className={`font-bold text-gray-800 text-xs lg:text-sm ${
                  isRepeated 
                    ? 'animate-pulse-color-size' 
                    : ''
                }`}>
                  {item.customValue !== undefined ? item.customValue : item.value}
                </div>
                {!item.hidePercentage && (
                  <div className="text-xs lg:text-xs text-gray-500">{item.percentage}%</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Função para calcular estatísticas dos terminais
  const calculateTerminaisStats = React.useMemo(() => {
    const terminaisCount: { [key: number]: number } = {};
    
    // Inicializar contadores para terminais 0-9
    for (let i = 0; i <= 9; i++) {
      terminaisCount[i] = 0;
    }
    
    // Contar ocorrências dos últimos 50 números
    const last50Numbers = lastNumbers.slice(-50);
    last50Numbers.forEach(num => {
      const terminal = num % 10;
      terminaisCount[terminal]++;
    });
    
    // Converter para array com percentuais
    const terminaisData = [];
    for (let i = 0; i <= 9; i++) {
      const count = terminaisCount[i];
      const percentage = last50Numbers.length > 0 ? Math.round((count / last50Numbers.length) * 100) : 0;
      
      // Determinar quais números pertencem a este terminal
      const numbersInTerminal = [];
      for (let num = i; num <= 36; num += 10) {
        if (num <= 36) {
          numbersInTerminal.push(num);
        }
      }
      
      terminaisData.push({
        terminal: i,
        count,
        percentage,
        numbers: numbersInTerminal
      });
    }
    
    return terminaisData.sort((a, b) => b.count - a.count);
  }, [lastNumbers]);

  // Função para calcular colunas combinadas (1&2, 1&3, 2&3)
  const calculateCombinedColumnsStats = React.useMemo(() => {
    const nums = lastNumbers;
    let c12 = 0, c13 = 0, c23 = 0;
    let base = 0;
    nums.forEach(num => {
      const col = getNumberColumn(num);
      if (col === null) return; // Ignora o zero
      base++;
      if (col === 1) { c12++; c13++; }
      else if (col === 2) { c12++; c23++; }
      else if (col === 3) { c13++; c23++; }
    });
    const pct = (count: number) => base > 0 ? Math.round((count / base) * 100) : 0;
    return { c12, p12: pct(c12), c13, p13: pct(c13), c23, p23: pct(c23), base };
  }, [lastNumbers]);

  // Triangulação: tríade com base no último número e seus vizinhos
  const triangulacaoTriadDisplay = React.useMemo(() => {
    const len = ROULETTE_SEQUENCE.length;
    const last = lastNumbers[lastNumbers.length - 1];
    let baseIndex = ROULETTE_SEQUENCE.indexOf(last);
    if (baseIndex < 0) baseIndex = 0; // fallback para 0
    const secondIndex = (baseIndex + 12) % len;
    const thirdIndex = (baseIndex + 24) % len;
    return [ROULETTE_SEQUENCE[baseIndex], ROULETTE_SEQUENCE[secondIndex], ROULETTE_SEQUENCE[thirdIndex]];
  }, [lastNumbers]);

  const triangulacaoSections = React.useMemo(() => {
    const len = ROULETTE_SEQUENCE.length;
    const getNeighbors = (pos: number, count: number) => {
      const right: number[] = [];
      const left: number[] = [];
      for (let i = 1; i <= count; i++) {
        right.push(ROULETTE_SEQUENCE[(pos + i) % len]);
        left.push(ROULETTE_SEQUENCE[(pos - i + len) % len]);
      }
      return { right, left };
    };
    return triangulacaoTriadDisplay.map(center => {
      const pos = ROULETTE_SEQUENCE.indexOf(center);
      const { right, left } = getNeighbors(pos, 4);
      return { center, neighborsRight: right, neighborsLeft: left };
    });
  }, [triangulacaoTriadDisplay]);

  const triangulacaoCoveredNumbers = React.useMemo(() => {
    const set = new Set<number>();
    triangulacaoSections.forEach(section => {
      set.add(section.center);
      section.neighborsRight.forEach(n => set.add(n));
      section.neighborsLeft.forEach(n => set.add(n));
    });
    return Array.from(set);
  }, [triangulacaoSections]);

  const triangulacaoExposedNumbers = React.useMemo(() => {
    return ROULETTE_SEQUENCE.filter(n => !triangulacaoCoveredNumbers.includes(n));
  }, [triangulacaoCoveredNumbers]);

  // Estatísticas da Triangulação: WIN/LOSS e sequências
  const calculatedTriangulacaoStats = React.useMemo(() => {
    const len = ROULETTE_SEQUENCE.length;
    let wins = 0, losses = 0;
    let positiveSequenceCurrent = 0, positiveSequenceMax = 0;
    let negativeSequenceCurrent = 0, negativeSequenceMax = 0;

    if (lastNumbers.length < 2) {
      return {
        wins: 0, losses: 0,
        winPercentage: 0, lossPercentage: 0,
        positiveSequenceCurrent: 0, positiveSequenceMax: 0,
        negativeSequenceCurrent: 0, negativeSequenceMax: 0
      };
    }

    for (let i = 1; i < lastNumbers.length; i++) {
      const base = lastNumbers[i - 1];
      let baseIndex = ROULETTE_SEQUENCE.indexOf(base);
      if (baseIndex < 0) baseIndex = 0; // fallback

      const centers = [
        ROULETTE_SEQUENCE[baseIndex],
        ROULETTE_SEQUENCE[(baseIndex + 12) % len],
        ROULETTE_SEQUENCE[(baseIndex + 24) % len]
      ];

      const cover = new Set<number>();
      centers.forEach(center => {
        cover.add(center);
        const pos = ROULETTE_SEQUENCE.indexOf(center);
        for (let k = 1; k <= 4; k++) {
          cover.add(ROULETTE_SEQUENCE[(pos + k) % len]);
          cover.add(ROULETTE_SEQUENCE[(pos - k + len) % len]);
        }
      });

      const result = lastNumbers[i];
      if (cover.has(result)) {
        wins++;
        positiveSequenceCurrent += 1;
        negativeSequenceCurrent = 0;
        if (positiveSequenceCurrent > positiveSequenceMax) positiveSequenceMax = positiveSequenceCurrent;
      } else {
        losses++;
        negativeSequenceCurrent += 1;
        positiveSequenceCurrent = 0;
        if (negativeSequenceCurrent > negativeSequenceMax) negativeSequenceMax = negativeSequenceCurrent;
      }
    }

    const total = wins + losses;
    const winPercentage = total > 0 ? Math.round((wins / total) * 100) : 0;
    const lossPercentage = total > 0 ? Math.round((losses / total) * 100) : 0;

    return {
      wins,
      losses,
      winPercentage,
      lossPercentage,
      positiveSequenceCurrent,
      positiveSequenceMax,
      negativeSequenceCurrent,
      negativeSequenceMax
    };
  }, [lastNumbers]);
 
   // Stats de exibição para BET Terminais (zerar quando não há dados)
   const betTerminaisStatsDisplay = React.useMemo(() => {
    if (!betTerminaisStats) {
      return { wins: 0, losses: 0, winPercentage: 0, lossPercentage: 0, negativeSequenceCurrent: 0, negativeSequenceMax: 0, positiveSequenceCurrent: 0, positiveSequenceMax: 0 };
    }
    if (lastNumbers.length === 0) {
      return { wins: 0, losses: 0, winPercentage: 0, lossPercentage: 0, negativeSequenceCurrent: 0, negativeSequenceMax: 0, positiveSequenceCurrent: 0, positiveSequenceMax: 0 };
    }
    return betTerminaisStats;
  }, [lastNumbers, betTerminaisStats]);

  // Função para calcular ranking das estratégias por WINs
  // Função para calcular estatísticas das seções da Race Track
  const calculateRaceTrackStats = React.useMemo(() => {
    const last50Numbers = lastNumbers.slice(-50);
    
    // Definição das seções da race track
    const sections = {
      'Voisins': [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
      'Tiers': [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
      'Orphelins': [1, 20, 14, 31, 9, 17, 34, 6],
      'Zero': [12, 35, 3, 26, 0, 32, 15]
    };
    
    const stats = Object.entries(sections).map(([name, sectionNumbers]) => {
      const count = last50Numbers.filter(num => sectionNumbers.includes(num)).length;
      const percentage = last50Numbers.length > 0 ? Math.round((count / last50Numbers.length) * 100) : 0;
      
      return {
        name,
        count,
        percentage
      };
    });
    
    return stats.sort((a, b) => b.count - a.count);
  }, [lastNumbers]);

  const calculateStrategiesRanking = React.useMemo(() => {
    const strategies = [
      {
        name: 'Torre',
        wins: calculatedTorreStats.wins,
        winPercentage: (calculatedTorreStats.wins + calculatedTorreStats.losses) > 0 ? Math.round((calculatedTorreStats.wins / (calculatedTorreStats.wins + calculatedTorreStats.losses)) * 100) : 0
      },
      {
        name: 'P2',
        wins: calculatedP2Stats.wins,
        winPercentage: (calculatedP2Stats.wins + calculatedP2Stats.losses) > 0 ? Math.round((calculatedP2Stats.wins / (calculatedP2Stats.wins + calculatedP2Stats.losses)) * 100) : 0
      },
      {
        name: 'Fusion',
        wins: calculatedFusionStats.wins,
        winPercentage: (calculatedFusionStats.wins + calculatedFusionStats.losses) > 0 ? Math.round((calculatedFusionStats.wins / (calculatedFusionStats.wins + calculatedFusionStats.losses)) * 100) : 0
      },
      {
        name: 'BET Terminais',
        wins: betTerminaisStatsDisplay.wins,
        winPercentage: betTerminaisStatsDisplay.winPercentage
      },
      {
        name: '171',
        wins: pattern171Stats.wins,
        winPercentage: pattern171Stats.entradas > 0 ? Math.round((pattern171Stats.wins / pattern171Stats.entradas) * 100) : 0
      },
      {
        name: '171 Forçado (5)',
        wins: calculated171ForcedStats.wins,
        winPercentage: (calculated171ForcedStats.wins + calculated171ForcedStats.losses) > 0 ? Math.round((calculated171ForcedStats.wins / (calculated171ForcedStats.wins + calculated171ForcedStats.losses)) * 100) : 0
      },
      {
        name: 'Triangulação',
        wins: calculatedTriangulacaoStats.wins,
        winPercentage: calculatedTriangulacaoStats.winPercentage
      },
      {
        name: '32P3',
        wins: calculated32P1Stats.wins,
        // Percentual baseado no campo WIN do card 32P1: wins / total
        winPercentage: calculated32P1Stats.total > 0 ? Math.round((calculated32P1Stats.wins / calculated32P1Stats.total) * 100) : 0
      },
      {
        name: 'Castelo',
        wins: calculatedCasteloStats.wins,
        // Percentual baseado no campo WIN do card Castelo: wins / total
        winPercentage: calculatedCasteloStats.total > 0 ? Math.round((calculatedCasteloStats.wins / calculatedCasteloStats.total) * 100) : 0
      }
    ];
    
    // Ordenar por percentual de vitórias (maior para menor)
    return strategies.sort((a, b) => b.winPercentage - a.winPercentage);
  }, [calculatedTorreStats, calculatedP2Stats, calculatedFusionStats, betTerminaisStatsDisplay, pattern171Stats, calculated171ForcedStats, calculatedTriangulacaoStats, calculated32P1Stats, calculatedCasteloStats]);

  // Ordem fixa para exibição no card Ranking (sem rolagem)
  const displayStrategiesRanking = React.useMemo(() => {
    // Exibir ordenado por maior percentual de vitórias para menor
    return calculateStrategiesRanking;
  }, [calculateStrategiesRanking]);

  return (
    <div className="space-y-3 flex flex-col">
      {/* Primeira linha - 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 lg:gap-2 transition-all duration-300 ease-in-out" style={{
        order: rowOrder === 0 ? 1 : rowOrder === 1 ? 3 : 2,
        marginTop: '0',
        marginBottom: rowOrder === 1 ? '0' : '0.75rem'
      }}>
        {/* Card - Ranking das Estratégias (de volta ao primeiro da 1ª linha) */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">Ranking Estratégias</h3>
          <style>{`
            .ranking-scroll { scrollbar-width: thin; scrollbar-color: #4b5563 #111827; }
            .ranking-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
            .ranking-scroll::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 6px; }
            .ranking-scroll::-webkit-scrollbar-track { background-color: #111827; }
          `}</style>
          <div>
            <div className="space-y-0.5 ranking-scroll max-h-[150px] overflow-y-auto pr-1">
              {displayStrategiesRanking.map((strategy, index) => (
                <div key={strategy.name} className="flex justify-between items-center px-1 py-0.5 rounded text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <span className="text-xs text-gray-600 truncate font-medium">
                      {strategy.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800 text-xs">{strategy.winPercentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Novo card 32P3 (apenas rótulo; lógica permanece 32P1) */}
        <StatCard
          title={
            <div className="flex justify-between items-center w-full">
              <span>32P3</span>
              <select
                className="text-xs bg-gray-200 text-gray-700 rounded px-1 py-0.5"
                value={window32P1}
                onChange={(e) => setWindow32P1(parseInt(e.target.value))}
                title="Selecione a janela de números para 32P3"
              >
                <option value={0}>Todos</option>
                <option value={10}>Últimos 10</option>
                <option value={20}>Últimos 20</option>
                <option value={30}>Últimos 30</option>
                <option value={40}>Últimos 40</option>
                <option value={50}>Últimos 50</option>
              </select>
            </div>
          }
          data={[
            { label: 'WIN TOTAL', value: calculated32P1Stats.winTotal, percentage: calculated32P1Stats.total > 0 ? Math.round((calculated32P1Stats.winTotal / calculated32P1Stats.total) * 100) : 0 },
            { label: 'WIN', value: calculated32P1Stats.wins, percentage: calculated32P1Stats.total > 0 ? Math.round((calculated32P1Stats.wins / calculated32P1Stats.total) * 100) : 0 },
            { label: 'LOSS', value: calculated32P1Stats.losses, percentage: calculated32P1Stats.total > 0 ? Math.round((calculated32P1Stats.losses / calculated32P1Stats.total) * 100) : 0 }
          ]}
          colors={['bg-blue-500', 'bg-green-500', 'bg-red-500']}
        />

        <StatCard
          title={
            <div className={`cursor-pointer transition-all duration-300 flex justify-between items-center ${
              animatingTorre === 'green' 
                ? 'animate-pulse-green-border' 
                : animatingTorre === 'yellow' 
                ? 'animate-pulse-yellow-border' 
                : ''
            }`} onClick={() => setShowTorreModal(true)}>
              <span>Torre</span>
            </div>
          }
          data={[
            { label: 'Entradas', value: calculatedTorreStats.entradas, percentage: totalNumbers > 0 ? Math.round((calculatedTorreStats.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: calculatedTorreStats.wins, percentage: (calculatedTorreStats.wins + calculatedTorreStats.losses) > 0 ? Math.round((calculatedTorreStats.wins / (calculatedTorreStats.wins + calculatedTorreStats.losses)) * 100) : 0 },
            { label: 'LOSS', value: calculatedTorreStats.losses, percentage: (calculatedTorreStats.wins + calculatedTorreStats.losses) > 0 ? Math.round((calculatedTorreStats.losses / (calculatedTorreStats.wins + calculatedTorreStats.losses)) * 100) : 0 },
            { label: 'Seq. Negativa', value: calculatedTorreStats.maxNegativeSequence, customValue: `${calculatedTorreStats.currentNegativeSequence}/${calculatedTorreStats.maxNegativeSequence}`, percentage: calculatedTorreStats.entradas > 0 ? Math.round((calculatedTorreStats.maxNegativeSequence / calculatedTorreStats.entradas) * 100) : 0, hidePercentage: true }
          ]}
          colors={['bg-gray-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500']}
        />

        {/* Card Triangulação (substitui Coluna Combinada) */}
         <StatCard
           title={
             <div className="flex items-center justify-between">
               <span
                 className="cursor-pointer hover:text-blue-600 transition-colors"
                 onClick={() => setShowTriangulacaoModal(true)}
                 title="Clique para ver cobertura e números expostos"
               >
                 Triangulação
               </span>
               <div className="flex items-center gap-1">
                  {triangulacaoTriadDisplay.map(n => (
                    <div key={n} className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${getRouletteColor(n)}`}>
                      {n.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
             </div>
           }
           containerClassName="min-h-[111px]"
           data={[
             { label: 'WIN', value: calculatedTriangulacaoStats.wins, percentage: calculatedTriangulacaoStats.winPercentage },
             { label: 'LOSS', value: calculatedTriangulacaoStats.losses, percentage: calculatedTriangulacaoStats.lossPercentage },
             { label: 'Seq. Positiva', value: 0, percentage: 0, hidePercentage: true, customValue: `${calculatedTriangulacaoStats.positiveSequenceCurrent}/${calculatedTriangulacaoStats.positiveSequenceMax}` },
             { label: 'Seq. Negativa', value: 0, percentage: 0, hidePercentage: true, customValue: `${calculatedTriangulacaoStats.negativeSequenceCurrent}/${calculatedTriangulacaoStats.negativeSequenceMax}` }
           ]}
           colors={['bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-orange-500']}
         />

        {/* Card BET Terminais (agora na 1ª linha, posição do antigo Fusion) */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24">
          <div className="flex justify-between items-center mb-1 lg:mb-2">
            <h3 className="text-xs lg:text-sm font-semibold text-gray-800">BET Terminais</h3>
            {calculateTerminaisStats.length > 0 && (
              <div className="flex items-center gap-[5px]">
                {calculateTerminaisStats.slice(-3).map(({ terminal }, idx) => (
                  <span key={`bet-${terminal}-${idx}`} className="text-yellow-500 font-semibold text-xs lg:text-sm">{terminal}</span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500"></div>
                <span className="text-xs lg:text-xs text-gray-600">WIN</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs lg:text-sm">{betTerminaisStatsDisplay.wins}</div>
                <div className="text-xs lg:text-xs text-gray-500">{betTerminaisStatsDisplay.winPercentage}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-red-500"></div>
                <span className="text-xs lg:text-xs text-gray-600">LOSS</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs lg:text-sm">{betTerminaisStatsDisplay.losses}</div>
                <div className="text-xs lg:text-xs text-gray-500">{betTerminaisStatsDisplay.lossPercentage}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-[25px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs lg:text-xs text-gray-600">Seq. Positiva</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs lg:text-sm">{betTerminaisStatsDisplay.positiveSequenceCurrent}/{betTerminaisStatsDisplay.positiveSequenceMax}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs lg:text-xs text-gray-600">Seq. Negativa</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs lg:text-sm">{betTerminaisStatsDisplay.negativeSequenceCurrent}/{betTerminaisStatsDisplay.negativeSequenceMax}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Castelo (agora na 1ª linha) */}
        <StatCard
          title={
            <div className="flex justify-between items-center w-full">
              <span>Castelo</span>
              <select
                className="text-xs bg-gray-200 text-gray-700 rounded px-1 py-0.5"
                value={windowCastelo}
                onChange={(e) => setWindowCastelo(parseInt(e.target.value))}
                title="Selecione a janela de números para Castelo"
              >
                <option value={0}>Todos</option>
                <option value={10}>Últimos 10</option>
                <option value={20}>Últimos 20</option>
                <option value={30}>Últimos 30</option>
                <option value={40}>Últimos 40</option>
                <option value={50}>Últimos 50</option>
              </select>
            </div>
          }
          data={[
            { label: 'WIN', value: calculatedCasteloStats.wins, percentage: calculatedCasteloStats.total > 0 ? Math.round((calculatedCasteloStats.wins / calculatedCasteloStats.total) * 100) : 0 },
            { label: 'LOSS', value: calculatedCasteloStats.losses, percentage: calculatedCasteloStats.total > 0 ? Math.round((calculatedCasteloStats.losses / calculatedCasteloStats.total) * 100) : 0 },
            { label: 'Seq. Positiva', value: 0, percentage: 0, hidePercentage: true, customValue: `${calculatedCasteloStats.positiveSequenceCurrent}/${calculatedCasteloStats.positiveSequenceMax}` },
            { label: 'Seq. Negativa', value: 0, percentage: 0, hidePercentage: true, customValue: `${calculatedCasteloStats.negativeSequenceCurrent}/${calculatedCasteloStats.negativeSequenceMax}` }
          ]}
          colors={['bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-orange-500']}
        />

        
      </div>

      {/* Segunda linha - 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 lg:gap-2 transition-all duration-300 ease-in-out" style={{
        order: rowOrder === 0 ? 2 : rowOrder === 1 ? 1 : 3,
        marginTop: '0',
        marginBottom: rowOrder === 2 ? '0' : '0.75rem'
      }}>
        {/* Card 171 Forçado (5) - 1º da 2ª linha */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">171 Forçado (5)</h3>
          <div className="space-y-0.5">
            {/* WIN */}
            <div className="flex justify-between items-center px-0 py-1 rounded">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500"></div>
                <span className="text-xs lg:text-xs text-gray-600 truncate">WIN</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculated171ForcedStats.wins}</div>
                <div className="text-xs lg:text-xs text-gray-500">{(calculated171ForcedStats.wins + calculated171ForcedStats.losses) > 0 ? Math.round((calculated171ForcedStats.wins / (calculated171ForcedStats.wins + calculated171ForcedStats.losses)) * 100) : 0}%</div>
              </div>
            </div>
            {/* LOSS */}
            <div className="flex justify-between items-center px-0 py-1 rounded">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-red-500"></div>
                <span className="text-xs lg:text-xs text-gray-600 truncate">LOSS</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculated171ForcedStats.losses}</div>
                <div className="text-xs lg:text-xs text-gray-500">{(calculated171ForcedStats.wins + calculated171ForcedStats.losses) > 0 ? Math.round((calculated171ForcedStats.losses / (calculated171ForcedStats.wins + calculated171ForcedStats.losses)) * 100) : 0}%</div>
              </div>
            </div>
          </div>
          {/* Footer - Seq. Negativa */}
          <div className="mt-0 pt-0">
            <div className="flex justify-between items-center px-0 py-1 rounded ">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs lg:text-xs text-gray-600 truncate">Seq. Negativa</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculated171ForcedStats.currentPositiveSequence}/{calculated171ForcedStats.maxPositiveSequence}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 171 (agora na 2ª linha) */}
        <StatCard
          title={
            <div className="flex justify-between items-center w-full">
              <span>171</span>
              <span className="font-normal text-xs text-gray-500">
                Qt: <span className="font-bold text-white">{numbersWithoutPattern}</span> - 
                Md: <span className="font-bold text-white">{pattern171Stats.entradas > 0 ? Math.round((lastNumbers.length / pattern171Stats.entradas) * 100) / 100 : 0}</span>
              </span>
            </div>
          }
          data={[
            { label: 'Entradas', value: pattern171Stats.entradas, percentage: totalNumbers > 0 ? Math.round((pattern171Stats.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: pattern171Stats.wins, percentage: pattern171Stats.entradas > 0 ? Math.round((pattern171Stats.wins / pattern171Stats.entradas) * 100) : 0 },
            { label: 'LOSS', value: pattern171Stats.losses, percentage: pattern171Stats.entradas > 0 ? Math.round((pattern171Stats.losses / pattern171Stats.entradas) * 100) : 0 }
          ]}
          colors={['bg-gray-500', 'bg-green-500', 'bg-red-500']}
        />

        {/* Colunas e Cores seguem após Castelo */}

        <StatCard
          title="Colunas"
          containerClassName="min-h-[111px]"
          data={[
            { label: '3ª Coluna', value: statistics.columns.third, percentage: columnsPercentages.third },
            { label: '2ª Coluna', value: statistics.columns.second, percentage: columnsPercentages.second },
            { label: '1ª Coluna', value: statistics.columns.first, percentage: columnsPercentages.first }
          ]}
          colors={['bg-emerald-500', 'bg-teal-500', 'bg-lime-500']}
          cardType="columns"
        />
        <StatCard
          title="Cores"
          data={[
            { label: 'Vermelho', value: statistics.colors.red, percentage: colorPercentages.red },
            { label: 'Preto', value: statistics.colors.black, percentage: colorPercentages.black },
            { label: 'Verde (0)', value: statistics.colors.green, percentage: colorPercentages.green }
          ]}
          colors={['bg-red-500', 'bg-gray-800', 'bg-green-500']}
          cardType="colors"
        />

        {/* Card Alto/Baixo (4º da 2ª linha) */}
        <StatCard
          title="Alto/Baixo"
          data={[
            { label: 'Alto (19-36)', value: statistics.highLow.high, percentage: highLowPercentages.high },
            { label: 'Baixo (1-18)', value: statistics.highLow.low, percentage: highLowPercentages.low },
            { label: 'Zero', value: statistics.colors.green, percentage: highLowPercentages.zero }
          ]}
          colors={['bg-purple-500', 'bg-yellow-500', 'bg-green-500']}
          cardType="highLow"
        />

        {/* Card Terminais (agora na 1ª linha, posição do antigo P2) */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24">
          <div className="flex justify-between items-center mb-1 lg:mb-2">
            <h3 className="text-xs lg:text-sm font-semibold text-gray-800">Terminais</h3>
            {calculateTerminaisStats.length > 0 && (
              <div className="flex items-center gap-[5px]">
                {calculateTerminaisStats.slice(-3).map(({ terminal }, idx) => (
                  <span key={`${terminal}-${idx}`} className="text-yellow-500 font-semibold text-xs lg:text-sm">{terminal}</span>
                ))}
              </div>
            )}
          </div>
          <div className="ranking-scroll max-h-[calc(8rem+19px)] overflow-y-auto">
            <div className="space-y-0.5">
              {lastNumbers.length > 0 ? (
                calculateTerminaisStats.slice(0, 10).map(({ terminal, count, percentage, numbers }) => (
                  <div key={terminal} className="flex justify-between items-center px-1 py-0.5 rounded text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-[14px]">
                        {terminal}
                      </div>
                      <span className="text-xs text-gray-600 truncate">
                        {numbers.map(n => n.toString().padStart(2, '0')).join(',')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800 text-xs">{count}</div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Terminais movido para o fim da 3ª linha */}

      </div>

      {/* Terceira linha - 6 cards (Par/Ímpar, Dúzias, Race Track, Números, Coluna Combinada, Terminais) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 lg:gap-2 transition-all duration-300 ease-in-out" style={{
        order: rowOrder === 0 ? 3 : rowOrder === 1 ? 2 : 1,
        marginTop: '0',
        marginBottom: rowOrder === 0 ? '0' : '0.75rem'
      }}>
        {/* Card Par/Ímpar (agora primeiro da 3ª linha) */}
        <StatCard
          title="Par/Ímpar"
          data={[
            { label: 'Par', value: statistics.evenOdd.even, percentage: evenOddPercentages.even },
            { label: 'Ímpar', value: statistics.evenOdd.odd, percentage: evenOddPercentages.odd },
            { label: 'Zero', value: statistics.colors.green, percentage: evenOddPercentages.zero }
          ]}
          colors={['bg-blue-500', 'bg-orange-500', 'bg-green-500']}
          cardType="evenOdd"
        />
        {/* Card - Race Track (2º da 3ª linha) */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-[111px]">
          <h3 
            className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setShowRaceTrackModal(true)}
            title="Clique para ver os números de cada seção da Race Track"
          >
            Race Track
          </h3>
          <div>
            <div className="space-y-0.5">
              {calculateRaceTrackStats.map((section, index) => (
                <div key={section.name} className="flex justify-between items-center px-1 py-0.5 rounded text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <span className="text-xs text-gray-600 truncate font-medium">
                      {section.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800 text-xs">{section.count}</div>
                    <div className="text-xs text-gray-500">{section.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Card Dúzias (3º da 3ª linha) */}
        <StatCard
          title="Dúzias"
          data={[
            { label: '1ª (1-12)', value: statistics.dozens.first, percentage: dozensPercentages.first },
            { label: '2ª (13-24)', value: statistics.dozens.second, percentage: dozensPercentages.second },
            { label: '3ª (25-36)', value: statistics.dozens.third, percentage: dozensPercentages.third }
          ]}
          colors={['bg-cyan-500', 'bg-indigo-500', 'bg-pink-500']}
          cardType="dozens"
        />

        {/* Card Fusion - movido para a posição onde estava o Ranking */}
        <StatCard
          title={
            <div className={`cursor-pointer transition-all duration-300 flex justify-between items-center ${
              animatingFusion === 'green' 
                ? 'animate-pulse-green-border' 
                : animatingFusion === 'yellow' 
                ? 'animate-pulse-yellow-border' 
                : ''
            }`} onClick={() => setShowFusionModal(true)}>
              <span>Fusion</span>
            </div>
          }
          data={[
            { label: 'Entradas', value: calculatedFusionStats.entradas, percentage: totalNumbers > 0 ? Math.round((calculatedFusionStats.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: calculatedFusionStats.wins, percentage: (calculatedFusionStats.wins + calculatedFusionStats.losses) > 0 ? Math.round((calculatedFusionStats.wins / (calculatedFusionStats.wins + calculatedFusionStats.losses)) * 100) : 0 },
            { label: 'LOSS', value: calculatedFusionStats.losses, percentage: (calculatedFusionStats.wins + calculatedFusionStats.losses) > 0 ? Math.round((calculatedFusionStats.losses / (calculatedFusionStats.wins + calculatedFusionStats.losses)) * 100) : 0 },
            { label: '> Seq. Negativa', value: calculatedFusionStats.maxNegativeSequence, percentage: calculatedFusionStats.entradas > 0 ? Math.round((calculatedFusionStats.maxNegativeSequence / calculatedFusionStats.entradas) * 100) : 0, hidePercentage: true }
          ]}
          colors={['bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-blue-500']}
        />

        {/* Card P2 - movido para 3ª linha, posição do Terminais */}
        <StatCard
          title={
            <div className={`cursor-pointer transition-all duration-300 flex justify-between items-center ${
              animatingP2 === 'green' 
                ? 'animate-pulse-green-border' 
                : animatingP2 === 'yellow' 
                ? 'animate-pulse-yellow-border' 
                : ''
            }`} onClick={() => setShowP2Modal(true)}>
              <span>P2</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setP2Mode(1);
                  }}
                  title="Com 1 padrão"
                  className={`rounded transition-all ${
                    p2Mode === 1 
                      ? 'px-2 py-1 text-xs bg-blue-500 text-white' 
                      : 'px-1 py-0.5 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 opacity-70 scale-90'
                  }`}
                >
                  1
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setP2Mode(2);
                  }}
                  title="Com 2 padrões"
                  className={`rounded transition-all ${
                    p2Mode === 2 
                      ? 'px-2 py-1 text-xs bg-blue-500 text-white' 
                      : 'px-1 py-0.5 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 opacity-70 scale-90'
                  }`}
                >
                  2
                </button>
              </div>
            </div>
          }
          containerClassName="min-h-[111px]"
          data={[
            { label: 'Entradas', value: calculatedP2Stats.entradas, percentage: totalNumbers > 0 ? Math.round((calculatedP2Stats.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: calculatedP2Stats.wins, percentage: (calculatedP2Stats.wins + calculatedP2Stats.losses) > 0 ? Math.round((calculatedP2Stats.wins / (calculatedP2Stats.wins + calculatedP2Stats.losses)) * 100) : 0 },
            { label: 'LOSS', value: calculatedP2Stats.losses, percentage: (calculatedP2Stats.wins + calculatedP2Stats.losses) > 0 ? Math.round((calculatedP2Stats.losses / (calculatedP2Stats.wins + calculatedP2Stats.losses)) * 100) : 0 },
            { label: '> Seq. Negativa', value: calculatedP2Stats.maxNegativeSequence, percentage: calculatedP2Stats.entradas > 0 ? Math.round((calculatedP2Stats.maxNegativeSequence / calculatedP2Stats.entradas) * 100) : 0, hidePercentage: true }
          ]}
          colors={['bg-gray-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500']}
        />

        {/* Card - Números (Max 50) (agora na posição onde estava o Ranking) */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">Números (Max 50)</h3>
          <div className="ranking-scroll max-h-[calc(8rem+16px)] overflow-y-auto">
            <div className="space-y-0.5">
              {React.useMemo(() => {
                const numberCounts: { [key: number]: number } = {};
                lastNumbers.forEach(num => {
                  numberCounts[num] = (numberCounts[num] || 0) + 1;
                });

                const sortedNumbers = Object.entries(numberCounts)
                  .map(([num, count]) => ({ number: parseInt(num), count }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 50);

                return sortedNumbers.map(({ number, count }) => {
                  const percentage = totalNumbers > 0 ? Math.round((count / totalNumbers) * 100) : 0;
                  return (
                    <div key={number} className="flex justify-between items-center px-1 py-0.5 rounded text-xs">
                      <div className="flex items-center space-x-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${getRouletteColor(number)}`}>
                          {number.toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800 text-xs">{count}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                  );
                });
              }, [lastNumbers, totalNumbers])}
            </div>
          </div>
        </div>
      </div>

      {/* Modal P2 - Números Gatilho */}
      {showP2Modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-24" onClick={() => setShowP2Modal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">P2 - NÚMEROS GATILHO</h2>
              <button 
                onClick={() => setShowP2Modal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center space-x-3">
                <RouletteBall number={3} />
                <RouletteBall number={4} />
                <RouletteBall number={7} />
                <RouletteBall number={11} />
              </div>
              
              <div className="flex justify-center space-x-3">
                <RouletteBall number={15} />
                <RouletteBall number={18} />
                <RouletteBall number={21} />
                <RouletteBall number={22} />
              </div>
              
              <div className="flex justify-center space-x-3">
                <RouletteBall number={25} />
                <RouletteBall number={29} />
                <RouletteBall number={33} />
                <RouletteBall number={36} />
              </div>
            </div>
            
            <div className="mt-4 text-center text-gray-300 text-sm">
              <p>Estes números incrementam as <strong>ENTRADAS</strong></p>
              <p>e são considerados <strong>LOSS</strong> para o P2</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Torre - Números Gatilho */}
      {showTorreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-24" onClick={() => setShowTorreModal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">TORRE - NÚMEROS GATILHO</h2>
              <button 
                onClick={() => setShowTorreModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center space-x-3">
                <RouletteBall number={1} />
                <RouletteBall number={2} />
                <RouletteBall number={3} />
              </div>
              
              <div className="flex justify-center space-x-3">
                <RouletteBall number={34} />
                <RouletteBall number={35} />
                <RouletteBall number={36} />
              </div>
            </div>
            
            <div className="mt-4 text-center text-gray-300 text-sm">
              <p>Números <strong>GATILHO</strong> incrementam as <strong>ENTRADAS</strong></p>
              <p>WIN: Qualquer número exceto <strong>00, 01, 02, 03, 34, 35, 36</strong></p>
              <p>LOSS: Números <strong>00, 01, 02, 03, 34, 35, 36</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fusion */}
      {showFusionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowFusionModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Fusion - Números Gatilho</h2>
              <button 
                onClick={() => setShowFusionModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-3">
                <h3 className="font-semibold text-purple-700">Números Gatilho do Fusion</h3>
                <p className="text-sm text-gray-600 mb-3">13 números que ativam o sistema Fusion</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {[0, 32, 15, 19, 4, 21, 2, 25, 7, 29, 18, 22, 9].map(num => (
                    <RouletteBall key={num} number={num} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-gray-600 text-sm">
              <p>Estes números <strong>GATILHO</strong> incrementam as <strong>ENTRADAS</strong> do sistema Fusion</p>
            </div>

            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowFusionModal(false)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Race Track */}
      {showRaceTrackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowRaceTrackModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Race Track - Seções da Roleta</h2>
              <button 
                onClick={() => setShowRaceTrackModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-3">
                <h3 className="font-semibold text-purple-700">Voisins du Zéro</h3>
                <p className="text-sm text-gray-600 mb-1">17 números vizinhos do zero</p>
                <div className="flex flex-wrap gap-1">
                  {[22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25].map(num => (
                    <span key={num} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      {num.toString().padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-3">
                <h3 className="font-semibold text-blue-700">Tiers du Cylindre</h3>
                <p className="text-sm text-gray-600 mb-1">12 números do terço oposto</p>
                <div className="flex flex-wrap gap-1">
                  {[27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33].map(num => (
                    <span key={num} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {num.toString().padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-3">
                <h3 className="font-semibold text-green-700">Orphelins</h3>
                <p className="text-sm text-gray-600 mb-1">8 números órfãos</p>
                <div className="flex flex-wrap gap-1">
                  {[1, 20, 14, 31, 9, 17, 34, 6].map(num => (
                    <span key={num} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      {num.toString().padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-l-4 border-yellow-500 pl-3">
                 <h3 className="font-semibold text-yellow-700">Jeu Zéro</h3>
                 <p className="text-sm text-gray-600 mb-1">7 números próximos ao zero</p>
                 <div className="flex flex-wrap gap-1">
                   {[12, 35, 3, 26, 0, 32, 15].map(num => (
                     <span key={num} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                       {num.toString().padStart(2, '0')}
                     </span>
                   ))}
                 </div>
               </div>
            </div>

            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowRaceTrackModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Triangulação */}
      {showTriangulacaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTriangulacaoModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Triangulação</h2>
              <button 
                onClick={() => setShowTriangulacaoModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-3">
                <h3 className="font-semibold text-blue-700">Tríade atual</h3>
                <p className="text-sm text-gray-600 mb-2">Último número e offsets (+12, +24)</p>
                <div className="flex items-center gap-3">
                  {triangulacaoTriadDisplay.map(num => (
                    <RouletteBall key={num} number={num} />
                  ))}
                </div>
              </div>

              <div className="border-l-4 border-teal-500 pl-3">
                <h3 className="font-semibold text-teal-700">Vizinhos por centro</h3>
                <p className="text-sm text-gray-600 mb-2">4 vizinhos à esquerda e à direita</p>
                <div className="space-y-2">
                  {triangulacaoSections.map(s => (
                    <div key={s.center} className="bg-gray-50 rounded p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-600">Centro</span>
                        <RouletteBall number={s.center} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-16">Esquerda</span>
                        <div className="flex flex-wrap gap-1">
                          {s.neighborsLeft.map(n => (
                            <div key={`${s.center}-L-${n}`} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColor(n)}`}>{n.toString().padStart(2,'0')}</div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-600 w-16">Direita</span>
                        <div className="flex flex-wrap gap-1">
                          {s.neighborsRight.map(n => (
                            <div key={`${s.center}-R-${n}`} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColor(n)}`}>{n.toString().padStart(2,'0')}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-l-4 border-indigo-500 pl-3">
                <h3 className="font-semibold text-indigo-700">Cobertura</h3>
                <p className="text-sm text-gray-600 mb-2">Números cobertos e expostos</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Cobertos ({triangulacaoCoveredNumbers.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {triangulacaoCoveredNumbers.map(n => (
                        <span key={`cov-${n}`} className={`px-2 py-1 rounded text-xs font-medium text-white ${getRouletteColor(n)}`}>{n.toString().padStart(2,'0')}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Expostos ({triangulacaoExposedNumbers.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {triangulacaoExposedNumbers.map(n => (
                        <span key={`exp-${n}`} className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-800">{n.toString().padStart(2,'0')}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowTriangulacaoModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsCards;