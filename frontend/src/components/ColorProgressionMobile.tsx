import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useBalance } from '../contexts/BalanceContext';

interface ColorProgressionMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColorProgressionMobile: React.FC<ColorProgressionMobileProps> = ({ isOpen, onClose }) => {
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
  const [showNumberPopup, setShowNumberPopup] = useState<boolean>(false);

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

  const handleNumberClick = (num: number, closePopup: boolean = false) => {
    const newSelectedNumbers = [num, ...selectedNumbers];
    setSelectedNumbers(newSelectedNumbers);
    
    if (closePopup) {
      setShowNumberPopup(false);
    }

    if (num === 0) {
      const betValue = progression[currentPosition];
      setCurrentBalance(currentBalance - betValue);
      setLosses(losses + 1);
      
      const newPosition = currentPosition < 11 ? currentPosition + 1 : currentPosition;
      setBetHistory([...betHistory, {
        position: currentPosition,
        balanceChange: -betValue,
        wasWin: false,
        betColor: currentBetColor
      }]);
      
      if (currentPosition < 11) {
        setCurrentPosition(newPosition);
      }
      return;
    }

    const lastColor = selectedNumbers.length > 0 ? getNumberColor(selectedNumbers[0]) : null;
    const currentColor = getNumberColor(num);

    const newBetColor = (currentColor === 'red' || currentColor === 'black') ? currentColor as 'red' | 'black' : currentBetColor;
    if (currentColor === 'red' || currentColor === 'black') {
      setCurrentBetColor(newBetColor);
    }

    if (lastColor && lastColor !== 'green' && currentColor !== 'green') {
      if (lastColor === currentColor) {
        const betValue = progression[currentPosition];
        setCurrentBalance(currentBalance + betValue);
        setWins(wins + 1);
        
        const newPosition = currentPosition > 0 ? currentPosition - 1 : currentPosition;
        setBetHistory([...betHistory, {
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
        setCurrentBalance(currentBalance - betValue);
        setLosses(losses + 1);
        
        const newPosition = currentPosition < 11 ? currentPosition + 1 : currentPosition;
        setBetHistory([...betHistory, {
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
  };

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

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-50 overflow-auto bg-gray-100">
        <div className="min-h-screen pb-20">
          <div className="bg-green-700 p-3 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-white font-bold text-lg">Progressão de Cores</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-green-300 transition-colors p-1"
              title="Fechar"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-3 space-y-3">
            <div className="bg-white rounded-lg p-2 grid grid-cols-3 gap-2 shadow">
              <div>
                <div className="text-[10px] text-gray-500">Saldo</div>
                <div className="text-sm font-bold text-gray-800">
                  R$ {balance.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-500">Resultado da Operação</div>
                <div className={`text-sm font-bold ${
                  currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {currentBalance.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500">Valor de Entrada</div>
                <input
                  type="text"
                  value={entryValueInput}
                  onChange={(e) => {
                    const input = e.target.value;
                    setEntryValueInput(input);
                    
                    // Aceita ponto (.) e vírgula (,) como separador decimal
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

            <div className="bg-white rounded-lg p-2 shadow">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-gray-500">Roleta Europeia</div>
                <button
                  onClick={() => setShowNumberPopup(true)}
                  className="text-green-600 hover:text-green-700 active:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
                  title="Seleção ampliada"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="w-full">
                <div className="mb-1">
                  <button
                    onClick={() => handleNumberClick(0)}
                    className="w-full h-10 flex items-center justify-center text-white font-bold text-sm rounded bg-green-600 active:bg-green-800"
                  >
                    0
                  </button>
                </div>
                
                <div className="grid grid-cols-12 gap-0.5">
                  {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xs rounded ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 active:bg-red-800' 
                          : 'bg-gray-800 active:bg-black'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-12 gap-0.5 mt-0.5">
                  {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xs rounded ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 active:bg-red-800' 
                          : 'bg-gray-800 active:bg-black'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-12 gap-0.5 mt-0.5">
                  {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xs rounded ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 active:bg-red-800' 
                          : 'bg-gray-800 active:bg-black'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 shadow">
              <div className="text-[10px] text-gray-500 mb-1">Números Selecionados</div>
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

            <div className="bg-white rounded-lg p-2 shadow">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-gray-500">Total Preto</div>
                  <div className="text-sm font-bold text-gray-800">
                    {countByColor('black')} <span className="text-xs text-gray-500">({blackPercentage}%)</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Total Vermelho</div>
                  <div className="text-sm font-bold text-red-600">
                    {countByColor('red')} <span className="text-xs text-gray-500">({redPercentage}%)</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Total Win</div>
                  <div className="text-sm font-bold text-green-600">
                    {wins} <span className="text-xs text-gray-500">({winPercentage}%)</span>
                  </div>
                  <div className="text-[10px] text-green-600">R$ {calculateWinValue().toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Total Loss</div>
                  <div className="text-sm font-bold text-red-600">
                    {losses} <span className="text-xs text-gray-500">({lossPercentage}%)</span>
                  </div>
                  <div className="text-[10px] text-red-600">R$ {calculateLossValue().toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 shadow">
              <div className="text-[10px] text-gray-500 mb-1">Progressão de Apostas</div>
              <div className="grid grid-cols-6 gap-1.5">
                {progression.map((value, idx) => (
                  <div key={idx} className="relative">
                    <div className={`p-1.5 rounded text-center font-bold ${
                      currentPosition === idx 
                        ? currentBetColor === 'red' 
                          ? 'bg-yellow-200 text-gray-800 border-[3px] border-red-600' 
                          : currentBetColor === 'black'
                          ? 'bg-yellow-200 text-gray-800 border-[3px] border-gray-800'
                          : 'bg-yellow-200 text-gray-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <div className="text-[9px]">#{idx + 1}</div>
                      <div className="text-[11px]">{value.toFixed(2)}</div>
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
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-sm active:bg-red-800"
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
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm active:bg-blue-800"
              >
                Desfazer Último
              </button>
            </div>
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
                    className="w-full h-16 flex items-center justify-center text-white font-bold text-2xl rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-md transition-colors"
                  >
                    0
                  </button>
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num, true)}
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                          : 'bg-gray-800 hover:bg-gray-900 active:bg-black'
                      }`}
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
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                          : 'bg-gray-800 hover:bg-gray-900 active:bg-black'
                      }`}
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
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                          : 'bg-gray-800 hover:bg-gray-900 active:bg-black'
                      }`}
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
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                          : 'bg-gray-800 hover:bg-gray-900 active:bg-black'
                      }`}
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
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                          : 'bg-gray-800 hover:bg-gray-900 active:bg-black'
                      }`}
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
                      className={`aspect-square flex items-center justify-center text-white font-bold text-xl rounded-lg shadow-md transition-colors ${
                        getNumberColor(num) === 'red' 
                          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                          : 'bg-gray-800 hover:bg-gray-900 active:bg-black'
                      }`}
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
    </>
  );
};

export default ColorProgressionMobile;
