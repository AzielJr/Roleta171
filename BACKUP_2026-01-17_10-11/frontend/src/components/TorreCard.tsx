import React from 'react';

const TorreCard = ({ calculatedTorreStats, totalNumbers, animatingTorre, setShowTorreModal }) => {
  const wins = Number(calculatedTorreStats?.wins) || 0;
  const losses = Number(calculatedTorreStats?.losses) || 0;
  const totalEval = wins + losses;
  const displayWin = (() => {
    if (wins > 0 && losses === 0) return 100;
    if (wins === 0 && losses > 0) return 0;
    if (totalEval > 0) return Math.max(1, Math.round((wins / totalEval) * 100));
    return wins > 0 ? 100 : 0;
  })();
  const displayLoss = (() => {
    if (wins > 0 && losses === 0) return 0;
    if (wins === 0 && losses > 0) return 100;
    if (totalEval > 0) return Math.max(0, 100 - Math.max(1, Math.round((wins / totalEval) * 100)));
    return losses > 0 ? 100 : 0;
  })();
  return (
    <div className={`bg-white rounded-lg shadow-md p-2 lg:p-3 h-full ${
        animatingTorre === 'green' 
          ? 'animate-pulse-green-border' 
          : animatingTorre === 'yellow' 
          ? 'animate-pulse-yellow-border' 
          : ''
      }`}>
      <h3 className="text-xs lg:text-sm font-semibold text-white mb-1 lg:mb-2 cursor-pointer" onClick={() => setShowTorreModal(true)}>
        Torre Móvel
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
              {(() => {
                const tn = Number(totalNumbers) || 0;
                const entradas = Number(calculatedTorreStats?.entradas) || 0;
                const display = tn > 0 ? Math.max(1, Math.round((entradas / tn) * 100)) : (entradas > 0 ? 100 : 0);
                return <div className="text-xs lg:text-xs text-yellow-400 font-semibold">{display}%</div>;
              })()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500"></div>
              <span className="text-xs lg:text-xs text-gray-600">WIN</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculatedTorreStats.wins}</div>
              <div className="text-xs lg:text-xs text-yellow-400 font-semibold">{displayWin}%</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-red-500"></div>
              <span className="text-xs lg:text-xs text-gray-600">LOSS</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{calculatedTorreStats.losses}</div>
              <div className="text-xs lg:text-xs text-yellow-400 font-semibold">{displayLoss}%</div>
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
