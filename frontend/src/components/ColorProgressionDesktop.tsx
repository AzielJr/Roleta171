import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Target } from 'lucide-react';
import { useBalance } from '../contexts/BalanceContext';

interface ColorProgressionDesktopProps {
  isOpen: boolean;
  onClose: () => void;
  lastNumbers: number[];
}

export const ColorProgressionDesktop: React.FC<ColorProgressionDesktopProps> = ({ isOpen, onClose, lastNumbers }) => {
  const { balance } = useBalance();
  const [entryValue, setEntryValue] = useState<number>(1);
  const [entryValueInput, setEntryValueInput] = useState<string>('1');
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [currentBetColor, setCurrentBetColor] = useState<'red' | 'black' | null>(null);
  const [betHistory, setBetHistory] = useState<Array<{
    position: number;
    balanceChange: number;
    wasWin: boolean;
    betColor: 'red' | 'black' | null;
  }>>([]);
  const [showGoalsPopup, setShowGoalsPopup] = useState<boolean>(false);

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'green';
    if (redNumbers.includes(num)) return 'red';
    if (blackNumbers.includes(num)) return 'black';
    return 'gray';
  };

  const calculateProgression = (): number[] => {
    const progression = [entryValue];
    progression.push(entryValue * 2);
    
    for (let i = 2; i < 12; i++) {
      progression.push(progression[i - 1] + progression[i - 2]);
    }
    
    return progression;
  };

  const progression = calculateProgression();

  useEffect(() => {
    console.log('[ColorProgressionDesktop] useEffect triggered', { 
      lastNumbers, 
      isOpen,
      selectedNumbers: selectedNumbers[0]
    });
    
    if (lastNumbers.length > 0 && isOpen) {
      const lastNumber = lastNumbers[lastNumbers.length - 1]; // Pegar o ÚLTIMO número, não o primeiro
      
      console.log('[ColorProgressionDesktop] Checking number', { 
        lastNumber, 
        lastNumbersLength: lastNumbers.length,
        selectedNumbersLength: selectedNumbers.length
      });
      
      // Verificar se o tamanho do array mudou (novo número adicionado)
      if (lastNumbers.length !== selectedNumbers.length) {
        console.log('[ColorProgressionDesktop] Processing new number:', lastNumber);
        
        setSelectedNumbers(prev => {
          const newSelectedNumbers = [lastNumber, ...prev];
          
          if (lastNumber === 0) {
            const betValue = progression[currentPosition];
            setCurrentBalance(cb => cb - betValue);
            setLosses(l => l + 1);
            
            const newPosition = currentPosition < 11 ? currentPosition + 1 : currentPosition;
            setBetHistory(bh => [...bh, {
              position: currentPosition,
              balanceChange: -betValue,
              wasWin: false,
              betColor: currentBetColor
            }]);
            
            if (currentPosition < 11) {
              setCurrentPosition(newPosition);
            }
            return newSelectedNumbers;
          }

          const lastColor = prev.length > 0 ? getNumberColor(prev[0]) : null;
          const currentColor = getNumberColor(lastNumber);

          const newBetColor = (currentColor === 'red' || currentColor === 'black') ? currentColor as 'red' | 'black' : currentBetColor;
          if (currentColor === 'red' || currentColor === 'black') {
            setCurrentBetColor(newBetColor);
          }

          if (lastColor && lastColor !== 'green' && currentColor !== 'green') {
            if (lastColor === currentColor) {
              const betValue = progression[currentPosition];
              setCurrentBalance(cb => cb + betValue);
              setWins(w => w + 1);
              
              const newPosition = currentPosition > 0 ? currentPosition - 1 : currentPosition;
              setBetHistory(bh => [...bh, {
                position: currentPosition,
                balanceChange: betValue,
                wasWin: true,
                betColor: newBetColor
              }]);
              
              if (currentPosition > 0) {
                setCurrentPosition(newPosition);
              }
            } else {
              const betValue = progression[currentPosition];
              setCurrentBalance(cb => cb - betValue);
              setLosses(l => l + 1);
              
              const newPosition = currentPosition < 11 ? currentPosition + 1 : currentPosition;
              setBetHistory(bh => [...bh, {
                position: currentPosition,
                balanceChange: -betValue,
                wasWin: false,
                betColor: newBetColor
              }]);
              
              if (currentPosition < 11) {
                setCurrentPosition(newPosition);
              }
            }
          }
          
          return newSelectedNumbers;
        });
      }
    }
  }, [lastNumbers, isOpen]);

  const countByColor = (color: string): number => {
    return selectedNumbers.filter(num => getNumberColor(num) === color).length;
  };

  const calculateWinValue = (): number => {
    return betHistory.filter(bet => bet.wasWin).reduce((sum, bet) => sum + bet.balanceChange, 0);
  };

  const calculateLossValue = (): number => {
    return Math.abs(betHistory.filter(bet => !bet.wasWin).reduce((sum, bet) => sum + bet.balanceChange, 0));
  };

  const totalNumbers = selectedNumbers.length;
  const blackPercentage = totalNumbers > 0 ? ((countByColor('black') / totalNumbers) * 100).toFixed(1) : '0.0';
  const redPercentage = totalNumbers > 0 ? ((countByColor('red') / totalNumbers) * 100).toFixed(1) : '0.0';
  
  const totalBets = wins + losses;
  const winPercentage = totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : '0.0';
  const lossPercentage = totalBets > 0 ? ((losses / totalBets) * 100).toFixed(1) : '0.0';

  const calculateGoals = () => {
    const currentBalance = balance;
    const goals = [
      { percentage: 2.34, label: '2,34%' },
      { percentage: 3.73, label: '3,73%' },
      { percentage: 7.73, label: '7,73%' },
      { percentage: 10.00, label: '10,00%' }
    ];

    return goals.map(goal => {
      const amountToWin = currentBalance * (goal.percentage / 100);
      const targetTotal = currentBalance + amountToWin;
      return {
        ...goal,
        amountToWin,
        targetTotal
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4" style={{marginBottom: '5px'}}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Progressão de Cores</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGoalsPopup(true)}
            className="text-blue-500 hover:text-blue-700 transition-colors p-1"
            title="Projeções de Metas"
          >
            <Target size={20} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {showGoalsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowGoalsPopup(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Target size={24} className="text-blue-500" />
                Projeções de Metas
              </h3>
              <button
                onClick={() => setShowGoalsPopup(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                title="Fechar"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Saldo Atual</div>
              <div className="text-2xl font-bold text-blue-600">R$ {balance.toFixed(2)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calculateGoals().map((goal, index) => {
                const greenShades = [
                  { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500', borderColor: 'border-green-300' },
                  { bg: 'from-green-100 to-green-200', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-600', borderColor: 'border-green-400' },
                  { bg: 'from-green-200 to-green-300', border: 'border-green-400', text: 'text-green-900', badge: 'bg-green-700', borderColor: 'border-green-500' },
                  { bg: 'from-green-300 to-green-400', border: 'border-green-500', text: 'text-green-950', badge: 'bg-green-800', borderColor: 'border-green-600' }
                ];
                const shade = greenShades[index];
                
                return (
                  <div key={index} className={`bg-gradient-to-br ${shade.bg} rounded-lg p-4 border-2 ${shade.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-lg font-bold ${shade.text}`}>Meta {goal.label}</div>
                      <div className={`${shade.badge} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                        {goal.percentage}%
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Valor a Ganhar:</span>
                        <span className={`text-base font-bold ${shade.text}`}>R$ {goal.amountToWin.toFixed(2)}</span>
                      </div>
                      
                      <div className={`flex justify-between items-center pt-2 border-t ${shade.borderColor}`}>
                        <span className="text-sm text-gray-700">Total a Atingir:</span>
                        <span className={`text-lg font-bold ${shade.text}`}>R$ {goal.targetTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Saldo</div>
              <div className="text-sm font-bold text-gray-800">
                R$ {balance.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Resultado da Operação</div>
              <div className={`text-sm font-bold ${
                currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                R$ {currentBalance.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Valor de Entrada</div>
              <input
                type="text"
                value={entryValueInput}
                onChange={(e) => {
                  const input = e.target.value;
                  setEntryValueInput(input);
                  
                  const cleaned = input.replace(/[^\d,.-]/g, '');
                  let val = 0;
                  if (cleaned.includes(',')) {
                    val = parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
                  } else {
                    val = parseFloat(cleaned) || 0;
                  }
                  
                  if (val > 0) {
                    setEntryValue(val);
                    setCurrentPosition(0);
                  }
                }}
                className="text-sm font-bold text-gray-800 text-right border border-gray-300 rounded px-2 py-1 w-full"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">Números Selecionados</div>
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
              <div className="flex gap-1 pb-1">
                {selectedNumbers.length === 0 ? (
                  <div className="text-xs text-gray-400 py-2">Nenhum número selecionado</div>
                ) : (
                  selectedNumbers.map((num, idx) => (
                    <div
                      key={idx}
                      className={`min-w-[32px] h-8 flex items-center justify-center text-white font-bold text-xs rounded flex-shrink-0 ${
                        getNumberColor(num) === 'green' 
                          ? 'bg-green-600' 
                          : getNumberColor(num) === 'red'
                          ? 'bg-red-600'
                          : 'bg-gray-800'
                      }`}
                    >
                      {num}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Total Preto</div>
                <div className="text-base font-bold text-gray-800">
                  {countByColor('black')} <span className="text-sm text-gray-500">({blackPercentage}%)</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Vermelho</div>
                <div className="text-base font-bold text-red-600">
                  {countByColor('red')} <span className="text-sm text-gray-500">({redPercentage}%)</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Win</div>
                <div className="text-base font-bold text-green-600">
                  {wins} <span className="text-sm text-gray-500">({winPercentage}%)</span>
                  <span className="text-sm text-green-600 ml-5">R$ {calculateWinValue().toFixed(2)}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Loss</div>
                <div className="text-base font-bold text-red-600">
                  {losses} <span className="text-sm text-gray-500">({lossPercentage}%)</span>
                  <span className="text-sm text-red-600 ml-5">R$ {calculateLossValue().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">Progressão de Apostas</div>
            <div className="grid grid-cols-4 gap-2">
              {progression.map((value, idx) => (
                <div key={idx} className="relative">
                  <div className={`p-2 rounded text-center font-bold ${
                    currentPosition === idx 
                      ? currentBetColor === 'red' 
                        ? 'bg-yellow-200 text-gray-800 border-4 border-red-600' 
                        : currentBetColor === 'black'
                        ? 'bg-yellow-200 text-gray-800 border-4 border-gray-800'
                        : 'bg-yellow-200 text-gray-800 border-4 border-yellow-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className="text-xs">#{idx + 1}</div>
                    <div className="text-sm">{value.toFixed(2)}</div>
                  </div>
                  {currentPosition === idx && (
                    <div className={`absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent ${
                      currentBetColor === 'red' 
                        ? 'border-t-red-600' 
                        : currentBetColor === 'black'
                        ? 'border-t-gray-800'
                        : 'border-t-yellow-400'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedNumbers([]);
                setCurrentPosition(0);
                setWins(0);
                setLosses(0);
                setCurrentBalance(0);
                setBetHistory([]);
                setCurrentBetColor(null);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-sm transition-colors"
            >
              Limpar Tudo
            </button>
            <button
              onClick={() => {
                if (selectedNumbers.length > 0 && betHistory.length > 0) {
                  const lastBet = betHistory[betHistory.length - 1];
                  
                  setSelectedNumbers(selectedNumbers.slice(1));
                  setCurrentBalance(currentBalance - lastBet.balanceChange);
                  setCurrentPosition(lastBet.position);
                  
                  if (lastBet.wasWin) {
                    setWins(wins - 1);
                  } else {
                    setLosses(losses - 1);
                  }
                  
                  setBetHistory(betHistory.slice(0, -1));
                  
                  if (betHistory.length > 1) {
                    setCurrentBetColor(betHistory[betHistory.length - 2].betColor);
                  } else {
                    setCurrentBetColor(null);
                  }
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition-colors"
            >
              Desfazer Último
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorProgressionDesktop;
