import React from 'react';

const NumerosMax50Card = ({ lastNumbers, totalNumbers, getRouletteColorLocal }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full">
      <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">Números (Max 50)</h3>
      <div className="ranking-scroll max-h-[calc(8rem+16px)] overflow-y-auto">
        <div className="space-y-0.5">
          {React.useMemo(() => {
            const numberCounts: Record<number, number> = {};
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
  );
};

export default NumerosMax50Card;
