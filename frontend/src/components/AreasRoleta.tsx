import React, { useEffect, useState } from 'react';
import { soundGenerator } from '../utils/soundUtils';

interface AreasRoletaProps {
  isOpen: boolean;
  onClose: () => void;
  lastNumbers: number[];
  avisosSonorosAtivos: boolean;
}

interface AreaAlert {
  primaryArea: string;
  secondaryArea: string;
  count: number;
}

interface GlobalStats {
  wins: number;
  losses: number;
}

interface HighlightedNumber {
  number: number;
  timestamp: number;
}

const AreasRoleta: React.FC<AreasRoletaProps> = ({
  isOpen,
  onClose,
  lastNumbers,
  avisosSonorosAtivos
}) => {
  // Definição das áreas de cores da roleta
  const AREA_AMARELA = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13];
  const AREA_VERMELHA = [13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14];
  const AREA_AZUL = [14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26, 0];

  // Estado para alertas de áreas
  const [areaAlert, setAreaAlert] = useState<AreaAlert | null>(null);
  
  // Estado para números destacados
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
  const [highlightTimeout, setHighlightTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Estado para estatísticas globais
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    wins: 0,
    losses: 0
  });
  
  // Estado para controlar se já havia alerta antes do último número
  const [hadAlertBefore, setHadAlertBefore] = useState<boolean>(false);

  // Função para obter a cor da área de um número
  const getAreaColor = (num: number): 'amarela' | 'vermelha' | 'azul' | null => {
    if (AREA_AMARELA.includes(num)) return 'amarela';
    if (AREA_VERMELHA.includes(num)) return 'vermelha';
    if (AREA_AZUL.includes(num)) return 'azul';
    return null;
  };

  // Função para obter a classe CSS da cor da área
  const getAreaColorClass = (num: number): string => {
    const area = getAreaColor(num);
    switch (area) {
      case 'amarela': return 'bg-yellow-500';
      case 'vermelha': return 'bg-red-500';
      case 'azul': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Função para detectar ausências consecutivas de áreas
  const checkAreaAbsences = (numbers: number[]) => {
    if (numbers.length < 6) return null;

    // Calcular ausências de cada área
    const ausencias = {
      amarela: countAreaAbsence('amarela'),
      vermelha: countAreaAbsence('vermelha'),
      azul: countAreaAbsence('azul')
    };

    // Verificar se alguma área tem 6+ ausências consecutivas
    const areasComAlerta = Object.entries(ausencias)
      .filter(([_, count]) => count >= 6)
      .sort(([_, a], [__, b]) => b - a); // Ordenar por maior ausência

    if (areasComAlerta.length > 0) {
      const primaryArea = areasComAlerta[0][0].toUpperCase();
      const secondaryArea = areasComAlerta.length > 1 
        ? areasComAlerta[1][0].toUpperCase()
        : Object.entries(ausencias)
            .filter(([area, _]) => area !== areasComAlerta[0][0])
            .sort(([_, a], [__, b]) => b - a)[0][0].toUpperCase();

      return {
        primaryArea,
        secondaryArea,
        count: areasComAlerta[0][1]
      };
    }

    return null;
  };

  // Função para contar ausências de uma área específica
  const countAreaAbsence = (areaType: 'amarela' | 'vermelha' | 'azul'): number => {
    let count = 0;
    for (let i = lastNumbers.length - 1; i >= 0; i--) {
      if (getAreaColor(lastNumbers[i]) === areaType) break;
      count++;
    }
    return count;
  };

  // Função para destacar números iguais com borda preta
  const highlightSameNumbers = (num: number) => {
    // Se há um timeout ativo, cancela o anterior
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
      setHighlightTimeout(null);
    }
    
    // Destacar o novo número clicado
    setHighlightedNumber(num);
    
    // Criar novo timeout para remover destaque após 25 segundos
    const newTimeout = setTimeout(() => {
      setHighlightedNumber(null);
      setHighlightTimeout(null);
    }, 25000);
    
    setHighlightTimeout(newTimeout);
  };

  // Monitorar mudanças nos números para detectar alertas de área
  useEffect(() => {
    if (isOpen && lastNumbers.length > 0) {
      const alert = checkAreaAbsences(lastNumbers);
      
      // Se há um novo alerta ou mudança na área prioritária
      if (alert && (!areaAlert || areaAlert.primaryArea !== alert.primaryArea)) {
        setAreaAlert(alert);
        if (avisosSonorosAtivos) {
          try {
            soundGenerator.playBellSound();
          } catch (error) {
            console.error('Erro ao tocar som de alerta:', error);
          }
        }
      }
      // Se não há mais nenhuma área com 6+ ausências, remove o alerta
      else if (!alert) {
        setAreaAlert(null);
      }
    }
  }, [lastNumbers, isOpen, avisosSonorosAtivos, areaAlert]);

  // Estado para controlar o tamanho anterior da lista
  const [previousLength, setPreviousLength] = useState<number>(0);

  // Atualizar estatísticas W/R apenas quando um NOVO número é adicionado após alerta
  useEffect(() => {
    // Só processar se houve incremento real de números E havia alerta antes
    if (lastNumbers.length > previousLength && hadAlertBefore && lastNumbers.length > 1) {
      const lastNumber = lastNumbers[lastNumbers.length - 1];
      const lastNumberArea = getAreaColor(lastNumber);
      
      // Usar o alerta atual
      const currentAlert = areaAlert;
      if (currentAlert) {
        const primaryAreaLower = currentAlert.primaryArea.toLowerCase() as 'amarela' | 'vermelha' | 'azul';
        const secondaryAreaLower = currentAlert.secondaryArea.toLowerCase() as 'amarela' | 'vermelha' | 'azul';
        
        // Verificar se o número que saiu é uma das áreas alertadas (WIN) ou não (RED)
        const isWin = lastNumberArea === primaryAreaLower || lastNumberArea === secondaryAreaLower;
        
        setGlobalStats(prev => {
          const newStats = { ...prev };
          
          if (isWin) {
            // WIN: incrementar wins globais
            newStats.wins += 1;
            
            // Remover alerta após WIN
            setAreaAlert(null);
            setHadAlertBefore(false);
          } else {
            // LOSS: incrementar losses globais
            newStats.losses += 1;
          }
          
          return newStats;
        });
      }
    }
    
    // Atualizar estados de controle
    setPreviousLength(lastNumbers.length);
    setHadAlertBefore(!!areaAlert);
  }, [lastNumbers.length, areaAlert]);

  // Destacar automaticamente o último número adicionado
  useEffect(() => {
    if (lastNumbers.length > 0) {
      const lastNumber = lastNumbers[lastNumbers.length - 1];
      
      // Se há um timeout ativo, cancela o anterior
      if (highlightTimeout) {
        clearTimeout(highlightTimeout);
        setHighlightTimeout(null);
      }
      
      // Destacar o último número adicionado
      setHighlightedNumber(lastNumber);
      
      // Criar novo timeout para remover destaque após 25 segundos
      const newTimeout = setTimeout(() => {
        setHighlightedNumber(null);
        setHighlightTimeout(null);
      }, 25000);
      
      setHighlightTimeout(newTimeout);
    }
  }, [lastNumbers.length]);

  // Limpar timeout quando componente for desmontado
  useEffect(() => {
    return () => {
      if (highlightTimeout) {
        clearTimeout(highlightTimeout);
      }
    };
  }, [highlightTimeout]);

  // Resetar estatísticas quando os números forem limpos
  useEffect(() => {
    if (lastNumbers.length === 0) {
      setGlobalStats({
        wins: 0,
        losses: 0
      });
      setAreaAlert(null);
      setHadAlertBefore(false);
      setPreviousLength(0);
    }
  }, [lastNumbers.length]);

  if (!isOpen) return null;

  return (
    <div 
      className="bg-white rounded-lg p-4 h-fit transform-gpu animate-slide-in-right mb-4"
      style={{ 
        marginTop: '-21px', 
        marginBottom: '35px', 
        willChange: 'transform, opacity, filter',
        height: '220px'
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-gray-800 font-bold text-lg">🎯 Áreas da Roleta</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg w-6 h-6 flex items-center justify-center rounded-full border border-red-400 hover:border-red-500 transition-colors leading-none z-10"
        >
          ×
        </button>
      </div>

      {/* Layout dividido: 80% números, 20% informações */}
      <div className="flex gap-4" style={{ height: 'calc(100% - 60px)' }}>
        {/* Coluna Esquerda - Números (80%) */}
        <div className="flex flex-col" style={{ width: '80%' }}>
          <div className="bg-gray-50 rounded-lg p-3 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">Últimos 60 Números</h4>
              <span className="text-xs text-gray-500">Total: {lastNumbers.slice(-60).length}</span>
            </div>
            <div className="flex flex-wrap overflow-y-auto" style={{ height: 'calc(100% - 30px)', gap: '2px' }}>
              {lastNumbers.slice(-60).reverse().map((num, idx) => {
                const isHighlighted = highlightedNumber === num;
                const borderClass = isHighlighted ? 'border-black border-4 shadow-lg' : 'border-gray-300 border';
                
                return (
                  <button
                    key={`area-${num}-${idx}`}
                    onClick={() => highlightSameNumbers(num)}
                    className={`rounded flex items-center justify-center text-white font-bold text-xs transition-all duration-200 hover:scale-105 hover:shadow-md ${getAreaColorClass(num)} ${borderClass}`}
                    style={{ width: 'calc(3.33% - 2px)', height: '26px', minWidth: '26px' }}
                    title={`Número ${num} - Área ${getAreaColor(num)?.toUpperCase() || 'INDEFINIDA'}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna Direita - Informações (20%) */}
        <div className="flex flex-col gap-3 h-full" style={{ width: '20%' }}>
          {/* Alerta de Área */}
          {areaAlert && (
            <div className={`px-2 py-2 rounded font-semibold text-center animate-pulse text-xs flex-shrink-0 border ${
              areaAlert.primaryArea === 'AMARELA' 
                ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                : areaAlert.primaryArea === 'VERMELHA'
                ? 'bg-red-100 border-red-400 text-red-700'
                : 'bg-blue-100 border-blue-400 text-blue-800'
            }`}>
              <div>🚨 Área {areaAlert.primaryArea}</div>
              <div>(Nºs {areaAlert.primaryArea === 'AMARELA' ? '2' : areaAlert.primaryArea === 'VERMELHA' ? '10' : '7'} e {areaAlert.secondaryArea === 'AMARELA' ? '2' : areaAlert.secondaryArea === 'VERMELHA' ? '10' : '7'} com 6 vizinhos)</div>
            </div>
          )}

          {/* Nova visualização das áreas com estatísticas */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {/* Linha das três áreas */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { name: 'Vermelha', color: 'bg-red-500', count: countAreaAbsence('vermelha') },
                { name: 'Azul', color: 'bg-blue-500', count: countAreaAbsence('azul') },
                { name: 'Amarela', color: 'bg-yellow-500', count: countAreaAbsence('amarela') }
              ].map((area) => {
                // Calcular total de ocorrências da área nos últimos números
                const totalOccurrences = lastNumbers.filter(num => {
                  const areaColor = getAreaColor(num);
                  return areaColor === area.name.toLowerCase();
                }).length;
                
                return (
                  <div key={area.name} className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${area.color} flex-shrink-0`}></div>
                      <span className="text-[10px] text-gray-700">{area.name}</span>
                    </div>
                    <div className="text-[11px] font-bold">
                      {area.count} / {totalOccurrences}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Linha das estatísticas WIN/LOSS */}
            <div className="flex justify-center gap-8 text-[11px]">
              <div className="text-center">
                <div className="text-green-600 font-semibold">WIN:</div>
                <div className="text-green-600 font-bold">{globalStats.wins}</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-semibold">LOSS:</div>
                <div className="text-red-600 font-bold">{globalStats.losses}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreasRoleta;
