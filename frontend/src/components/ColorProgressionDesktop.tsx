import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Target, ChevronUp, ChevronDown, FileText, Pause, Play, AlertTriangle } from 'lucide-react';
import { useBalance } from '../contexts/BalanceContext';
import { generateSessionReport } from '../utils/generateSessionReport';

interface ColorProgressionDesktopProps {
  isOpen: boolean;
  onClose: () => void;
  lastNumbers: number[];
}

export const ColorProgressionDesktop: React.FC<ColorProgressionDesktopProps> = ({ isOpen, onClose, lastNumbers }) => {
  const { balance: rawBalance } = useBalance();
  const balance = Number(rawBalance) || 0;
  const [entryValue, setEntryValue] = useState<number>(0.5);
  const [entryValueInput, setEntryValueInput] = useState<string>('0,50');
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [currentBetColor, setCurrentBetColor] = useState<'red' | 'black' | null>(null);
  const [lastWasZero, setLastWasZero] = useState<boolean>(false);
  const [betHistory, setBetHistory] = useState<Array<{
    position: number;
    balanceChange: number;
    wasWin: boolean;
    betColor: 'red' | 'black' | null;
  }>>([]);
  const [showGoalsPopup, setShowGoalsPopup] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showLossAlert, setShowLossAlert] = useState<boolean>(false);
  const [alertRepetitionAverage, setAlertRepetitionAverage] = useState<number>(0);
  const [shouldResetOnUnpause, setShouldResetOnUnpause] = useState<boolean>(false);
  const [manualBorderColors, setManualBorderColors] = useState<{[key: number]: 'green' | 'red' | 'black' | null}>({});

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

  // Função para alternar a cor da borda ao clicar no card
  const toggleBorderColor = (position: number) => {
    if (!isPaused) return; // Só permite alternar quando pausado
    
    const currentColor = manualBorderColors[position];
    let nextColor: 'green' | 'red' | 'black';
    
    if (!currentColor || currentColor === 'green') {
      nextColor = 'red';
    } else if (currentColor === 'red') {
      nextColor = 'black';
    } else {
      nextColor = 'green';
    }
    
    setManualBorderColors(prev => ({
      ...prev,
      [position]: nextColor
    }));
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedNumbers([]);
      setCurrentPosition(0);
      setWins(0);
      setLosses(0);
      setCurrentBalance(0);
      setBetHistory([]);
      setCurrentBetColor(null);
      setLastWasZero(false);
      setManualBorderColors({});
      return;
    }
  }, [isOpen]);

  const lastProcessedLengthRef = useRef<number>(0);
  const selectedNumbersRef = useRef<number[]>([]);
  const isFirstOpenRef = useRef<boolean>(true);

  // Sincronizar ref com state
  useEffect(() => {
    selectedNumbersRef.current = selectedNumbers;
  }, [selectedNumbers]);

  useEffect(() => {
    if (!isOpen) {
      // Quando fecha, resetar para processar do zero na próxima abertura
      lastProcessedLengthRef.current = 0;
      selectedNumbersRef.current = [];
      isFirstOpenRef.current = true;
    } else if (isFirstOpenRef.current) {
      // Quando abre pela primeira vez, resetar para processar todos os números desde o início
      lastProcessedLengthRef.current = 0;
      isFirstOpenRef.current = false;
    }
  }, [isOpen]);

  // Ajustar lastProcessedLengthRef quando lastNumbers diminuir (botão -5, limpar, etc)
  useEffect(() => {
    if (isOpen && lastNumbers.length < lastProcessedLengthRef.current) {
      console.log('[ColorProgressionDesktop] lastNumbers diminuiu, ajustando ref:', {
        oldRef: lastProcessedLengthRef.current,
        newLength: lastNumbers.length
      });
      lastProcessedLengthRef.current = lastNumbers.length;
    }
  }, [lastNumbers.length, isOpen]);

  // Resetar betHistory quando despausar após popup de 3 LOSS
  useEffect(() => {
    if (!isPaused && shouldResetOnUnpause) {
      console.log('[ColorProgressionDesktop] Resetando betHistory após despausar');
      setBetHistory([]);
      setShouldResetOnUnpause(false);
    }
  }, [isPaused, shouldResetOnUnpause]);

  useEffect(() => {
    console.log('[ColorProgressionDesktop] useEffect triggered', { 
      lastNumbers, 
      isOpen,
      isPaused,
      selectedNumbers: selectedNumbers[0]
    });
    
    if (lastNumbers.length > 0 && isOpen) {
      if (selectedNumbers.length === 0 && !startTime) {
        const now = new Date();
        setStartTime(now.toLocaleTimeString('pt-BR'));
      }
      const lastNumber = lastNumbers[lastNumbers.length - 1];
      const currentIndex = lastNumbers.length - 1;
      
      console.log('[ColorProgressionDesktop] Checking number', { 
        lastNumber, 
        lastNumbersLength: lastNumbers.length,
        selectedNumbersLength: selectedNumbers.length,
        lastProcessedLength: lastProcessedLengthRef.current,
        currentIndex
      });
      
      // Verificar se é um número novo (array cresceu)
      if (lastNumbers.length > lastProcessedLengthRef.current) {
        lastProcessedLengthRef.current = lastNumbers.length;
        console.log('[ColorProgressionDesktop] Processing new number:', lastNumber);
        
        // Só adicionar número e calcular WIN/LOSS se NÃO estiver pausado
        if (!isPaused) {
          // IMPORTANTE: Pegar prevNumber ANTES de adicionar o novo
          const prevNumber = selectedNumbersRef.current.length > 0 ? selectedNumbersRef.current[0] : null;
          const currentColor = getNumberColor(lastNumber);
          
          // Adicionar o número ao selectedNumbers
          setSelectedNumbers(prev => [lastNumber, ...prev]);
          
          // Definir currentBetColor sempre que o número não for zero
          if (currentColor === 'red' || currentColor === 'black') {
            setCurrentBetColor(currentColor as 'red' | 'black');
            setLastWasZero(false);
          }
          
          // Verificar se há cor manual definida para a posição atual
          const manualColor = manualBorderColors[currentPosition] as 'green' | 'red' | 'black' | undefined;
          
          // Se a cor manual é verde, não faz nada - verde não conta win nem loss
          if (manualColor === 'green') {
            console.log('[ColorProgressionDesktop] Cor manual verde - não conta win/loss');
          }
          // Se o número atual é zero, computar LOSS, avançar posição e marcar que saiu zero
          else if (lastNumber === 0) {
            const betValue = progression[currentPosition];
            setCurrentBalance(cb => cb - betValue);
            setLosses(l => l + 1);
            setLastWasZero(true);
            
            const newPosition = currentPosition < 11 ? currentPosition + 1 : currentPosition;
            const newBetEntry = {
              position: currentPosition,
              balanceChange: -betValue,
              wasWin: false,
              betColor: currentBetColor
            };
            setBetHistory(bh => {
              const updatedHistory = [...bh, newBetEntry];
              
              // Verificar 3 LOSS consecutivos com histórico atualizado
              if (updatedHistory.length >= 3) {
                const lastThreeBets = updatedHistory.slice(-3);
                const threeConsecutiveLosses = lastThreeBets.every(bet => !bet.wasWin);
                
                if (threeConsecutiveLosses) {
                  const currentAverage = calculateColorRepetitionAverage();
                  setAlertRepetitionAverage(currentAverage);
                  setShowLossAlert(true);
                  setIsPaused(true);
                  setShouldResetOnUnpause(true);
                }
              }
              
              return updatedHistory;
            });
            
            if (currentPosition < 11) {
              setCurrentPosition(newPosition);
            }
          } else if (prevNumber !== null) {
            // Se a cor manual é verde, não conta win nem loss
            // @ts-expect-error - manualColor pode ser 'green' via type assertion
            if (manualColor === 'green') {
              console.log('[ColorProgressionDesktop] Cor da aposta é verde - não conta win/loss');
            } else {
              // Usar cor manual se definida (red ou black), senão usar cor automática
              const betColorToUse: 'red' | 'black' | null = manualColor === 'red' || manualColor === 'black' ? manualColor : currentBetColor;
              
              if (betColorToUse && currentColor !== 'green') {
                // Verificar se ganhou (cor atual = cor da aposta)
                if (betColorToUse === currentColor) {
                const betValue = progression[currentPosition];
                setCurrentBalance(cb => cb + betValue);
                setWins(w => w + 1);
                
                const newPosition = currentPosition > 0 ? currentPosition - 1 : currentPosition;
                setBetHistory(bh => [...bh, {
                  position: currentPosition,
                  balanceChange: betValue,
                  wasWin: true,
                  betColor: currentColor as 'red' | 'black'
                }]);
                
                if (currentPosition > 0) {
                  setCurrentPosition(newPosition);
                }
              } else {
                // Perdeu
                const betValue = progression[currentPosition];
                setCurrentBalance(cb => cb - betValue);
                setLosses(l => l + 1);
                
                const newPosition = currentPosition < 11 ? currentPosition + 1 : currentPosition;
                const newBetEntry = {
                  position: currentPosition,
                  balanceChange: -betValue,
                  wasWin: false,
                  betColor: currentColor as 'red' | 'black'
                };
                setBetHistory(bh => {
                  const updatedHistory = [...bh, newBetEntry];
                  
                  // Verificar 3 LOSS consecutivos com histórico atualizado
                  if (updatedHistory.length >= 3) {
                    const lastThreeBets = updatedHistory.slice(-3);
                    const threeConsecutiveLosses = lastThreeBets.every(bet => !bet.wasWin);
                    
                    if (threeConsecutiveLosses) {
                      const currentAverage = calculateColorRepetitionAverage();
                      setAlertRepetitionAverage(currentAverage);
                      setShowLossAlert(true);
                      setIsPaused(true);
                      setShouldResetOnUnpause(true);
                    }
                  }
                  
                  return updatedHistory;
                });
                
                if (currentPosition < 11) {
                  setCurrentPosition(newPosition);
                }
              }
            }
            }
          }
        }
      }
    }
  }, [lastNumbers, isOpen, isPaused]);

  const countByColor = (color: string): number => {
    return selectedNumbers.filter(num => getNumberColor(num) === color).length;
  };

  const calculateWinValue = (): number => {
    return betHistory.filter(bet => bet.wasWin).reduce((sum, bet) => sum + bet.balanceChange, 0);
  };

  const calculateLossValue = (): number => {
    return Math.abs(betHistory.filter(bet => !bet.wasWin).reduce((sum, bet) => sum + bet.balanceChange, 0));
  };

  // Calcular WIN/LOSS e sequências diretamente de lastNumbers
  const calculateWinLossStats = () => {
    if (lastNumbers.length < 2) {
      return {
        wins: 0,
        losses: 0,
        currentWinStreak: 0,
        maxWinStreak: 0,
        currentLossStreak: 0,
        maxLossStreak: 0
      };
    }

    // PASSO 1: Processar do mais recente para o mais antigo (direita para esquerda)
    // lastNumbers vem [antigo...recente], então inverter para [recente...antigo]
    const reversedNumbers = [...lastNumbers].reverse();
    let wins = 0;
    let losses = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    for (let i = 1; i < reversedNumbers.length; i++) {
      const prevNumber = reversedNumbers[i - 1];
      const currentNumber = reversedNumbers[i];
      const prevColor = getNumberColor(prevNumber);
      const currentColor = getNumberColor(currentNumber);

      // Se o número atual é zero, é LOSS
      if (currentNumber === 0) {
        losses++;
        tempWinStreak = 0;
        tempLossStreak++;
        maxLossStreak = Math.max(maxLossStreak, tempLossStreak);
        continue;
      }

      // Ignorar se o anterior era zero
      if (prevColor === 'green') {
        continue;
      }

      // Comparar cores
      if (prevColor === currentColor && prevColor !== 'green' && currentColor !== 'green') {
        // WIN
        wins++;
        tempLossStreak = 0;
        tempWinStreak++;
        maxWinStreak = Math.max(maxWinStreak, tempWinStreak);
      } else if (prevColor !== currentColor && prevColor !== 'green' && currentColor !== 'green') {
        // LOSS
        losses++;
        tempWinStreak = 0;
        tempLossStreak++;
        maxLossStreak = Math.max(maxLossStreak, tempLossStreak);
      }
    }

    // PASSO 2: Contar do INÍCIO (mais recente) quantos WIN/LOSS consecutivos existem AGORA
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let lastResultType: 'win' | 'loss' | null = null;
    
    // Começar do primeiro resultado (mais recente) e ir para frente
    for (let i = 1; i < reversedNumbers.length; i++) {
      const prevNumber = reversedNumbers[i - 1];
      const currentNumber = reversedNumbers[i];
      const prevColor = getNumberColor(prevNumber);
      const currentColor = getNumberColor(currentNumber);

      // Se o número atual é zero, é LOSS
      if (currentNumber === 0) {
        if (lastResultType === null) {
          lastResultType = 'loss';
          currentLossStreak = 1;
        } else if (lastResultType === 'loss') {
          currentLossStreak++;
        } else {
          break; // Era WIN, parar
        }
        continue;
      }

      // Ignorar se o anterior era zero
      if (prevColor === 'green') {
        continue;
      }

      // Comparar cores
      if (prevColor === currentColor && prevColor !== 'green' && currentColor !== 'green') {
        // WIN
        if (lastResultType === null) {
          lastResultType = 'win';
          currentWinStreak = 1;
        } else if (lastResultType === 'win') {
          currentWinStreak++;
        } else {
          break; // Era LOSS, parar
        }
      } else if (prevColor !== currentColor && prevColor !== 'green' && currentColor !== 'green') {
        // LOSS
        if (lastResultType === null) {
          lastResultType = 'loss';
          currentLossStreak = 1;
        } else if (lastResultType === 'loss') {
          currentLossStreak++;
        } else {
          break; // Era WIN, parar
        }
      }
    }

    const result = {
      wins,
      losses,
      currentWinStreak,
      maxWinStreak,
      currentLossStreak,
      maxLossStreak
    };
    
    console.log('[calculateWinLossStats] Resultado:', {
      lastNumbers: lastNumbers.slice(-5),
      result
    });
    
    return result;
  };

  const winLossStats = calculateWinLossStats();

  const totalNumbers = selectedNumbers.length;
  const blackPercentage = totalNumbers > 0 ? ((countByColor('black') / totalNumbers) * 100).toFixed(1) : '0.0';
  const redPercentage = totalNumbers > 0 ? ((countByColor('red') / totalNumbers) * 100).toFixed(1) : '0.0';
  const greenPercentage = totalNumbers > 0 ? ((countByColor('green') / totalNumbers) * 100).toFixed(1) : '0.0';
  
  const totalBets = wins + losses;
  const winPercentage = totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : '0.0';
  const lossPercentage = totalBets > 0 ? ((losses / totalBets) * 100).toFixed(1) : '0.0';

  const calculateColorRepetitionAverage = (): number => {
    if (lastNumbers.length < 2) return 0;
    
    const reversedNumbers = [...lastNumbers].reverse();
    const sequences: number[] = [];
    let currentSequenceLength = 1;
    
    for (let i = 1; i < reversedNumbers.length; i++) {
      const prevColor = getNumberColor(reversedNumbers[i - 1]);
      const currentColor = getNumberColor(reversedNumbers[i]);
      
      if (prevColor === 'green' || currentColor === 'green') {
        if (currentSequenceLength > 1) {
          sequences.push(currentSequenceLength);
        }
        currentSequenceLength = 1;
        continue;
      }
      
      if (prevColor === currentColor) {
        currentSequenceLength++;
      } else {
        sequences.push(currentSequenceLength);
        currentSequenceLength = 1;
      }
    }
    
    if (currentSequenceLength > 0) {
      sequences.push(currentSequenceLength);
    }
    
    if (sequences.length === 0) return 0;
    
    const sum = sequences.reduce((acc, val) => acc + val, 0);
    return sum / sequences.length;
  };

  const calculateLastNumbersStats = () => {
    if (lastNumbers.length < 2) {
      return { wins: 0, losses: 0, winValue: 0, lossValue: 0, result: 0 };
    }
    
    const reversedNumbers = [...lastNumbers].reverse();
    let wins = 0;
    let losses = 0;
    let winValue = 0;
    let lossValue = 0;
    const baseValue = progression[0];
    
    for (let i = 1; i < reversedNumbers.length; i++) {
      const prevNumber = reversedNumbers[i - 1];
      const currentNumber = reversedNumbers[i];
      
      const prevColor = getNumberColor(prevNumber);
      const currentColor = getNumberColor(currentNumber);
      
      if (currentColor === 'green') {
        losses++;
        lossValue += baseValue;
        continue;
      }
      
      if (prevColor === 'green') {
        continue;
      }
      
      if (prevColor === currentColor) {
        wins++;
        winValue += baseValue;
      } else {
        losses++;
        lossValue += baseValue;
      }
    }
    
    return {
      wins,
      losses,
      winValue,
      lossValue,
      result: winValue - lossValue
    };
  };

  const calculateGoals = () => {
    const currentBalance = balance;
    const goals = [
      { percentage: 2.34, label: '2,34%' },
      { percentage: 3.73, label: '3,73%' },
      { percentage: 4.73, label: '4,73%' },
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

  const currentRepetitionAverage = calculateColorRepetitionAverage();
  const containerBgColor = currentRepetitionAverage < 1.90 ? 'bg-red-100' : 'bg-white';

  return (
    <div className={`${containerBgColor} rounded-lg shadow-lg p-4`} style={{marginTop: '-15px', marginBottom: '20px'}}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Progressão de Cores</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`${
              isPaused 
                ? 'text-green-500 hover:text-green-700' 
                : 'text-orange-500 hover:text-orange-700'
            } transition-colors p-1`}
            title={isPaused ? 'Retomar Progressão' : 'Pausar Progressão'}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const endTime = now.toLocaleTimeString('pt-BR');
              
              const calculateDuration = (start: string, end: string): string => {
                try {
                  const startDate = new Date(`1970-01-01 ${start}`);
                  const endDate = new Date(`1970-01-01 ${end}`);
                  const diff = endDate.getTime() - startDate.getTime();
                  const minutes = Math.floor(diff / 60000);
                  const seconds = Math.floor((diff % 60000) / 1000);
                  return `${minutes}m ${seconds}s`;
                } catch {
                  return '0m 0s';
                }
              };

              const balanceHistory: number[] = [];
              let runningBalance = 0;
              betHistory.forEach(bet => {
                runningBalance += bet.balanceChange;
                balanceHistory.push(runningBalance);
              });

              console.log('[Gráfico] Debug:', {
                selectedNumbersCount: selectedNumbers.length,
                betHistoryCount: betHistory.length,
                balanceHistoryCount: balanceHistory.length,
                balanceHistory: balanceHistory
              });

              generateSessionReport({
                initialBalance: balance,
                operationResult: currentBalance,
                entryValue: entryValue,
                selectedNumbers: selectedNumbers,
                startTime: startTime || '--:--:--',
                endTime: endTime,
                totalDuration: startTime ? calculateDuration(startTime, endTime) : '0m 0s',
                blackCount: countByColor('black'),
                blackPercentage: blackPercentage,
                redCount: countByColor('red'),
                redPercentage: redPercentage,
                greenCount: countByColor('green'),
                greenPercentage: greenPercentage,
                wins: wins,
                winPercentage: winPercentage,
                winValue: calculateWinValue(),
                losses: losses,
                lossPercentage: lossPercentage,
                lossValue: calculateLossValue(),
                balanceHistory: balanceHistory,
                betProgression: progression
              });
            }}
            className="text-purple-500 hover:text-purple-700 transition-colors p-1"
            title="Resumo da Sessão"
          >
            <FileText size={20} />
          </button>
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

      {showLossAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setShowLossAlert(false)}>
          <div className="bg-gradient-to-br from-red-50 via-red-100 to-red-200 rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border-4 border-red-400" style={{animation: 'pulse 0.5s ease-in-out 2'}} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-6">
              <div className="bg-red-500 rounded-full p-4 mb-4 shadow-lg">
                <AlertTriangle size={48} className="text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-black text-red-800 text-center mb-2">
                ⚠️ ATENÇÃO ⚠️
              </h3>
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full"></div>
            </div>
            
            <div className="bg-white rounded-xl p-6 mb-6 border-2 border-red-300 shadow-inner">
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-red-900 mb-3">
                  Detectamos 3 LOSS consecutivos!
                </p>
                <div className="bg-red-100 rounded-lg p-4 mb-4 border border-red-300">
                  <p className="text-sm text-red-800 font-semibold mb-2">
                    📊 Sua média de repetição atual é:
                  </p>
                  <p className="text-4xl font-black text-red-600">
                    {alertRepetitionAverage.toFixed(2)}
                  </p>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">
                  A progressão foi <span className="font-bold text-red-700">pausada automaticamente</span> por segurança. 
                  Aguarde a média de repetição subir um pouco antes de retomar as apostas.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3 border border-red-200">
                <AlertTriangle size={16} />
                <span className="font-semibold">Recomendação: Aguarde uma sequência favorável</span>
              </div>
            </div>

            <button
              onClick={() => setShowLossAlert(false)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Entendi, vou aguardar
            </button>
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
              <div className="flex items-center gap-1">
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
                  placeholder="0,50"
                />
                <div className="flex flex-col">
                  <button
                    onClick={() => {
                      const newValue = Math.round((entryValue + 0.5) * 100) / 100;
                      setEntryValue(newValue);
                      setEntryValueInput(newValue.toFixed(2).replace('.', ','));
                      setCurrentPosition(0);
                    }}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded p-0.5 transition-colors"
                    title="Aumentar R$ 0,50"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const newValue = Math.max(0.5, Math.round((entryValue - 0.5) * 100) / 100);
                      setEntryValue(newValue);
                      setEntryValueInput(newValue.toFixed(2).replace('.', ','));
                      setCurrentPosition(0);
                    }}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded p-0.5 transition-colors"
                    title="Diminuir R$ 0,50"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2 flex justify-between items-center">
              <span>Números Selecionados</span>
              <span className="font-semibold text-gray-700">{selectedNumbers.length}</span>
            </div>
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
            <div className="grid grid-cols-3 gap-3 mb-3">
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
                <div className="text-xs text-gray-500">Total Verde</div>
                <div className="text-base font-bold text-green-600">
                  {countByColor('green')} <span className="text-sm text-gray-500">({greenPercentage}%)</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-xs text-green-700 font-medium mb-1">Total Win</div>
                <div className="text-base font-bold text-green-700">
                  {wins} <span className="text-sm text-green-600">({winPercentage}%)</span>
                  <span className="text-sm text-green-700 font-semibold ml-5">R$ {calculateWinValue().toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="text-xs text-red-700 font-medium mb-1">Total Loss</div>
                <div className="text-base font-bold text-red-700">
                  {losses} <span className="text-sm text-red-600">({lossPercentage}%)</span>
                  <span className="text-sm text-red-700 font-semibold ml-5">R$ {calculateLossValue().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200">
            <div className="grid grid-cols-4 gap-2">
              {(() => {
                const stats = calculateLastNumbersStats();
                const repetitionAvg = calculateColorRepetitionAverage();
                const resultado = stats.winValue - stats.lossValue;
                
                return (
                  <>
                    <div className="text-center">
                      <div className="text-xs text-blue-700 font-medium mb-0.5">Média de Repetição</div>
                      <div className="text-base font-bold text-blue-900">
                        {repetitionAvg.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-green-700 font-medium mb-0.5">Qtde WIN</div>
                      <div className="text-base font-bold text-green-900">
                        {winLossStats.wins} <span className="text-xs">({winLossStats.currentWinStreak}/{winLossStats.maxWinStreak})</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-red-700 font-medium mb-0.5">Qtde LOSS</div>
                      <div className="text-base font-bold text-red-900">
                        {winLossStats.losses} <span className="text-xs">({winLossStats.currentLossStreak}/{winLossStats.maxLossStreak})</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-700 font-medium mb-0.5">Resultado</div>
                      <div className={`text-base font-bold ${
                        resultado >= 0 ? 'text-green-900' : 'text-red-900'
                      }`}>
                        R$ {resultado.toFixed(2)}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg py-3 px-2">
            <div className="flex justify-between items-center mb-1.5">
              <div className="text-xs text-gray-500">Progressão de Apostas</div>
              <div className="text-xs text-gray-600">
                Total: R$ {progression.reduce((sum, val) => sum + val, 0).toFixed(2)}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {progression.map((value, idx) => {
                // Determinar a cor da borda: usar cor manual se definida, senão usar a cor automática
                const manualColor = manualBorderColors[idx];
                const borderColor = manualColor 
                  ? manualColor === 'green' ? 'border-green-600'
                    : manualColor === 'red' ? 'border-red-600'
                    : 'border-gray-800'
                  : lastWasZero
                    ? 'border-green-600'
                    : currentBetColor === 'red' 
                    ? 'border-red-600' 
                    : currentBetColor === 'black'
                    ? 'border-gray-800'
                    : 'border-yellow-400';
                
                const arrowColor = manualColor 
                  ? manualColor === 'green' ? 'border-t-green-600'
                    : manualColor === 'red' ? 'border-t-red-600'
                    : 'border-t-gray-800'
                  : lastWasZero
                    ? 'border-t-green-600'
                    : currentBetColor === 'red' 
                    ? 'border-t-red-600' 
                    : currentBetColor === 'black'
                    ? 'border-t-gray-800'
                    : 'border-t-yellow-400';
                
                return (
                  <div key={idx} className="relative">
                    <div 
                      onClick={() => toggleBorderColor(idx)}
                      className={`p-2 rounded text-center font-bold ${
                        currentPosition === idx 
                          ? `bg-yellow-200 text-gray-800 border-4 ${borderColor} ${isPaused ? 'cursor-pointer hover:opacity-80' : ''}`
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="text-xs">#{idx + 1}</div>
                      <div className="text-sm">{value.toFixed(2)}</div>
                    </div>
                    {currentPosition === idx && (
                      <div className={`absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent ${arrowColor}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                setSelectedNumbers([]);
                setCurrentPosition(0);
                setWins(0);
                setLosses(0);
                setCurrentBalance(0);
                setBetHistory([]);
                setCurrentBetColor(null);
                setLastWasZero(false);
                setStartTime('');
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
