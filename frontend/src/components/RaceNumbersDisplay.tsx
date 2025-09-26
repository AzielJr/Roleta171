import React from 'react';
import { cn } from "../utils/cn";

interface RaceNumbersDisplayProps {
  raceNumbers?: number[];
  highlightedNumbers?: number[];
  betNumbers?: number[]; // Números para APOSTAR (borda verde)
  riskNumbers?: number[]; // Números para RISCO (borda vermelha)
  isPatternActive?: boolean; // Indica se o padrão 171 está ativo/visível
  selectedNumber?: number | null; // Número selecionado na caixa de seleção
  baseNumbers?: number[]; // Números base que geram os 30 apostados
  forcedPattern?: any; // Indica se é um padrão forçado
  className?: string;
}

const RaceNumbersDisplay: React.FC<RaceNumbersDisplayProps> = ({ 
  raceNumbers = [], 
  highlightedNumbers = [],
  betNumbers = [],
  riskNumbers = [],
  isPatternActive = false,
  selectedNumber = null,
  baseNumbers = [],
  forcedPattern = null,
  className 
}) => {
  
  const getForceBlueClass = (num: number) => {
    // Se o número está destacado em amarelo, não aplica classe azul
    if (isHighlighted(num)) return '';
    
    // Apenas os números base têm classe force-blue quando padrão é forçado
    if (isPatternActive && baseNumbers.length > 0 && baseNumbers.includes(num)) {
      return 'force-blue-number';
    }
    
    // NÃO aplica classe force-blue nos números do card APOSTAR (amarelos)
    // Removido: if (isPatternActive && baseNumbers.length === 0 && betNumbers.includes(num))
    
    return '';
  };
  // Sequência da roleta conforme a imagem
  const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

  const getNumberColor = (num: number): string => {
    if (num === 0) {
      return 'bg-green-600';
    }
    
    // Números vermelhos na roleta
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    if (redNumbers.includes(num)) {
      return 'bg-red-600';
    }
    
    // Números pretos
    return 'bg-gray-800';
  };

  // Função para determinar a cor do texto
  const getTextColor = (num: number): string => {
    if (isPatternActive && betNumbers.includes(num)) {
      return 'text-white'; // Texto branco para números azuis
    }
    return 'text-white'; // Texto branco padrão
  };

  // Função para verificar se o número deve ser destacado (apenas para outros números, não o selecionado)
  const isHighlighted = (num: number): boolean => {
    return highlightedNumbers.includes(num);
  };

  // Função para verificar se é o número selecionado (apenas borda amarela)
  const isSelectedNumber = (num: number): boolean => {
    return selectedNumber !== null && selectedNumber === num;
  };

  // Função para determinar se um número deve ter borda especial
  const getSpecialBorderClass = (num: number): string => {
    // Só aplica bordas especiais se o padrão estiver ativo
    if (!isPatternActive) return '';
    
    // Se o número está destacado em amarelo, não aplica bordas especiais
    if (isHighlighted(num)) return '';
    
    // Apenas os números base têm borda branca oscilante (números azuis)
    if (baseNumbers.length > 0 && baseNumbers.includes(num)) {
      return 'animate-pulse-white-border';
    }
    
    // NÃO aplica oscilação nos números do card APOSTAR (amarelos)
    // Removido: if (baseNumbers.length === 0 && betNumbers.includes(num))
    
    return '';
  };

  // Função para determinar se um número deve ter destaque especial (tamanho maior)
  const getSpecialSizeClass = (num: number): string => {
    // Só aplica destaque especial se o padrão estiver ativo
    if (!isPatternActive) return '';
    
    // Se o número está destacado em amarelo, não aplica tamanho especial
    if (isHighlighted(num)) return '';
    
    // Apenas os números base têm tamanho especial quando padrão é forçado
    if (baseNumbers.length > 0 && baseNumbers.includes(num)) {
      return 'w-[25px] h-[25px] text-[11px]';
    }
    
    // Números do card APOSTAR têm tamanho especial apenas quando padrão é detectado (não forçado)
    if (baseNumbers.length === 0 && betNumbers.includes(num)) {
      return 'w-[25px] h-[25px] text-[11px]';
    }
    
    return '';
  };

  // Função para determinar se um número deve ter destaque especial
  const getYellowBorderClass = (num: number): string => {
    // Só aplica destaque especial se o padrão estiver ativo
    if (!isPatternActive) return '';
    
    // Se o número está destacado em amarelo, não aplica classes especiais
    if (isHighlighted(num)) return '';
    
    // Apenas os números base têm destaque especial (números azuis)
    if (baseNumbers.length > 0 && baseNumbers.includes(num)) {
      return 'selected-bet-number';
    }
    
    // NÃO aplica destaque especial nos números do card APOSTAR (amarelos)
    // Removido: if (baseNumbers.length === 0 && betNumbers.includes(num))
    
    // Primeiro e último número dos expostos têm borda branca oscilante
    if (riskNumbers.length > 0) {
      const firstExposed = riskNumbers[0];
      const lastExposed = riskNumbers[riskNumbers.length - 1];
      if ((num === firstExposed || num === lastExposed) && !isHighlighted(num)) {
        return 'animate-pulse-white-border';
      }
    }
    
    return '';
  };

  // Layout oval exato conforme especificado
  const topSequence = [10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3];
  const leftNumber = 23;
  const rightNumber = 26;
  const bottomSequence = [8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32, 0];

  return (
    <div className={cn("bg-gray-600 rounded-lg p-4 w-[calc(100%+200px)] mb-[-60px] ml-auto min-h-[128px] -translate-x-[200px]", className)}>
      {/* Título */}
      <div className="text-white text-xs font-medium mb-2 text-left mt-[-5px]">
        Sequencia na RACE
      </div>
      {/* Layout oval da roleta */}
      <div className="w-full h-full">
        {/* Linha superior */}
        <div className="flex justify-center mb-1 mt-[12px]">
          <div className="flex gap-1">
            {topSequence.map((num, index) => (
              <div
                key={`top-${num}`}
                className={cn(
                "w-[23px] h-[23px] rounded flex items-center justify-center text-[10px] border",
                  getNumberColor(num),
                  getTextColor(num),
                  isHighlighted(num) ? "bg-yellow-400 text-black" : 
                  isSelectedNumber(num) ? "border-yellow-400 border-2" : "border-gray-600",
                  getSpecialBorderClass(num),
                  getSpecialSizeClass(num),
                  getYellowBorderClass(num),
                  getForceBlueClass(num)
                )}
                style={
                  // Para números amarelos (padrão detectado ou forçado): sempre amarelo com borda original
                  isHighlighted(num)
                    ? { 
                        backgroundColor: '#fbbf24 !important', // amarelo
                        color: 'black !important',
                        border: '1px solid #6b7280 !important', // borda cinza original
                        borderColor: '#6b7280 !important',
                        boxShadow: 'none !important',
                        animation: 'none !important'
                      }
                  // Para padrão forçado: 30 números em amarelo, 2 base em azul
                  : forcedPattern && betNumbers.includes(num) && !baseNumbers.includes(num)
                    ? { 
                        backgroundColor: '#fbbf24', // amarelo
                        color: 'black',
                        border: '1px solid #6b7280' // borda cinza original
                      } 
                    : (forcedPattern || isPatternActive) && baseNumbers.includes(num)
                    ? { 
                        backgroundColor: '#3b82f6', // azul
                        color: 'white',
                        border: '1px solid #3b82f6'
                      }
                    // Para padrão detectado: números base em azul, outros em amarelo
                    : isPatternActive && !forcedPattern && baseNumbers.includes(num)
                    ? { 
                        backgroundColor: '#3b82f6', // azul para números base
                        color: 'white',
                        border: '1px solid #3b82f6'
                      }
                    : isPatternActive && !forcedPattern && betNumbers.includes(num) && !baseNumbers.includes(num)
                    ? { 
                        backgroundColor: '#fbbf24', // amarelo para outros números
                        color: 'black',
                        border: '1px solid #f59e0b'
                      } 
                    : undefined
                }
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Linha do meio com números laterais */}
        <div className="flex justify-between items-center mb-1 px-4">
          {/* Número da esquerda */}
          <div
            className={cn(
                "w-[23px] h-[23px] rounded flex items-center justify-center text-[10px] border ml-[-10px]",
              getNumberColor(leftNumber),
              getTextColor(leftNumber),
              isHighlighted(leftNumber) ? "bg-yellow-400 text-black" : 
              isSelectedNumber(leftNumber) ? "border-yellow-400 border-2" : "border-gray-600",
              getSpecialBorderClass(leftNumber),
              getSpecialSizeClass(leftNumber),
              getYellowBorderClass(leftNumber),
              getForceBlueClass(leftNumber)
            )}
            style={
              // Para números amarelos (padrão detectado ou forçado): sempre amarelo com borda original
              isHighlighted(leftNumber)
                ? { 
                    backgroundColor: '#fbbf24', // amarelo
                    color: 'black',
                    border: '1px solid #6b7280' // borda cinza original
                  }
              // Para padrão forçado: 30 números em amarelo, 2 base em azul
              : forcedPattern && betNumbers.includes(leftNumber) && !baseNumbers.includes(leftNumber)
                ? { 
                    backgroundColor: '#fbbf24', // amarelo
                    color: 'black',
                    border: '1px solid #6b7280' // borda cinza original
                  } 
                : (forcedPattern || isPatternActive) && baseNumbers.includes(leftNumber)
                ? { 
                    backgroundColor: '#3b82f6', // azul
                    color: 'white',
                    border: '1px solid #3b82f6'
                  }
                // Para padrão detectado: números base em azul, outros em amarelo
                : isPatternActive && !forcedPattern && baseNumbers.includes(leftNumber)
                ? { 
                    backgroundColor: '#3b82f6', // azul para números base
                    color: 'white',
                    border: '1px solid #3b82f6'
                  }
                : isPatternActive && !forcedPattern && betNumbers.includes(leftNumber) && !baseNumbers.includes(leftNumber)
                ? { 
                    backgroundColor: '#fbbf24', // amarelo para outros números
                    color: 'black',
                    border: '1px solid #f59e0b'
                  } 
                : undefined
            }
          >
            {leftNumber}
          </div>

          {/* Número da direita */}
          <div
            className={cn(
                "w-[23px] h-[23px] rounded flex items-center justify-center text-[10px] border mr-[-10px]",
              getNumberColor(rightNumber),
              getTextColor(rightNumber),
              isHighlighted(rightNumber) ? "bg-yellow-400 text-black" : 
              isSelectedNumber(rightNumber) ? "border-yellow-400 border-2" : "border-gray-600",
              getSpecialBorderClass(rightNumber),
              getSpecialSizeClass(rightNumber),
              getYellowBorderClass(rightNumber),
              getForceBlueClass(rightNumber)
            )}
            style={
              // Para números amarelos (padrão detectado ou forçado): sempre amarelo com borda original
              isHighlighted(rightNumber)
                ? { 
                    backgroundColor: '#fbbf24', // amarelo
                    color: 'black',
                    border: '1px solid #6b7280' // borda cinza original
                  }
              // Para padrão forçado: 30 números em amarelo, 2 base em azul
              : forcedPattern && betNumbers.includes(rightNumber) && !baseNumbers.includes(rightNumber)
                ? { 
                    backgroundColor: '#fbbf24', // amarelo
                    color: 'black',
                    border: '1px solid #6b7280' // borda cinza original
                  } 
                : (forcedPattern || isPatternActive) && baseNumbers.includes(rightNumber)
                ? { 
                    backgroundColor: '#3b82f6', // azul
                    color: 'white',
                    border: '1px solid #3b82f6'
                  }
                // Para padrão detectado: números base em azul, outros em amarelo
                : isPatternActive && !forcedPattern && baseNumbers.includes(rightNumber)
                ? { 
                    backgroundColor: '#3b82f6', // azul para números base
                    color: 'white',
                    border: '1px solid #3b82f6'
                  }
                : isPatternActive && !forcedPattern && betNumbers.includes(rightNumber) && !baseNumbers.includes(rightNumber)
                ? { 
                    backgroundColor: '#fbbf24', // amarelo para outros números
                    color: 'black',
                    border: '1px solid #f59e0b'
                  } 
                : undefined
            }
          >
            {rightNumber}
          </div>
        </div>

        {/* Linha inferior */}
        <div className="flex justify-center mb-[-90px]">
          <div className="flex gap-1">
            {bottomSequence.map((num, index) => (
              <div
                key={`bottom-${num}`}
                className={cn(
                "w-[23px] h-[23px] rounded flex items-center justify-center text-[10px] border",
                  getNumberColor(num),
                  getTextColor(num),
                  isHighlighted(num) ? "bg-yellow-400 text-black" : 
                  isSelectedNumber(num) ? "border-yellow-400 border-2" : "border-gray-600",
                  getSpecialBorderClass(num),
                  getSpecialSizeClass(num),
                  getYellowBorderClass(num),
                  getForceBlueClass(num)
                )}
                style={
                  // Para números amarelos (padrão detectado ou forçado): sempre amarelo com borda original
                  isHighlighted(num)
                    ? { 
                        backgroundColor: '#fbbf24', // amarelo
                        color: 'black',
                        border: '1px solid #6b7280' // borda cinza original
                      }
                  // Para padrão forçado: 30 números em amarelo, 2 base em azul
                  : forcedPattern && betNumbers.includes(num) && !baseNumbers.includes(num)
                    ? { 
                        backgroundColor: '#fbbf24', // amarelo
                        color: 'black',
                        border: '1px solid #6b7280' // borda cinza original
                      } 
                    : (forcedPattern || isPatternActive) && baseNumbers.includes(num)
                    ? { 
                        backgroundColor: '#3b82f6', // azul
                        color: 'white',
                        border: '1px solid #3b82f6'
                      }
                    // Para padrão detectado: números base em azul, outros em amarelo
                    : isPatternActive && !forcedPattern && baseNumbers.includes(num)
                    ? { 
                        backgroundColor: '#3b82f6', // azul para números base
                        color: 'white',
                        border: '1px solid #3b82f6'
                      }
                    : isPatternActive && !forcedPattern && betNumbers.includes(num) && !baseNumbers.includes(num)
                    ? { 
                        backgroundColor: '#fbbf24', // amarelo para outros números
                        color: 'black',
                        border: '1px solid #f59e0b'
                      } 
                    : undefined
                }
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceNumbersDisplay;