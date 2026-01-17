import React from 'react';

interface NovesForaCardProps {
  novesForaStats: {
    entradas: number;
    wins: number;
    losses: number;
    winPercentage: number;
    lossPercentage: number;
    negativeSequenceCurrent: number;
    negativeSequenceMax: number;
  };
  totalNumbers: number;
  animatingNovesFora?: 'yellow' | 'green';
}

const NovesForaCard: React.FC<NovesForaCardProps> = ({ novesForaStats, totalNumbers, animatingNovesFora }) => {
  const [open, setOpen] = React.useState(false);
  const entradas = Number(novesForaStats.entradas) || 0;
  const wins = Number(novesForaStats.wins) || 0;
  const losses = Number(novesForaStats.losses) || 0;
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
    <div className={`bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-[111px] ${
      animatingNovesFora === 'green'
        ? 'animate-pulse-green-border'
        : animatingNovesFora === 'yellow'
        ? 'animate-pulse-yellow-border'
        : ''
    }`}>
      <h3 className="text-xs lg:text-sm font-semibold text-white mb-1 lg:mb-2">
        <button type="button" onClick={() => setOpen(true)} className="cursor-pointer">
          NovesFora v3
        </button>
      </h3>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-gray-500"></div>
            <span className="text-xs lg:text-xs text-gray-600">Entradas</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800 text-xs lg:text-sm">{novesForaStats.entradas}</div>
            <div className="text-xs lg:text-xs text-yellow-400 font-semibold" title={`Entradas=${entradas} / Total=${totalNumbers}`}>Entradas%: {displayEntradas}%</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500"></div>
            <span className="text-xs lg:text-xs text-gray-600">WIN</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800 text-xs lg:text-sm">{novesForaStats.wins}</div>
            <div className="text-xs lg:text-xs text-yellow-400 font-semibold" title={`wins=${wins}`}>% de vitórias: {displayWin}%</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-red-500"></div>
            <span className="text-xs lg:text-xs text-gray-600">LOSS</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800 text-xs lg:text-sm">{novesForaStats.losses}</div>
            <div className="text-xs lg:text-xs text-yellow-400 font-semibold" title={`losses=${losses}`}>PERDA%: {displayLoss}%</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs lg:text-xs text-gray-600">Seq. Negativa</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-800 text-xs lg:text-sm">{novesForaStats.negativeSequenceCurrent}/{novesForaStats.negativeSequenceMax}</div>
          </div>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-4 w-11/12 max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-semibold mb-2">NovesFora</div>
            <div className="text-xs text-gray-700 mb-2">Gatilhos: 5, 8, 16, 23, 25, 30</div>
            <div className="text-xs text-gray-700 mb-1">Entrada: quando sai um número de gatilho, o campo Entradas incrementa imediatamente.</div>
            <div className="text-xs text-gray-700 mb-1">WIN: na rodada seguinte, se o número não for de gatilho.</div>
            <div className="text-xs text-gray-700 mb-3">LOSS: na rodada seguinte, se o número for de gatilho.</div>
            <div className="text-xs text-gray-700 mb-3">Seq. Negativa: mostra atual/MAX de LOSS consecutivo; zera o atual ao ocorrer um WIN.</div>
            <div className="flex justify-end">
              <button type="button" className="text-xs bg-gray-800 text-white px-3 py-1 rounded" onClick={() => setOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovesForaCard;
