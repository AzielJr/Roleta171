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

  // Calcular dados filtrados para exibição e impressão
  const saldosFiltrados = saldos.filter(saldo => {
    if (!filtroAplicado) return true;
    const dataSaldo = saldo.data;
    const dentroDoIntervalo = (!dataInicial || dataSaldo >= dataInicial) && 
                             (!dataFinal || dataSaldo <= dataFinal);
    
    return dentroDoIntervalo;
  });

  // Definir datas padrão (primeiro dia do mês corrente até hoje)
  useEffect(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    
    const dataFinalPadrao = `${ano}-${mes}-${dia}`; // hoje
    const dataInicialPadrao = `${ano}-${mes}-01`;   // 1º dia do mês atual
    
    setDataFinal(dataFinalPadrao);
    setDataInicial(dataInicialPadrao);
  }, []);

  // Carregar histórico
  const carregarHistorico = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🚨 INICIANDO CONSULTA AO BANCO DE DADOS');
      console.log('👤 user.id:', user?.id);
      console.log('🚨 Data Inicial:', dataInicial);
      console.log('🚨 Data Final:', dataFinal);
      
      // CONSULTA DIRETA SEM FILTROS PRIMEIRO
      console.log('🚨 FAZENDO CONSULTA SEM FILTROS PARA VER TODOS OS REGISTROS...');
      const { data: todosRegistros, error: erroTodos } = await supabase
        .from('r171_saldo')
        .select('*')
        .eq('id_senha', user.id)
        .order('data', { ascending: true });

      if (erroTodos) {
        console.error('🚨 ERRO NA CONSULTA SEM FILTROS:', erroTodos);
      } else {
        console.log('🚨 TODOS OS REGISTROS NO BANCO (SEM FILTROS):', todosRegistros);
        console.log('🚨 QUANTIDADE TOTAL DE REGISTROS:', todosRegistros?.length || 0);
        
        const todasAsDatasDisponiveis = todosRegistros?.map(r => r.data).sort() || [];
        console.log('🚨 TODAS AS DATAS DISPONÍVEIS NO BANCO:', todasAsDatasDisponiveis);
        
        // 🔍 VERIFICAR SE AS DATAS ESTÃO REALMENTE EM 2025
        console.log('🔍 === ANÁLISE DAS DATAS ===');
        todosRegistros?.forEach(registro => {
          const [ano, mes, dia] = registro.data.split('-');
          console.log(`📅 Data: ${registro.data} -> Ano: ${ano}, Mês: ${mes}, Dia: ${dia}`);
          if (ano === '2025') {
            console.log('⚠️ ATENÇÃO: Data com ano 2025 encontrada!', registro.data);
          }
        });
      }

      // Agora fazer a consulta com filtros
      let query = supabase
        .from('r171_saldo')
        .select('*')
        .eq('id_senha', user.id);

      // Aplicar filtros de data se definidos
      if (dataInicial) {
        query = query.gte('data', dataInicial);
      }
      
      if (dataFinal) {
        // CORREÇÃO: Usar lte (<=) ao invés de lt (<) para incluir a data final selecionada
        console.log('🔍 DEBUG - Data final original:', dataFinal);
        console.log('🔍 DEBUG - Usando filtro: data <= ', dataFinal);
        console.log('🔍 DEBUG - Teste: "2025-09-25" <= "' + dataFinal + '"?', '2025-09-25' <= dataFinal);
        console.log('🔍 DEBUG - Teste: "2025-09-24" <= "' + dataFinal + '"?', '2025-09-24' <= dataFinal);
        
        query = query.lte('data', dataFinal);
      }

      const { data, error } = await query.order('data', { ascending: true });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        return;
      }

      console.log('🔍 DEBUG - TODOS OS REGISTROS RETORNADOS:', data);
      console.log('🔍 DEBUG - Quantidade de registros:', data?.length || 0);
      
      // Verificar especificamente os registros 24/09/2025 e 25/09/2025
      const registro24 = data?.find(r => r.data === '2025-09-24');
      const registro25 = data?.find(r => r.data === '2025-09-25');
      console.log('🚨 VERIFICAÇÃO CRÍTICA - Registro 24/09/2025 encontrado?', registro24 ? 'SIM' : 'NÃO');
      console.log('🚨 VERIFICAÇÃO CRÍTICA - Registro 25/09/2025 encontrado?', registro25 ? 'SIM' : 'NÃO');
      
      // Listar TODAS as datas encontradas
      const todasAsDatas = data?.map(r => r.data).sort() || [];
      console.log('🚨 TODAS AS DATAS NO BANCO:', todasAsDatas);
      
      if (registro24) {
        console.log('🔍 DEBUG - Dados do registro 24/09:', registro24);
      }
      if (registro25) {
        console.log('🔍 DEBUG - Dados do registro 25/09:', registro25);
      }

      // Normalizar tipos numéricos para evitar divergências (strings vs numbers)
      const normalizados = (data || []).map((r: any) => {
        const saldo_inicial = r.saldo_inicial != null ? Number(r.saldo_inicial) : 0;
        const saldo_atual = r.saldo_atual != null ? Number(r.saldo_atual) : 0;
        const vlr_lucro = r.vlr_lucro != null ? Number(r.vlr_lucro) : (saldo_atual - saldo_inicial);
        const per_lucro = r.per_lucro != null ? Number(r.per_lucro) : (saldo_inicial > 0 ? (vlr_lucro / saldo_inicial) * 100 : 0);
        return {
          ...r,
          saldo_inicial,
          saldo_atual,
          vlr_lucro,
          per_lucro
        } as R171Saldo;
      });

      // Consolidar por data: manter somente o registro mais recente (maior created_at) de cada dia
      const porDataMaisRecente = Object.values(
        normalizados.reduce((acc: Record<string, R171Saldo>, item: any) => {
          const key = item.data; // 'YYYY-MM-DD'
          if (!key) return acc;
          const atual = acc[key];
          if (!atual) {
            acc[key] = item;
          } else {
            // Comparar created_at para manter o mais recente
            const caNovo = new Date(item.created_at).getTime();
            const caAtual = new Date(atual.created_at).getTime();
            if (caNovo >= caAtual) acc[key] = item;
          }
          return acc;
        }, {})
      ) as R171Saldo[];

      // Ordenar por data ascendente
      porDataMaisRecente.sort((a, b) => (a.data || '').localeCompare(b.data || ''));

      setSaldos(porDataMaisRecente);
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

  // Assinar alterações em tempo real para manter a lista sempre atualizada
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('historico_saldos_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'r171_saldo',
          filter: `id_senha=eq.${user.id}`
        },
        (payload) => {
          console.log('🟢 Alteração detectada em r171_saldo:', payload.eventType, payload.new || payload.old);
          // Recarregar mantendo filtros atuais
          carregarHistorico();
        }
      )
      .subscribe();

    return () => {
      try { channel.unsubscribe(); } catch {}
    };
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
    }
    
    carregarHistorico();
  };

  const limparFiltro = () => {
    const hoje = new Date();
    // Sempre voltar para o 1º dia do mês corrente até hoje
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const formatDateLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setDataFinal(formatDateLocal(hoje));
    setDataInicial(formatDateLocal(primeiroDiaMes));
    setFiltroAplicado(false);
  };

  const gerarRelatorioHTML = () => {
    console.log('🖨️ [HistoricoSaldos] Gerando relatório de impressão...');
    // DEBUG: Mostrar dados que serão impressos
    console.log('=== DADOS PARA IMPRESSÃO ===');
    console.log('saldosFiltrados:', saldosFiltrados);
    console.log('Quantidade:', saldosFiltrados.length);
    console.log('Período:', dataInicial, 'até', dataFinal);
    
    // USAR APENAS OS DADOS FILTRADOS
    const dadosParaImprimir = saldosFiltrados;
    
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');
    
    // Calcular estatísticas APENAS com os dados filtrados
    const lucroTotal = dadosParaImprimir.reduce((acc, s) => acc + ((s.saldo_atual || 0) - (s.saldo_inicial || 0)), 0);
    const maiorSaldo = dadosParaImprimir.length > 0 ? Math.max(...dadosParaImprimir.map(s => s.saldo_atual || 0)) : 0;
    const menorSaldo = dadosParaImprimir.length > 0 ? Math.min(...dadosParaImprimir.map(s => s.saldo_atual || 0)) : 0;
    
    console.log('🖨️ ESTATÍSTICAS CALCULADAS:', { lucroTotal, maiorSaldo, menorSaldo });
    
    // Calcular média de percentual de lucratividade com dados filtrados
    const percentuais = dadosParaImprimir.map(s => {
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
            background-color: #f97316; /* laranja */
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 56px;  /* botão redondo maior */
            height: 56px; /* botão redondo maior */
            font-size: 26px; /* ícone maior */
            line-height: 56px; /* centraliza verticalmente o ícone */
            text-align: center; /* centraliza horizontalmente o ícone */
            cursor: pointer;
            box-shadow: 0 6px 14px rgba(0,0,0,0.25);
            z-index: 1000;
        }
        .print-button:hover {
            background-color: #ea580c; /* laranja mais escuro no hover */
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
        /* Zebra (linhas alternadas) */
        tbody tr:nth-child(odd) {
            background-color: #fafafa;
        }
        tbody tr:nth-child(even) {
            background-color: #ffffff;
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
        /* Ajustes solicitados de margens no cabeçalho do relatório */
        .header h1 {
            margin-top: 60px;
            margin-bottom: 10px;
        }
        .header p {
            margin-bottom: 12px;
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
            <div class="summary-value">${dadosParaImprimir.length}</div>
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
              const mediaReais = dadosParaImprimir.length > 0 ? lucroTotal / dadosParaImprimir.length : 0;
              return mediaReais >= 0 ? 'positive' : 'negative';
            })()}">${(() => {
              const mediaReais = dadosParaImprimir.length > 0 ? lucroTotal / dadosParaImprimir.length : 0;
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
            ${dadosParaImprimir.map(saldo => {
              // Formatar data e calcular lucro/percentual dinamicamente
              const [ano, mes, dia] = saldo.data.split('-');
              const data = `${dia}/${mes}/${ano}`;
              const lucro = (saldo.saldo_atual || 0) - (saldo.saldo_inicial || 0);
              const percentual = (saldo.saldo_inicial || 0) > 0 ? (lucro / (saldo.saldo_inicial || 1)) * 100 : 0;
              
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
    
    // Abrir apenas em nova aba usando Blob URL (sem acionar impressão automática)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      console.warn('Não foi possível abrir a nova aba. Verifique as permissões de pop-up do navegador.');
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
    // Usar a função gerarRelatorioHTML que já está corrigida
    gerarRelatorioHTML();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 lg:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] lg:max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center px-3 lg:px-6 py-1 lg:py-2 border-b border-gray-200">
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
          <div
            className="flex flex-col lg:flex-row flex-wrap gap-2 lg:gap-4 items-start lg:items-end"
            style={{ marginTop: '-1px', marginBottom: '-2px' }}
          >
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
              onClick={limparFiltro}
              className="w-full lg:w-auto px-3 lg:px-4 py-1.5 lg:py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              🗑️ Limpar
            </button>
            <div className="w-full lg:w-auto lg:ml-auto">
              <button
                onClick={gerarRelatorioHTML}
                className="w-full lg:w-auto px-3 lg:px-4 py-1.5 lg:py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                style={{width: '120px'}}
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
          
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
                  {saldosFiltrados.map((saldo, index) => {
                    // Calcular lucro e percentual SEMPRE a partir dos saldos (fonte única de verdade)
                    const valorLucro = (saldo.saldo_atual || 0) - (saldo.saldo_inicial || 0);
                    const percentualLucro = (saldo.saldo_inicial || 0) > 0 
                      ? (valorLucro / (saldo.saldo_inicial || 1)) * 100 
                      : 0;

                    return (
                      <tr key={saldo.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-2 lg:px-4 py-0.5 lg:py-1 text-xs lg:text-sm">
                          {saldo.data ? (() => {
                            // CORREÇÃO FINAL: O problema é que as datas no banco estão corretas (2025-09-20, 2025-09-21, etc.)
                            // mas a formatação está mostrando um dia a menos. Vamos usar a data exata do banco.
                            const [ano, mes, dia] = saldo.data.split('-');
                            return `${dia}/${mes}/${ano}`;
                          })() : ''}
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
                          percentualLucro >= 0 ? 'text-green-600' : 'text-red-800'
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
                <div className="text-xl font-bold text-gray-800">{saldosFiltrados.length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Lucro Total</div>
                <div className={`text-xl font-bold ${
                  saldosFiltrados.reduce((acc, s) => acc + ((s.saldo_atual || 0) - (s.saldo_inicial || 0)), 0) >= 0 ? 'text-green-600' : 'text-amber-900'
                }`}>
                  {formatarMoeda(saldosFiltrados.reduce((acc, s) => acc + ((s.saldo_atual || 0) - (s.saldo_inicial || 0)), 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Maior Saldo</div>
                <div className="text-xl font-bold text-green-600">
                  {formatarMoeda(saldosFiltrados.length > 0 ? Math.max(...saldosFiltrados.map(s => s.saldo_atual || 0)) : 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Menor Saldo</div>
                <div className="text-xl font-bold text-amber-900">
                  {formatarMoeda(saldosFiltrados.length > 0 ? Math.min(...saldosFiltrados.map(s => s.saldo_atual || 0)) : 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Média em R$</div>
                <div className={`text-xl font-bold ${
                  (() => {
                    const totalLucro = saldosFiltrados.reduce((acc, s) => acc + ((s.saldo_atual || 0) - (s.saldo_inicial || 0)), 0);
                    const totalRegistros = saldosFiltrados.length;
                    const mediaReais = totalRegistros > 0 ? totalLucro / totalRegistros : 0;
                    return mediaReais >= 0 ? 'text-green-600' : 'text-amber-900';
                  })()
                }`}>
                  {(() => {
                    const totalLucro = saldosFiltrados.reduce((acc, s) => acc + ((s.saldo_atual || 0) - (s.saldo_inicial || 0)), 0);
                    const totalRegistros = saldosFiltrados.length;
                    const mediaReais = totalRegistros > 0 ? totalLucro / totalRegistros : 0;
                    return formatarMoeda(mediaReais);
                  })()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Média Percentual</div>
                <div className={`text-xl font-bold ${
                  (() => {
                    const percentuais = saldosFiltrados.map(s => {
                      const lucro = (s.saldo_atual || 0) - (s.saldo_inicial || 0);
                      return (s.saldo_inicial || 0) > 0 ? (lucro / (s.saldo_inicial || 0)) * 100 : 0;
                    });
                    const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0;
                    return mediaPercentual >= 0 ? 'text-green-600' : 'text-amber-900';
                  })()
                }`}>
                  {(() => {
                    const percentuais = saldosFiltrados.map(s => {
                      const lucro = (s.saldo_atual || 0) - (s.saldo_inicial || 0);
                      return (s.saldo_inicial || 0) > 0 ? (lucro / (s.saldo_inicial || 0)) * 100 : 0;
                    });
                    const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0;
                    return `${mediaPercentual >= 0 ? '+' : ''}${mediaPercentual.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}%`;
                  })()
                }
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