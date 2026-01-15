// Função para calcular sequências consecutivas atuais e máximas

export interface SequenceStats {
  current: number;  // Sequência atual consecutiva
  max: number;      // Máxima sequência consecutiva já ocorrida
}

// Função genérica para calcular sequências
function calculateSequences(
  numbers: number[],
  getCategoryFn: (num: number) => number | null
): Map<number, SequenceStats> {
  const stats = new Map<number, SequenceStats>();
  
  if (numbers.length === 0) return stats;
  
  // Limitar aos últimos 60 números
  const recentNumbers = numbers.slice(-60);
  
  // Inicializar stats para todas as categorias possíveis
  const allCategories = new Set<number>();
  recentNumbers.forEach(num => {
    const cat = getCategoryFn(num);
    if (cat !== null) allCategories.add(cat);
  });
  
  allCategories.forEach(cat => {
    stats.set(cat, { current: 0, max: 0 });
  });
  
  // Calcular sequência atual (do final para trás)
  let currentCategory: number | null = null;
  let currentCount = 0;
  
  for (let i = recentNumbers.length - 1; i >= 0; i--) {
    const cat = getCategoryFn(recentNumbers[i]);
    
    if (cat === null) {
      // Zero não conta, interrompe a sequência
      break;
    }
    
    if (currentCategory === null) {
      currentCategory = cat;
      currentCount = 1;
    } else if (cat === currentCategory) {
      currentCount++;
    } else {
      // Mudou de categoria, para de contar
      break;
    }
  }
  
  // Definir sequência atual
  if (currentCategory !== null) {
    const stat = stats.get(currentCategory);
    if (stat) {
      stat.current = currentCount;
    }
  }
  
  // Calcular máxima sequência consecutiva (percorrer do início ao fim)
  let tempCategory: number | null = null;
  let tempCount = 0;
  
  for (let i = 0; i < recentNumbers.length; i++) {
    const cat = getCategoryFn(recentNumbers[i]);
    
    if (cat === null) {
      // Zero interrompe
      if (tempCategory !== null && tempCount > 0) {
        const stat = stats.get(tempCategory);
        if (stat) {
          stat.max = Math.max(stat.max, tempCount);
        }
      }
      tempCategory = null;
      tempCount = 0;
      continue;
    }
    
    if (tempCategory === null || cat !== tempCategory) {
      // Nova categoria ou mudança
      if (tempCategory !== null && tempCount > 0) {
        const stat = stats.get(tempCategory);
        if (stat) {
          stat.max = Math.max(stat.max, tempCount);
        }
      }
      tempCategory = cat;
      tempCount = 1;
    } else {
      // Mesma categoria
      tempCount++;
    }
  }
  
  // Processar última sequência
  if (tempCategory !== null && tempCount > 0) {
    const stat = stats.get(tempCategory);
    if (stat) {
      stat.max = Math.max(stat.max, tempCount);
    }
  }
  
  return stats;
}

// Função para obter dúzia
function getDozen(num: number): number | null {
  if (num === 0) return null;
  if (num >= 1 && num <= 12) return 1;
  if (num >= 13 && num <= 24) return 2;
  if (num >= 25 && num <= 36) return 3;
  return null;
}

// Função para obter coluna
function getColumn(num: number): number | null {
  if (num === 0) return null;
  if (num % 3 === 0) return 3;
  if (num % 3 === 1) return 1;
  if (num % 3 === 2) return 2;
  return null;
}

// Calcular sequências de dúzias
export function calculateDozenSequences(numbers: number[]): Map<number, SequenceStats> {
  return calculateSequences(numbers, getDozen);
}

// Calcular sequências de colunas
export function calculateColumnSequences(numbers: number[]): Map<number, SequenceStats> {
  return calculateSequences(numbers, getColumn);
}
