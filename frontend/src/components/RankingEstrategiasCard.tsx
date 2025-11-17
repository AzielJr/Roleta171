import React from 'react';

const RankingEstrategiasCard = ({ displayStrategiesRanking }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full">
      <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2">Ranking Estratégias</h3>
      <style>{`
        .ranking-scroll { scrollbar-width: thin; scrollbar-color: #4b5563 #111827; }
        .ranking-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .ranking-scroll::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 6px; }
        .ranking-scroll::-webkit-scrollbar-track { background-color: #111827; }
        .ranking-scroll .ranking-item:nth-child(odd) { background-color: rgba(255, 255, 255, 0.12); }
        .ranking-scroll .ranking-item:nth-child(even) { background-color: rgba(255, 255, 255, 0.06); }
      `}</style>
      <div>
        <div className="space-y-[3px] ranking-scroll max-h-[150px] overflow-y-auto pr-1">
          {displayStrategiesRanking.map((strategy, index) => (
            <div key={strategy.name} className="ranking-item flex justify-between items-center px-1 py-0.5 rounded text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  {index + 1}
                </div>
                <span className="text-xs text-gray-600 truncate font-medium">
                  {strategy.name}
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-xs">{strategy.winPercentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RankingEstrategiasCard;
