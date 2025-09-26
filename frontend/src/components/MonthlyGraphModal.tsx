import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Registrar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyGraphModalProps {
  onClose: () => void;
}

interface BalanceRecord {
  data: string;
  saldo_inicial: number;
  saldo_atual: number;
  vlr_lucro: number;
  per_lucro: number;
  status?: string;
}

export const MonthlyGraphModal: React.FC<MonthlyGraphModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<BalanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      
      console.log('Buscando dados para:', { selectedMonth, selectedYear, startDate, endDate, userId: user.id });
      
      let query = supabase
        .from('r171_saldo')
        .select('*')
        .eq('id_senha', user.id);

      // Aplicar filtros de data
      if (startDate) {
        query = query.gte('data', startDate);
      }
      
      if (endDate) {
        query = query.lte('data', endDate);
      }

      query = query.order('data', { ascending: true });

      const { data: result, error } = await query;
      
      console.log('Resultado da consulta:', { result, error, count: result?.length });
      
      if (error) {
        console.error('Erro ao buscar dados:', error);
        setData([]);
      } else {
        console.log('Dados encontrados:', result);
        // Log detalhado de cada registro
        result?.forEach((record, index) => {
          console.log(`Registro ${index}: Data=${record.data}, Dia=${new Date(record.data + 'T00:00:00').getDate()}, Lucro=${record.vlr_lucro}`);
        });
        setData(result || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const chartData = {
    labels: data.map(record => {
      const date = new Date(record.data + 'T00:00:00');
      const day = date.getDate().toString();
      // Debug: console.log(`Chart Label - Data: ${record.data}, Dia: ${day}, Lucro: ${record.vlr_lucro}`);
      return day; // Apenas o número do dia
    }),
    datasets: [
      {
        label: 'Valor do Lucro (R$)',
        data: data.map(record => {
          // Debug: console.log(`Chart Data - Data: ${record.data}, Lucro: ${record.vlr_lucro}`);
          return record.vlr_lucro || 0;
        }),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: data.map(record => 
          (record.vlr_lucro || 0) > 0 ? '#10b981' : (record.vlr_lucro || 0) < 0 ? '#ef4444' : '#6b7280'
        ),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Remove a legenda
      },
      title: {
        display: true,
        text: `Gráfico de Lucros - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
        font: {
          size: 18,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const formatted = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value);
            return `Lucro: ${formatted}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            }).format(value as number);
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const handlePrint = () => {
    // Capturar o canvas do gráfico
    const chartCanvas = document.querySelector('canvas');
    let chartImageData = '';
    
    if (chartCanvas) {
      chartImageData = chartCanvas.toDataURL('image/png');
    }
    
    const printContent = `
      <html>
        <head>
          <title>Relatório de Lucros - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 8px; 
              padding: 8px;
              line-height: 1.2;
              font-size: 12px;
            }
            .header { text-align: center; margin-bottom: 15px; }
            .header h1 { font-size: 18px; margin: 0 0 5px 0; }
            .header h2 { font-size: 14px; margin: 0 0 5px 0; }
            .header p { font-size: 10px; margin: 0; }
            .summary { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 8px; 
              margin: 10px 0; 
            }
            .summary-item { 
              text-align: center; 
              padding: 6px; 
              border: 1px solid #ddd; 
              border-radius: 4px; 
              font-size: 11px;
            }
            .summary-item h3 { font-size: 11px; margin: 0 0 3px 0; }
            .summary-item p { margin: 0; font-size: 12px; }
            .values-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
              gap: 6px; 
              margin: 10px 0; 
            }
            .value-card { 
              padding: 6px; 
              border: 1px solid #ddd; 
              border-radius: 4px; 
              text-align: center; 
              font-size: 10px;
            }
            .positive { border-color: #3b82f6; background-color: #eff6ff; color: #1d4ed8; }
            .negative { border-color: #ef4444; background-color: #fef2f2; color: #dc2626; }
            .neutral { border-color: #6b7280; background-color: #f9fafb; color: #374151; }
            .day-title { font-size: 9px; color: #6b7280; margin-bottom: 2px; }
            .value { font-weight: bold; font-size: 10px; }
            .chart-container { 
              text-align: center; 
              margin: 10px 0; 
              padding: 8px; 
              border: 1px solid #ddd; 
              border-radius: 4px; 
            }
            .chart-container h3 { font-size: 14px; margin: 0 0 8px 0; }
            .chart-image { 
              max-width: 100%; 
              height: auto; 
              margin: 8px 0; 
              border: 1px solid #ddd; 
              border-radius: 4px; 
              max-height: 300px;
            }
            .visual-summary { 
              margin: 8px 0; 
              padding: 8px; 
              background-color: #f8f9fa; 
              border-radius: 4px; 
              font-size: 13px;
            }
            @media print { 
              body { margin: 8mm; padding: 4mm; font-size: 11px; } 
              .summary { grid-template-columns: repeat(3, 1fr); gap: 4px; }
              .summary-item { padding: 4px; font-size: 10px; }
              .values-grid { grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 4px; }
              .value-card { padding: 4px; font-size: 9px; }
              .chart-image { max-height: 280px; page-break-inside: avoid; }
              .chart-container { padding: 6px; }
              .header h1 { font-size: 16px; }
              .header h2 { font-size: 13px; }
              .header p { font-size: 9px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Relatório de Lucros</h1>
            <h2>${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}</h2>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <h3 style="color: ${totalLucro >= 0 ? '#2563eb' : '#dc2626'};">Total de Lucro</h3>
              <p><strong style="color: ${totalLucro >= 0 ? '#2563eb' : '#dc2626'};">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalLucro)}</strong></p>
            </div>
            <div class="summary-item">
              <h3 style="color: #2563eb;">Dias Positivos</h3>
              <p><strong style="color: #2563eb;">${lucroPositivo}</strong></p>
            </div>
            <div class="summary-item">
              <h3 style="color: #dc2626;">Dias Negativos</h3>
              <p><strong style="color: #dc2626;">${lucroNegativo}</strong></p>
            </div>
            <div class="summary-item">
              <h3>Total de Dias</h3>
              <p><strong>${data.length}</strong></p>
            </div>
            <div class="summary-item">
              <h3 style="color: ${saldoInicial >= 0 ? '#2563eb' : '#dc2626'};">Saldo Inicial</h3>
              <p><strong style="color: ${saldoInicial >= 0 ? '#2563eb' : '#dc2626'};">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoInicial)}</strong></p>
            </div>
            <div class="summary-item">
              <h3 style="color: ${saldoAtual >= 0 ? '#2563eb' : '#dc2626'};">Saldo Atual</h3>
              <p><strong style="color: ${saldoAtual >= 0 ? '#2563eb' : '#dc2626'};">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoAtual)}</strong></p>
            </div>
          </div>
          
          <div class="chart-container">
            <h3>Gráfico de Lucros</h3>
            ${chartImageData ? `<img src="${chartImageData}" alt="Gráfico de Lucros" class="chart-image" />` : '<p><em>Gráfico não disponível para impressão.</em></p>'}
            <div class="visual-summary">
              <strong>Resumo Visual:</strong> 
              Período: ${data.length > 0 ? `${String(new Date(data[0].data + 'T00:00:00').getDate()).padStart(2, '0')} a ${String(new Date(data[data.length - 1].data + 'T00:00:00').getDate()).padStart(2, '0')}` : 'N/A'} | 
              Maior Lucro: ${data.length > 0 ? `<span style="color: ${Math.max(...data.map(r => r.vlr_lucro || 0)) >= 0 ? '#2563eb' : '#dc2626'};">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(...data.map(r => r.vlr_lucro || 0)))}</span>` : 'N/A'} | 
              Menor Lucro: ${data.length > 0 ? `<span style="color: ${Math.min(...data.map(r => r.vlr_lucro || 0)) >= 0 ? '#2563eb' : '#dc2626'};">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.min(...data.map(r => r.vlr_lucro || 0)))}</span>` : 'N/A'}
            </div>
          </div>
          
          <h3>Valores de Lucro por Dia:</h3>
          <div class="values-grid">
            ${data.map(record => {
              const value = record.vlr_lucro || 0;
              const isPositive = value > 0;
              const isNegative = value < 0;
              const className = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
              const dateObj = new Date(record.data + 'T00:00:00');
              const day = String(dateObj.getDate()).padStart(2, '0');
              const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
              const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
              const formattedValue = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(Math.abs(value));
              
              return `
                <div class="value-card ${className}">
                  <div class="day-title">Dia ${day} - ${dayNameCapitalized}</div>
                  <div class="value">${isNegative ? '-' : ''}${formattedValue}</div>
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const totalLucro = data.reduce((sum, record) => sum + (record.vlr_lucro || 0), 0);
  const lucroPositivo = data.filter(record => (record.vlr_lucro || 0) > 0).length;
  const lucroNegativo = data.filter(record => (record.vlr_lucro || 0) < 0).length;
  
  // Calcular saldo inicial e atual
  const saldoInicial = data.length > 0 ? data[0].saldo_inicial : 0;
  const saldoAtual = data.length > 0 ? data[data.length - 1].saldo_atual : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">📊 Gráfico Mensal de Lucros</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Imprimir Relatório"
            >
              🖨️
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Fechar"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 pb-8">{/* Aumentei o padding bottom */}
          <div className="flex justify-between items-center mb-6">
            {/* Seletores de Mês e Ano */}
            <div className="flex gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Mês</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Ano</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estatísticas na mesma linha */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className={`text-lg font-bold ${totalLucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalLucro)}
                </div>
                <div className="text-xs text-gray-600">Lucro Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{lucroPositivo}</div>
                <div className="text-xs text-gray-600">Dias com Lucro</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{lucroNegativo}</div>
                <div className="text-xs text-gray-600">Dias com Prejuízo</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${saldoInicial >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(saldoInicial)}
                </div>
                <div className="text-xs text-gray-600">Saldo Inicial</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${saldoAtual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(saldoAtual)}
                </div>
                <div className="text-xs text-gray-600">Saldo Atual</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-lg text-gray-600">Carregando dados...</div>
            </div>
          ) : data.length > 0 ? (
            <div className="space-y-6">
              {/* Gráfico */}
              <div className="h-80 relative mt-2.5">
                <Line data={chartData} options={chartOptions} />
              </div>
              
              {/* Valores próximos aos pontos - SEMPRE VISÍVEL */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Valores de Lucro por Dia:</h3>
                <div className="grid grid-cols-6 gap-3">
                  {data.map((record, index) => {
                    const value = record.vlr_lucro || 0;
                    const isPositive = value > 0;
                    const isNegative = value < 0;
                    const color = isPositive ? 'text-blue-600' : isNegative ? 'text-red-600' : 'text-gray-600';
                    const bgColor = isPositive ? 'bg-blue-50' : isNegative ? 'bg-red-50' : 'bg-gray-50';
                    const borderColor = isPositive ? 'border-blue-200' : isNegative ? 'border-red-200' : 'border-gray-200';
                    const formattedValue = new Intl.NumberFormat('pt-BR', {
                       style: 'currency',
                       currency: 'BRL',
                       minimumFractionDigits: 2,
                       maximumFractionDigits: 2
                     }).format(Math.abs(value));
                    
                    // Processamento correto da data
                    const dateObj = new Date(record.data + 'T00:00:00'); // Força timezone local
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                    const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                     
                     // Debug temporário
                     // console.log(`Seção Valores - Index ${index}: Data=${record.data}, Dia=${day}, Lucro=${value}, Formatted=${formattedValue}`);
                     
                     return (
                       <div key={`${record.data}-${index}`} className="text-center">
                         <div className={`${color} ${bgColor} ${borderColor} px-3 py-2 rounded-lg shadow-sm border-2 font-bold text-xs`}>
                           <div className="text-gray-500 text-xs mb-1">Dia {day} - {dayNameCapitalized}</div>
                           <div>{isNegative ? '-' : ''}{formattedValue}</div>
                         </div>
                       </div>
                     );
                  })}
                </div>
              </div>
              
              {/* Números dos dias abaixo do gráfico */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dias do Mês:</h3>
                <div className="flex justify-between px-4">
                  {data.map((record, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg font-bold text-gray-800 bg-gray-100 px-3 py-2 rounded-lg border shadow-sm">
                        {String(new Date(record.data + 'T00:00:00').getDate()).padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-96">
              <div className="text-lg text-gray-600">
                Nenhum dado encontrado para {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};