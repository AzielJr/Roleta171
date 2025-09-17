import { RouletteEntry } from '../types/roulette';

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

// Função para encontrar os 2 números ideais para apostar baseado na região dos números que saíram
function findOptimalBettingNumbers(raceNum1: number, raceNum2: number): number[] {
  const index1 = WHEEL_ORDER.indexOf(raceNum1);
  const index2 = WHEEL_ORDER.indexOf(raceNum2);
  
  if (index1 === -1 || index2 === -1) return [];
  
  // Calcula o ponto médio entre os dois números na roda
  let midIndex1, midIndex2;
  
  if (Math.abs(index1 - index2) <= WHEEL_ORDER.length / 2) {
    // Caso normal - números próximos
    const avgIndex = Math.round((index1 + index2) / 2);
    midIndex1 = (avgIndex + 8) % WHEEL_ORDER.length; // +8 posições do meio
    midIndex2 = (avgIndex + 16) % WHEEL_ORDER.length; // +16 posições do meio
  } else {
    // Caso circular - números distantes (passam pelo 0)
    const avgIndex = Math.round((index1 + index2 + WHEEL_ORDER.length) / 2) % WHEEL_ORDER.length;
    midIndex1 = (avgIndex + 8) % WHEEL_ORDER.length;
    midIndex2 = (avgIndex + 16) % WHEEL_ORDER.length;
  }
  
  return [WHEEL_ORDER[midIndex1], WHEEL_ORDER[midIndex2]];
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
  const lastTwoEntries = history.slice(-2);
  const lastNumber = lastTwoEntries[1].number;
  const secondLastNumber = lastTwoEntries[0].number;
  
  // Verificações de segurança
  if (typeof lastNumber !== 'number' || typeof secondLastNumber !== 'number') {
    return {
      hasRace: false,
      raceNumbers: [],
      coveredNumbers: [],
      riskNumbers: []
    };
  }
  
  // Verifica se os 2 últimos números são diferentes e estão dentro de 5 posições na roda
  if (lastNumber !== secondLastNumber && areWithinFivePositions(lastNumber, secondLastNumber)) {
    // Race detectada! Encontra os 2 números ideais para apostar
    const suggestedNumbers = findOptimalBettingNumbers(lastNumber, secondLastNumber);
    
    // Calcula a cobertura dos números sugeridos (cada um cobre 15 números)
    const coverage1 = getNumberNeighbors(suggestedNumbers[0]);
    const coverage2 = getNumberNeighbors(suggestedNumbers[1]);
    
    // União dos dois conjuntos de cobertura (deve cobrir 30 números)
    const coveredNumbers = [...new Set([...coverage1, ...coverage2])];
    
    // Números em risco são todos os outros (deve ser exatamente 7 números)
    const allNumbers = Array.from({ length: 37 }, (_, i) => i);
    const riskNumbers = allNumbers.filter(num => !coveredNumbers.includes(num));
    
    return {
      hasRace: true,
      raceNumbers: suggestedNumbers, // Agora retorna os números sugeridos, não os que saíram
      coveredNumbers,
      riskNumbers
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