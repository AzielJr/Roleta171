import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface FourColorsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lastNumbers: number[];
  isMobile?: boolean;
  className?: string;
}

const FourColorsPanel: React.FC<FourColorsPanelProps> = ({ isOpen, onClose, lastNumbers, isMobile = false, className = '' }) => {
  if (!isOpen) return null;

  // Color mappings
  const brownGroup = [32, 15, 19, 4, 21, 2, 25, 17, 34];
  const blueGroup = [6, 27, 13, 36, 11, 30, 8, 23, 10];
  const yellowGroup = [5, 24, 16, 33, 1, 20, 14, 31, 9];
  const darkGreenGroup = [22, 18, 29, 7, 28, 12, 35, 3, 26];

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'bg-green-400 text-white'; // 0 is now Lighter Green

    if (brownGroup.includes(num)) return 'bg-[#8B4513] text-white'; // Brown hex code
    if (blueGroup.includes(num)) return 'bg-blue-600 text-white';
    if (yellowGroup.includes(num)) return 'bg-yellow-400 text-black'; // Yellow (text-black for contrast)
    if (darkGreenGroup.includes(num)) return 'bg-green-800 text-white'; // Dark Green

    return 'bg-gray-200 text-gray-800'; // Fallback
  };

  // Calculate stats
  const calculateStats = () => {
    const counts = {
      brown: 0,
      blue: 0,
      yellow: 0,
      darkGreen: 0
    };

    let total = 0;

    lastNumbers.forEach(num => {
      if (brownGroup.includes(num)) { counts.brown++; total++; }
      else if (blueGroup.includes(num)) { counts.blue++; total++; }
      else if (yellowGroup.includes(num)) { counts.yellow++; total++; }
      else if (darkGreenGroup.includes(num)) { counts.darkGreen++; total++; }
    });

    const stats = [
      { name: 'Brown', color: 'bg-[#8B4513]', count: counts.brown, percent: total > 0 ? (counts.brown / total) * 100 : 0 },
      { name: 'Blue', color: 'bg-blue-600', count: counts.blue, percent: total > 0 ? (counts.blue / total) * 100 : 0 },
      { name: 'Yellow', color: 'bg-yellow-400', count: counts.yellow, percent: total > 0 ? (counts.yellow / total) * 100 : 0 },
      { name: 'Green', color: 'bg-green-800', count: counts.darkGreen, percent: total > 0 ? (counts.darkGreen / total) * 100 : 0 },
    ];

    return stats.sort((a, b) => b.percent - a.percent);
  };

  const stats = calculateStats();

  // Strategy Logic: Exclusion by Short Absence
  // Rule: Last 5 spins. If exactly 3 unique colors present (1 absent), bet on the 3 present + 0.
  
  const getColorName = (num: number): 'Brown' | 'Blue' | 'Yellow' | 'Green' | 'Zero' => {
    if (num === 0) return 'Zero';
    if (brownGroup.includes(num)) return 'Brown';
    if (blueGroup.includes(num)) return 'Blue';
    if (yellowGroup.includes(num)) return 'Yellow';
    if (darkGreenGroup.includes(num)) return 'Green';
    return 'Zero'; // Should not happen
  };

  const getRepresentativeNumber = (color: string): number => {
    switch (color) {
      case 'Brown': return 21;
      case 'Blue': return 11;
      case 'Yellow': return 1;
      case 'Green': return 28;
      case 'Zero': return 0;
      default: return 0;
    }
  };

  const getRepresentativeColorClass = (color: string): string => {
    switch (color) {
      case 'Brown': return 'bg-[#8B4513] text-white';
      case 'Blue': return 'bg-blue-600 text-white';
      case 'Yellow': return 'bg-yellow-400 text-black';
      case 'Green': return 'bg-green-800 text-white';
      case 'Zero': return 'bg-green-400 text-white';
      default: return 'bg-gray-200';
    }
  };

  const calculateStrategy = () => {
    // Use lastNumbers directly (Oldest to Newest) to simulate correctly
    const sequence = [...lastNumbers].map(n => Number(n)); 
    let wins = 0;
    let losses = 0;
    let entries = 0;
    
    let curWinStreak = 0;
    let maxWinStreak = 0;
    let curLossStreak = 0;
    let maxLossStreak = 0;

    let currentSuggestion: string[] | null = null;

    // We need at least 5 numbers to start
    for (let i = 5; i <= sequence.length; i++) {
      const window = sequence.slice(i - 5, i);
      
      const uniqueColors = new Set<string>();
      const counts: Record<string, number> = { 'Brown': 0, 'Blue': 0, 'Yellow': 0, 'Green': 0 };
      const lastIndex: Record<string, number> = { 'Brown': -1, 'Blue': -1, 'Yellow': -1, 'Green': -1 };

      window.forEach((num, idx) => {
        const c = getColorName(num);
        if (c !== 'Zero') {
            uniqueColors.add(c);
            counts[c]++;
            lastIndex[c] = idx;
        }
      });

      // Strategy: Exclusion by Short Absence
      // Rule interpreted from user feedback:
      // 1. Must have exactly 3 colors present (1 absent).
      // 2. Identify the Most Frequent color in the last 5.
      // 3. Exclude the Most Frequent.
      // 4. Bet on the other 3 (which includes the Absent one).
      
      if (uniqueColors.size === 3) {
        // Find the color to exclude (Highest Frequency)
        // If tie, exclude the one that appeared most recently
        const sortedColors = ['Brown', 'Blue', 'Yellow', 'Green'].sort((a, b) => {
            if (counts[b] !== counts[a]) {
                return counts[b] - counts[a]; // Descending frequency
            }
            return lastIndex[b] - lastIndex[a]; // Descending recency (Most recent first)
        });

        const excludedColor = sortedColors[0];
        const suggestion = sortedColors.slice(1); // Take the other 3

        // If this is the LAST window (current state), set suggestion for user
        const isCurrent = i === sequence.length;
        
        if (isCurrent) {
          currentSuggestion = suggestion;
        } else {
          // Check result of next spin
          entries++;
          const nextNum = sequence[i]; 
          
          if (nextNum !== undefined) {
             const nextColor = getColorName(nextNum);
             // Win if nextColor is in suggestion OR is Zero
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

  const strategyStats = calculateStrategy();

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg p-4 relative animate-in slide-in-from-top duration-300",
      !isMobile && "mb-[20px]",
      className
    )}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-800">4 Cores</h3>
        {!isMobile && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
            title="Fechar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Container 70% - Aspect ratio adjusted to fit 3 lines of 20 items */}
        <div className="w-full md:w-[70%] aspect-[6/1] border border-gray-200 rounded p-2 overflow-y-auto bg-gray-50">
            <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1">
            {[...lastNumbers].reverse().map((num, index) => (
              <div
                key={`${num}-${index}`} // Using index to ensure uniqueness if number repeats
                className={`w-full aspect-square flex items-center justify-center rounded font-bold text-xs sm:text-sm ${getNumberColor(num)}`}
                title={`Número: ${num}`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Container 30% */}
        <div className="w-full md:w-[30%] aspect-[6/1] border border-gray-200 rounded p-2 bg-gray-50 flex">
          {/* Left Side (Stats) - 30% */}
          <div className="w-[30%] flex flex-col justify-between h-full border-r border-gray-100 pr-2">
            {stats.map((item) => (
              <div key={item.name} className="flex items-center gap-1 text-xs sm:text-sm">
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${item.color}`}></div>
                <span className="font-bold w-4 text-right">{item.count}</span>
                <span className="text-gray-500 text-[10px] sm:text-xs">{item.percent.toFixed(0)}%</span>
              </div>
            ))}
          </div>
          {/* Right Side (Strategy) - 70% */}
          <div className="w-[70%] pl-2 flex flex-col h-full">
            
            {/* Top: Suggestion */}
                    <div className="h-1/2 flex flex-col items-center justify-center border-b border-gray-100 pb-1">
                       <span className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Entrada</span>
                       {strategyStats.currentSuggestion ? (
                         <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {strategyStats.currentSuggestion.map(color => (
                                <div key={color} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${getRepresentativeColorClass(color)}`}>
                                  {getRepresentativeNumber(color).toString().padStart(2, '0')}
                                </div>
                              ))}
                            </div>
                            <span className="text-gray-400 font-bold">+</span>
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${getRepresentativeColorClass('Zero')}`}>
                                00
                            </div>
                         </div>
                       ) : (
                         <span className="text-gray-300 text-xs italic">Aguardando...</span>
                       )}
                    </div>

            {/* Bottom: Stats */}
             <div className="h-1/2 flex flex-col justify-center text-xs pt-1 space-y-1">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-gray-500 text-left">Entradas:</span>
                  <span className="font-bold text-center">{strategyStats.entries}</span>
                  <span></span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-green-600 font-bold text-left">WIN:</span>
                  <span className="font-bold text-center">{strategyStats.wins}</span>
                  <span className="text-right text-gray-600 font-medium">
                     {strategyStats.curWinStreak.toString().padStart(2, '0')} / {strategyStats.maxWinStreak.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-red-500 font-bold text-left">LOSS:</span>
                  <span className="font-bold text-center">{strategyStats.losses}</span>
                  <span className="text-right text-gray-600 font-medium">
                     {strategyStats.curLossStreak.toString().padStart(2, '0')} / {strategyStats.maxLossStreak.toString().padStart(2, '0')}
                  </span>
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FourColorsPanel;
