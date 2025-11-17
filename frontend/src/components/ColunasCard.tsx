import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const ColunasCard = ({ statistics, columnsPercentages, columnsLoss, lastNumbers, getNumberColumnSafe, columnsAbsences }) => {
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

  // Gerar sugestões de aposta
  const generateSuggestions = () => {
    const stats = calculateStats();
    
    // Encontrar as 2 colunas que mais saíram
    const columnEntries = Object.entries(stats.columns)
      .map(([col, count]) => ({ col: parseInt(col), count }))
      .sort((a, b) => b.count - a.count);
    
    const topColumns = columnEntries.slice(0, 2).map(item => item.col);

    // Cor que mais saiu
    const colorEntries = Object.entries(stats.colors)
      .filter(([color]) => color !== 'green') // Excluir verde (zero)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);
    
    const topColor = colorEntries[0]?.color || 'black';

    // Melhor de Alto/Baixo
    const bestHighLow = stats.highLow.high > stats.highLow.low ? 'Nºs Altos' : 'Nºs Baixos';
    
    // Melhor de Par/Ímpar
    const bestEvenOdd = stats.evenOdd.even > stats.evenOdd.odd ? 'Par' : 'Ímpar';

    // Encontrar o melhor campo geral (maior valor entre todos)
    const allFields = [
      { name: 'Coluna 1', value: stats.columns[1] },
      { name: 'Coluna 2', value: stats.columns[2] },
      { name: 'Coluna 3', value: stats.columns[3] },
      { name: 'Cor Preta', value: stats.colors.black },
      { name: 'Cor Vermelha', value: stats.colors.red },
      { name: 'Nºs Baixos', value: stats.highLow.low },
      { name: 'Nºs Altos', value: stats.highLow.high },
      { name: 'Par', value: stats.evenOdd.even },
      { name: 'Ímpar', value: stats.evenOdd.odd }
    ];
    
    const bestField = allFields.sort((a, b) => b.value - a.value)[0];

    return {
      stats,
      suggestions: {
        columns: topColumns,
        color: topColor === 'red' ? 'Vermelha' : 'Preta',
        colorRaw: topColor,
        bestHighLow,
        bestEvenOdd,
        bestField: bestField.name
      }
    };
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-2 lg:p-3 h-full min-h-24">
      <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2 flex justify-between items-center">
         <div className="flex items-center gap-1">
           <span>Colunas</span>
           <div title="Análise e Sugestões de Apostas">
             <Info 
               size={14} 
               className="text-blue-500 cursor-pointer hover:text-blue-700" 
               onClick={() => setShowPopup(true)}
             />
           </div>
         </div>
         <span className="text-[13px] lg:text-[15px] text-yellow-600 font-normal">LOSS: <span className="font-bold">{columnsLoss}</span></span>
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
        }].map((item) => (
          <div key={item.label} className="grid items-center gap-1" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
            {/* Coluna 1: Identificação da Coluna */}
            <div className="flex items-center gap-0.5 lg:gap-1">
              <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${item.color}`}></div>
              <span className="text-xs lg:text-xs text-gray-600">{item.label}</span>
            </div>
            
            {/* Coluna 2: Ausências (centralizada) */}
            <div className="text-center" style={{ marginLeft: '12px', marginRight: '12px' }}>
              <div 
                className="text-pink-400" 
                style={{ fontSize: '12px' }}
                title={`Ausências: ${item.absences.current} atual / ${item.absences.max} máxima consecutiva`}
              >
                {item.absences.current} / {item.absences.max}
              </div>
            </div>
            
            {/* Coluna 3: Total e Percentual (alinhada à direita) */}
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs lg:text-sm">{item.value}</div>
              <div className="text-xs lg:text-xs text-gray-500">{item.percentage}%</div>
            </div>
          </div>
        ))}
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

      {/* Popup de Análise e Sugestões - Portal para body */}
      {showPopup && createPortal(
        <div className="fixed inset-0 z-[9999]" style={{ top: 0, left: 0 }}>
          <div 
            className="fixed inset-0 bg-black bg-opacity-30" 
            onClick={() => setShowPopup(false)}
          />
          <div 
            className="fixed bg-gray-50 rounded-lg p-4 shadow-2xl"
            style={{ 
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100vw - 32px)',
              maxWidth: '1024px',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-800">Análise Estatística e Sugestões</h2>
              <button 
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {(() => {
              const { stats, suggestions } = generateSuggestions();
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lado Esquerdo - Estatísticas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-center">Estatísticas Atuais</h3>
                    
                    {/* Colunas */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-center mb-1">Colunas</h4>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">1</div>
                          <div>({stats.columns[1]})</div>
                        </div>
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">2</div>
                          <div>({stats.columns[2]})</div>
                        </div>
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">3</div>
                          <div>({stats.columns[3]})</div>
                        </div>
                      </div>
                    </div>

                    {/* Cores */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-center mb-1">Cores</h4>
                      <div className="grid grid-cols-2 gap-1 text-center">
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">Preta</div>
                          <div>({stats.colors.black})</div>
                        </div>
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">Vermelha</div>
                          <div>({stats.colors.red})</div>
                        </div>
                      </div>
                    </div>

                    {/* Nºs Baixos/Altos */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-center mb-1">Nºs Baixos/Altos</h4>
                      <div className="grid grid-cols-2 gap-1 text-center">
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">Baixos</div>
                          <div>({stats.highLow.low})</div>
                        </div>
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">Altos</div>
                          <div>({stats.highLow.high})</div>
                        </div>
                      </div>
                    </div>

                    {/* Nºs Par/Ímpar */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-center mb-1">Nºs Par/Ímpar</h4>
                      <div className="grid grid-cols-2 gap-1 text-center">
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">Par</div>
                          <div>({stats.evenOdd.even})</div>
                        </div>
                        <div className="border p-1 rounded text-sm">
                          <div className="font-bold">Ímpar</div>
                          <div>({stats.evenOdd.odd})</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito - Sugestões */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-center">Melhor Dica</h3>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="mb-2">
                        <span className="font-semibold">Colunas:</span>
                        <div className="text-lg font-bold text-blue-600">
                          {suggestions.columns.join(' e ')}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <span className="font-semibold">Cor:</span>
                        <div className="text-lg font-bold text-blue-600">
                          {suggestions.color}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="font-semibold">Alto/Baixo:</span>
                        <div className="text-lg font-bold text-green-600">
                          {suggestions.bestHighLow}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="font-semibold">Par/Ímpar:</span>
                        <div className="text-lg font-bold text-orange-600">
                          {suggestions.bestEvenOdd}
                        </div>
                      </div>

                      <div className="text-sm text-gray-900 mt-2 p-3 bg-yellow-100 rounded border border-yellow-300">
                        <div className="font-bold text-gray-900 mb-2">💡 Sugestão para as próximas 25 rodadas:</div>
                        <div className="text-gray-900 leading-relaxed">
                          Aposte nas colunas <span className="font-bold text-blue-700">{suggestions.columns.join(' e ')}</span>, 
                          priorizando números da cor <span className={`font-bold ${suggestions.colorRaw === 'red' ? 'text-red-600' : 'text-gray-800'}`}>{suggestions.color.toLowerCase()}</span> {' '}
                          que sejam <span className="font-bold text-green-600">{suggestions.bestHighLow.toLowerCase()}</span> {' '}
                          e <span className="font-bold text-orange-600">{suggestions.bestEvenOdd.toLowerCase()}</span>.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ColunasCard;
