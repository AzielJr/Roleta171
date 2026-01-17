import React, { useState } from 'react';
import { ArrowLeft, Trash2, Undo2, Plus, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface FourColorsMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FourColorsMobile: React.FC<FourColorsMobileProps> = ({ isOpen, onClose }) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [showNumberPopup, setShowNumberPopup] = useState<boolean>(false);

  if (!isOpen) return null;

  const ROULETTE_NUMBERS = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36
  ];

  const marromGroup = [32, 15, 19, 4, 21, 2, 25, 17, 34];
  const azulGroup = [6, 27, 13, 36, 11, 30, 8, 23, 10];
  const amareloGroup = [5, 24, 16, 33, 1, 20, 14, 31, 9];
  const verdeEscuroGroup = [22, 18, 29, 7, 28, 12, 35, 3, 26];

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'bg-green-400 text-white';
    if (marromGroup.includes(num)) return 'bg-[#8B4513] text-white';
    if (azulGroup.includes(num)) return 'bg-blue-600 text-white';
    if (amareloGroup.includes(num)) return 'bg-yellow-400 text-black';
    if (verdeEscuroGroup.includes(num)) return 'bg-green-800 text-white';
    return 'bg-gray-200 text-gray-800';
  };

  const getNumberTextColor = (num: number): string => {
    if (num === 0) return 'text-green-500';
    if (marromGroup.includes(num)) return 'text-[#8B4513]';
    if (azulGroup.includes(num)) return 'text-blue-600';
    if (amareloGroup.includes(num)) return 'text-yellow-600';
    if (verdeEscuroGroup.includes(num)) return 'text-green-800';
    return 'text-gray-700';
  };

  const getColorName = (num: number): 'Marrom' | 'Azul' | 'Amarelo' | 'Verde' | 'Zero' => {
    if (num === 0) return 'Zero';
    if (marromGroup.includes(num)) return 'Marrom';
    if (azulGroup.includes(num)) return 'Azul';
    if (amareloGroup.includes(num)) return 'Amarelo';
    if (verdeEscuroGroup.includes(num)) return 'Verde';
    return 'Zero';
  };

  const getRepresentativeNumber = (color: string): number => {
    switch (color) {
      case 'Marrom': return 21;
      case 'Azul': return 11;
      case 'Amarelo': return 1;
      case 'Verde': return 28;
      case 'Zero': return 0;
      default: return 0;
    }
  };

  const getRepresentativeColorClass = (color: string): string => {
    switch (color) {
      case 'Marrom': return 'bg-[#8B4513] text-white';
      case 'Azul': return 'bg-blue-600 text-white';
      case 'Amarelo': return 'bg-yellow-400 text-black';
      case 'Verde': return 'bg-green-800 text-white';
      case 'Zero': return 'bg-green-400 text-white';
      default: return 'bg-gray-200';
    }
  };

  const handleNumberClick = (num: number, closePopup: boolean = false) => {
    setSelectedNumbers(prev => {
      const updated = [...prev, num];
      // Manter apenas os últimos 60 números
      return updated.length > 60 ? updated.slice(-60) : updated;
    });
    
    if (closePopup) {
      setShowNumberPopup(false);
    }
  };

  const handleClear = () => {
    setSelectedNumbers([]);
  };

  const handleRemoveLast = () => {
    setSelectedNumbers(prev => prev.slice(0, -1));
  };

  const calculateStats = () => {
    const counts = {
      marrom: 0,
      azul: 0,
      amarelo: 0,
      verdeEscuro: 0
    };

    let total = 0;

    selectedNumbers.forEach(num => {
      if (marromGroup.includes(num)) { counts.marrom++; total++; }
      else if (azulGroup.includes(num)) { counts.azul++; total++; }
      else if (amareloGroup.includes(num)) { counts.amarelo++; total++; }
      else if (verdeEscuroGroup.includes(num)) { counts.verdeEscuro++; total++; }
    });

    const stats = [
      { name: 'Marrom', color: 'bg-[#8B4513]', count: counts.marrom, percent: total > 0 ? (counts.marrom / total) * 100 : 0 },
      { name: 'Azul', color: 'bg-blue-600', count: counts.azul, percent: total > 0 ? (counts.azul / total) * 100 : 0 },
      { name: 'Amarelo', color: 'bg-yellow-400', count: counts.amarelo, percent: total > 0 ? (counts.amarelo / total) * 100 : 0 },
      { name: 'Verde', color: 'bg-green-800', count: counts.verdeEscuro, percent: total > 0 ? (counts.verdeEscuro / total) * 100 : 0 },
    ];

    return stats.sort((a, b) => b.percent - a.percent);
  };

  const calculateStrategy = () => {
    const sequence = [...selectedNumbers].map(n => Number(n));
    let wins = 0;
    let losses = 0;
    let entries = 0;
    
    let curWinStreak = 0;
    let maxWinStreak = 0;
    let curLossStreak = 0;
    let maxLossStreak = 0;

    let currentSuggestion: string[] | null = null;

    for (let i = 5; i <= sequence.length; i++) {
      const window = sequence.slice(i - 5, i);
      
      const uniqueColors = new Set<string>();
      const counts: Record<string, number> = { 'Marrom': 0, 'Azul': 0, 'Amarelo': 0, 'Verde': 0 };
      const lastIndex: Record<string, number> = { 'Marrom': -1, 'Azul': -1, 'Amarelo': -1, 'Verde': -1 };

      window.forEach((num, idx) => {
        const c = getColorName(num);
        if (c !== 'Zero') {
            uniqueColors.add(c);
            counts[c]++;
            lastIndex[c] = idx;
        }
      });

      if (uniqueColors.size === 3) {
        const sortedColors = ['Marrom', 'Azul', 'Amarelo', 'Verde'].sort((a, b) => {
            if (counts[b] !== counts[a]) {
                return counts[b] - counts[a];
            }
            return lastIndex[b] - lastIndex[a];
        });

        const excludedColor = sortedColors[0];
        const suggestion = sortedColors.slice(1);

        const isCurrent = i === sequence.length;
        
        if (isCurrent) {
          currentSuggestion = suggestion;
        } else {
          entries++;
          const nextNum = sequence[i]; 
          
          if (nextNum !== undefined) {
             const nextColor = getColorName(nextNum);
             if (suggestion.includes(nextColor) || nextColor === 'Zero') {
               wins++;
               curWinStreak++;
               curLossStreak = 0;
               if (curWinStreak > maxWinStreak) maxWinStreak = curWinStreak;
             } else {
               losses++;
               curLossStreak++;
               curWinStreak = 0;
               if (curLossStreak > maxLossStreak) maxLossStreak = curLossStreak;
             }
          }
        }
      }
    }

    return { wins, losses, entries, currentSuggestion, curWinStreak, maxWinStreak, curLossStreak, maxLossStreak };
  };

  const stats = calculateStats();
  const strategyStats = calculateStrategy();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-800 to-green-900 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-green-300 transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-medium">Voltar</span>
          </button>
          
          <h1 className="text-xl font-bold text-white">4 Cores</h1>
          
          <button
            onClick={handleClear}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
            <span className="text-sm font-medium">Limpar</span>
          </button>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Selecione os Números</h2>
            <button
              onClick={() => setShowNumberPopup(true)}
              className="text-green-600 hover:text-green-700 active:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
              title="Seleção ampliada"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="grid grid-cols-9 gap-1">
            {/* Zero no topo - linha completa */}
            <button
              onClick={() => handleNumberClick(0)}
              className={cn(
                "col-span-9 h-10 flex items-center justify-center rounded font-bold text-xs transition-transform active:scale-95",
                getNumberColor(0)
              )}
            >
              0
            </button>
            
            {/* Números 1-36 em grid 9x4 */}
            {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className={cn(
                  "aspect-square flex items-center justify-center rounded font-bold text-xs transition-transform active:scale-95",
                  getNumberColor(num)
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Números Selecionados ({selectedNumbers.length})</h2>
            {selectedNumbers.length > 0 && (
              <button
                onClick={handleRemoveLast}
                className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                title="Desfazer último número"
              >
                <Undo2 size={14} />
                <span>Desfazer</span>
              </button>
            )}
          </div>
          <div className="border border-gray-200 rounded p-3 bg-gray-50">
            {selectedNumbers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                Nenhum número selecionado
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-1 leading-relaxed">
                {[...selectedNumbers].slice(-60).reverse().map((num, index, arr) => (
                  <React.Fragment key={`${num}-${selectedNumbers.length - 1 - index}`}>
                    <span className={cn("font-semibold text-xs", getNumberTextColor(num))}>
                      {num.toString().padStart(2, '0')}
                    </span>
                    {index < arr.length - 1 && (
                      <span className="text-gray-600 font-normal text-xs">-</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Estratégia</h2>
          
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-2">Entrada Sugerida</span>
            {strategyStats.currentSuggestion ? (
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  {strategyStats.currentSuggestion.map(color => (
                    <div key={color} className={cn("w-10 h-10 rounded flex items-center justify-center text-sm font-bold", getRepresentativeColorClass(color))}>
                      {getRepresentativeNumber(color).toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
                <span className="text-gray-400 font-bold text-lg">+</span>
                <div className={cn("w-10 h-10 rounded flex items-center justify-center text-sm font-bold", getRepresentativeColorClass('Zero'))}>
                  00
                </div>
              </div>
            ) : (
              <span className="text-gray-400 text-sm italic block text-center">Aguardando dados...</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Entradas:</span>
              <span className="font-bold text-gray-800">{strategyStats.entries}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-green-600 font-bold">WIN:</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-800">{strategyStats.wins}</span>
                <span className="text-gray-500 text-sm">
                  {strategyStats.curWinStreak.toString().padStart(2, '0')} / {strategyStats.maxWinStreak.toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-red-500 font-bold">LOSS:</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-800">{strategyStats.losses}</span>
                <span className="text-gray-500 text-sm">
                  {strategyStats.curLossStreak.toString().padStart(2, '0')} / {strategyStats.maxLossStreak.toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Estatísticas</h2>
          <div className="space-y-2">
            {stats.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-6 h-6 rounded", item.color)}></div>
                  <span className="font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">{item.count}</span>
                  <span className="text-gray-500 text-sm w-12 text-right">{item.percent.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNumberPopup && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 z-[60]"
            onClick={() => setShowNumberPopup(false)}
          />
          
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-green-700 p-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-white font-bold text-lg">Selecionar Número</h3>
                <button
                  onClick={() => setShowNumberPopup(false)}
                  className="text-white hover:text-green-300 transition-colors p-1"
                  title="Fechar"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="mb-2">
                  <button
                    onClick={() => handleNumberClick(0, true)}
                    className="w-full h-16 flex items-center justify-center text-white font-bold text-2xl rounded-lg bg-green-400 hover:bg-green-500 active:bg-green-600 shadow-md transition-colors"
                  >
                    0
                  </button>
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num, true)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors",
                        getNumberColor(num)
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[7, 8, 9, 10, 11, 12].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num, true)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors",
                        getNumberColor(num)
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[13, 14, 15, 16, 17, 18].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num, true)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors",
                        getNumberColor(num)
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[19, 20, 21, 22, 23, 24].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num, true)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors",
                        getNumberColor(num)
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[25, 26, 27, 28, 29, 30].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num, true)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors",
                        getNumberColor(num)
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[31, 32, 33, 34, 35, 36].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num, true)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors",
                        getNumberColor(num)
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FourColorsMobile;
