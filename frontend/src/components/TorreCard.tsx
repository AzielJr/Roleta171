import React from 'react';

const TorreCard = ({ calculatedTorreStats, totalNumbers, animatingTorre, setShowTorreModal }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-2 lg:p-3 h-full ${
        animatingTorre === 'green' 
          ? 'animate-pulse-green-border' 
          : animatingTorre === 'yellow' 
          ? 'animate-pulse-yellow-border' 
          : ''
      }`}>
      <h3 className="text-xs lg:text-sm font-semibold text-white mb-1 lg:mb-2 cursor-pointer" onClick={() => setShowTorreModal(true)}>
        Torre
      </h3>
      <div className="min-h-[111px]">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-gray-500"></div>
              <span className="text-xs lg:text-xs text-gray-600">Entradas</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculatedTorreStats.entradas}</div>
              <div className="text-xs lg:text-xs text-gray-500">{totalNumbers > 0 ? Math.round((calculatedTorreStats.entradas / totalNumbers) * 100) : 0}%</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500"></div>
              <span className="text-xs lg:text-xs text-gray-600">WIN</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculatedTorreStats.wins}</div>
              <div className="text-xs lg:text-xs text-gray-500">{(calculatedTorreStats.wins + calculatedTorreStats.losses) > 0 ? Math.round((calculatedTorreStats.wins / (calculatedTorreStats.wins + calculatedTorreStats.losses)) * 100) : 0}%</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-red-500"></div>
              <span className="text-xs lg:text-xs text-gray-600">LOSS</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculatedTorreStats.losses}</div>
              <div className="text-xs lg:text-xs text-gray-500">{(calculatedTorreStats.wins + calculatedTorreStats.losses) > 0 ? Math.round((calculatedTorreStats.losses / (calculatedTorreStats.wins + calculatedTorreStats.losses)) * 100) : 0}%</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs lg:text-xs text-gray-600">Seq. Negativa</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculatedTorreStats.currentNegativeSequence}/{calculatedTorreStats.maxNegativeSequence}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TorreCard;
