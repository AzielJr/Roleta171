import React from 'react';
import { Statistics } from '../types/roulette';
import { useStatistics } from '../hooks/useStatistics';

interface StatisticsCardsProps {
  statistics: Statistics;
}

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
  const {
    totalNumbers,
    colorPercentages,
    evenOddPercentages,
    highLowPercentages,
    dozensPercentages,
    columnsPercentages
  } = useStatistics(statistics);

  const StatCard = ({ title, data, colors }: {
    title: string;
    data: Array<{ label: string; value: number; percentage: number }>;
    colors: string[];
  }) => (
    <div className="bg-white rounded-lg shadow-md p-3">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${colors[index]}`}></div>
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
      {/* Header com total */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalNumbers}</div>
          <div className="text-xs text-blue-800">Total de Números</div>
        </div>
      </div>

      {/* Grid compacto de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
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
      </div>
    </div>
  );
}