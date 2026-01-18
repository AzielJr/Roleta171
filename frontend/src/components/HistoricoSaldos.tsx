import React, { useState, useEffect } from 'react';
import { saldoAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useBalance } from '../contexts/BalanceContext';
import { R171Saldo } from '../lib/api';
 
interface HistoricoSaldosProps {
  onClose: () => void;
  variant?: 'modal' | 'inline';
}

export const HistoricoSaldos: React.FC<HistoricoSaldosProps> = ({ onClose, variant = 'modal' }) => {
  const { user } = useAuth();
  const { balance, currentSaldoRecord } = useBalance();
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
      
      // Buscar histórico usando a nova API MySQL
      const { saldos: data } = await saldoAPI.getHistory(
        user.id,
        dataInicial || undefined,
        dataFinal || undefined
      );

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
      // IMPORTANTE: Para o registro de hoje, usar o saldo atual do contexto (balance) que está atualizado em tempo real
      const hoje = new Date().toISOString().split('T')[0];
      const normalizados = (data || []).map((r: any) => {
        const saldo_inicial = r.saldo_inicial != null ? Number(r.saldo_inicial) : 0;
        // Se for o registro de hoje E temos um saldo atual do contexto, usar o balance atualizado
        const saldo_atual = (r.data === hoje && balance != null) 
          ? Number(balance) 
          : (r.saldo_atual != null ? Number(r.saldo_atual) : 0);
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

      // Consolidar por data: escolher o registro "mais confiável" por dia
      // Critérios: 1) possui vlr_lucro/per_lucro definidos (não nulos) -> priorizar
      //            2) maior created_at
      //            3) maior id (fallback)
      const porDataMaisRecente = Object.values(
        normalizados.reduce((acc: Record<string, R171Saldo>, item: any) => {
          const key = item.data; // 'YYYY-MM-DD'
          if (!key) return acc;
          const atual = acc[key];
          if (!atual) {
            acc[key] = item;
          } else {
            const score = (r: any) => {
              const hasProfit = (r.vlr_lucro != null || r.per_lucro != null) ? 1 : 0;
              const created = new Date(r.created_at).getTime();
              const idVal = typeof r.id === 'number' ? r.id : 0;
              return hasProfit * 1e12 + created * 1e3 + idVal;
            };
            if (score(item) >= score(atual)) acc[key] = item;
          }
          return acc;
        }, {})
      ) as R171Saldo[];

      // Ordenar por data DECRESCENTE (mais recente primeiro)
      porDataMaisRecente.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
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
  }, [user, dataInicial, dataFinal, balance]); // Adicionar balance para recarregar quando o saldo mudar

  // Recarregar histórico quando balance mudar (indica que houve atualização)
  useEffect(() => {
    if (user && dataInicial && dataFinal) {
      carregarHistorico();
    }
  }, [user, balance]);

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
    const lucroTotal = dadosParaImprimir.reduce((acc, s) => {
      const vlr = s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0));
      return acc + vlr;
    }, 0);
    const maiorSaldo = dadosParaImprimir.length > 0 ? Math.max(...dadosParaImprimir.map(s => s.saldo_atual || 0)) : 0;
    const menorSaldo = dadosParaImprimir.length > 0 ? Math.min(...dadosParaImprimir.map(s => s.saldo_atual || 0)) : 0;
    
    console.log('🖨️ ESTATÍSTICAS CALCULADAS:', { lucroTotal, maiorSaldo, menorSaldo });
    
    // Calcular média de percentual de lucratividade com dados filtrados
    const percentuais = dadosParaImprimir.map(s => {
      if (s.per_lucro != null) return Number(s.per_lucro);
      const lucro = s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0));
      return (s.saldo_inicial || 0) > 0 ? (lucro / (s.saldo_inicial || 1)) * 100 : 0;
    });
    const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Histórico de Saldos (Mobile)</title>
  <style>
    :root { --fg:#333; --muted:#666; --line:#e5e7eb; --green:#16a34a; --red:#dc2626; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 10px; color: var(--fg); }
    .header { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--line); position:sticky; top:0; background:#fff; }
    .title { font-weight:700; font-size:14px; }
    .period { font-size:11px; color: var(--muted); }
    .summary { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin:10px 0; }
    .card { background:#f9fafb; border:1px solid var(--line); border-radius:8px; padding:8px; text-align:center; }
    .label { font-size:10px; color:var(--muted); }
    .value { font-size:13px; font-weight:700; }
    .value.green { color:var(--green); }
    .value.red { color:var(--red); }
    .list { border:1px solid var(--line); border-radius:8px; overflow:hidden; }
    .list-head { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:6px; padding:6px 8px; font-size:11px; font-weight:700; border-bottom:1px solid var(--line); background:#fff; }
    .row { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:6px; padding:6px 8px; font-size:11px; border-bottom:1px solid var(--line); }
    .right { text-align:right; }
    .green { color:var(--green); }
    .red { color:var(--red); }
    .footer { margin-top:10px; text-align:center; font-size:10px; color:var(--muted); }
    @media print { .print-btn { display:none } body { margin: 10px } }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">📊 Histórico de Saldos</div>
    <div class="period">${dataInicial ? dataInicial.split('-').reverse().join('/') : ''} a ${dataFinal ? dataFinal.split('-').reverse().join('/') : ''}</div>
  </div>

  <div class="summary">
    <div class="card">
      <div class="label">Total de Registros</div>
      <div class="value">${dadosParaImprimir.length}</div>
    </div>
    <div class="card">
      <div class="label">Lucro Total</div>
      <div class="value ${lucroTotal >= 0 ? 'green' : 'red'}">${formatarMoeda(lucroTotal)}</div>
    </div>
  </div>

  <div class="list">
    <div class="list-head">
      <div>Data</div>
      <div class="right">Saldo Atual</div>
      <div class="right">Vlr Lucro</div>
      <div class="right">% Lucro</div>
    </div>
    ${dadosParaImprimir.map(saldo => {
      const [ano, mes, dia] = saldo.data.split('-');
      const data = `${dia}/${mes}/${ano}`;
      const lucro = saldo.vlr_lucro != null ? Number(saldo.vlr_lucro) : ((saldo.saldo_atual || 0) - (saldo.saldo_inicial || 0));
      const percentual = saldo.per_lucro != null ? Number(saldo.per_lucro) : ((saldo.saldo_inicial || 0) > 0 ? (lucro / (saldo.saldo_inicial || 1)) * 100 : 0);
      return `
        <div class="row">
          <div>${data}</div>
          <div class="right">${formatarMoeda(saldo.saldo_atual)}</div>
          <div class="right ${lucro >= 0 ? 'green' : 'red'}">${formatarMoeda(lucro)}</div>
          <div class="right ${percentual >= 0 ? 'green' : 'red'}">${formatarPercentual(percentual)}</div>
        </div>
      `;
    }).join('')}
  </div>

  <div class="footer">Gerado em ${dataAtual} às ${horaAtual}</div>
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

  if (variant === 'inline') {
    return (
      <div className="bg-white rounded-lg shadow-xl w-full overflow-hidden">
        {/* Filtros */}
        <div className="px-3 pt-2 pb-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Inicial</label>
              <input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Final</label>
              <input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={limparFiltro} className="w-full px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg">🗑️ Limpar</button>
            <button onClick={gerarRelatorioHTML} className="w-full px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg">🖨️ Imprimir</button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-3 pt-2 pb-2">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Carregando histórico...</div>
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
                    <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 text-xs">Data</th>
                    <th className="border border-gray-300 px-2 py-1 text-right font-semibold text-gray-700 text-xs">Saldo Inicial</th>
                    <th className="border border-gray-300 px-2 py-1 text-right font-semibold text-gray-700 text-xs">Saldo Atual</th>
                    <th className="border border-gray-300 px-2 py-1 text-right font-semibold text-gray-700 text-xs">Valor Lucro</th>
                    <th className="border border-gray-300 px-2 py-1 text-right font-semibold text-gray-700 text-xs">% Lucro</th>
                    <th className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-700 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {saldosFiltrados.map((saldo, index) => {
                    const valorLucro = saldo.vlr_lucro != null ? Number(saldo.vlr_lucro) : ((saldo.saldo_atual || 0) - (saldo.saldo_inicial || 0));
                    const percentualLucro = saldo.per_lucro != null ? Number(saldo.per_lucro) : ((saldo.saldo_inicial || 0) > 0 
                      ? (valorLucro / (saldo.saldo_inicial || 1)) * 100 
                      : 0);
                    const [ano, mes, dia] = saldo.data.split('-');
                    return (
                      <tr key={saldo.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-2 py-0.5 text-xs">{`${dia}/${mes}/${ano}`}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right text-xs">{formatarMoeda(saldo.saldo_inicial || 0)}</td>
                        <td className={`border border-gray-300 px-2 py-0.5 text-right font-semibold text-xs ${(saldo.saldo_atual || 0) >= 0 ? 'text-green-600' : 'text-amber-900'}`}>{formatarMoeda(saldo.saldo_atual || 0)}</td>
                        <td className={`border border-gray-300 px-2 py-0.5 text-right font-semibold text-xs ${valorLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`}>{formatarMoeda(valorLucro)}</td>
                        <td className={`border border-gray-300 px-2 py-0.5 text-right font-semibold text-xs ${percentualLucro >= 0 ? 'text-green-600' : 'text-red-800'}`}>{formatarPercentual(percentualLucro)}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-center text-xs">
                          {valorLucro > 0 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Lucro</span>
                          ) : valorLucro < 0 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Prejuízo</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Neutro</span>
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

        {/* Resumo - cards 2 por linha no mobile */}
        {saldos.length > 0 && (
          <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
              <div className="text-center bg-white rounded p-2">
                <div className="text-xs text-gray-600">Total de Registros</div>
                <div className="text-lg font-bold text-gray-800">{saldosFiltrados.length}</div>
              </div>
              <div className="text-center bg-white rounded p-2">
                <div className="text-xs text-gray-600">Lucro Total</div>
                <div className={`text-lg font-bold ${
                  (() => {
                    const total = saldosFiltrados.reduce((acc, s) => acc + (s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0))), 0);
                    return total >= 0 ? 'text-green-600' : 'text-amber-900';
                  })()
                }`}>{(() => {
                  const total = saldosFiltrados.reduce((acc, s) => acc + (s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0))), 0);
                  return formatarMoeda(total);
                })()}</div>
              </div>
              <div className="text-center bg-white rounded p-2">
                <div className="text-xs text-gray-600">Maior Saldo</div>
                <div className="text-lg font-bold text-green-600">{formatarMoeda(saldosFiltrados.length > 0 ? Math.max(...saldosFiltrados.map(s => s.saldo_atual || 0)) : 0)}</div>
              </div>
              <div className="text-center bg-white rounded p-2">
                <div className="text-xs text-gray-600">Menor Saldo</div>
                <div className="text-lg font-bold text-amber-900">{formatarMoeda(saldosFiltrados.length > 0 ? Math.min(...saldosFiltrados.map(s => s.saldo_atual || 0)) : 0)}</div>
              </div>
              <div className="text-center bg-white rounded p-2">
                <div className="text-xs text-gray-600">Média em R$</div>
                <div className={`text-lg font-bold ${(() => { const totalLucro = saldosFiltrados.reduce((acc, s) => acc + (s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0))), 0); const totalRegistros = saldosFiltrados.length; const mediaReais = totalRegistros > 0 ? totalLucro / totalRegistros : 0; return mediaReais >= 0 ? 'text-green-600' : 'text-amber-900'; })()}`}>{(() => { const totalLucro = saldosFiltrados.reduce((acc, s) => acc + (s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0))), 0); const totalRegistros = saldosFiltrados.length; const mediaReais = totalRegistros > 0 ? totalLucro / totalRegistros : 0; return formatarMoeda(mediaReais); })()}</div>
              </div>
              <div className="text-center bg-white rounded p-2">
                <div className="text-xs text-gray-600">Média Percentual</div>
                <div className={`text-lg font-bold ${(() => { const percentuais = saldosFiltrados.map(s => { if (s.per_lucro != null) return Number(s.per_lucro); const lucro = s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0)); return (s.saldo_inicial || 0) > 0 ? (lucro / (s.saldo_inicial || 0)) * 100 : 0; }); const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0; return mediaPercentual >= 0 ? 'text-green-600' : 'text-amber-900'; })()}`}>{(() => { const percentuais = saldosFiltrados.map(s => { if (s.per_lucro != null) return Number(s.per_lucro); const lucro = s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0)); return (s.saldo_inicial || 0) > 0 ? (lucro / (s.saldo_inicial || 0)) * 100 : 0; }); const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0; return `${mediaPercentual >= 0 ? '+' : ''}${mediaPercentual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`; })()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
                    const valorLucro = saldo.vlr_lucro != null ? Number(saldo.vlr_lucro) : ((saldo.saldo_atual || 0) - (saldo.saldo_inicial || 0));
                    const percentualLucro = saldo.per_lucro != null ? Number(saldo.per_lucro) : ((saldo.saldo_inicial || 0) > 0 
                      ? (valorLucro / (saldo.saldo_inicial || 1)) * 100 
                      : 0);

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
                  (() => {
                    const total = saldosFiltrados.reduce((acc, s) => acc + (s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0))), 0);
                    return total >= 0 ? 'text-green-600' : 'text-amber-900';
                  })()
                }`}>
                  {(() => {
                    const total = saldosFiltrados.reduce((acc, s) => acc + (s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0))), 0);
                    return formatarMoeda(total);
                  })()}
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
                    const totalLucro = saldosFiltrados.reduce((acc, s) => acc + (s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0))), 0);
                    const totalRegistros = saldosFiltrados.length;
                    const mediaReais = totalRegistros > 0 ? totalLucro / totalRegistros : 0;
                    return mediaReais >= 0 ? 'text-green-600' : 'text-amber-900';
                  })()
                }`}>
                  {(() => {
                    const totalLucro = saldosFiltrados.reduce((acc, s) => acc + (s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0))), 0);
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
                      if (s.per_lucro != null) return Number(s.per_lucro);
                      const lucro = s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0));
                      return (s.saldo_inicial || 0) > 0 ? (lucro / (s.saldo_inicial || 0)) * 100 : 0;
                    });
                    const mediaPercentual = percentuais.length > 0 ? percentuais.reduce((acc, p) => acc + p, 0) / percentuais.length : 0;
                    return mediaPercentual >= 0 ? 'text-green-600' : 'text-amber-900';
                  })()
                }`}>
                  {(() => {
                    const percentuais = saldosFiltrados.map(s => {
                      if (s.per_lucro != null) return Number(s.per_lucro);
                      const lucro = s.vlr_lucro != null ? Number(s.vlr_lucro) : ((s.saldo_atual || 0) - (s.saldo_inicial || 0));
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
