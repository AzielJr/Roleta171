// Configurações da roleta
export const ROULETTE_CONFIG = {
  RED_NUMBERS: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  BLACK_NUMBERS: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
  GREEN_NUMBERS: [0],
  MAX_HISTORY: 50,
  RACE_INTERVAL: 5
};

// Funções utilitárias
export function getNumberColor(num: number): 'green' | 'red' | 'black' {
  if (num === 0) return 'green';
  if (ROULETTE_CONFIG.RED_NUMBERS.includes(num)) return 'red';
  return 'black';
}

// Ordem dos números na roda da roleta (sentido horário) - Sequência física real
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export function getNeighbors(num: number): number[] {
  // Retorna os 7 vizinhos de cada lado na roda da roleta
  const index = WHEEL_ORDER.indexOf(num);
  const neighbors = [];
  
  for (let i = -7; i <= 7; i++) {
    if (i !== 0) {
      const neighborIndex = (index + i + WHEEL_ORDER.length) % WHEEL_ORDER.length;
      neighbors.push(WHEEL_ORDER[neighborIndex]);
    }
  }
  
  return neighbors;
}