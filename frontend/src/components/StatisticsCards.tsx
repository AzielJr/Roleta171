import React from 'react';
import { Statistics } from '../types/roulette';
import { useStatistics } from '../hooks/useStatistics';

interface StatisticsCardsProps {
  statistics: Statistics;
  patternDetectedCount?: number;
  winCount?: number;
  lossCount?: number;
  numbersWithoutPattern?: number;
  totalNumbersWithoutPattern?: number;
}

export function StatisticsCards({ statistics, patternDetectedCount = 0, winCount = 0, lossCount = 0, numbersWithoutPattern = 0, totalNumbersWithoutPattern = 0 }: StatisticsCardsProps) {
  const {
    totalNumbers,
    colorPercentages,
    evenOddPercentages,
    highLowPercentages,
    dozensPercentages,
    columnsPercentages
  } = useStatistics(statistics);

  const StatCard = ({ title, data, colors }: {
    title: string | React.ReactNode;
    data: Array<{ label: string; value: number; percentage: number }>;
    colors: string[];
  }) => (
    <div className="bg-white rounded-lg shadow-md p-3">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
              <span className="text-xs text-gray-600 truncate">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-sm">{item.value}</div>
              <div className="text-xs text-gray-500">{item.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Grid com todos os 6 cards em uma linha */}
      <div className="grid grid-cols-6 gap-2">
        <StatCard
          title="Cores"
          data={[
            { label: 'Vermelho', value: statistics.colors.red, percentage: colorPercentages.red },
            { label: 'Preto', value: statistics.colors.black, percentage: colorPercentages.black },
            { label: 'Verde (0)', value: statistics.colors.green, percentage: colorPercentages.green }
          ]}
          colors={['bg-red-500', 'bg-gray-800', 'bg-green-500']}
        />

        <StatCard
          title="Par / Ímpar"
          data={[
            { label: 'Par', value: statistics.evenOdd.even, percentage: evenOddPercentages.even },
            { label: 'Ímpar', value: statistics.evenOdd.odd, percentage: evenOddPercentages.odd }
          ]}
          colors={['bg-blue-500', 'bg-purple-500']}
        />

        <StatCard
          title="Alto / Baixo"
          data={[
            { label: 'Baixo (1-18)', value: statistics.highLow.low, percentage: highLowPercentages.low },
            { label: 'Alto (19-36)', value: statistics.highLow.high, percentage: highLowPercentages.high }
          ]}
          colors={['bg-yellow-500', 'bg-orange-500']}
        />

        <StatCard
          title="Dúzias"
          data={[
            { label: '1ª (1-12)', value: statistics.dozens.first, percentage: dozensPercentages.first },
            { label: '2ª (13-24)', value: statistics.dozens.second, percentage: dozensPercentages.second },
            { label: '3ª (25-36)', value: statistics.dozens.third, percentage: dozensPercentages.third }
          ]}
          colors={['bg-cyan-500', 'bg-indigo-500', 'bg-pink-500']}
        />

        <StatCard
          title="Colunas"
          data={[
            { label: '1ª Coluna', value: statistics.columns.first, percentage: columnsPercentages.first },
            { label: '2ª Coluna', value: statistics.columns.second, percentage: columnsPercentages.second },
            { label: '3ª Coluna', value: statistics.columns.third, percentage: columnsPercentages.third }
          ]}
          colors={['bg-emerald-500', 'bg-teal-500', 'bg-lime-500']}
        />

        <StatCard
          title={
            <div className="flex justify-between items-center w-full">
              <span>📊 171</span>
              <span className="font-normal text-xs text-gray-500">Qtd: <span className="font-bold text-white">{numbersWithoutPattern}</span> - Méd: <span className="font-bold text-white">{patternDetectedCount > 0 ? Math.round((totalNumbers / patternDetectedCount) * 100) / 100 : 0}</span></span>
            </div>
          }
          data={[
            { label: 'Entradas', value: patternDetectedCount, percentage: totalNumbers > 0 ? Math.round((patternDetectedCount / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: winCount, percentage: patternDetectedCount > 0 ? Math.round((winCount / patternDetectedCount) * 100) : 0 },
            { label: 'LOSS', value: lossCount, percentage: patternDetectedCount > 0 ? Math.round((lossCount / patternDetectedCount) * 100) : 0 }
          ]}
          colors={['bg-gray-500', 'bg-green-500', 'bg-red-500']}
        />
      </div>
    </div>
  );
}