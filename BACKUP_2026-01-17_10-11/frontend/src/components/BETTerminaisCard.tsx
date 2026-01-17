import React from 'react';

const BETTerminaisCard = ({ betTerminaisStatsDisplay, totalNumbers, animatingBetTerminais, terminaisRanking }) => {
  const wins = Number(betTerminaisStatsDisplay?.wins) || 0;
  const losses = Number(betTerminaisStatsDisplay?.losses) || 0;
  const entradas = Number(betTerminaisStatsDisplay?.entradas) || 0;
  const totalEval = wins + losses;
  const displayEntradas = (() => {
    const tn = Number(totalNumbers) || 0;
    if (tn > 0) return Math.max(1, Math.round((entradas / tn) * 100));
    return entradas > 0 ? 100 : 0;
  })();
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
    <div className={`bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24 ${
        animatingBetTerminais === 'green' 
          ? 'animate-pulse-green-border' 
          : animatingBetTerminais === 'yellow' 
          ? 'animate-pulse-yellow-border' 
          : ''
      }`}>
      <div className="flex justify-between items-center mb-1 lg:mb-2 cursor-pointer transition-all duration-300">
        <h3 className="text-xs lg:text-sm font-semibold text-white">BET Terminais</h3>
        {terminaisRanking.length > 0 && (
          <div className="flex items-center gap-[5px]">
            {terminaisRanking.slice(-3).map(({ terminal }, idx) => (
              <span key={`bet-${terminal}-${idx}`} className="text-yellow-500 font-semibold text-xs lg:text-sm">{terminal}</span>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-gray-500"></div>
            <span className="text-xs lg:text-xs text-gray-600">Entradas</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800 text-xs lg:text-sm">{betTerminaisStatsDisplay.entradas}</div>
            <div className="text-xs lg:text-xs text-yellow-400 font-semibold">{displayEntradas}%</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500"></div>
            <span className="text-xs lg:text-xs text-gray-600">WIN</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800 text-xs lg:text-sm">{betTerminaisStatsDisplay.wins}</div>
            <div className="text-xs lg:text-xs text-yellow-400 font-semibold">{displayWin}%</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-red-500"></div>
            <span className="text-xs lg:text-xs text-gray-600">LOSS</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800 text-xs lg:text-sm">{betTerminaisStatsDisplay.losses}</div>
            <div className="text-xs lg:text-xs text-yellow-400 font-semibold">{displayLoss}%</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs lg:text-xs text-gray-600">Seq. Negativa</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800 text-xs lg:text-sm">{betTerminaisStatsDisplay.negativeSequenceCurrent}/{betTerminaisStatsDisplay.negativeSequenceMax}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BETTerminaisCard;
