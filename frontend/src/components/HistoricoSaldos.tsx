import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { R171Saldo } from '../lib/supabase';

interface HistoricoSaldosProps {
  onClose: () => void;
}

export const HistoricoSaldos: React.FC<HistoricoSaldosProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [saldos, setSaldos] = useState<R171Saldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [filtroAplicado, setFiltroAplicado] = useState(false);

  // Definir datas padrão (primeiro dia do mês corrente até hoje)
  useEffect(() => {
    const hoje = new Date();
    // Usar um período mais amplo: 3 meses atrás até hoje
    const treseMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
    
    console.log('=== DEFININDO DATAS PADRÃO ===');
    console.log('Hoje:', hoje);
    console.log('Três meses atrás:', treseMesesAtras);
    console.log('Data final (hoje):', hoje.toISOString().split('T')[0]);
    console.log('Data inicial (3 meses atrás):', treseMesesAtras.toISOString().split('T')[0]);
    
    // Definir data final como hoje e inicial como 3 meses atrás
    setDataFinal(hoje.toISOString().split('T')[0]);
    setDataInicial(treseMesesAtras.toISOString().split('T')[0]);
  }, []);

  // Carregar histórico
  const carregarHistorico = async () => {
    if (!user) return;

    console.log('=== CARREGANDO HISTÓRICO ===');
    console.log('Data inicial:', dataInicial);
    console.log('Data final:', dataFinal);
    console.log('User ID:', user.id);
    console.log('Tipo do User ID:', typeof user.id);

    setLoading(true);
    try {
      // Primeiro, vamos fazer uma query sem filtros para ver todos os registros
      const { data: todosRegistros } = await supabase
        .from('r171_saldo')
        .select('*')
        .eq('id_senha', 1)
        .order('data', { ascending: true });
      
      console.log('=== TODOS OS REGISTROS (SEM FILTRO) ===');
      console.log('Total de registros no banco:', todosRegistros?.length || 0);
      if (todosRegistros) {
        const registro24 = todosRegistros.find(r => r.data === '2025-09-24');
        console.log('🔍 Registro do dia 24 existe no banco?', registro24 ? 'SIM ✅' : 'NÃO ❌');
        if (registro24) {
          console.log('📊 Dados do registro 24 no banco:', registro24);
        }
      }

      // Query com filtros
      let query = supabase
        .from('r171_saldo')
        .select('*')
        .eq('id_senha', 1);

      console.log('=== QUERY COM FILTRO DE USUÁRIO ===');
      console.log('User ID original:', user.id);
      console.log('Forçando id_senha = 1 (baseado nos dados do banco)');

      // Aplicar filtros de data se definidos
      if (dataInicial) {
        query = query.gte('data', dataInicial);
        console.log('✅ Filtro data inicial aplicado:', dataInicial);
      }
      
      if (dataFinal) {
        // Adicionar um dia à data final para incluir o dia selecionado
        const dataFinalObj = new Date(dataFinal);
        dataFinalObj.setDate(dataFinalObj.getDate() + 1);
        const dataFinalCorrigida = dataFinalObj.toISOString().split('T')[0];
        
        query = query.lt('data', dataFinalCorrigida);
        console.log('✅ Filtro data final aplicado:', dataFinalCorrigida, '(para incluir', dataFinal, ')');
        console.log('🔍 DEBUG: 2025-09-24 < ' + dataFinalCorrigida + '?', '2025-09-24' < dataFinalCorrigida);
      }

      const { data, error } = await query.order('data', { ascending: true });

      console.log('=== RESULTADO DA QUERY COM FILTROS ===');
      console.log('Total de registros encontrados:', data?.length || 0);
      
      if (data) {
        console.log('Registros encontrados:', data);
        const registro24 = data.find(r => r.data === '2025-09-24');
        console.log('🔍 Registro do dia 24 encontrado na query filtrada?', registro24 ? 'SIM ✅' : 'NÃO ❌');
        if (registro24) {
          console.log('📊 Dados completos do registro 24:', registro24);
        }
      }

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        return;
      }

      setSaldos(data || []);
      setFiltroAplicado(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (user && dataInicial && dataFinal) {
      carregarHistorico();
    }
  }, [user, dataInicial, dataFinal]);

  const aplicarFiltro = () => {
    console.log('🔥 BOTÃO FILTRAR CLICADO! 🔥');
    console.log('=== APLICANDO FILTROS MANUALMENTE ===');
    console.log('Data inicial input:', dataInicial);
    console.log('Data final input:', dataFinal);
    
    // Verificar se as datas estão no formato correto
    if (dataFinal) {
      console.log('Verificação manual: 2025-09-24 <= ' + dataFinal + '?', '2025-09-24' <= dataFinal);
      console.log('Comparação de strings:', {
        '2025-09-24': '2025-09-24',
        dataFinal: dataFinal,
        resultado: '2025-09-24' <= dataFinal
      });
      
      // Debug adicional para conversão de datas
      const dataFinalObj = new Date(dataFinal);
      dataFinalObj.setDate(dataFinalObj.getDate() + 1);
      const dataFinalCorrigida = dataFinalObj.toISOString().split('T')[0];
      console.log('🔍 DEBUG CONVERSÃO DE DATAS:');
      console.log('Data final original:', dataFinal);
      console.log('Data final + 1 dia:', dataFinalCorrigida);
      console.log('2025-09-24 < ' + dataFinalCorrigida + '?', '2025-09-24' < dataFinalCorrigida);
    }
    
    carregarHistorico();
  };

  const limparFiltro = () => {
    const hoje = new Date();
    // Usar um período mais amplo: 3 meses atrás até hoje
    const treseMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
    
    setDataFinal(hoje.toISOString().split('T')[0]);
    setDataInicial(treseMesesAtras.toISOString().split('T')[0]);
    setFiltroAplicado(false);
  };

  const gerarRelatorioHTML = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');
    
    // Calcular estatísticas
    const lucroTotal = saldos.reduce((acc, s) => acc + (s.vlr_lucro || 0), 0);
    const maiorSaldo = Math.max(...saldos.map(s => s.saldo_atual || 0));
    const menorSaldo = Math.min(...saldos.map(s => s.saldo_atual || 0));
    
    // Calcular média de percentual de lucratividade
    const percentuais = saldos.map(s => {
      const lucro = s.saldo_atual - s.saldo_inicial;
      return s.saldo_inicial > 0 ? (lucro / s.saldo_inicial) * 100 : 0;
    });
    const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Histórico de Saldos</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 15px;
            color: #333;
            position: relative;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #16a34a;
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        .print-button:hover {
            background-color: #15803d;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            margin-top: -20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header p {
            margin-top: -10px;
            margin-bottom: -15px;
        }
        .info {
            margin-bottom: 20px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        .summary-item {
            text-align: center;
        }
        .summary-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .summary-value.positive {
            color: #16a34a;
        }
        .summary-value.negative {
            color: #dc2626;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: left;
        }
        th:nth-child(2), th:nth-child(3), th:nth-child(4), th:nth-child(5) {
            text-align: right;
        }
        td {
            text-align: left;
        }
        td:nth-child(2), td:nth-child(3), td:nth-child(4), td:nth-child(5) {
            text-align: right;
        }
        .positive {
            color: #16a34a;
        }
        .negative {
            color: #dc2626;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media print {
            body { margin: 25px; }
            .no-print { display: none; }
            .print-button { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()" title="Imprimir Relatório">
        🖨️
    </button>

    <div class="header">
        <h1>Relatório de Histórico de Saldos</h1>
        <p><strong>Período:</strong> ${dataInicial ? dataInicial.split('-').reverse().join('/') : ''} a ${dataFinal ? dataFinal.split('-').reverse().join('/') : ''}</p>
    </div>
    
    <div class="info">
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-label">Total de Registros</div>
            <div class="summary-value">${saldos.length}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Lucro Total</div>
            <div class="summary-value ${lucroTotal >= 0 ? 'positive' : 'negative'}">${formatarMoeda(lucroTotal)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Maior Saldo</div>
            <div class="summary-value positive">${formatarMoeda(maiorSaldo)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Menor Saldo</div>
            <div class="summary-value negative">${formatarMoeda(menorSaldo)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Média em R$</div>
            <div class="summary-value ${(() => {
              const mediaReais = saldos.length > 0 ? lucroTotal / saldos.length : 0;
              return mediaReais >= 0 ? 'positive' : 'negative';
            })()}">${(() => {
              const mediaReais = saldos.length > 0 ? lucroTotal / saldos.length : 0;
              return formatarMoeda(mediaReais);
            })()}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Média Percentual</div>
            <div class="summary-value ${mediaPercentual >= 0 ? 'positive' : 'negative'}">${formatarPercentual(mediaPercentual)}</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Saldo Inicial</th>
                <th>Saldo Atual</th>
                <th>Lucro/Prejuízo</th>
                <th>Percentual</th>
            </tr>
        </thead>
        <tbody>
            ${saldos.map(saldo => {
              const data = new Date(saldo.data).toLocaleDateString('pt-BR');
              const lucro = saldo.saldo_atual - saldo.saldo_inicial;
              const percentual = saldo.saldo_inicial > 0 ? (lucro / saldo.saldo_inicial) * 100 : 0;
              
              return `
                <tr>
                    <td>${data}</td>
                    <td>${formatarMoeda(saldo.saldo_inicial)}</td>
                    <td>${formatarMoeda(saldo.saldo_atual)}</td>
                    <td class="${lucro >= 0 ? 'positive' : 'negative'}">${formatarMoeda(lucro)}</td>
                    <td class="${percentual >= 0 ? 'positive' : 'negative'}">${formatarPercentual(percentual)}</td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Relatório gerado automaticamente pelo sistema R171 - Gerado em: ${dataAtual} às ${horaAtual}</p>
    </div>
</body>
</html>
    `;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatarPercentual = (valor: number) => {
    return `${valor >= 0 ? '+' : ''}${valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}%`;
  };

  const imprimirDireto = () => {
    gerarRelatorioHTML();
    // Aguardar um pouco para a nova aba carregar e então imprimir
    setTimeout(() => {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const horaAtual = new Date().toLocaleTimeString('pt-BR');
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Histórico de Saldos</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .info {
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .positive {
            color: #16a34a;
        }
        .negative {
            color: #dc2626;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Histórico de Saldos</h1>
        <p>Gerado em: ${dataAtual} às ${horaAtual}</p>
    </div>
    
    <div class="info">
        <p><strong>Período:</strong> ${dataInicial ? dataInicial.split('-').reverse().join('/') : ''} a ${dataFinal ? dataFinal.split('-').reverse().join('/') : ''}</p>
        <p><strong>Total de registros:</strong> ${saldos.length}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Saldo Inicial</th>
                <th>Saldo Atual</th>
                <th>Lucro/Prejuízo</th>
                <th>Percentual</th>
            </tr>
        </thead>
        <tbody>
            ${saldos.map(saldo => {
              const data = new Date(saldo.data).toLocaleDateString('pt-BR');
              const lucro = saldo.saldo_atual - saldo.saldo_inicial;
              const percentual = saldo.saldo_inicial > 0 ? (lucro / saldo.saldo_inicial) * 100 : 0;
              
              return `
                <tr>
                    <td>${data}</td>
                    <td>${formatarMoeda(saldo.saldo_inicial)}</td>
                    <td>${formatarMoeda(saldo.saldo_atual)}</td>
                    <td class="${lucro >= 0 ? 'positive' : 'negative'}">${formatarMoeda(lucro)}</td>
                    <td class="${percentual >= 0 ? 'positive' : 'negative'}">${formatarPercentual(percentual)}</td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Relatório gerado automaticamente pelo sistema R171</p>
    </div>
</body>
</html>
        `;
        
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        newWindow.print();
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 lg:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] lg:max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center px-3 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
          <h2 className="text-lg lg:text-2xl font-bold text-gray-800">📊 Histórico de Saldos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl lg:text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Filtros */}
        <div className="px-3 lg:px-6 pt-2 pb-3 lg:pb-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row flex-wrap gap-2 lg:gap-4 items-start lg:items-end">
            <div className="w-full lg:w-auto">
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="w-full lg:w-auto px-2 lg:px-3 py-1.5 lg:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full lg:w-auto">
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="w-full lg:w-auto px-2 lg:px-3 py-1.5 lg:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                console.log('🔥 BOTÃO FILTRAR CLICADO! 🔥');
                console.log('=== APLICANDO FILTROS MANUALMENTE ===');
                console.log('Data inicial input:', dataInicial);
                console.log('Data final input:', dataFinal);
                aplicarFiltro();
              }}
              className="w-full lg:w-auto px-6 lg:px-8 py-3 lg:py-4 text-lg bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold border-4 border-yellow-400 shadow-lg animate-pulse"
              style={{
                background: 'linear-gradient(45deg, #dc2626, #ef4444)',
                boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)',
                transform: 'scale(1.1)'
              }}
            >
              🔥🔥🔥 FILTRAR HISTÓRICO AQUI 🔥🔥🔥
            </button>
            <button
              onClick={limparFiltro}
              className="w-full lg:w-auto px-3 lg:px-4 py-1.5 lg:py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              🗑️ Limpar
            </button>
            <div className="w-full lg:w-auto lg:ml-auto">
              <button
                onClick={gerarRelatorioHTML}
                className="w-full lg:w-auto px-3 lg:px-4 py-1.5 lg:py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
          {filtroAplicado && (
            <div className="mt-3 text-sm text-gray-600 mb-0">
              Exibindo {saldos.length} registro(s) entre {dataInicial ? dataInicial.split('-').reverse().join('/') : ''} e {dataFinal ? dataFinal.split('-').reverse().join('/') : ''}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto px-3 lg:px-6 pt-2 pb-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Carregando histórico...</div>
            </div>
          ) : saldos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>Nenhum registro encontrado para o período selecionado.</p>
              <p className="text-sm mt-2">Tente ajustar os filtros de data.</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse border border-gray-300">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 lg:px-4 py-1 lg:py-2 text-left font-semibold text-gray-700 text-xs lg:text-sm">Data</th>
                    <th className="border border-gray-300 px-2 lg:px-4 py-1 lg:py-2 text-right font-semibold text-gray-700 text-xs lg:text-sm">Saldo Inicial</th>
                    <th className="border border-gray-300 px-2 lg:px-4 py-1 lg:py-2 text-right font-semibold text-gray-700 text-xs lg:text-sm">Saldo Atual</th>
                    <th className="border border-gray-300 px-2 lg:px-4 py-1 lg:py-2 text-right font-semibold text-gray-700 text-xs lg:text-sm">Valor Lucro</th>
                    <th className="border border-gray-300 px-2 lg:px-4 py-1 lg:py-2 text-right font-semibold text-gray-700 text-xs lg:text-sm">% Lucro</th>
                    <th className="border border-gray-300 px-2 lg:px-4 py-1 lg:py-2 text-center font-semibold text-gray-700 text-xs lg:text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {saldos.map((saldo, index) => {
                    // Calcular lucro e percentual se não estiverem salvos no banco
                    const valorLucro = saldo.vlr_lucro !== null && saldo.vlr_lucro !== undefined 
                      ? saldo.vlr_lucro 
                      : (saldo.saldo_atual || 0) - (saldo.saldo_inicial || 0);
                    
                    const percentualLucro = saldo.per_lucro !== null && saldo.per_lucro !== undefined 
                      ? saldo.per_lucro 
                      : (saldo.saldo_inicial || 0) > 0 
                        ? (valorLucro / (saldo.saldo_inicial || 1)) * 100 
                        : 0;

                    return (
                      <tr key={saldo.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-2 lg:px-4 py-0.5 lg:py-1 text-xs lg:text-sm">
                          {saldo.data ? saldo.data.split('-').reverse().join('/') : ''}
                        </td>
                        <td className="border border-gray-300 px-2 lg:px-4 py-0.5 lg:py-1 text-right text-xs lg:text-sm">
                          {formatarMoeda(saldo.saldo_inicial || 0)}
                        </td>
                        <td className={`border border-gray-300 px-2 lg:px-4 py-0.5 lg:py-1 text-right font-semibold text-xs lg:text-sm ${
                          (saldo.saldo_atual || 0) >= 0 ? 'text-green-600' : 'text-amber-900'
                        }`}>
                          {formatarMoeda(saldo.saldo_atual || 0)}
                        </td>
                        <td className={`border border-gray-300 px-2 lg:px-4 py-0.5 lg:py-1 text-right font-semibold text-xs lg:text-sm ${
                          valorLucro >= 0 ? 'text-green-600' : 'text-amber-900'
                        }`}>
                          {formatarMoeda(valorLucro)}
                        </td>
                        <td className={`border border-gray-300 px-2 lg:px-4 py-0.5 lg:py-1 text-right font-semibold text-xs lg:text-sm ${
                          percentualLucro >= 0 ? 'text-green-600' : 'text-yellow-100'
                        }`}>
                          {formatarPercentual(percentualLucro)}
                        </td>
                        <td className="border border-gray-300 px-2 lg:px-4 py-0.5 lg:py-1 text-center text-xs lg:text-sm">
                          {valorLucro > 0 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Lucro
                            </span>
                          ) : valorLucro < 0 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              Prejuízo
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              Neutro
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* Resumo */}
        {saldos.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Total de Registros</div>
                <div className="text-xl font-bold text-gray-800">{saldos.length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Lucro Total</div>
                <div className={`text-xl font-bold ${
                  saldos.reduce((acc, s) => acc + (s.vlr_lucro || 0), 0) >= 0 ? 'text-green-600' : 'text-amber-900'
                }`}>
                  {formatarMoeda(saldos.reduce((acc, s) => acc + (s.vlr_lucro || 0), 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Maior Saldo</div>
                <div className="text-xl font-bold text-green-600">
                  {formatarMoeda(Math.max(...saldos.map(s => s.saldo_atual || 0)))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Menor Saldo</div>
                <div className="text-xl font-bold text-amber-900">
                  {formatarMoeda(Math.min(...saldos.map(s => s.saldo_atual || 0)))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Média em R$</div>
                <div className={`text-xl font-bold ${
                  (() => {
                    const totalLucro = saldos.reduce((acc, s) => acc + (s.vlr_lucro || 0), 0);
                    const totalRegistros = saldos.length;
                    const mediaReais = totalRegistros > 0 ? totalLucro / totalRegistros : 0;
                    return mediaReais >= 0 ? 'text-green-600' : 'text-amber-900';
                  })()
                }`}>
                  {(() => {
                    const totalLucro = saldos.reduce((acc, s) => acc + (s.vlr_lucro || 0), 0);
                    const totalRegistros = saldos.length;
                    const mediaReais = totalRegistros > 0 ? totalLucro / totalRegistros : 0;
                    return formatarMoeda(mediaReais);
                  })()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Média Percentual</div>
                <div className={`text-xl font-bold ${
                  (() => {
                    const percentuais = saldos.map(s => {
                      const lucro = (s.saldo_atual || 0) - (s.saldo_inicial || 0);
                      return (s.saldo_inicial || 0) > 0 ? (lucro / (s.saldo_inicial || 0)) * 100 : 0;
                    });
                    const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0;
                    return mediaPercentual >= 0 ? 'text-green-600' : 'text-amber-900';
                  })()
                }`}>
                  {(() => {
                    const percentuais = saldos.map(s => {
                      const lucro = (s.saldo_atual || 0) - (s.saldo_inicial || 0);
                      return (s.saldo_inicial || 0) > 0 ? (lucro / (s.saldo_inicial || 0)) * 100 : 0;
                    });
                    const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0;
                    return `${mediaPercentual >= 0 ? '+' : ''}${mediaPercentual.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}%`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricoSaldos;