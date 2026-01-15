// Função para detectar sequências de 3 números seguidos na mesma categoria

export interface SequenceAlert {
  type: 'dozen' | 'column' | 'color' | 'highLow' | 'evenOdd';
  category: string;
  message: string;
}

// Função para obter a dúzia de um número
function getDozen(num: number): number | null {
  if (num === 0) return null;
  if (num >= 1 && num <= 12) return 1;
  if (num >= 13 && num <= 24) return 2;
  if (num >= 25 && num <= 36) return 3;
  return null;
}

// Função para obter a coluna de um número
function getColumn(num: number): number | null {
  if (num === 0) return null;
  if (num % 3 === 0) return 3;
  if (num % 3 === 1) return 1;
  if (num % 3 === 2) return 2;
  return null;
}

// Função para obter a cor de um número
function getColor(num: number): string {
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  if (num === 0) return 'green';
  return reds.includes(num) ? 'red' : 'black';
}

// Função para verificar se é alto ou baixo
function getHighLow(num: number): string | null {
  if (num === 0) return null;
  return num >= 1 && num <= 18 ? 'low' : 'high';
}

// Função para verificar se é par ou ímpar
function getEvenOdd(num: number): string | null {
  if (num === 0) return null;
  return num % 2 === 0 ? 'even' : 'odd';
}

// Função principal para detectar sequências de 3 números seguidos
export function detectSequenceAlerts(lastNumbers: number[]): SequenceAlert[] {
  const alerts: SequenceAlert[] = [];
  
  // Precisamos de pelo menos 3 números
  if (lastNumbers.length < 3) return alerts;
  
  // Pegar os últimos 3 números (mais recentes)
  const last3 = lastNumbers.slice(-3);
  
  // Verificar Dúzias
  const dozens = last3.map(getDozen);
  if (dozens[0] !== null && dozens[0] === dozens[1] && dozens[1] === dozens[2]) {
    const dozenName = dozens[0] === 1 ? '1ª Dúzia (1-12)' : dozens[0] === 2 ? '2ª Dúzia (13-24)' : '3ª Dúzia (25-36)';
    alerts.push({
      type: 'dozen',
      category: dozenName,
      message: `⚠️ ALERTA: ${dozenName} saiu 3 vezes seguidas!`
    });
  }
  
  // Verificar Colunas
  const columns = last3.map(getColumn);
  if (columns[0] !== null && columns[0] === columns[1] && columns[1] === columns[2]) {
    const columnName = `${columns[0]}ª Coluna`;
    alerts.push({
      type: 'column',
      category: columnName,
      message: `⚠️ ALERTA: ${columnName} saiu 3 vezes seguidas!`
    });
  }
  
  // Verificar Cores
  const colors = last3.map(getColor);
  if (colors[0] === colors[1] && colors[1] === colors[2] && colors[0] !== 'green') {
    const colorName = colors[0] === 'red' ? 'Vermelho' : 'Preto';
    alerts.push({
      type: 'color',
      category: colorName,
      message: `⚠️ ALERTA: ${colorName} saiu 3 vezes seguidas!`
    });
  }
  
  // Verificar Alto/Baixo
  const highLows = last3.map(getHighLow);
  if (highLows[0] !== null && highLows[0] === highLows[1] && highLows[1] === highLows[2]) {
    const hlName = highLows[0] === 'low' ? 'Baixo (1-18)' : 'Alto (19-36)';
    alerts.push({
      type: 'highLow',
      category: hlName,
      message: `⚠️ ALERTA: ${hlName} saiu 3 vezes seguidas!`
    });
  }
  
  // Verificar Par/Ímpar
  const evenOdds = last3.map(getEvenOdd);
  if (evenOdds[0] !== null && evenOdds[0] === evenOdds[1] && evenOdds[1] === evenOdds[2]) {
    const eoName = evenOdds[0] === 'even' ? 'Par' : 'Ímpar';
    alerts.push({
      type: 'evenOdd',
      category: eoName,
      message: `⚠️ ALERTA: ${eoName} saiu 3 vezes seguidas!`
    });
  }
  
  return alerts;
}
