import React, { useState, useEffect } from 'react';
import { Statistics } from '../types/roulette';
import { useStatistics } from '../hooks/useStatistics';

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

export function StatisticsCards({ statistics, patternDetectedCount = 0, winCount = 0, lossCount = 0, numbersWithoutPattern = 0, totalNumbersWithoutPattern = 0, lastNumbers = [], pattern171Stats = { entradas: 0, wins: 0, losses: 0 }, pattern171ForcedStats = { wins: 11, losses: 0 } }: StatisticsCardsProps) {
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

  // Estados para controlar as animações de cada categoria
  const [animatingColumns, setAnimatingColumns] = useState<Set<number>>(new Set());
  const [animatingDozens, setAnimatingDozens] = useState<Set<number>>(new Set());
  const [animatingHighLow, setAnimatingHighLow] = useState<Set<number>>(new Set());
  const [animatingEvenOdd, setAnimatingEvenOdd] = useState<Set<number>>(new Set());
  const [animatingColors, setAnimatingColors] = useState<Set<string>>(new Set());

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
      const firstHighLow = firstNum === 0 ? 0 : (firstNum >= 1 && firstNum <= 18 ? 1 : 2);
      if (firstHighLow !== 0) {
        const allSameHighLow = sequenceNumbers.every(num => {
          const highLow = num === 0 ? 0 : (num >= 1 && num <= 18 ? 1 : 2);
          return highLow === firstHighLow;
        });
        if (allSameHighLow) {
          repeatedHighLow.add(firstHighLow);
          maxSequenceLength = Math.max(maxSequenceLength, len);
        }
      }
      
      // PAR/ÍMPAR
      const firstEvenOdd = firstNum === 0 ? 0 : (firstNum % 2 === 0 ? 1 : 2);
      if (firstEvenOdd !== 0) {
        const allSameEvenOdd = sequenceNumbers.every(num => {
          const evenOdd = num === 0 ? 0 : (num % 2 === 0 ? 1 : 2);
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

  const StatCard = ({ title, data, colors, cardType = 'default' }: {
    title: string | React.ReactNode;
    data: Array<{ label: string; value: number; percentage: number }>;
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
              isRepeated = animatingHighLow.has(index + 1);
              break;
            case 'evenOdd':
              isRepeated = animatingEvenOdd.has(index + 1);
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
                <div className="text-xs lg:text-xs text-gray-500">{item.percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Grid com todos os 7 cards em uma linha */}
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
          title="Par / Ímpar"
          data={[
            { label: 'Par', value: statistics.evenOdd.even, percentage: evenOddPercentages.even },
            { label: 'Ímpar', value: statistics.evenOdd.odd, percentage: evenOddPercentages.odd }
          ]}
          colors={['bg-blue-500', 'bg-purple-500']}
          cardType="evenOdd"
        />

        <StatCard
          title="Alto / Baixo"
          data={[
            { label: 'Baixo (1-18)', value: statistics.highLow.low, percentage: highLowPercentages.low },
            { label: 'Alto (19-36)', value: statistics.highLow.high, percentage: highLowPercentages.high }
          ]}
          colors={['bg-yellow-500', 'bg-orange-500']}
          cardType="highLow"
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
    </div>
  );
}

export default StatisticsCards;