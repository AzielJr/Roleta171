import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const ColunasCard = ({ statistics, columnsPercentages, columnsLoss, lastNumbers, getNumberColumnSafe, columnsAbsences, columnSequenceCount = null, columnSequences = new Map() }) => {
  const [showPopup, setShowPopup] = useState(false);

  // Função para determinar a cor de um número
  const getNumberColor = (num) => {
    if (num === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  // Calcular estatísticas baseadas nos últimos números
  const calculateStats = () => {
    if (!lastNumbers || lastNumbers.length === 0) {
      return {
        columns: { 1: 0, 2: 0, 3: 0 },
        colors: { red: 0, black: 0, green: 0 },
        highLow: { high: 0, low: 0 },
        evenOdd: { even: 0, odd: 0 }
      };
    }

    const stats = {
      columns: { 1: 0, 2: 0, 3: 0 },
      colors: { red: 0, black: 0, green: 0 },
      highLow: { high: 0, low: 0 },
      evenOdd: { even: 0, odd: 0 }
    };

    lastNumbers.forEach(num => {
      // Colunas
      const col = getNumberColumnSafe(num);
      if (col) stats.columns[col]++;

      // Cores
      const color = getNumberColor(num);
      stats.colors[color]++;

      // Alto/Baixo (0 não conta)
      if (num >= 1 && num <= 18) stats.highLow.low++;
      else if (num >= 19 && num <= 36) stats.highLow.high++;

      // Par/Ímpar (0 não conta)
      if (num !== 0) {
        if (num % 2 === 0) stats.evenOdd.even++;
        else stats.evenOdd.odd++;
      }
    });

    return stats;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24">
      <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2 flex justify-between items-center">
         <div className="flex items-center gap-1">
           <span>Colunas</span>
           <div title="Como funciona este card?">
             <Info 
               size={14} 
               className="text-blue-500 cursor-pointer hover:text-blue-700" 
               onClick={() => setShowPopup(true)}
             />
           </div>
         </div>
       </h3>
      <div className="space-y-0.5 lg:space-y-1">
        {[{
          label: '3ª Coluna',
          value: statistics.columns.third,
          percentage: columnsPercentages.third,
          color: 'bg-blue-600',
          columnIndex: 3,
          absences: columnsAbsences.third
        }, {
          label: '2ª Coluna',
          value: statistics.columns.second,
          percentage: columnsPercentages.second,
          color: 'bg-green-600',
          columnIndex: 2,
          absences: columnsAbsences.second
        }, {
          label: '1ª Coluna',
          value: statistics.columns.first,
          percentage: columnsPercentages.first,
          color: 'bg-yellow-600',
          columnIndex: 1,
          absences: columnsAbsences.first
        }].map((item) => {
          const sequences = columnSequences.get(item.columnIndex) || { current: 0, max: 0 };
          const hasSequence = sequences.current >= 3;
          
          return (
          <div key={item.label} className="grid items-center gap-1" style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr' }}>
            {/* Coluna 1: Identificação da Coluna */}
            <div className="flex items-center gap-0.5 lg:gap-1">
              <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${item.color}`}></div>
              <span className={`text-xs lg:text-xs text-gray-600 ${hasSequence ? 'border border-yellow-400 px-1 rounded' : ''}`}>
                {item.label}
              </span>
            </div>
            
            {/* Coluna 2: Sequências Consecutivas (atual / máxima) */}
            <div className="text-center" style={{ marginLeft: '8px', marginRight: '8px' }}>
              <div 
                className={hasSequence ? 'text-red-600 font-bold animate-pulse' : 'text-pink-400'} 
                style={{ fontSize: hasSequence ? '14px' : '12px' }}
                title={`Sequência: ${sequences.current} atual / ${sequences.max} máxima consecutiva`}
              >
                {sequences.current} / {sequences.max}
              </div>
            </div>
            
            {/* Coluna 3: Total e Percentual (alinhada à direita) */}
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{item.value}</div>
              {(() => {
                const total = (statistics.columns.first || 0) + (statistics.columns.second || 0) + (statistics.columns.third || 0);
                const computed = total > 0 ? Math.round(((item.value || 0) / total) * 100) : 0;
                const provided = Number(item.percentage) || 0;
                const display = ((provided === 0) && (item.value || 0) > 0 && total > 0) ? computed : provided;
                return <div className="text-xs lg:text-xs text-yellow-400 font-semibold">{display}%</div>;
              })()}
            </div>
          </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex overflow-x-auto ranking-scroll pr-1">
          <div className="flex" style={{ minWidth: 'max-content' }}>
            {lastNumbers
              .slice()
              .reverse()
              .map((num, index) => {
                const col = getNumberColumnSafe(num);
                if (col === null) return null;
                const columnTextColors = {
                  1: 'text-yellow-600',
                  2: 'text-green-600',
                  3: 'text-blue-600'
                };
                return (
                  <span
                    key={`${num}-${index}`}
                    className={`font-bold text-sm whitespace-nowrap ${columnTextColors[col]}`}
                    style={{ marginRight: '5px' }}
                  >
                    {col}
                  </span>
                );
              })
              .filter(Boolean)}
          </div>
        </div>
      </div>

      {/* Popup de Explicação - Portal para body */}
      {showPopup && createPortal(
        <div className="fixed inset-0 z-[9999]" style={{ top: 0, left: 0 }}>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowPopup(false)}
          />
          <div 
            className="fixed bg-white rounded-xl p-6 shadow-2xl border-2 border-blue-200"
            style={{ 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100vw - 32px)',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-blue-100">
              <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <Info size={28} className="text-blue-500" />
                Como Funciona o Card de Colunas
              </h2>
              <button 
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Conteúdo */}
            <div className="space-y-4 text-gray-700">
              {/* Seção 1: Linhas Principais */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-lg text-blue-700 mb-3 flex items-center gap-2">
                  📊 Linhas Principais (3 Colunas)
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">• Identificação:</span> Nome da coluna com bolinha colorida (1ª, 2ª ou 3ª Coluna)</p>
                  <p><span className="font-semibold">• Campo do Meio:</span> <code className="bg-white px-2 py-1 rounded border">ATUAL / MÁXIMA</code></p>
                  <div className="ml-6 mt-1 space-y-1">
                    <p className="text-xs">→ <span className="font-semibold">ATUAL:</span> Quantos números seguidos saíram na mesma coluna agora</p>
                    <p className="text-xs">→ <span className="font-semibold">MÁXIMA:</span> Maior sequência consecutiva já registrada (últimos 60 números)</p>
                    <p className="text-xs">→ <span className="font-semibold text-red-600">Vermelho pulsante:</span> Quando ATUAL ≥ 3 (alerta de sequência!)</p>
                    <p className="text-xs">→ <span className="font-semibold text-pink-500">Rosa claro:</span> Quando ATUAL &lt; 3 (normal)</p>
                  </div>
                  <p><span className="font-semibold">• Lado Direito:</span> Total de números sorteados nessa coluna e percentual</p>
                </div>
              </div>

              {/* Seção 2: Lista no Footer */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-bold text-lg text-green-700 mb-3 flex items-center gap-2">
                  📜 Lista no Rodapé (Footer)
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">• Exibição:</span> Mostra os últimos números sorteados em ordem reversa (mais recente primeiro)</p>
                  <p><span className="font-semibold">• Cores:</span></p>
                  <div className="ml-6 space-y-1">
                    <p className="text-xs">→ <span className="font-semibold text-yellow-600">Amarelo:</span> 1ª Coluna</p>
                    <p className="text-xs">→ <span className="font-semibold text-green-600">Verde:</span> 2ª Coluna</p>
                    <p className="text-xs">→ <span className="font-semibold text-blue-600">Azul:</span> 3ª Coluna</p>
                  </div>
                  <p><span className="font-semibold">• Formato:</span> Apenas o número da coluna (1, 2 ou 3), não o número sorteado</p>
                </div>
              </div>

              {/* Seção 3: Exemplo Prático */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-bold text-lg text-purple-700 mb-3 flex items-center gap-2">
                  💡 Exemplo Prático
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Números sorteados: 7, 10, 4, 22, 25</p>
                  <div className="bg-white p-3 rounded border mt-2">
                    <p className="text-xs mb-1"><span className="font-semibold">1ª Coluna:</span> <code className="bg-gray-100 px-2 py-1 rounded">3 / 3</code> ← 3 seguidos (7,10,4), máximo 3</p>
                    <p className="text-xs mb-1"><span className="font-semibold">2ª Coluna:</span> <code className="bg-gray-100 px-2 py-1 rounded">1 / 1</code> ← Atual: 1 (só o 22)</p>
                    <p className="text-xs"><span className="font-semibold">3ª Coluna:</span> <code className="bg-gray-100 px-2 py-1 rounded">1 / 1</code> ← Atual: 1 (só o 25)</p>
                  </div>
                  <p className="text-xs mt-2"><span className="font-semibold">Lista no rodapé:</span> <span className="text-blue-600 font-bold">3</span> <span className="text-green-600 font-bold">2</span> <span className="text-yellow-600 font-bold">1 1 1</span></p>
                </div>
              </div>

              {/* Nota sobre Dúzias */}
              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  ℹ️ <span>O card de <span className="text-yellow-900">Dúzias</span> funciona exatamente da mesma forma, mas com 3 dúzias (1ª, 2ª, 3ª) ao invés de colunas.</span>
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ColunasCard;
