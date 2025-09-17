import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

interface SelectedNumbers {
  numbers: number[];
  colors: string[];
  dozens: string[];
  columns: string[];
  specials: string[];
}

interface PatternAlert {
  numbers: number[];
  positions: number[];
  message: string;
}

interface RouletteProps {
  onLogout?: () => void;
}

const RouletteBoard: React.FC<RouletteProps> = ({ onLogout }) => {
  // Sequência real da roleta europeia
  const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

  const [selected, setSelected] = useState<SelectedNumbers>({
    numbers: [],
    colors: [],
    dozens: [],
    columns: [],
    specials: []
  });
  
  // Estado para armazenar os últimos 50 números sorteados
  const [lastNumbers, setLastNumbers] = useState<number[]>([]);
  
  // Estado para controlar a simulação automática
  const [isSimulating, setIsSimulating] = useState(false);
  const isSimulatingRef = useRef<boolean>(false);
  
  // Estado para armazenar referência do interval da simulação
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Estado para armazenar o último número selecionado manualmente
  const [lastSelectedNumber, setLastSelectedNumber] = useState<number | null>(null);
  
  // Estado para armazenar o último número sorteado durante simulação
  const [lastDrawnNumber, setLastDrawnNumber] = useState<number | null>(null);
  
  // Estado para alertas de padrão
  const [patternAlert, setPatternAlert] = useState<PatternAlert | null>(null);
  
  // Estado para histórico de números sorteados (para detecção de padrões)
  const [drawnHistory, setDrawnHistory] = useState<number[]>([]);
  
  // Estado para controlar o modal de adicionar números
  const [showAddNumbersModal, setShowAddNumbersModal] = useState(false);
  const [addNumbersInput, setAddNumbersInput] = useState('');
  const drawnHistoryRef = useRef<number[]>([]);
  
  // Estados para destacar números na race quando popup aparecer
  const [highlightedBetNumbers, setHighlightedBetNumbers] = useState<number[]>([]);
  const [highlightedRiskNumbers, setHighlightedRiskNumbers] = useState<number[]>([]);
  
  // Estado para contar quantas vezes o popup apareceu (Entrada)
  const [patternDetectedCount, setPatternDetectedCount] = useState<number>(0);

  // Estados para contar WIN e LOSS
  const [winCount, setWinCount] = useState<number>(0);
  const [lossCount, setLossCount] = useState<number>(0);
  
  // Estado para controlar se estamos aguardando a próxima dezena após popup
  const [waitingForNextNumber, setWaitingForNextNumber] = useState<boolean>(false);
  const waitingForNextNumberRef = useRef<boolean>(false);
  const [lastPatternNumbers, setLastPatternNumbers] = useState<{covered: number[], risk: number[]}>({covered: [], risk: []});
  const lastPatternNumbersRef = useRef<{covered: number[], risk: number[]}>({covered: [], risk: []});

  // useEffect para lidar com a tecla ESC e notificação sonora
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && patternAlert) {
        setPatternAlert(null);
      }
    };

    // Adicionar listener para tecla ESC
    document.addEventListener('keydown', handleKeyDown);

    // Tocar som quando o popup aparecer
    if (patternAlert) {
      // Criar um som simples usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [patternAlert]);

  // Função para obter vizinhos de um número na sequência da roleta
  const getNeighbors = (number: number, count: number): number[] => {
    const pos = ROULETTE_SEQUENCE.indexOf(number);
    if (pos === -1) return [];
    
    const neighbors: number[] = [];
    for (let i = 1; i <= count; i++) {
      // Vizinho à esquerda
      const leftPos = (pos - i + 37) % 37;
      neighbors.push(ROULETTE_SEQUENCE[leftPos]);
      
      // Vizinho à direita
      const rightPos = (pos + i) % 37;
      neighbors.push(ROULETTE_SEQUENCE[rightPos]);
    }
    
    return neighbors;
  };
  
  // Função para calcular estratégia de aposta baseada no padrão detectado
  const calculateBettingStrategy = (patternNumbers: number[]) => {
    const [num1, num2] = patternNumbers;
    
    // Encontrar posições dos números do padrão na sequência da roleta
    const pos1 = ROULETTE_SEQUENCE.indexOf(num1);
    const pos2 = ROULETTE_SEQUENCE.indexOf(num2);
    
    if (pos1 === -1 || pos2 === -1) return null;
    
    // Calcular distância circular
    const distance = Math.min(
      Math.abs(pos1 - pos2),
      37 - Math.abs(pos1 - pos2)
    );
    
    if (distance > 4) return null;
    
    // Determinar a sequência dos números do padrão na ordem da roleta
    let sequenceStartPos, sequenceEndPos;
    
    // Encontrar qual número vem primeiro na sequência da roleta
    if (pos1 < pos2) {
      // Verificar se é sequência normal ou cruza o zero
      if (pos2 - pos1 <= 4) {
        // Sequência normal
        sequenceStartPos = pos1;
        sequenceEndPos = pos2;
      } else {
        // Cruza o zero (pos1 vem depois de pos2 na sequência circular)
        sequenceStartPos = pos2;
        sequenceEndPos = pos1;
      }
    } else {
      // pos2 < pos1
      if (pos1 - pos2 <= 4) {
        // Sequência normal
        sequenceStartPos = pos2;
        sequenceEndPos = pos1;
      } else {
        // Cruza o zero (pos2 vem depois de pos1 na sequência circular)
        sequenceStartPos = pos1;
        sequenceEndPos = pos2;
      }
    }
    
    // Calcular os 7 números expostos SEMPRE incluindo os 2 números do padrão
    // Lógica corrigida: encontrar qual número vem primeiro na sequência Race (sentido horário)
    const riskNumbers = [];
    
    // Para números 15 (pos 2) e 26 (pos 36), no sentido horário da Race:
    // 26 vem ANTES de 15 porque a sequência é circular (36 → 0 → 1 → 2)
    // Então o primeiro número é sempre aquele que, seguindo o sentido horário,
    // encontra o segundo número primeiro
    let firstRacePos;
    
    // Calcular qual número encontra o outro primeiro no sentido horário
    const distanceFromPos1ToPos2 = (pos2 - pos1 + 37) % 37;
    const distanceFromPos2ToPos1 = (pos1 - pos2 + 37) % 37;
    
    if (distanceFromPos1ToPos2 <= distanceFromPos2ToPos1) {
      // pos1 encontra pos2 primeiro no sentido horário
      firstRacePos = pos1;
    } else {
      // pos2 encontra pos1 primeiro no sentido horário
      firstRacePos = pos2;
    }
    
    // Começar 1 posição antes do primeiro número na sequência
    let startPos = (firstRacePos - 1 + 37) % 37;
    
    // Gerar exatamente 7 números consecutivos na sequência Race
    for (let i = 0; i < 7; i++) {
      const currentPos = (startPos + i) % 37;
      riskNumbers.push(ROULETTE_SEQUENCE[currentPos]);
    }
    
    const finalRiskNumbers = riskNumbers;
    
    // Números cobertos são todos os outros (30 números)
    const coveredNumbers = ROULETTE_SEQUENCE.filter(n => !finalRiskNumbers.includes(n));
    
    // Encontrar os 2 números ideais para apostar seguindo a lógica explicada
    // Cada número com 7 vizinhos de cada lado deve cobrir exatamente os 30 números restantes
    let bestBetNumbers = null;
    
    // Função para obter números cobertos por um número (ele + 7 vizinhos de cada lado)
    const getCoveredByNumber = (num: number): number[] => {
      const pos = ROULETTE_SEQUENCE.indexOf(num);
      if (pos === -1) return [];
      
      const covered = [num];
      
      // 7 vizinhos à esquerda
      for (let i = 1; i <= 7; i++) {
        const leftPos = (pos - i + 37) % 37;
        covered.push(ROULETTE_SEQUENCE[leftPos]);
      }
      
      // 7 vizinhos à direita
      for (let i = 1; i <= 7; i++) {
        const rightPos = (pos + i) % 37;
        covered.push(ROULETTE_SEQUENCE[rightPos]);
      }
      
      return covered;
    };
    
    // Testar combinações para encontrar os 2 números que cobrem exatamente os 30
    for (let i = 0; i < ROULETTE_SEQUENCE.length; i++) {
      for (let j = i + 1; j < ROULETTE_SEQUENCE.length; j++) {
        const betNum1 = ROULETTE_SEQUENCE[i];
        const betNum2 = ROULETTE_SEQUENCE[j];
        
        const covered1 = getCoveredByNumber(betNum1);
        const covered2 = getCoveredByNumber(betNum2);
        
        // Unir as coberturas sem repetição
        const allCovered = [...new Set([...covered1, ...covered2])];
        
        // Verificar se cobre exatamente os 30 números que não estão no risco
        const sortedCovered = allCovered.sort((a, b) => a - b);
        const sortedExpected = coveredNumbers.sort((a, b) => a - b);
        
        if (sortedCovered.length === sortedExpected.length && 
            sortedCovered.every((num, idx) => num === sortedExpected[idx])) {
          bestBetNumbers = [betNum1, betNum2];
          break;
        }
      }
      if (bestBetNumbers) break;
    }
    
    return {
      betNumbers: bestBetNumbers || [15, 23], // fallback se não encontrar
      coveredNumbers: coveredNumbers.sort((a, b) => a - b),
      riskNumbers: finalRiskNumbers
    };
  };

  // Função para detectar padrão de 2 números consecutivos em grupo de até 5 na sequência real
  const detectPattern = (history: number[]): PatternAlert | null => {
    if (history.length < 2) return null;
    
    // Verificar apenas os últimos 2 números sorteados consecutivamente
    const lastNumber = history[history.length - 1];
    const secondLastNumber = history[history.length - 2];
    
    // Encontrar posições na sequência da roleta
    const pos1 = ROULETTE_SEQUENCE.indexOf(lastNumber);
    const pos2 = ROULETTE_SEQUENCE.indexOf(secondLastNumber);
    
    if (pos1 === -1 || pos2 === -1) return null;
    
    // Calcular distância considerando que a roleta é circular
    const distance = Math.min(
      Math.abs(pos1 - pos2),
      37 - Math.abs(pos1 - pos2)
    );
    
    // Se a distância for <= 4 (grupo de até 5 números), detectou padrão
    if (distance <= 4) {
      const strategy = calculateBettingStrategy([secondLastNumber, lastNumber]);
      
      let message = `Padrão detectado! Os números ${secondLastNumber} e ${lastNumber} saíram consecutivamente em um grupo de ${distance + 1} números na sequência da roleta.`;
      
      if (strategy) {
        message += `\n\n🎯 ESTRATÉGIA DE APOSTA:\nAposte nos números: ${strategy.betNumbers.join(' e ')}\n(cada um com 7 vizinhos de cada lado)\n\n📊 COBERTURA:\n• Números apostados (30): ${strategy.coveredNumbers.join(', ')}\n• Números no risco (7): ${strategy.riskNumbers.join(', ')}`;
      }
      
      return {
        numbers: [secondLastNumber, lastNumber],
        positions: [pos2, pos1],
        message: message
      };
    }
    
    return null;
  };
  
  // Função para adicionar número ao histórico e verificar padrões
  // Função específica para adicionar números ao histórico sem mostrar popup
  const addToHistoryWithoutPopup = (number: number) => {
    // Atualizar histórico de forma síncrona na ref para evitar estado obsoleto
    const updatedHistory = [...drawnHistoryRef.current, number].slice(-20);
    drawnHistoryRef.current = updatedHistory;
    setDrawnHistory(updatedHistory);

    // Se estamos aguardando a próxima dezena após um popup
    if (waitingForNextNumberRef.current) {
      // Verificar se o número está nos 30 números cobertos (WIN) ou nos 7 de risco (LOSS)
      if (lastPatternNumbersRef.current.covered.includes(number)) {
        setWinCount((prev) => prev + 1);
      } else if (lastPatternNumbersRef.current.risk.includes(number)) {
        setLossCount((prev) => prev + 1);
      }
      // Parar de aguardar após processar a próxima dezena
      setWaitingForNextNumber(false);
      setLastPatternNumbers({covered: [], risk: []});
      waitingForNextNumberRef.current = false;
      lastPatternNumbersRef.current = {covered: [], risk: []};
    }

    const pattern = detectPattern(updatedHistory);
    if (pattern) {
      // Sempre computar estatísticas
      setPatternDetectedCount((prev) => prev + 1);

      // Extrair números para apostar (todos os 2 números)
      const betNumbers = pattern.message.includes('Aposte nos números:') ? 
        pattern.message.split('Aposte nos números: ')[1]?.split('\n')[0]?.split(' e ').map(n => parseInt(n.trim())) : 
        [15, 23];

      // Extrair números de risco e pegar apenas o primeiro e último
      const allRiskNumbers = pattern.message.includes('Números no risco (7):') ? 
        pattern.message.split('Números no risco (7): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
        [14, 31, 9, 22, 18, 29, 7];

      // Extrair números cobertos (30 números)
      const coveredNumbers = pattern.message.includes('Números apostados (30):') ? 
        pattern.message.split('Números apostados (30): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
        ROULETTE_SEQUENCE.filter(n => !allRiskNumbers.includes(n));

      // Configurar para aguardar a próxima dezena
      setWaitingForNextNumber(true);
      setLastPatternNumbers({
        covered: coveredNumbers,
        risk: allRiskNumbers
      });
      waitingForNextNumberRef.current = true;
      lastPatternNumbersRef.current = { covered: coveredNumbers, risk: allRiskNumbers };

      // NÃO mostrar popup nem destacar números - apenas computar estatísticas
    }
  };

  const addToHistory = (number: number) => {
    // Atualizar histórico de forma síncrona na ref para evitar estado obsoleto
    const updatedHistory = [...drawnHistoryRef.current, number].slice(-20);
    drawnHistoryRef.current = updatedHistory;
    setDrawnHistory(updatedHistory);

    // Se estamos aguardando a próxima dezena após um popup
    if (waitingForNextNumberRef.current) {
      // Verificar se o número está nos 30 números cobertos (WIN) ou nos 7 de risco (LOSS)
      if (lastPatternNumbersRef.current.covered.includes(number)) {
        setWinCount((prev) => prev + 1);
      } else if (lastPatternNumbersRef.current.risk.includes(number)) {
        setLossCount((prev) => prev + 1);
      }
      // Parar de aguardar após processar a próxima dezena
      setWaitingForNextNumber(false);
      setLastPatternNumbers({covered: [], risk: []});
      waitingForNextNumberRef.current = false;
      lastPatternNumbersRef.current = {covered: [], risk: []};
    }

    const pattern = detectPattern(updatedHistory);
    if (pattern) {
      // Sempre computar estatísticas
      setPatternDetectedCount((prev) => prev + 1);

      // Extrair números para apostar (todos os 2 números)
      const betNumbers = pattern.message.includes('Aposte nos números:') ? 
        pattern.message.split('Aposte nos números: ')[1]?.split('\n')[0]?.split(' e ').map(n => parseInt(n.trim())) : 
        [15, 23];

      // Extrair números de risco e pegar apenas o primeiro e último
      const allRiskNumbers = pattern.message.includes('Números no risco (7):') ? 
        pattern.message.split('Números no risco (7): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
        [14, 31, 9, 22, 18, 29, 7];

      // Extrair números cobertos (30 números)
      const coveredNumbers = pattern.message.includes('Números apostados (30):') ? 
        pattern.message.split('Números apostados (30): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
        ROULETTE_SEQUENCE.filter(n => !allRiskNumbers.includes(n));

      // Configurar para aguardar a próxima dezena
      setWaitingForNextNumber(true);
      setLastPatternNumbers({
        covered: coveredNumbers,
        risk: allRiskNumbers
      });
      waitingForNextNumberRef.current = true;
      lastPatternNumbersRef.current = { covered: coveredNumbers, risk: allRiskNumbers };

      // Só mostrar popup e destacar números se NÃO estiver simulando
      if (!isSimulatingRef.current) {
        setPatternAlert(pattern);
        setHighlightedBetNumbers(betNumbers);

        // Ordenar números de risco pela sequência da Race (ROULETTE_SEQUENCE)
        const sortedRiskNumbers = allRiskNumbers.sort((a, b) => {
          return ROULETTE_SEQUENCE.indexOf(a) - ROULETTE_SEQUENCE.indexOf(b);
        });
        
        // Destacar TODOS os números de risco, não apenas primeiro e último
        setHighlightedRiskNumbers(sortedRiskNumbers);
      }
    }
  };

  // Função para limpar toda a tela
  const clearScreen = () => {
    setSelected({
      numbers: [],
      colors: [],
      dozens: [],
      columns: [],
      specials: []
    });
    setLastNumbers([]);
    setLastSelectedNumber(null);
    setDrawnHistory([]);
    drawnHistoryRef.current = [];
    setPatternAlert(null);
    setHighlightedBetNumbers([]);
    setHighlightedRiskNumbers([]);
    setPatternDetectedCount(0);
    setWinCount(0);
    setLossCount(0);
    setWaitingForNextNumber(false);
    setLastPatternNumbers({covered: [], risk: []});
    waitingForNextNumberRef.current = false;
    lastPatternNumbersRef.current = {covered: [], risk: []};
    isSimulatingRef.current = false;
  };

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'bg-green-600';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'bg-red-700' : 'bg-gray-800';
  };

  const getTextColor = (num: number): string => {
    return 'text-white';
  };

  const toggleNumber = (num: number) => {
    // Limpar seleção anterior primeiro
    setLastSelectedNumber(null);
    
    // Limpar destaques do popup quando houver seleção manual
    setHighlightedBetNumbers([]);
    setHighlightedRiskNumbers([]);
    
    // Definir como último número selecionado
    setLastSelectedNumber(num);
    
    // Adicionar o número aos últimos sorteados
    addToLastNumbers(num);
    
    // Adicionar ao histórico para detecção de padrões
    addToHistory(num);
    
    // Manter a funcionalidade de seleção original
    setSelected(prev => ({
      ...prev,
      numbers: prev.numbers.includes(num)
        ? prev.numbers.filter(n => n !== num)
        : [...prev.numbers, num]
    }));
  };

  // Função para adicionar número aos últimos sorteados
  const addToLastNumbers = (num: number) => {
    setLastNumbers(prev => {
      const newList = [num, ...prev];
      return newList.slice(0, 50); // Manter apenas os últimos 50
    });
  };

  // Função para simular sorteio (para teste)
  const simulateDrawing = () => {
    const randomNum = Math.floor(Math.random() * 37); // 0-36
    addToLastNumbers(randomNum);
    addToHistory(randomNum); // Adicionar ao histórico para detecção de padrões
    setLastDrawnNumber(randomNum);
    setLastSelectedNumber(randomNum); // Marcar também na race
    // Limpar a borda após 2 segundos
    setTimeout(() => setLastDrawnNumber(null), 2000);
  };

  // Função para processar números adicionados
  const processAddedNumbers = () => {
    if (!addNumbersInput.trim()) return;
    
    // Processar números separados por vírgula
    const numbersText = addNumbersInput.trim();
    const numberStrings = numbersText.split(',').map(n => n.trim());
    const validNumbers: number[] = [];
    
    // Validar cada número
    for (const numStr of numberStrings) {
      const num = parseInt(numStr);
      if (!isNaN(num) && num >= 0 && num <= 36) {
        validNumbers.push(num);
      }
    }
    
    if (validNumbers.length === 0) {
      alert('Nenhum número válido encontrado. Use números de 0 a 36 separados por vírgula.');
      return;
    }
    
    // Fechar modal
    setShowAddNumbersModal(false);
    setAddNumbersInput('');
    
    // Aplicar números em sequência com intervalo de 700ms
    // Ordem: na sequência digitada (10,11,12,13,14 = 10 primeiro, 14 último)
    
    let index = 0;
    const interval = setInterval(() => {
      if (index >= validNumbers.length) {
        clearInterval(interval);
        return;
      }
      
      const currentNumber = validNumbers[index];
      
      // Adicionar aos últimos números
      addToLastNumbers(currentNumber);
      
      // Adicionar ao histórico para detecção de padrões (sem popup)
      addToHistoryWithoutPopup(currentNumber);
      
      // Marcar como último selecionado
      setLastSelectedNumber(currentNumber);
      setLastDrawnNumber(currentNumber);
      
      // Limpar borda após 600ms (antes do próximo número)
      setTimeout(() => setLastDrawnNumber(null), 600);
      
      index++;
    }, 700);
   };
  
  const toggleSpecial = (type: string) => {
    setSelected(prev => ({
      ...prev,
      specials: prev.specials.includes(type)
        ? prev.specials.filter(s => s !== type)
        : [...prev.specials, type]
    }));
  };

  const toggleDozen = (dozen: string) => {
    setSelected(prev => ({
      ...prev,
      dozens: prev.dozens.includes(dozen)
        ? prev.dozens.filter(d => d !== dozen)
        : [...prev.dozens, dozen]
    }));
  };

  const toggleColumn = (col: string) => {
    setSelected(prev => ({
      ...prev,
      columns: prev.columns.includes(col)
        ? prev.columns.filter(c => c !== col)
        : [...prev.columns, col]
    }));
  };

  // Função para simular sorteio automático dos primeiros 50 números
  const simulateAutoDrawing = () => {
    if (isSimulating) {
      // Parar a simulação
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
      setIsSimulating(false);
      isSimulatingRef.current = false;
      setLastDrawnNumber(null); // Limpar borda ao finalizar
    } else {
      setIsSimulating(true);
      isSimulatingRef.current = true;
      let count = 0;
      
      const interval = setInterval(() => {
        if (count >= 50) {
          clearInterval(interval);
          setIsSimulating(false);
          isSimulatingRef.current = false;
          setLastDrawnNumber(null); // Limpar borda ao finalizar
          return;
        }
        
        const randomNum = Math.floor(Math.random() * 37); // 0-36
        addToLastNumbers(randomNum);
        addToHistory(randomNum); // Adicionar ao histórico para detecção de padrões
        setLastDrawnNumber(randomNum); // Marcar número atual com borda
        setLastSelectedNumber(randomNum); // Marcar também na race
        count++;
      }, 700);
      setSimulationInterval(interval);
    }
  };

  useEffect(() => {
    isSimulatingRef.current = isSimulating;
  }, [isSimulating]);

  useEffect(() => {
    waitingForNextNumberRef.current = waitingForNextNumber;
  }, [waitingForNextNumber]);

  useEffect(() => {
    lastPatternNumbersRef.current = lastPatternNumbers;
  }, [lastPatternNumbers]);

  const renderNumber = (num: number) => {
    const isLastSelected = lastSelectedNumber === num;
    const isLastDrawn = lastDrawnNumber === num;
    const needsReducedMargin = [1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 17, 18, 19, 20, 21, 25, 26, 27, 28, 29, 30, 31, 32, 33].includes(num);
    const needsExtraMargin = [12, 11, 10, 24, 23, 22].includes(num);
    
    return (
      <button
        key={num}
        onClick={() => toggleNumber(num)}
        className={cn(
          'w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 border-2',
          getNumberColor(num),
          getTextColor(num),
          (isLastSelected || isLastDrawn) ? 'border-yellow-400 border-4' : 'border-gray-600 hover:border-gray-400',
          needsReducedMargin ? 'mr-[-6px]' : '',
          needsExtraMargin ? 'mr-[8px]' : ''
        )}
      >
        {num}
      </button>
    );
  };

  const renderSpecialButton = (label: string, type: string, bgColor: string = 'bg-gray-600') => {
    const isSelected = selected.specials.includes(type);
    return (
      <button
        onClick={() => toggleSpecial(type)}
        className={cn(
          'px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 border-2',
          bgColor,
          isSelected ? 'border-yellow-400 scale-105 shadow-lg' : 'border-gray-500 hover:border-gray-400'
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Popup de Alerta de Padrão */}
      {patternAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-3xl">🎯</span>
                      Padrão Detectado - Estratégia de Aposta
                    </h2>
                    <p className="text-sm text-gray-600 ml-11">
                      Sistema encontrou uma oportunidade de aposta otimizada
                    </p>
                  </div>
                  <button
            onClick={() => setShowAddNumbersModal(true)}
            className="bg-yellow-100 hover:bg-yellow-200 text-black text-xs px-3 py-1 rounded transition-colors font-semibold"
            style={{height: '20px', fontSize: '11px', lineHeight: '1'}}
            title="Adicionar números já sorteados"
          >
            <div className="flex items-center gap-1">
              <span>➕</span>
              Adicionar Nºs
            </div>
          </button>
          <button
                    onClick={() => {
                      setPatternAlert(null);
                      setHighlightedBetNumbers([]);
                      setHighlightedRiskNumbers([]);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Coluna da Esquerda - Números Sugeridos */}
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">💰</span>
                    NÚMEROS PARA APOSTAR
                  </h3>
                  <p className="text-sm text-green-700 mb-4">Aposte nestes números (cada um com 7 vizinhos):</p>
                  <div className="flex justify-center gap-4 mb-4">
                    {(() => {
                      const strategy = patternAlert.message.includes('Aposte nos números:') ? 
                        patternAlert.message.split('Aposte nos números: ')[1]?.split('\n')[0]?.split(' e ') : 
                        ['15', '23'];
                      return strategy.map((numStr, index) => {
                        const num = parseInt(numStr.trim());
                        return (
                          <div
                            key={num}
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform hover:scale-105 ${
                              getNumberColor(num)
                            } ring-4 ring-green-300`}
                          >
                            {num}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="text-center">
                    <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Cobertura: 30 números (81%)
                    </span>
                  </div>
                </div>
                
                {/* Coluna da Direita - Números de Risco */}
                <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                  <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">⚠️</span>
                    NÚMEROS NO RISCO
                  </h3>
                  <p className="text-sm text-red-700 mb-4">Números descobertos (sequência real da roleta):</p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {(() => {
                      const riskNumbers = patternAlert.message.includes('Números no risco (7):') ? 
                        patternAlert.message.split('Números no risco (7): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
                        [14, 31, 9, 22, 18, 29, 7];
                      
                      // Manter a ordem original da lista (não ordenar pela sequência Race)
                      const allRiskNumbers = riskNumbers;
                      
                      return allRiskNumbers.map((num, index) => {
                        const isFirst = index === 0;
                        const isLast = index === allRiskNumbers.length - 1;
                        const isHighlighted = isFirst || isLast;
                        
                        return (
                          <div
                            key={num}
                            className={`${isHighlighted ? 'w-12 h-12 ring-2 ring-red-400' : 'w-10 h-10'} rounded-full flex items-center justify-center text-white font-medium text-sm opacity-75 ${
                              getNumberColor(num)
                            } ${isHighlighted ? 'transform scale-110' : ''}`}
                          >
                            {num}
                          </div>
                        );
                      });
                    })()
                  }
                  </div>
                  <div className="text-center">
                    <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Risco: 7 números (19%)
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Números do Padrão Detectado */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800 mb-3">📊 Padrão Detectado:</h4>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-blue-700">Números consecutivos:</span>
                    {patternAlert.numbers.map((num, index) => (
                      <div key={num} className="flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-1 font-mono">
                          {patternAlert.positions[index] + 1}
                        </div>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            getNumberColor(num)
                          } shadow-md`}
                        >
                          {num}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              

            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar números */}
      {showAddNumbersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              {/* Logo da tela de login */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <radialGradient id="ballGradient" cx="0.3" cy="0.3" r="0.7">
                        <stop offset="0%" stopColor="#ff4444" />
                        <stop offset="100%" stopColor="#cc0000" />
                      </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="45" fill="url(#ballGradient)" stroke="#990000" strokeWidth="2"/>
                    <circle cx="40" cy="35" r="8" fill="#ff6666" opacity="0.6"/>
                    <text x="50" y="58" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">171</text>
                  </svg>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
                Adicionar Números Sorteados
              </h2>
              
              <p className="text-sm text-gray-600 text-center mb-4">
                Digite os números separados por vírgula (ex: 01,36,00,16,17)
              </p>
              
              <textarea
                ref={(el) => {
                  if (el && showAddNumbersModal) {
                    setTimeout(() => el.focus(), 100);
                  }
                }}
                value={addNumbersInput}
                onChange={(e) => setAddNumbersInput(e.target.value)}
                placeholder="01,36,00,16,17,00,26..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddNumbersModal(false);
                    setAddNumbersInput('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={processAddedNumbers}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-auto p-6 bg-green-700 rounded-xl shadow-2xl" style={{marginTop: '-20px'}}>
      {/* Título e botões na mesma linha */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white" style={{marginTop: '-15px'}}>Roleta Europeia</h1>
        <div className="flex gap-2">
          <button
            onClick={simulateAutoDrawing}
            className={cn(
               "text-black text-xs px-3 py-1 rounded transition-colors font-semibold",
               isSimulating 
                 ? "bg-red-500 hover:bg-red-600 text-white" 
                 : "bg-gray-400 hover:bg-gray-500"
             )}
            style={{height: '20px', fontSize: '11px', lineHeight: '1'}}
            title={isSimulating ? "Parar simulação automática" : "Simular sorteio automático dos primeiros 50 números"}
          >
            <div className="flex items-center gap-1">
               {isSimulating ? (
                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                   <rect x="6" y="4" width="2" height="12" />
                   <rect x="12" y="4" width="2" height="12" />
                 </svg>
               ) : (
                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                   <circle cx="10" cy="10" r="2"/>
                   <path d="M10 6l2 2-2 2-2-2z"/>
                 </svg>
               )}
               {isSimulating ? 'Parar Simulação' : 'Simular Sorteio'}
             </div>
          </button>
          <button
            onClick={() => setShowAddNumbersModal(true)}
            className="bg-yellow-100 hover:bg-yellow-200 text-black text-xs px-3 py-1 rounded transition-colors font-semibold"
            style={{height: '20px', fontSize: '11px', lineHeight: '1'}}
            title="Adicionar números já sorteados"
          >
            <div className="flex items-center gap-1">
              <span>➕</span>
              Adicionar Nºs
            </div>
          </button>
          <button
            onClick={clearScreen}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors"
            style={{height: '20px', fontSize: '11px', lineHeight: '1'}}
            title="Limpar toda a tela e iniciar novo sorteio"
          >
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3l1.5 1.5a1 1 0 01-1.414 1.414L9.5 10.5A1 1 0 019 9.5V6a1 1 0 011-1z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6 2a1 1 0 000 2v5a1 1 0 00.293.707l6.414 6.414a1 1 0 001.414-1.414L7.414 8.414A1 1 0 007 8V4a3 3 0 10-1-2z" clipRule="evenodd" />
              </svg>
              Limpar Tela
            </div>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded transition-colors"
              style={{height: '20px', fontSize: '11px', lineHeight: '1'}}
              title="Sair do sistema"
            >
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 01-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Sair
              </div>
            </button>
          )}
        </div>
      </div>
      
      {/* Box com últimos números sorteados */}
      <div className="bg-gray-600 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-semibold">Últimos Números Sorteados:</h3>
          <div className="flex gap-2">

            <button
              onClick={simulateDrawing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
            >
              Simular Próximo
            </button>
            
            <button
              onClick={() => {
                if (lastNumbers.length > 0) {
                  const newNumbers = lastNumbers.slice(1);
                  setLastNumbers(newNumbers);
                  // Marcar o novo número mais recente na race
                  setLastSelectedNumber(newNumbers.length > 0 ? newNumbers[0] : null);
                }
              }}
              disabled={lastNumbers.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
              title="Apagar Último"
            >
              Apagar Último
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[80px] items-start">
          {lastNumbers.length === 0 ? (
            <span className="text-gray-300 text-sm flex items-center h-full">Nenhum número sorteado ainda</span>
          ) : (
            lastNumbers.map((num, index) => {
              const isLastSelected = lastSelectedNumber === num;
              return (
                <span
                  key={`${num}-${index}`}
                  className={cn(
                    'w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center text-white border-2 border-gray-400',
                    getNumberColor(num),
                    isLastSelected ? 'ring-2 ring-yellow-400 scale-110' : ''
                  )}
                  title={`Posição: ${index + 1}`}
                >
                  {num}
                </span>
              );
            })
          )}
        </div>
      </div>
      
      <div className="flex gap-6">
        {/* Painel Principal - Esquerda */}
        <div className="flex-1">
          {/* Grid Principal de Números com Zero Vertical e Colunas */}
          <div className="mb-6">
            <div className="flex gap-4">
              {/* Botão Zero Vertical */}
               <div className="flex flex-col ml-[-5px] mr-[-10px]">
                 <button
                   onClick={() => toggleNumber(0)}
                   className={cn(
                     'w-10 h-[136px] rounded-lg font-bold text-lg transition-all duration-200 border-2 bg-green-600 text-white border-gray-600 hover:border-gray-400'
                   )}
                 >
                   0
                 </button>
               </div>
              
              {/* Grid de Números */}
              <div className="flex-1">
                {/* Primeira linha */}
                <div className="flex gap-2 mb-2">
                  {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(num => renderNumber(num))}
                </div>
                
                {/* Segunda linha */}
                <div className="flex gap-2 mb-2">
                  {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(num => renderNumber(num))}
                </div>
                
                {/* Terceira linha */}
                <div className="flex gap-2 mb-4">
                  {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(num => renderNumber(num))}
                </div>
              </div>

              {/* Race Sequence - Sequência Real da Roleta */}
              <div className="ml-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  {/* Formato da race real */}
                  <div className="w-full font-mono">
                    {/* Linha superior: 05 24 16 33 01 20 14 31 09 22 18 29 07 28 12 35 03 */}
                    <div className="flex justify-center gap-1 mb-1 mt-2.5">
                      {[5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3].map((num, index) => {
                        const isLastSelected = lastSelectedNumber === num;
                        const isHighlightedBet = highlightedBetNumbers.includes(num);
                        const isHighlightedRisk = highlightedRiskNumbers.includes(num);
                        return (
                          <div
                            key={`race-top-${num}`}
                            className={cn(
                              'w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white border-2 border-gray-400',
                              getNumberColor(num),
                              isLastSelected ? 'ring-2 ring-yellow-400 scale-110' : '',
                              isHighlightedBet ? 'ring-2 ring-green-400 scale-110 shadow-lg' : '',
                              isHighlightedRisk ? 'ring-2 ring-red-400 scale-110 shadow-lg' : ''
                            )}
                            title={`Posição ${ROULETTE_SEQUENCE.indexOf(num) + 1} na roleta: ${num}`}
                          >
                            {num.toString().padStart(2, '0')}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Linha do meio: 10 e 26 posicionados acima de 23 e 00 respectivamente */}
                    <div className="flex justify-center gap-1 mb-1">
                      <div className="flex gap-1">
                        {/* 10 posicionado acima do 23 (primeira posição) */}
                        {(() => {
                          const num = 10;
                          const isLastSelected = lastSelectedNumber === num;
                          const isHighlightedBet = highlightedBetNumbers.includes(num);
                          const isHighlightedRisk = highlightedRiskNumbers.includes(num);
                          return (
                            <div
                              className={cn(
                                'w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white border-2 border-gray-400',
                                getNumberColor(num),
                                isLastSelected 
                                  ? 'border-yellow-400 border-2 ring-2 ring-yellow-300 scale-125 shadow-lg animate-pulse' 
                                  : 'border-gray-400',
                                isHighlightedBet ? 'ring-2 ring-green-400 scale-110 shadow-lg' : '',
                                isHighlightedRisk ? 'ring-2 ring-red-400 scale-110 shadow-lg' : ''
                              )}
                              title={`Posição ${ROULETTE_SEQUENCE.indexOf(num) + 1} na roleta: ${num}`}
                            >
                              {num.toString().padStart(2, '0')}
                            </div>
                          );
                        })()}
                        
                        {/* Espaços vazios para posicionar corretamente */}
                        {Array.from({length: 16}, (_, i) => (
                          <div key={`spacer-${i}`} className="w-7 h-7"></div>
                        ))}
                        
                        {/* 26 posicionado acima do 00 */}
                        {(() => {
                          const num = 26;
                          const isLastSelected = lastSelectedNumber === num;
                          const isHighlightedBet = highlightedBetNumbers.includes(num);
                          const isHighlightedRisk = highlightedRiskNumbers.includes(num);
                          return (
                            <div
                              className={cn(
                                'w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white border-2 border-gray-400',
                                getNumberColor(num),
                                isLastSelected 
                                  ? 'border-yellow-400 border-2 ring-2 ring-yellow-300 scale-125 shadow-lg animate-pulse' 
                                  : 'border-gray-400',
                                isHighlightedBet ? 'ring-2 ring-green-400 scale-110 shadow-lg' : '',
                                isHighlightedRisk ? 'ring-2 ring-red-400 scale-110 shadow-lg' : ''
                              )}
                              title={`Posição ${ROULETTE_SEQUENCE.indexOf(num) + 1} na roleta: ${num}`}
                            >
                              {num.toString().padStart(2, '0')}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Linha inferior: 23 08 30 11 36 13 27 06 34 17 25 02 21 04 19 15 32 00 */}
                    <div className="flex justify-center gap-1 mb-2.5">
                      {[23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32, 0].map((num, index) => {
                        const isLastSelected = lastSelectedNumber === num;
                        const isHighlightedBet = highlightedBetNumbers.includes(num);
                        const isHighlightedRisk = highlightedRiskNumbers.includes(num);
                        return (
                          <div
                            key={`race-bottom-${num}`}
                            className={cn(
                              'w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white border-2 border-gray-400',
                              getNumberColor(num),
                              isLastSelected 
                                ? 'border-yellow-400 border-2 ring-2 ring-yellow-300 scale-125 shadow-lg animate-pulse' 
                                : 'border-gray-400',
                              isHighlightedBet ? 'ring-2 ring-green-400 scale-110 shadow-lg' : '',
                              isHighlightedRisk ? 'ring-2 ring-red-400 scale-110 shadow-lg' : ''
                            )}
                            title={`Posição ${ROULETTE_SEQUENCE.indexOf(num) + 1} na roleta: ${num}`}
                          >
                            {num.toString().padStart(2, '0')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Estatísticas - Direita - Layout em 6 Colunas */}
          <div className="flex-1 bg-gray-800 rounded-lg p-3 h-fit">
            <h3 className="text-white font-bold -mt-1.5 mb-3 text-center text-sm">📊 Estatísticas dos Sorteios</h3>
            
            {/* Layout em 6 colunas */}
            <div className="grid grid-cols-6 gap-3">
              {/* Coluna 1 - Números */}
              <div className="bg-gray-700 rounded p-2">
                <h4 className="text-white font-semibold mb-2 text-xs">🎯 Números</h4>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-gray-300 text-xs">Total</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.length}</div>
                    <div className="text-gray-400 text-xs">100%</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-xs">Pares</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n !== 0 && n % 2 === 0).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n !== 0 && n % 2 === 0).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-xs">Ímpares</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n % 2 === 1).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n % 2 === 1).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
              
              {/* Coluna 2 - Cores */}
              <div className="bg-gray-700 rounded p-2">
                <h4 className="text-white font-semibold mb-2 text-xs">🎨 Cores</h4>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-red-400 text-xs">● Verm.</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n)).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n)).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-xs">● Pretos</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n !== 0 && ![1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n)).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n !== 0 && ![1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n)).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-green-400 text-xs">● Verde</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n === 0).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n === 0).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
              
              {/* Coluna 3 - Faixas */}
              <div className="bg-gray-700 rounded p-2">
                <h4 className="text-white font-semibold mb-2 text-xs">📈 Faixas</h4>
                <div className="grid grid-cols-2 gap-1 text-center">
                  <div>
                    <div className="text-gray-300 text-xs">1-18</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n >= 1 && n <= 18).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n >= 1 && n <= 18).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-xs">19-36</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n >= 19 && n <= 36).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n >= 19 && n <= 36).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
              
              {/* Coluna 4 - Dúzias */}
              <div className="bg-gray-700 rounded p-2">
                <h4 className="text-white font-semibold mb-2 text-xs">🎲 Dúzias</h4>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-gray-300 text-xs">1ª</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n >= 1 && n <= 12).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n >= 1 && n <= 12).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-xs">2ª</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n >= 13 && n <= 24).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n >= 13 && n <= 24).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-xs">3ª</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => n >= 25 && n <= 36).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => n >= 25 && n <= 36).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
              
              {/* Coluna 5 - Colunas */}
              <div className="bg-gray-700 rounded p-2">
                <h4 className="text-white font-semibold mb-2 text-xs">📋 Colunas</h4>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-gray-300 text-xs">Col 1</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(n)).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(n)).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-xs">Col 2</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(n)).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(n)).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-xs">Col 3</div>
                    <div className="text-white font-bold text-sm">{lastNumbers.filter(n => [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(n)).length}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((lastNumbers.filter(n => [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(n)).length / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
              
              {/* Coluna 6 - I7I */}
              <div className="bg-gray-700 rounded p-2">
                <h4 className="text-white font-semibold mb-2 text-xs">📊 I7I</h4>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-gray-300 text-xs">Entradas</div>
                    <div className="text-white font-bold text-sm">{patternDetectedCount}</div>
                    <div className="text-gray-400 text-xs">{lastNumbers.length > 0 ? Math.round((patternDetectedCount / lastNumbers.length) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-green-400 text-xs">WIN</div>
                    <div className="text-white font-bold text-sm">{winCount}</div>
                    <div className="text-gray-400 text-xs">{patternDetectedCount > 0 ? Math.round((winCount / patternDetectedCount) * 100) : 0}%</div>
                  </div>
                  <div>
                    <div className="text-red-400 text-xs">LOSS</div>
                    <div className="text-white font-bold text-sm">{lossCount}</div>
                    <div className="text-gray-400 text-xs">{patternDetectedCount > 0 ? Math.round((lossCount / patternDetectedCount) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default RouletteBoard;