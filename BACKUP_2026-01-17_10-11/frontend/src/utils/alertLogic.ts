import { RouletteEntry } from '../types/roulette';

// Função para detectar o padrão 171
export function checkFor171Pattern(history: RouletteEntry[]): { hasPattern: boolean, numbers: number[] } {
  // Precisamos de pelo menos 3 números para verificar o padrão
  if (history.length < 3) {
    return { hasPattern: false, numbers: [] };
  }
  
  // Pegamos os últimos 3 números
  const lastThree = history.slice(-3).map(entry => entry.number);
  
  // Verificamos se os números formam o padrão 171
  // Padrão 171: primeiro número é 1, segundo é 7, terceiro é 1
  if (lastThree[0] === 1 && lastThree[1] === 7 && lastThree[2] === 1) {
    return { 
      hasPattern: true, 
      numbers: lastThree 
    };
  }
  
  return { hasPattern: false, numbers: [] };
}

// Ordem física dos números na roda da roleta
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Função para obter vizinhos de um número (7 à esquerda + número + 7 à direita = 15 números)
function getNumberNeighbors(num: number): number[] {
  const index = WHEEL_ORDER.indexOf(num);
  if (index === -1) return [];
  
  const neighbors = [];
  
  // Adiciona o próprio número
  neighbors.push(num);
  
  // Adiciona 7 vizinhos à esquerda e 7 à direita
  for (let i = 1; i <= 7; i++) {
    // Vizinho à esquerda
    const leftIndex = (index - i + WHEEL_ORDER.length) % WHEEL_ORDER.length;
    neighbors.push(WHEEL_ORDER[leftIndex]);
    
    // Vizinho à direita
    const rightIndex = (index + i) % WHEEL_ORDER.length;
    neighbors.push(WHEEL_ORDER[rightIndex]);
  }
  
  return neighbors;
}

// Função para calcular os 7 números expostos baseado na nova lógica
export function calculateExposedNumbers(raceNum1: number, raceNum2: number): number[] {
  // Encontra o primeiro índice onde qualquer um dos números aparece
  let firstFoundIndex = -1;
  let firstFoundNumber = null;
  
  for (let i = 0; i < WHEEL_ORDER.length; i++) {
    if (WHEEL_ORDER[i] === raceNum1 || WHEEL_ORDER[i] === raceNum2) {
      firstFoundIndex = i;
      firstFoundNumber = WHEEL_ORDER[i];
      break;
    }
  }
  
  if (firstFoundIndex === -1) {
    return [];
  }
  
  // Determina qual é o segundo número
  const secondNumber = firstFoundNumber === raceNum1 ? raceNum2 : raceNum1;
  
  // Varre os próximos 5 índices para ver se existe o segundo número
  let secondFoundInRange = false;
  for (let i = 1; i <= 5; i++) {
    const checkIndex = (firstFoundIndex + i) % WHEEL_ORDER.length;
    if (WHEEL_ORDER[checkIndex] === secondNumber) {
      secondFoundInRange = true;
      break;
    }
  }
  
  let startIndex;
  if (secondFoundInRange) {
    // Se encontrou o segundo número nos próximos 5 índices, usa primeiro índice - 1
    startIndex = (firstFoundIndex - 1 + WHEEL_ORDER.length) % WHEEL_ORDER.length;
    
    // Captura os próximos 7 números (sequência normal)
    const exposedNumbers: number[] = [];
    for (let i = 0; i < 7; i++) {
      const currentIndex = (startIndex + i) % WHEEL_ORDER.length;
      exposedNumbers.push(WHEEL_ORDER[currentIndex]);
    }
    return exposedNumbers;
  } else {
    // Se não encontrou, usa índice do segundo número - 1
    const secondNumberIndex = WHEEL_ORDER.indexOf(secondNumber);
    startIndex = (secondNumberIndex - 1 + WHEEL_ORDER.length) % WHEEL_ORDER.length;
    
    // Captura os próximos 7 números (sequência normal circular)
    const exposedNumbers: number[] = [];
    for (let i = 0; i < 7; i++) {
      const currentIndex = (startIndex + i) % WHEEL_ORDER.length;
      exposedNumbers.push(WHEEL_ORDER[currentIndex]);
    }
    return exposedNumbers;
  }
}

// Função para encontrar os 2 números ideais para apostar que cobrem os 30 números restantes
function findOptimalBettingNumbers(exposedNumbers: number[]): number[] {
  // Todos os números da roleta
  const allNumbers = Array.from({ length: 37 }, (_, i) => i);
  
  // Números que precisam ser cobertos (30 números = 37 - 7 expostos)
  const numbersToCover = allNumbers.filter(num => !exposedNumbers.includes(num));
  
  // Testa todas as combinações possíveis de 2 números para encontrar a melhor cobertura
  let bestCombination = [];
  let maxCoverage = 0;
  
  for (let i = 0; i < WHEEL_ORDER.length; i++) {
    for (let j = i + 1; j < WHEEL_ORDER.length; j++) {
      const num1 = WHEEL_ORDER[i];
      const num2 = WHEEL_ORDER[j];
      
      // Calcula cobertura dos dois números (cada um com 7 vizinhos de cada lado)
      const coverage1 = getNumberNeighbors(num1);
      const coverage2 = getNumberNeighbors(num2);
      const totalCoverage = [...new Set([...coverage1, ...coverage2])];
      
      // Verifica quantos dos números necessários são cobertos
      const coveredFromNeeded = numbersToCover.filter(num => totalCoverage.includes(num));
      
      if (coveredFromNeeded.length > maxCoverage) {
        maxCoverage = coveredFromNeeded.length;
        bestCombination = [num1, num2];
      }
      
      // Se conseguiu cobrir todos os 30 números, pode parar
      if (maxCoverage === 30) {
        break;
      }
    }
    if (maxCoverage === 30) {
      break;
    }
  }
  
  return bestCombination;
}

// Função para verificar se dois números estão dentro de 5 posições consecutivas na roda
function areWithinFivePositions(num1: number, num2: number): boolean {
  // Se são o mesmo número, não é race
  if (num1 === num2) return false;
  
  const index1 = WHEEL_ORDER.indexOf(num1);
  const index2 = WHEEL_ORDER.indexOf(num2);
  
  // Se algum número não existe na roda, não é race
  if (index1 === -1 || index2 === -1) return false;
  
  // Calcula a distância direta
  const directDistance = Math.abs(index1 - index2);
  // Calcula a distância circular (volta completa)
  const circularDistance = WHEEL_ORDER.length - directDistance;
  
  // A menor distância entre as duas
  const minDistance = Math.min(directDistance, circularDistance);
  
  // Considera próximos se estão a até 5 posições de distância
  return minDistance <= 5;
}

export function checkForRaceCondition(history: RouletteEntry[]): {
  hasRace: boolean;
  raceNumbers: number[];
  coveredNumbers: number[];
  riskNumbers: number[];
} {
  // Precisa de pelo menos 2 números para verificar race
  if (history.length < 2) {
    return {
      hasRace: false,
      raceNumbers: [],
      coveredNumbers: [],
      riskNumbers: []
    };
  }

  // Pega APENAS os 2 ÚLTIMOS números chamados
  const lastTwoEntries = history.slice(0, 2); // Corrigido: slice(0, 2) para pegar os 2 primeiros (mais recentes)
  const lastNumber = lastTwoEntries[0].number; // O mais recente
  const secondLastNumber = lastTwoEntries[1].number; // O segundo mais recente
  
  // Verificações de segurança
  if (typeof lastNumber !== 'number' || typeof secondLastNumber !== 'number') {
    return {
      hasRace: false,
      raceNumbers: [],
      coveredNumbers: [],
      riskNumbers: []
    };
  }
  
  // Verifica se há race condition:
  // 1. Se os números são iguais (mesmo número digitado 2x) - SEMPRE aciona o padrão
  // 2. Se os números são diferentes E estão dentro de 5 posições na roda
  const sameNumber = lastNumber === secondLastNumber;
  const differentButClose = lastNumber !== secondLastNumber && areWithinFivePositions(lastNumber, secondLastNumber);
  
  if (sameNumber || differentButClose) {
    // Race detectada! Calcula os números expostos usando a nova lógica
    // IMPORTANTE: Passa secondLastNumber primeiro (mais antigo) e lastNumber segundo (mais recente)
    const exposedNumbers = calculateExposedNumbers(secondLastNumber, lastNumber);
    
    // Encontra os 2 números ideais para apostar que cobrem os 30 números restantes
    const suggestedNumbers = findOptimalBettingNumbers(exposedNumbers);
    
    // Calcula a cobertura dos números sugeridos (cada um cobre 15 números)
    const coverage1 = getNumberNeighbors(suggestedNumbers[0]);
    const coverage2 = getNumberNeighbors(suggestedNumbers[1]);
    
    // União dos dois conjuntos de cobertura (deve cobrir 30 números)
    const coveredNumbers = [...new Set([...coverage1, ...coverage2])];
    
    return {
      hasRace: true,
      raceNumbers: suggestedNumbers, // Os 2 números para apostar
      coveredNumbers, // Todos os números cobertos pelas apostas
      riskNumbers: exposedNumbers // Os 7 números expostos (em risco)
    };
  }

  return {
    hasRace: false,
    raceNumbers: [],
    coveredNumbers: [],
    riskNumbers: []
  };
}

export function generateBettingSuggestion(raceData: {
  hasRace: boolean;
  raceNumbers: number[];
  coveredNumbers: number[];
  riskNumbers: number[];
}): string {
  if (!raceData.hasRace) return '';
  
  const coveredCount = raceData.coveredNumbers.length;
  const riskCount = raceData.riskNumbers.length;
  
  return `Race detectada! Aposte nos números ${raceData.raceNumbers.join(' e ')} e seus vizinhos. ` +
         `Cada número cobre 15 posições (ele + 7 à esquerda + 7 à direita). ` +
         `Cobertura total: ${coveredCount} números. Risco: ${riskCount} números.`;
}