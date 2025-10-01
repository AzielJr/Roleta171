import React, { useState, useEffect, useRef } from 'react';
import { Statistics } from '../types/roulette';
import { useStatistics } from '../hooks/useStatistics';
import { soundGenerator } from '../utils/soundUtils';

// Sequência real da roleta (Race)
const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

interface StatisticsCardsProps {
  statistics: Statistics;
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
const calculate171ForcedStats = (lastNumbers: number[]): { wins: number; losses: number } => {
  let wins = 0;
  let losses = 0;
  
  // Precisa de pelo menos 2 números para fazer a análise
  if (lastNumbers.length < 2) {
    return { wins, losses };
  }
  
  // Analisar cada par de números consecutivos
  // lastNumbers[0] é o mais recente, lastNumbers[1] é o anterior, etc.
  for (let i = 1; i < lastNumbers.length; i++) {
    const currentNumber = lastNumbers[i]; // Número que foi selecionado
    const nextNumber = lastNumbers[i - 1]; // Próximo número que saiu
    
    const result = determine171ForcedResult(currentNumber, nextNumber);
    
    if (result === 'WIN') {
      wins++;
    } else if (result === 'LOSS') {
      losses++;
    }
  }
  
  return { wins, losses };
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

// Números de entrada para Padrão 72
const PADRAO72_ENTRY_NUMBERS = [2, 12, 22, 32, 7, 17, 27];

// Função para calcular 9 vizinhos de cada lado de um número na sequência da roleta
const calculateRouletteNeighbors = (centerNumber: number): number[] => {
  const centerIndex = ROULETTE_SEQUENCE.indexOf(centerNumber);
  if (centerIndex === -1) return [];

  const neighbors: number[] = [];
  const totalNumbers = ROULETTE_SEQUENCE.length;

  // NÃO incluir o número central - apenas os vizinhos

  // Adicionar 9 vizinhos de cada lado (18 vizinhos total)
  for (let i = 1; i <= 9; i++) {
    // Vizinho à esquerda (sentido anti-horário)
    const leftIndex = (centerIndex - i + totalNumbers) % totalNumbers;
    neighbors.push(ROULETTE_SEQUENCE[leftIndex]);

    // Vizinho à direita (sentido horário)
    const rightIndex = (centerIndex + i) % totalNumbers;
    neighbors.push(ROULETTE_SEQUENCE[rightIndex]);
  }

  return neighbors;
};

// Função para calcular estatísticas do Padrão 72
const calculatePadrao72Stats = (lastNumbers: number[]): { 
  entradas: number; 
  wins: number; 
  losses: number; 
  maxNegativeSequence: number;
  hasRecentEntry: boolean;
} => {
  console.log('🔍 [DEBUG PADRÃO 72 FUNCTION] Iniciando cálculo com:', lastNumbers);
  
  if (lastNumbers.length === 0) {
    console.log('🔍 [DEBUG PADRÃO 72 FUNCTION] Histórico vazio, retornando zeros');
    return { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, hasRecentEntry: false };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxNegativeSequence = 0;
  let currentNegativeSequence = 0;
  let hasRecentEntry = false;

  // Verificar se o ÚLTIMO número é uma entrada (para o alerta laranja)
  const lastNumber = lastNumbers[lastNumbers.length - 1]; // Último número da lista (mais recente)
  hasRecentEntry = PADRAO72_ENTRY_NUMBERS.includes(lastNumber);
  console.log('🔍 [DEBUG PADRÃO 72 FUNCTION] Último número:', lastNumber, 'É entrada?', hasRecentEntry);
  
  // Se é uma entrada e é o único número, contar como entrada
  if (hasRecentEntry && lastNumbers.length === 1) {
    entradas = 1;
    console.log('🔍 [DEBUG PADRÃO 72 FUNCTION] Número único é entrada! Total entradas: 1');
    const result = { entradas, wins, losses, maxNegativeSequence, hasRecentEntry };
    console.log('🔍 [DEBUG PADRÃO 72 FUNCTION] Resultado final (entrada única):', result);
    return result;
  }

  // CORREÇÃO: Agora processar na ordem cronológica correta (do mais antigo para o mais recente)
  for (let i = 0; i < lastNumbers.length; i++) {
    const currentNumber = lastNumbers[i];
    const nextNumber = i < lastNumbers.length - 1 ? lastNumbers[i + 1] : null; // Próximo número na sequência temporal
    
    if (nextNumber !== null) {
      console.log(`🔍 [DEBUG PADRÃO 72 FUNCTION] Analisando sequência: ${currentNumber} -> ${nextNumber}`);
    } else {
      console.log(`🔍 [DEBUG PADRÃO 72 FUNCTION] Analisando: ${currentNumber} (último da sequência)`);
    }

    // Verificar se o número atual é uma entrada do Padrão 72
    if (PADRAO72_ENTRY_NUMBERS.includes(currentNumber)) {
      entradas++;
      console.log(`🔍 [DEBUG PADRÃO 72 FUNCTION] ${currentNumber} é entrada! Total entradas: ${entradas}`);
      
      // Só avaliar WIN/LOSS se há um próximo número na sequência temporal
      if (nextNumber !== null) {
        // Calcular vizinhos do número atual
        const neighbors = calculateRouletteNeighbors(currentNumber);
        console.log(`🔍 [DEBUG PADRÃO 72 FUNCTION] Vizinhos de ${currentNumber}:`, neighbors);
        
        // Verificar se o próximo número é vizinho
        if (neighbors.includes(nextNumber)) {
          wins++;
          currentNegativeSequence = 0; // Reset da sequência negativa
          console.log(`🔍 [DEBUG PADRÃO 72 FUNCTION] WIN! ${nextNumber} é vizinho de ${currentNumber}. Total wins: ${wins}`);
        } else {
          losses++;
          currentNegativeSequence++;
          maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
          console.log(`🔍 [DEBUG PADRÃO 72 FUNCTION] LOSS! ${nextNumber} NÃO é vizinho de ${currentNumber}. Total losses: ${losses}, Seq negativa: ${currentNegativeSequence}`);
        }
      } else {
        console.log(`🔍 [DEBUG PADRÃO 72 FUNCTION] ${currentNumber} é entrada mas é o último número da sequência`);
      }
    } else {
      // Se não é uma entrada, resetar sequência negativa
      currentNegativeSequence = 0;
      console.log(`🔍 [DEBUG PADRÃO 72 FUNCTION] ${currentNumber} não é entrada, resetando sequência negativa`);
    }
  }

  const result = { entradas, wins, losses, maxNegativeSequence, hasRecentEntry };
  console.log('🔍 [DEBUG PADRÃO 72 FUNCTION] Resultado final:', result);
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
  if (lastNumbers.length === 0) {
    return { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, hasRecentEntry: false, hasConsecutiveEntries: false };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxNegativeSequence = 0;
  let currentNegativeSequence = 0;
  let hasRecentEntry = false;
  let hasConsecutiveEntries = false;

  // Verificar se o número mais recente é uma entrada
  if (P2_ENTRY_NUMBERS.includes(lastNumbers[0])) {
    hasRecentEntry = true;
  }

  // Verificar entradas consecutivas (2 ou mais)
  let consecutiveEntries = 0;
  for (let i = 0; i < Math.min(lastNumbers.length, 10); i++) {
    if (P2_ENTRY_NUMBERS.includes(lastNumbers[i])) {
      consecutiveEntries++;
    } else {
      break;
    }
  }
  hasConsecutiveEntries = consecutiveEntries >= 2;

  // Calcular estatísticas baseadas nos números
  // WIN/LOSS só é computado APÓS cada ENTRADA específica (padrão P2)
  // lastNumbers[0] é o mais recente, então vamos percorrer do mais antigo para o mais recente
  
  for (let i = lastNumbers.length - 1; i >= 0; i--) { // Percorrer do mais antigo para o mais recente
    const number = lastNumbers[i];
    
    // Se encontrou uma entrada P2, incrementa entradas e verifica o próximo número
    if (P2_ENTRY_NUMBERS.includes(number)) {
      entradas++;
      
      // Verificar se há um próximo número (mais recente) para determinar WIN/LOSS
      if (i > 0) { // Se não é o número mais recente
        const nextNumber = lastNumbers[i - 1]; // Próximo número (mais recente)
        
        if (P2_LOSS_NUMBERS.includes(nextNumber)) {
          // LOSS: Se o próximo número após entrada P2 for um dos números do padrão P2
          losses++;
          currentNegativeSequence++;
          maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
        } else {
          // WIN: Se o próximo número após entrada P2 NÃO for um dos números do padrão P2
          wins++;
          currentNegativeSequence = 0; // Reset sequência negativa
        }
      }
    }
  }

  return { entradas, wins, losses, maxNegativeSequence, hasRecentEntry, hasConsecutiveEntries };
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
  if (lastNumbers.length === 0) {
    return { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, hasRecentEntry: false, hasConsecutiveEntries: false };
  }

  let entradas = 0;
  let wins = 0;
  let losses = 0;
  let maxNegativeSequence = 0;
  let currentNegativeSequence = 0;
  let hasRecentEntry = false;
  let hasConsecutiveEntries = false;

  // Verificar se há entrada recente (último número é P2)
  if (P2_ENTRY_NUMBERS.includes(lastNumbers[0])) {
    hasRecentEntry = true;
  }

  // Verificar se há entradas consecutivas (dois últimos números são P2)
  if (lastNumbers.length >= 2 && 
      P2_ENTRY_NUMBERS.includes(lastNumbers[0]) && 
      P2_ENTRY_NUMBERS.includes(lastNumbers[1])) {
    hasConsecutiveEntries = true;
  }

  // NOVA LÓGICA CORRIGIDA: Para cada entrada, verificar se é WIN ou LOSS
  // Percorrer do mais antigo para o mais recente (reverso)
  for (let i = lastNumbers.length - 1; i >= 1; i--) {
    const currentNumber = lastNumbers[i];
    const nextNumber = lastNumbers[i - 1]; // Próximo número (mais recente)
    
    // Se o número atual é P2 e o anterior também é P2 → ENTRADA
    if (P2_ENTRY_NUMBERS.includes(currentNumber) && P2_ENTRY_NUMBERS.includes(nextNumber)) {
      entradas++;
      
      // Verificar se há um número após o próximo para determinar WIN/LOSS
      if (i >= 2) {
        const numberAfterNext = lastNumbers[i - 2];
        
        if (P2_ENTRY_NUMBERS.includes(numberAfterNext)) {
          // Se o número após o próximo também é P2 → LOSS (sequência continua)
          losses++;
          currentNegativeSequence++;
          maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
        } else {
          // Se o número após o próximo NÃO é P2 → WIN (sequência para)
          wins++;
          currentNegativeSequence = 0; // Reset sequência negativa
        }
      } else {
        // Se não há número suficiente para determinar, considerar como pendente
        // Para o último par, verificar se a sequência continua ou para
        if (i === 1) {
          // Este é o último par da sequência, não há como determinar WIN/LOSS ainda
          // Deixar como entrada sem WIN/LOSS até que mais números sejam adicionados
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
  
  console.log(`DEBUG P2 MODE 2: entradas=${entradas}, wins=${wins}, losses=${losses}, maxNegSeq=${maxNegativeSequence}`);
  
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

export function StatisticsCards({ statistics, patternDetectedCount = 0, winCount = 0, lossCount = 0, numbersWithoutPattern = 0, totalNumbersWithoutPattern = 0, lastNumbers = [], pattern171Stats = { entradas: 0, wins: 0, losses: 0 }, pattern171ForcedStats = { wins: 11, losses: 0 }, p2WinCount = 0, p2LossCount = 0 }: StatisticsCardsProps) {
  const [showP2Modal, setShowP2Modal] = useState(false);
  const [p2Mode, setP2Mode] = useState<1 | 2>(1); // Estado para controlar o modo do toggle P2
  const lastP2ConsecutiveState = useRef(false);

  // Calcular estatísticas do P2 baseado nos últimos números
  const calculatedP2Stats = React.useMemo(() => {
    return p2Mode === 1 ? calculateP2Stats(lastNumbers) : calculateP2StatsMode2(lastNumbers);
  }, [lastNumbers, p2Mode]);

  // Calcular estatísticas do Padrão 72 (placeholder - aguardando cálculos)
  const calculatedPadrao72Stats = React.useMemo(() => {
    console.log('🔍 [DEBUG PADRÃO 72] Calculando stats com lastNumbers:', lastNumbers);
    const result = calculatePadrao72Stats(lastNumbers);
    console.log('🔍 [DEBUG PADRÃO 72] Resultado calculado:', result);
    return result;
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

  // Estados para animações dos cards
  const [animatingColumns, setAnimatingColumns] = useState<Set<number>>(new Set());
  const [animatingDozens, setAnimatingDozens] = useState<Set<number>>(new Set());
  const [animatingHighLow, setAnimatingHighLow] = useState<Set<string>>(new Set());
  const [animatingEvenOdd, setAnimatingEvenOdd] = useState<Set<string>>(new Set());
  const [animatingColors, setAnimatingColors] = useState<Set<string>>(new Set());
  const [animatingP2, setAnimatingP2] = useState<'none' | 'green' | 'yellow'>('none');
  const [animatingPadrao72, setAnimatingPadrao72] = useState<'none' | 'orange'>('none');

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
    const repeatedHighLow = new Set<number>();
    const repeatedEvenOdd = new Set<number>();
    const repeatedColors = new Set<string>();

    // Verificar se há padrão contínuo a partir dos números mais recentes
    // Começar com os 3 primeiros números (mais recentes) e expandir se necessário
    let maxSequenceLength = 3;
    
    // Encontrar a maior sequência contínua possível
    for (let len = 3; len <= lastNumbers.length; len++) {
      const sequenceNumbers = lastNumbers.slice(0, len);
      
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
      setAnimatingHighLow(repeated.highLow.size > 0 ? repeated.highLow : new Set());
      setAnimatingEvenOdd(repeated.evenOdd.size > 0 ? repeated.evenOdd : new Set());
      setAnimatingColors(repeated.colors.size > 0 ? repeated.colors : new Set());
    } else {
      // Limpar todos os alertas se não há números suficientes
      setAnimatingColumns(new Set());
      setAnimatingDozens(new Set());
      setAnimatingHighLow(new Set());
      setAnimatingEvenOdd(new Set());
      setAnimatingColors(new Set());
    }
  }, [lastNumbers.join(',')]); // Monitorar todos os números, não apenas os últimos 3

  // Efeito para controlar animações do P2 e tocar som
  useEffect(() => {
    if (calculatedP2Stats.hasConsecutiveEntries) {
      setAnimatingP2('yellow');
      
      // Tocar som apenas quando P2 muda para consecutivo (não estava consecutivo antes)
      if (!lastP2ConsecutiveState.current) {
        soundGenerator.playBellSound();
        lastP2ConsecutiveState.current = true;
      }
    } else if (calculatedP2Stats.hasRecentEntry) {
      setAnimatingP2('green');
      lastP2ConsecutiveState.current = false; // Reset quando não é mais consecutivo
    } else {
      setAnimatingP2('none');
      lastP2ConsecutiveState.current = false;
    }
  }, [calculatedP2Stats.hasConsecutiveEntries, calculatedP2Stats.hasRecentEntry]);

  // Efeito para controlar animações do Padrão 72 e tocar som
  useEffect(() => {
    if (calculatedPadrao72Stats.hasRecentEntry) {
      setAnimatingPadrao72('orange');
      soundGenerator.playBellSound();
    } else {
      setAnimatingPadrao72('none');
    }
  }, [calculatedPadrao72Stats.hasRecentEntry]);

  const StatCard = ({ title, data, colors, cardType = 'default' }: {
    title: string | React.ReactNode;
    data: Array<{ label: string; value: number; percentage: number; hidePercentage?: boolean }>;
    colors: string[];
    cardType?: 'columns' | 'dozens' | 'highLow' | 'evenOdd' | 'colors' | 'default';
  }) => (
    <div className="bg-white rounded-lg shadow-md p-2 lg:p-3">
      <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">{title}</h3>
      <div className="space-y-0.5 lg:space-y-1">
        {data.map((item, index) => {
          // Verificar se o item está repetido baseado no tipo de card
          let isRepeated = false;
          
          switch (cardType) {
            case 'columns':
              isRepeated = animatingColumns.has(index + 1);
              break;
            case 'dozens':
              isRepeated = animatingDozens.has(index + 1);
              break;
            case 'highLow':
              isRepeated = animatingHighLow.has(index === 0 ? 'low' : 'high');
              break;
            case 'evenOdd':
              isRepeated = animatingEvenOdd.has(index === 0 ? 'even' : 'odd');
              break;
            case 'colors':
              const colorMap = ['red', 'black', 'green'];
              isRepeated = animatingColors.has(colorMap[index]);
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
                  {item.value}
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

  return (
    <div className="space-y-3">
      {/* Grid com todos os 7 cards distribuídos igualmente */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-1 lg:gap-2">
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

        <StatCard
          title="Colunas"
          data={[
            { label: '1ª Coluna', value: statistics.columns.first, percentage: columnsPercentages.first },
            { label: '2ª Coluna', value: statistics.columns.second, percentage: columnsPercentages.second },
            { label: '3ª Coluna', value: statistics.columns.third, percentage: columnsPercentages.third }
          ]}
          colors={['bg-emerald-500', 'bg-teal-500', 'bg-lime-500']}
          cardType="columns"
        />

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
          data={[
            { label: 'Entradas', value: calculatedP2Stats.entradas, percentage: totalNumbers > 0 ? Math.round((calculatedP2Stats.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: calculatedP2Stats.wins, percentage: (calculatedP2Stats.wins + calculatedP2Stats.losses) > 0 ? Math.round((calculatedP2Stats.wins / (calculatedP2Stats.wins + calculatedP2Stats.losses)) * 100) : 0 },
            { label: 'LOSS', value: calculatedP2Stats.losses, percentage: (calculatedP2Stats.wins + calculatedP2Stats.losses) > 0 ? Math.round((calculatedP2Stats.losses / (calculatedP2Stats.wins + calculatedP2Stats.losses)) * 100) : 0 },
            { label: '> Seq. Negativa', value: calculatedP2Stats.maxNegativeSequence, percentage: calculatedP2Stats.entradas > 0 ? Math.round((calculatedP2Stats.maxNegativeSequence / calculatedP2Stats.entradas) * 100) : 0, hidePercentage: true }
          ]}
          colors={['bg-gray-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500']}
        />

        <StatCard
          title={
            <div className={`transition-all duration-300 ${
              animatingPadrao72 === 'orange' 
                ? 'animate-pulse-orange-border' 
                : ''
            }`}>
              <span>Padrão 72</span>
            </div>
          }
          data={[
            { label: 'Entradas', value: calculatedPadrao72Stats.entradas, percentage: totalNumbers > 0 ? Math.round((calculatedPadrao72Stats.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: calculatedPadrao72Stats.wins, percentage: (calculatedPadrao72Stats.wins + calculatedPadrao72Stats.losses) > 0 ? Math.round((calculatedPadrao72Stats.wins / (calculatedPadrao72Stats.wins + calculatedPadrao72Stats.losses)) * 100) : 0 },
            { label: 'LOSS', value: calculatedPadrao72Stats.losses, percentage: (calculatedPadrao72Stats.wins + calculatedPadrao72Stats.losses) > 0 ? Math.round((calculatedPadrao72Stats.losses / (calculatedPadrao72Stats.wins + calculatedPadrao72Stats.losses)) * 100) : 0 },
            { label: '> Seq. Negativa', value: calculatedPadrao72Stats.maxNegativeSequence, percentage: calculatedPadrao72Stats.entradas > 0 ? Math.round((calculatedPadrao72Stats.maxNegativeSequence / calculatedPadrao72Stats.entradas) * 100) : 0, hidePercentage: true }
          ]}
          colors={['bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500']}
        />

        <StatCard
          title="171 Forçado (5)"
          data={[
            { label: 'WIN', value: calculated171ForcedStats.wins, percentage: (calculated171ForcedStats.wins + calculated171ForcedStats.losses) > 0 ? Math.round((calculated171ForcedStats.wins / (calculated171ForcedStats.wins + calculated171ForcedStats.losses)) * 100) : 0 },
            { label: 'LOSS', value: calculated171ForcedStats.losses, percentage: (calculated171ForcedStats.wins + calculated171ForcedStats.losses) > 0 ? Math.round((calculated171ForcedStats.losses / (calculated171ForcedStats.wins + calculated171ForcedStats.losses)) * 100) : 0 }
          ]}
          colors={['bg-green-500', 'bg-red-500']}
        />

        <StatCard
          title={
            <div className="flex justify-between items-center w-full">
              <span>📊 171</span>
              <span className="font-normal text-xs text-gray-500">Qt: <span className="font-bold text-white">{numbersWithoutPattern}</span> - Md: <span className="font-bold text-white">{pattern171Stats.entradas > 0 ? Math.round((lastNumbers.length / pattern171Stats.entradas) * 100) / 100 : 0}</span></span>
            </div>
          }
          data={[
            { label: 'Entradas', value: pattern171Stats.entradas, percentage: totalNumbers > 0 ? Math.round((pattern171Stats.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: pattern171Stats.wins, percentage: pattern171Stats.entradas > 0 ? Math.round((pattern171Stats.wins / pattern171Stats.entradas) * 100) : 0 },
            { label: 'LOSS', value: pattern171Stats.losses, percentage: pattern171Stats.entradas > 0 ? Math.round((pattern171Stats.losses / pattern171Stats.entradas) * 100) : 0 }
          ]}
          colors={['bg-gray-500', 'bg-green-500', 'bg-red-500']}
        />
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
    </div>
  );
}

export default StatisticsCards;