import React from 'react';
import RankingEstrategiasCard from './RankingEstrategiasCard';
import TorreCard from './TorreCard';
import BETTerminaisCard from './BETTerminaisCard';
import ColunasCard from './ColunasCard';
import { calculateDozenAbsences, calculateColumnAbsences } from '../utils/statisticsCalculator';

const StatisticsCards = ({
  lastNumbers = [],
  totalNumbers = lastNumbers.length,
  numbersWithoutPattern = 0,
  patternDetectedCount = 0,
  totalNumbersWithoutPattern = 0,
  window32P1 = 0,
  pattern171Stats = { entradas: 0, wins: 0, losses: 0 },
  calculatedTorreStats = { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0, currentNegativeSequence: 0 },
  calculatedP2Stats = { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0 },
  betTerminaisStats = { entradas: 0, wins: 0, losses: 0, winPercentage: 0, lossPercentage: 0, negativeSequenceCurrent: 0, negativeSequenceMax: 0, positiveSequenceCurrent: 0, positiveSequenceMax: 0 },
  calculated32P1Stats = { winTotal: 0, wins: 0, losses: 0, total: 0 },
  calculatedTriangulacaoStats = { wins: 0, losses: 0, winPercentage: 0, lossPercentage: 0, positiveSequenceCurrent: 0, positiveSequenceMax: 0, negativeSequenceCurrent: 0, negativeSequenceMax: 0 },
  showP2Modal = false,
  showTorreModal = false,
  showRaceTrackModal = false,
  showTriangulacaoModal = false,
  setShowP2Modal = (v: boolean) => {},
  setShowTorreModal = (v: boolean) => {},
  setShowRaceTrackModal = (v: boolean) => {},
  setShowTriangulacaoModal = (v: boolean) => {},
  triangulacaoTriadDisplay = [],
  triangulacaoSections = [],
  triangulacaoCoveredNumbers = [],
  triangulacaoExposedNumbers = [],
  animatingTorre = undefined,
  animatingP2 = undefined,
  animatingBetTerminais = undefined,
  animatingDozens = new Set<number>(),
  getNumberColumn = undefined,
  getNumberDozen = undefined,
  statistics = { columns: { first: 0, second: 0, third: 0 }, dozens: { first: 0, second: 0, third: 0 }, colors: { red: 0, black: 0, green: 0 }, highLow: { high: 0, low: 0 }, evenOdd: { even: 0, odd: 0 } },
  columnsPercentages = { first: 0, second: 0, third: 0 },
  dozensPercentages = { first: 0, second: 0, third: 0 },
  colorPercentages = { red: 0, black: 0, green: 0 },
  highLowPercentages = { high: 0, low: 0, zero: 0 },
  evenOddPercentages = { even: 0, odd: 0, zero: 0 },
  winCount = 0,
  lossCount = 0,
  p2WinCount = 0,
  p2LossCount = 0,
  setP2WinCount = (v: number | ((prev: number) => number)) => {},
  setP2LossCount = (v: number | ((prev: number) => number)) => {},
  torreWinCount = 0,
  torreLossCount = 0,
  setTorreWinCount = (v: number | ((prev: number) => number)) => {},
  setTorreLossCount = (v: number | ((prev: number) => number)) => {},
  avisosSonorosAtivos = false,
  p2Mode = 1,
  setP2Mode = (v: number | ((prev: number) => number)) => {},
  rowOrder = 0,
  ROULETTE_SEQUENCE = []
}) => {

    const p2Safe = calculatedP2Stats ?? { entradas: 0, wins: 0, losses: 0, maxNegativeSequence: 0 };
    const getNumberColumnSafe = (num: number) => {
      if (getNumberColumn) return getNumberColumn(num);
      if (num === 0) return null;
      return ((num - 1) % 3) + 1;
    };
    const getNumberDozenSafe = (num: number) => {
      if (getNumberDozen) return getNumberDozen(num);
      if (num === 0) return null;
      return Math.ceil(num / 12);
    };

    // LOSS helpers: conta apenas a primeira repetição por sequência,
    // lendo do fim para o início, limitado aos últimos 60 números
    const countLossRuns = (seq: Array<number | null>) => {
      const filtered = seq.filter(v => v !== null) as number[];
      const arr = filtered.slice(-60).reverse();
      let loss = 0;
      for (let i = 0; i < arr.length;) {
        const current = arr[i];
        let j = i + 1;
        while (j < arr.length && arr[j] === current) j++;
        if ((j - i) >= 2) loss++;
        i = j;
      }
      return loss;
    };

    const columnsLoss = React.useMemo(() => countLossRuns(lastNumbers.map(getNumberColumnSafe)), [lastNumbers]);
    const dozensLoss = React.useMemo(() => countLossRuns(lastNumbers.map(getNumberDozenSafe)), [lastNumbers]);
    const dozensAbsences = React.useMemo(() => calculateDozenAbsences(lastNumbers), [lastNumbers]);
    const columnsAbsences = React.useMemo(() => calculateColumnAbsences(lastNumbers), [lastNumbers]);
   const StatCard = ({
    title,
    data,
    colors = [],
    cardType,
    containerClassName = 'min-h-[111px]'
  }: {
    title: React.ReactNode | string;
    data: Array<{ label: string; value: number; percentage?: number; hidePercentage?: boolean; customValue?: string }>;
    colors?: string[];
    cardType?: 'colors' | 'highLow' | 'evenOdd' | string;
    containerClassName?: string;
  }) => {
    return (
      <div className={`bg-white rounded-lg shadow-md p-2 lg:p-3 h-full ${containerClassName}`}>
        <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">
          {title}
        </h3>
        <div className="space-y-0.5 lg:space-y-1">
          {data.map((item, idx) => (
            <div key={`${typeof title === 'string' ? title : 'stat'}-${item.label}-${idx}`} className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 lg:gap-1">
                {colors[idx] ? <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${colors[idx]}`}></div> : null}
                <span className="text-xs lg:text-xs text-gray-600 truncate">{item.label}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs lg:text-sm">{item.customValue ?? item.value}</div>
                {!item.hidePercentage && item.percentage !== undefined ? (
                  <div className="text-xs lg:text-xs text-gray-500">{item.percentage}%</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const getRouletteColor = (num: number): string => {
    if (num === 0) return 'bg-green-600';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'bg-red-700' : 'bg-gray-800';
  };
  const getRouletteColorLocal = (num: number): string => getRouletteColor(num);

  const calculateTerminaisStats = React.useMemo(() => {
    const len = Array.isArray(ROULETTE_SEQUENCE) ? ROULETTE_SEQUENCE.length : 0;
    const getNeighbors = (pos: number, count: number) => {
      const right: number[] = [];
      const left: number[] = [];
      for (let i = 1; i <= count && len > 0; i++) {
        right.push(ROULETTE_SEQUENCE[(pos + i) % len]);
        left.push(ROULETTE_SEQUENCE[(pos - i + len) % len]);
      }
      return { right, left };
    };
    if (len === 0) {
      return lastNumbers.map(center => ({ center, neighborsRight: [], neighborsLeft: [] }));
    }
    return lastNumbers.map(center => {
      const pos = ROULETTE_SEQUENCE.indexOf(center);
      const { right, left } = getNeighbors(pos, 4);
      return { center, neighborsRight: right, neighborsLeft: left };
    });
  }, [lastNumbers, ROULETTE_SEQUENCE]);

  const calculatedTerminaisStats = React.useMemo(() => {
    const len = Array.isArray(ROULETTE_SEQUENCE) ? ROULETTE_SEQUENCE.length : 0;
    let wins = 0, losses = 0;
    let positiveSequenceCurrent = 0, positiveSequenceMax = 0;
    let negativeSequenceCurrent = 0, negativeSequenceMax = 0;

    if (lastNumbers.length < 2 || len === 0) {
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
  }, [lastNumbers, ROULETTE_SEQUENCE]);
 
   // Stats de exibição para BET Terminais (zerar quando não há dados)
   const betTerminaisStatsDisplay = React.useMemo(() => {
    if (!betTerminaisStats) {
      return { entradas: 0, wins: 0, losses: 0, winPercentage: 0, lossPercentage: 0, negativeSequenceCurrent: 0, negativeSequenceMax: 0, positiveSequenceCurrent: 0, positiveSequenceMax: 0 };
    }
    if (lastNumbers.length === 0) {
      return { entradas: 0, wins: 0, losses: 0, winPercentage: 0, lossPercentage: 0, negativeSequenceCurrent: 0, negativeSequenceMax: 0, positiveSequenceCurrent: 0, positiveSequenceMax: 0 };
    }
    return betTerminaisStats;
  }, [lastNumbers, betTerminaisStats]);

  // Ranking de Terminais baseado nos últimos números
  const terminaisRanking = React.useMemo(() => {
    const counts = new Array(10).fill(0);
    const numbersBy: number[][] = Array.from({ length: 10 }, () => []);
    lastNumbers.forEach((n: number) => {
      const t = Math.abs(n) % 10;
      counts[t] += 1;
      numbersBy[t].push(n);
    });
    const total = lastNumbers.length;
    const arr = counts.map((count, terminal) => ({
      terminal,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      numbers: numbersBy[terminal]
    }));
    arr.sort((a, b) => (b.count - a.count) || (a.terminal - b.terminal));
    return arr;
  }, [lastNumbers]);

  // Últimos 3 terminais distintos em ordem cronológica (mais recente primeiro)
  const lastThreeTerminais = React.useMemo(() => {
    const result: number[] = [];
    for (let i = lastNumbers.length - 1; i >= 0 && result.length < 3; i--) {
      const t = Math.abs(lastNumbers[i]) % 10;
      if (!result.includes(t)) result.push(t);
    }
    return result;
  }, [lastNumbers]);

  // Lista canônica de números por terminal (0-36)
  const canonicalTerminalNumbers = (terminal: number) => {
    const arr: number[] = [];
    for (let n = 0; n <= 36; n++) {
      if (n % 10 === terminal) arr.push(n);
    }
    return arr;
  };

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
    const torreWins = calculatedTorreStats?.wins ?? 0;
    const torreLosses = calculatedTorreStats?.losses ?? 0;
    const p2Wins = calculatedP2Stats?.wins ?? 0;
    const p2Losses = calculatedP2Stats?.losses ?? 0;
    const betWins = betTerminaisStatsDisplay?.wins ?? 0;
    const betWinPercentage = betTerminaisStatsDisplay?.winPercentage ?? 0;
    const patternWins = pattern171Stats?.wins ?? 0;
    const patternEntradas = pattern171Stats?.entradas ?? 0;
    const triangWins = calculatedTriangulacaoStats?.wins ?? 0;
    const triangWinPercentage = calculatedTriangulacaoStats?.winPercentage ?? 0;
    const p32Total = calculated32P1Stats?.total ?? 0;
    const p32Wins = calculated32P1Stats?.wins ?? 0;

    const strategies = [
      { name: 'Torre', wins: torreWins, winPercentage: (torreWins + torreLosses) > 0 ? Math.round((torreWins / (torreWins + torreLosses)) * 100) : 0 },
      { name: 'P2', wins: p2Wins, winPercentage: (p2Wins + p2Losses) > 0 ? Math.round((p2Wins / (p2Wins + p2Losses)) * 100) : 0 },
      { name: 'BET Terminais', wins: betWins, winPercentage: betWinPercentage },
      { name: '171', wins: patternWins, winPercentage: patternEntradas > 0 ? Math.round((patternWins / patternEntradas) * 100) : 0 },
      { name: 'Triangulação', wins: triangWins, winPercentage: triangWinPercentage },
      { name: '32P3', wins: p32Wins, winPercentage: p32Total > 0 ? Math.round((p32Wins / p32Total) * 100) : 0 },
    ];
    
    // Ordenar por percentual de vitórias (maior para menor)
    return strategies.sort((a, b) => b.winPercentage - a.winPercentage);
  }, [calculatedTorreStats, calculatedP2Stats, betTerminaisStatsDisplay, pattern171Stats, calculatedTriangulacaoStats, calculated32P1Stats]);

  // Ordem fixa para exibição no card Ranking (sem rolagem)
  const displayStrategiesRanking = React.useMemo(() => {
    // Exibir ordenado por maior percentual de vitórias para menor
    return calculateStrategiesRanking;
  }, [calculateStrategiesRanking]);

  return (
    <div className="space-y-3 flex flex-col">
      {/* Primeira linha - 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 lg:gap-2 transition-all duration-300 ease-in-out" style={{
        order: rowOrder === 0 ? 1 : rowOrder === 1 ? 3 : 2,
        marginTop: '0',
        marginBottom: rowOrder === 1 ? '0' : '0.75rem'
      }}>
        {/* Card - Ranking das Estratégias (de volta ao primeiro da 1ª linha) */}
        <RankingEstrategiasCard displayStrategiesRanking={displayStrategiesRanking} />

        <TorreCard 
          calculatedTorreStats={calculatedTorreStats} 
          totalNumbers={totalNumbers} 
          animatingTorre={animatingTorre} 
          setShowTorreModal={setShowTorreModal} 
        />

        <BETTerminaisCard 
          betTerminaisStatsDisplay={betTerminaisStatsDisplay} 
          totalNumbers={totalNumbers} 
          animatingBetTerminais={animatingBetTerminais} 
          terminaisRanking={terminaisRanking} 
        />

        <ColunasCard 
          statistics={statistics} 
          columnsPercentages={columnsPercentages} 
          columnsLoss={columnsLoss} 
          lastNumbers={lastNumbers} 
          getNumberColumnSafe={getNumberColumnSafe} 
          columnsAbsences={columnsAbsences}
        />

        {/* Card Dúzias Customizado (movido da 3ª linha para 1ª linha) */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2 flex justify-between items-center">
             <span>Dúzias</span>
             <span className="text-[13px] lg:text-[15px] text-yellow-600 font-normal">LOSS: <span className="font-bold">{dozensLoss}</span></span>
           </h3>
          <div className="space-y-0.5 lg:space-y-1">
            {[
              { label: '1ª (1-12)', value: statistics.dozens.first, percentage: dozensPercentages.first, color: 'bg-yellow-600', dozenIndex: 1, absences: dozensAbsences.first },
              { label: '2ª (13-24)', value: statistics.dozens.second, percentage: dozensPercentages.second, color: 'bg-green-600', dozenIndex: 2, absences: dozensAbsences.second },
              { label: '3ª (25-36)', value: statistics.dozens.third, percentage: dozensPercentages.third, color: 'bg-blue-600', dozenIndex: 3, absences: dozensAbsences.third }
            ].map((item, index) => {
              const isRepeated = animatingDozens.has(item.dozenIndex);
              return (
                <div key={item.label} className="grid items-center gap-1" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                  {/* Coluna 1: Identificação da Dúzia */}
                  <div className="flex items-center gap-0.5 lg:gap-1">
                    <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${item.color}`}></div>
                    <span className="text-xs lg:text-xs text-gray-600">{item.label}</span>
                  </div>
                  
                  {/* Coluna 2: Ausências (centralizada) */}
                  <div className="text-center" style={{ marginLeft: '12px', marginRight: '12px' }}>
                    <div 
                      className="text-pink-400" 
                      style={{ fontSize: '12px' }}
                      title={`Ausências: ${item.absences.current} atual / ${item.absences.max} máxima consecutiva`}
                    >
                      {item.absences.current} / {item.absences.max}
                    </div>
                  </div>
                  
                  {/* Coluna 3: Total e Percentual (alinhada à direita) */}
                  <div className="text-right">
                    <div className={`font-bold text-gray-800 text-xs lg:text-sm ${
                      isRepeated ? 'animate-pulse-color-size' : ''
                    }`}>
                      {item.value}
                    </div>
                    <div className="text-xs lg:text-xs text-gray-500">{item.percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Rodapé com lista horizontal de dúzias chamadas */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex overflow-x-auto ranking-scroll pr-1">
              <div className="flex" style={{ minWidth: 'max-content' }}>
                {lastNumbers
                  .slice()
                  .reverse() // Últimas dúzias à esquerda
                  .map((num, index) => {
                    const dozen = getNumberDozenSafe(num);
                    if (dozen === null) return null;
                    
                    // Cores de texto fortes e visíveis em fundo cinza
                    const dozenTextColors: Record<number, string> = {
                      1: 'text-yellow-600',
                      2: 'text-green-600',
                      3: 'text-blue-600'
                    };
                    
                    return (
                      <span
                        key={`${num}-${index}`}
                        className={`font-bold text-sm whitespace-nowrap ${dozenTextColors[dozen]}`}
                        style={{ marginRight: '5px' }}
                      >
                        {dozen}
                      </span>
                    );
                  })
                  .filter(Boolean)}
              </div>
            </div>
          </div>
        </div>

        
      </div>

      {/* Segunda linha - 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 lg:gap-2 transition-all duration-300 ease-in-out" style={{
        order: rowOrder === 0 ? 2 : rowOrder === 1 ? 1 : 3,
        marginTop: '0',
        marginBottom: rowOrder === 2 ? '0' : '0.75rem'
      }}>

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

        {/* Novo card 32P3 (apenas rótulo; lógica permanece 32P1) */}
        <StatCard
          title={
            <div className="flex justify-between items-center w-full">
              <span>32P3</span>
              <select
                className="text-xs bg-gray-200 text-gray-700 rounded px-1 py-0.5"
                value={window32P1}
                onChange={() => {}}
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
            <div data-card-id="p2-card" className={`cursor-pointer transition-all duration-300 flex justify-between items-center`} onClick={() => setShowP2Modal(true)}>
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
          containerClassName={`min-h-[111px] ${
            animatingP2 === 'green' 
              ? 'animate-pulse-green-border' 
              : animatingP2 === 'yellow' 
              ? 'animate-pulse-yellow-border' 
              : ''
          }`}
          data={[
            { label: 'Entradas', value: p2Safe.entradas, percentage: totalNumbers > 0 ? Math.round((p2Safe.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: p2Safe.wins, percentage: (p2Safe.wins + p2Safe.losses) > 0 ? Math.round((p2Safe.wins / (p2Safe.wins + p2Safe.losses)) * 100) : 0 },
            { label: 'LOSS', value: p2Safe.losses, percentage: (p2Safe.wins + p2Safe.losses) > 0 ? Math.round((p2Safe.losses / (p2Safe.wins + p2Safe.losses)) * 100) : 0 },
            { label: '> Seq. Negativa', value: p2Safe.maxNegativeSequence, percentage: p2Safe.entradas > 0 ? Math.round((p2Safe.maxNegativeSequence / p2Safe.entradas) * 100) : 0, hidePercentage: true }
          ]}
          colors={['bg-gray-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500']}
        />

        {/* Card Race Track (movido para 2ª linha) */}
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

        {/* Card Terminais (agora na 1ª linha, posição do antigo P2) */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24">
          <div className="flex justify-between items-center mb-1 lg:mb-2">
            <h3 className="text-xs lg:text-sm font-semibold text-gray-800">Terminais</h3>
            {terminaisRanking.length > 0 && (
              <div className="flex items-center gap-[5px]">
                {terminaisRanking.slice(-3).map(({ terminal }, idx) => (
                  <span key={`term-${terminal}-${idx}`} className="text-yellow-500 font-semibold text-xs lg:text-sm">{terminal}</span>
                ))}
              </div>
            )}
          </div>
          <div className="ranking-scroll max-h-[calc(8rem+19px)] overflow-y-auto">
            <div className="space-y-0.5">
              {lastNumbers.length > 0 ? (
                terminaisRanking.slice(0, 10).map(({ terminal, count, percentage, numbers = [] }) => (
                  <div key={terminal} className="flex justify-between items-center px-1 py-0.5 rounded text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-[14px]">
                        {terminal}
                      </div>
                      <span className="text-xs text-gray-600 truncate">
                        {canonicalTerminalNumbers(terminal).map(n => n.toString().padStart(2, '0')).join(',')}
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 lg:gap-2 transition-all duration-300 ease-in-out" style={{
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
        {/* Card Alto/Baixo (movido para 3ª linha, posição do Race Track) */}
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
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(number)}`}>
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
                    <div key={n} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColor(n)}`}>
                      {n.toString().padStart(2,'0')}
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(3)}`}>03</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(4)}`}>04</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(7)}`}>07</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(11)}`}>11</div>
              </div>
              
              <div className="flex justify-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(15)}`}>15</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(18)}`}>18</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(21)}`}>21</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(22)}`}>22</div>
              </div>
              
              <div className="flex justify-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(25)}`}>25</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(29)}`}>29</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(33)}`}>33</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(36)}`}>36</div>
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(1)}`}>01</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(2)}`}>02</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(3)}`}>03</div>
              </div>
              
              <div className="flex justify-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(34)}`}>34</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(35)}`}>35</div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(36)}`}>36</div>
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
                    <div key={num} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColor(num)}`}>
                      {num.toString().padStart(2,'0')}
                    </div>
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
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(s.center)}`}>{s.center.toString().padStart(2,'0')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-16">Esquerda</span>
                        <div className="flex flex-wrap gap-1">
                          {s.neighborsLeft.map(n => (
                            <div key={`${s.center}-L-${n}`} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(n)}`}>{n.toString().padStart(2,'0')}</div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-600 w-16">Direita</span>
                        <div className="flex flex-wrap gap-1">
                          {s.neighborsRight.map(n => (
                            <div key={`${s.center}-R-${n}`} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRouletteColorLocal(n)}`}>{n.toString().padStart(2,'0')}</div>
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
