import React, { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateTorreNumber } from '../utils/torreEvaluator';
import { evaluateBetTerminaisNumber } from '../utils/betTerminaisEvaluator';
import { evaluateP2Number } from '../utils/p2Evaluator';
import { cn } from '../utils/cn';
import StatisticsCards from './StatisticsCards';
import { BalanceManager } from './BalanceManager';
import { useStatistics } from '../hooks/useStatistics';
import { useImageOCR } from '../hooks/useImageOCR';
import { calculateStatistics } from '../utils/statisticsCalculator';
import { getNumberColor as getNumberColorUtil } from '../utils/rouletteConfig';
import { checkForRaceCondition } from '../utils/alertLogic';
import { useAuth } from '../contexts/AuthContext';
import { useBalance } from '../contexts/BalanceContext';
import { HistoricoSaldos } from './HistoricoSaldos';
import { MonthlyGraphModal } from './MonthlyGraphModal';
import { soundGenerator } from '../utils/soundUtils';
import FourColorsPanel from './FourColorsPanel';
import AreasRoleta from './AreasRoleta';
import MobileMenu from './MobileMenu';
import FourColorsMobile from './FourColorsMobile';
import ColorProgressionMobile from './ColorProgressionMobile';
import ColorProgressionDesktop from './ColorProgressionDesktop';
import { supabase } from '../lib/supabase';
import { saldoAPI } from '../lib/api';
import { detectSequenceAlerts } from '../utils/sequenceAlerts';
import { LogOut } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
const valueLabelPlugin = {
  id: 'valueLabel',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0] as any;
    const meta = chart.getDatasetMeta(0);
    const profits: number[] = Array.isArray(dataset?.profits) ? dataset.profits : [];
    ctx.save();
    meta.data.forEach((element: any, index: number) => {
      const val = Number(dataset.data[index] || 0);
      const pos = element.tooltipPosition();
      // Valor acima da barra (saldo)
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        pos.x,
        pos.y - 2
      );
      // Lucro dentro do topo da barra (discreto em verde escuro)
      const profitVal = Number(profits[index] ?? 0);
      ctx.fillStyle = '#064e3b';
      ctx.textBaseline = 'top';
      ctx.fillText(
        profitVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        pos.x,
        pos.y + 6
      );
    });
    ctx.restore();
  }
};
ChartJS.register(valueLabelPlugin);

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
  type?: string;
  betNumbers?: number[];
  riskNumbers?: number[];
  baseNumbers?: number[];  // Adicionando baseNumbers à interface
}

interface RouletteProps {
  onLogout?: () => void;
}

const RouletteBoard: React.FC<RouletteProps> = ({ onLogout }) => {
  // Hooks para autenticação e saldo
  const { user } = useAuth();
  const { balance, currentSaldoRecord, lastSaldoRecord, adjustBalance, updateSaldoRecord, createSaldoRecord, refreshBalance } = useBalance();
  
  // Ref para controlar duplicação de detecção P2 WIN
  const lastProcessedP2Key = useRef<string>('');
  
  // Estado para controlar o modal de saldo
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  
  // Estado para controlar o modal de cadastrar saldo
  const [showCreateBalanceModal, setShowCreateBalanceModal] = useState(false);
  
  // Estado para controlar o modal de histórico de saldos
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Estado para controlar o modal de gráfico mensal
  const [showMonthlyGraphModal, setShowMonthlyGraphModal] = useState(false);
  // Painel de Registro de Entradas (Dúzias e Colunas)
  const [showDuzColPanel, setShowDuzColPanel] = useState(false);
  
  // Container Áreas da Roleta
  const [showAreasRoleta, setShowAreasRoleta] = useState(false);
  
  // Estados para menu mobile e 4 Cores mobile
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFourColorsMobile, setShowFourColorsMobile] = useState(false);
  const [showColorProgressionMobile, setShowColorProgressionMobile] = useState(false);
  
  // Estado para Progressão de Cores Desktop
  const [showColorProgressionDesktop, setShowColorProgressionDesktop] = useState(false);
  
  // Estados para os filtros do histórico (datas locais)
  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const todayLocal = formatDateLocal(new Date());
  const firstDayOfMonthLocal = (() => {
    const d = new Date();
    d.setDate(1);
    return formatDateLocal(d);
  })();
  const [filterStartDate, setFilterStartDate] = useState(firstDayOfMonthLocal);
  const [filterEndDate, setFilterEndDate] = useState(todayLocal);

  // Dados completos do histórico (exemplo local)
  const allHistoryData = [
    { data: '20/09/2025', dataISO: '2025-09-20', saldoInicial: 82.00, saldoAtual: 82.00, valorLucro: 0.00, percentual: 0.00, status: 'Neutro' },
    { data: '21/09/2025', dataISO: '2025-09-21', saldoInicial: 82.00, saldoAtual: 105.35, valorLucro: 23.35, percentual: 28.48, status: 'Lucro' },
    { data: '22/09/2025', dataISO: '2025-09-22', saldoInicial: 105.85, saldoAtual: 140.35, valorLucro: 34.50, percentual: 32.59, status: 'Lucro' },
    { data: '23/09/2025', dataISO: '2025-09-23', saldoInicial: 141.85, saldoAtual: 162.00, valorLucro: 20.15, percentual: 14.21, status: 'Lucro' },
    { data: '24/09/2025', dataISO: '2025-09-24', saldoInicial: 162.00, saldoAtual: 19.35, valorLucro: -142.65, percentual: -88.06, status: 'Prejuízo' },
    { data: '25/09/2025', dataISO: '2025-09-25', saldoInicial: 19.35, saldoAtual: 21.35, valorLucro: 2.00, percentual: 10.34, status: 'Lucro' }
  ];

  // Filtrar dados baseado nas datas selecionadas
  const filteredHistoryData = allHistoryData.filter(item => {
    return item.dataISO >= filterStartDate && item.dataISO <= filterEndDate;
  });

  // Calcular estatísticas dos dados filtrados
  const totalRegistros = filteredHistoryData.length;
  const lucroTotal = filteredHistoryData.reduce((acc, item) => acc + item.valorLucro, 0);
  const maiorSaldo = Math.max(...filteredHistoryData.map(item => item.saldoAtual));
  const menorSaldo = Math.min(...filteredHistoryData.map(item => item.saldoAtual));
  const mediaValor = totalRegistros > 0 ? lucroTotal / totalRegistros : 0;
  const mediaPercentual = totalRegistros > 0 ? filteredHistoryData.reduce((acc, item) => acc + item.percentual, 0) / totalRegistros : 0;
  
  // Função para gerar template HTML de impressão
  const generatePrintTemplate = () => {
    const moeda = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Histórico de Saldos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8f9fa;
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .period {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #6b7280;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .print-btn:hover {
            background: #4b5563;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 15px;
            padding: 20px 30px;
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        }
        
        .stat-card {
            text-align: center;
            padding: 15px 10px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border-left: 3px solid;
        }
        
        .stat-card.total { border-left-color: #3b82f6; }
        .stat-card.profit { border-left-color: #10b981; }
        .stat-card.max { border-left-color: #8b5cf6; }
        .stat-card.min { border-left-color: #f59e0b; }
        .stat-card.avg-value { border-left-color: #6366f1; }
        .stat-card.avg-percent { border-left-color: #14b8a6; }
        
        .stat-value {
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .stat-label {
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 500;
        }
        
        .table-container {
            padding: 30px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        th {
            background: #f8fafc;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        
        th:nth-child(2), th:nth-child(3), th:nth-child(4), th:nth-child(5) {
            text-align: right;
        }
        
        td {
            padding: 4px 15px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        td:nth-child(2), td:nth-child(3), td:nth-child(4), td:nth-child(5) {
            text-align: right;
        }
        
        tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        
        tbody tr:nth-child(odd) {
            background: white;
        }
        
        tr:hover {
            background: #e5e7eb !important;
        }
        
        .positive {
            color: #10b981;
            font-weight: 600;
        }
        
        .neutral {
            color: #6b7280;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        @media print {
            .print-btn {
                display: none;
            }
            
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️</button>
    
    <div class="container">
        <div class="header">
            <h1>Relatório de Histórico de Saldos</h1>
            <div class="period">Período: ${filterStartDate.split('-').reverse().join('/')} a ${filterEndDate.split('-').reverse().join('/')}</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card total">
                <div class="stat-value">4</div>
                <div class="stat-label">Total de Registros</div>
            </div>
            <div class="stat-card profit">
                <div class="stat-value positive">R$ 78,00</div>
                <div class="stat-label">Lucro Total</div>
            </div>
            <div class="stat-card max">
                <div class="stat-value">R$ 162,00</div>
                <div class="stat-label">Maior Saldo</div>
            </div>
            <div class="stat-card min">
                <div class="stat-value">R$ 82,00</div>
                <div class="stat-label">Menor Saldo</div>
            </div>
            <div class="stat-card avg-value">
                <div class="stat-value">R$ 19,50</div>
                <div class="stat-label">Média em R$</div>
            </div>
            <div class="stat-card avg-percent">
                <div class="stat-value positive">+18,82%</div>
                <div class="stat-label">Média Percentual</div>
            </div>
        </div>
        
        <div class="table-container">
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
                    ${filteredHistoryData.map(row => `
                        <tr>
                            <td>${row.data}</td>
                            <td>R$ ${row.saldoInicial.toFixed(2).replace('.', ',')}</td>
                            <td class="${row.valorLucro >= 0 ? 'positive' : ''}">R$ ${row.saldoAtual.toFixed(2).replace('.', ',')}</td>
                            <td class="${row.valorLucro >= 0 ? 'positive' : ''}">R$ ${row.valorLucro.toFixed(2).replace('.', ',')}</td>
                            <td class="${row.percentual >= 0 ? 'positive' : ''}">${row.percentual >= 0 ? '+' : ''}${row.percentual.toFixed(2)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            Relatório gerado automaticamente pelo sistema R171 - Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </div>
    </div>
</body>
</html>`;

    return htmlTemplate;
  };
  
  // Estados para os campos do modal de editar saldo
  const [editSaldoInicial, setEditSaldoInicial] = useState(0);
  const [editSaldoAtual, setEditSaldoAtual] = useState(0);
  const [editDataCadastro, setEditDataCadastro] = useState(new Date().toISOString().split('T')[0]);
  
  // Estados para os campos do modal de cadastrar saldo
  const [createDataCadastro, setCreateDataCadastro] = useState(new Date().toISOString().split('T')[0]);
  const [createSaldoInicial, setCreateSaldoInicial] = useState(Number(currentSaldoRecord?.saldo_atual) || 0);
  const [createSaldoAtual, setCreateSaldoAtual] = useState(Number(currentSaldoRecord?.saldo_atual) || 0);
  
  // Cálculos automáticos baseados nos valores
  const valorLucro = editSaldoAtual - editSaldoInicial;
  const percentualLucro = editSaldoInicial > 0 ? ((valorLucro / editSaldoInicial) * 100) : 0;
  
  // Cálculos automáticos para o modal de criar
  const createValorLucro = createSaldoAtual - createSaldoInicial;
  const createPercentualLucro = createSaldoInicial > 0 ? ((createValorLucro / createSaldoInicial) * 100) : 0;
  
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
  // Estados para configurações do sistema
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [alertaPadrao171Ativo, setAlertaPadrao171Ativo] = useState(false);
  const [avisosSonorosAtivos, setAvisosSonorosAtivos] = useState(false);
  const [espanholEnabled, setEspanholEnabled] = useState(false);
  
// Converter lastNumbers para Statistics e usar useStatistics
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Estado para armazenar o último número selecionado manualmente
  const [lastSelectedNumber, setLastSelectedNumber] = useState<number | null>(null);
  
  // Estado para armazenar o último número sorteado durante simulação
  const [lastDrawnNumber, setLastDrawnNumber] = useState<number | null>(null);
  
  // Estado para alertas de padrão
  const [patternAlert, setPatternAlert] = useState<PatternAlert | null>(null);
  
  // Estado para histórico de números sorteados (para detecção de padrões)
  const [drawnHistory, setDrawnHistory] = useState<number[]>([]);
  
  // Estados para alertas de sequência de 3 números seguidos
  const [sequenceAlerts, setSequenceAlerts] = useState<Array<{type: string, category: string, message: string}>>([]);
  const [dozenSequenceCount, setDozenSequenceCount] = useState<{dozen: number, count: number} | null>(null);
  const [columnSequenceCount, setColumnSequenceCount] = useState<{column: number, count: number} | null>(null);
  const [colorSequence, setColorSequence] = useState<{color: string, count: number} | null>(null);
  const [highLowSequence, setHighLowSequence] = useState<{type: string, count: number} | null>(null);
  const [evenOddSequence, setEvenOddSequence] = useState<{type: string, count: number} | null>(null);

  // Estados do recurso Espanhol
  const [espanholChamados, setEspanholChamados] = useState<number[]>([]);
  const [espanholRepetidos, setEspanholRepetidos] = useState<number[]>([]);
  const [espanholModulo1X, setEspanholModulo1X] = useState<number>(0);
  const [espanholModulo2X, setEspanholModulo2X] = useState<number>(0);
  const [espanholModulo3X, setEspanholModulo3X] = useState<number>(0);
  const [espanholValorInicial, setEspanholValorInicial] = useState<number>(1.00);
  const [espanholTotal, setEspanholTotal] = useState<number>(0);
  const [espanholWinValue, setEspanholWinValue] = useState<number | null>(null);
  const espanholCountsRef = useRef<Map<number, number>>(new Map());
  const prevLastNumbersLenRef = useRef<number>(0);
  const espanholWinTriggeredRef = useRef<boolean>(false);
  const [espanholLocked, setEspanholLocked] = useState<boolean>(false);
  const [apostandoEspanhol, setApostandoEspanhol] = useState<boolean>(false);


  // Estado para controlar o modal de adicionar números
  const [showAddNumbersModal, setShowAddNumbersModal] = useState(false);
  const [addNumbersInput, setAddNumbersInput] = useState('');
  
  // Hook de OCR para processar imagens
  const { isProcessing: isProcessingOCR, progress: ocrProgress, handlePasteImage } = useImageOCR();
  
  // Estados para reconhecimento de voz
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [voiceBuffer, setVoiceBuffer] = useState<string>(''); // Buffer para acumular dígitos falados
  const lastAppendedPairsRef = useRef<string[]>([]); // Rastro dos últimos pares adicionados (evita duplicações no interim)
  
  // Estados para reconhecimento de voz da roleta
  const [isRouletteListening, setIsRouletteListening] = useState(false);
  const [rouletteRecognition, setRouletteRecognition] = useState<any | null>(null);
  const [rouletteVoiceBuffer, setRouletteVoiceBuffer] = useState<string>(''); // Buffer para acumular dígitos da roleta
  
  // Estados para popup de feedback de voz
  const [showVoicePopup, setShowVoicePopup] = useState(false);

  // Estatísticas do BET Terminais
  const [betTerminaisWins, setBetTerminaisWins] = useState(0);
  const [betTerminaisLosses, setBetTerminaisLosses] = useState(0);
  const [betTerminaisNegSeqCurrent, setBetTerminaisNegSeqCurrent] = useState(0);
  const [betTerminaisNegSeqMax, setBetTerminaisNegSeqMax] = useState(0);
  const [betTerminaisPosSeqCurrent, setBetTerminaisPosSeqCurrent] = useState(0);
  const [betTerminaisPosSeqMax, setBetTerminaisPosSeqMax] = useState(0);
  const [betTerminaisEntradas, setBetTerminaisEntradas] = useState(0);
  const [betTerminaisPendingEntrada, setBetTerminaisPendingEntrada] = useState(false);
  const [animatingBetTerminais, setAnimatingBetTerminais] = useState<'yellow' | 'green' | undefined>(undefined);
  
  // ===== Calculadoras de Estatísticas: P2 e Torre =====
  const P2_ENTRY_NUMBERS = [0, 3, 4, 7, 11, 15, 18, 21, 22, 25, 29, 33, 36];
  const TORRE_STREETS: { [key: number]: number[] } = {
    1: [1, 2, 3, 4, 5, 6],
    2: [7, 8, 9, 10, 11, 12],
    3: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    4: [25, 26, 27, 28, 29, 30],
    5: [31, 32, 33, 34, 35, 36]
  };
  const NOVES_FORA_ENTRY_SET = new Set<number>([5, 8, 16, 23, 25, 30]);
  // Estados e animação da Torre
  const [torrePendingEntrada, setTorrePendingEntrada] = useState<boolean>(false);
  const [animatingTorre, setAnimatingTorre] = useState<'yellow' | 'green' | undefined>(undefined);
   // Garantia removida: limpeza controlada por evaluateTorre com timeout
   useEffect(() => {
     // noop
   }, [torrePendingEntrada]);
   // UI da Torre controlada exclusivamente por estado (sem manipulação de DOM)
   useEffect(() => {
     // Nada aqui: StatisticsCards aplica/removerá bordas via animatingTorre
   }, [animatingTorre]);

   // UI da Torre é aplicada pelo container em StatisticsCards; sem manipulação de DOM aqui
   useEffect(() => {
     // Sem ação: animatingTorre dirige a borda no componente StatCard
   }, [animatingTorre]);

  // Helper: limpar visuais da Torre apenas por estado
  const clearTorreVisuals = () => {
    setAnimatingTorre(undefined);
    setTorrePendingEntrada(false);
  };
  // Estados e animação da P2
  const [p2PendingEntrada, setP2PendingEntrada] = useState<boolean>(false);
  const [animatingP2, setAnimatingP2] = useState<'yellow' | 'green' | undefined>(undefined);

  const [novesForaPendingEntrada, setNovesForaPendingEntrada] = useState<boolean>(false);
  const [animatingNovesFora, setAnimatingNovesFora] = useState<'yellow' | 'green' | undefined>(undefined);

  // UI da P2 controlada por estado; sem manipulação de DOM
  useEffect(() => {
    // Nada aqui: StatisticsCards aplica/removerá bordas via animatingP2
  }, [animatingP2]);

  // Sem manipulação de DOM para P2; animatingP2 dirige a UI no StatisticsCards
  useEffect(() => {
    // Nenhuma ação necessária
  }, [animatingP2]);

  const [p2Mode, setP2Mode] = useState<number>(1);

  const calculatedP2Stats = React.useMemo(() => {
    let entradas = 0, wins = 0, losses = 0;
    let maxNegativeSequence = 0, currentNegativeSequence = 0;

    if (p2Mode === 1) {
      // Percorrer do início ao fim e classificar o número IMEDIATAMENTE SEGUINTE ao gatilho
      for (let i = 0; i < lastNumbers.length; i++) {
        const number = lastNumbers[i];
        if (P2_ENTRY_NUMBERS.includes(number)) {
          // Entradas: somar na ativação
          entradas++;
          if (i + 1 < lastNumbers.length) {
            const nextNumber = lastNumbers[i + 1];
            if (P2_ENTRY_NUMBERS.includes(nextNumber)) {
              // LOSS: somar também em Entradas
              losses++;
              entradas++;
              currentNegativeSequence++;
              if (currentNegativeSequence > maxNegativeSequence) {
                maxNegativeSequence = currentNegativeSequence;
              }
            } else {
              // WIN: não soma Entradas adicional
              wins++;
              currentNegativeSequence = 0;
            }
          }
        }
      }
    } else {
      // Modo 2: considerar entrada somente quando há DOIS gatilhos consecutivos (i e i+1)
      for (let i = 0; i <= lastNumbers.length - 2; i++) {
        const n0 = lastNumbers[i];
        const n1 = lastNumbers[i + 1];
        if (P2_ENTRY_NUMBERS.includes(n0) && P2_ENTRY_NUMBERS.includes(n1)) {
          // Entradas: somar na ativação (dois gatilhos consecutivos)
          entradas++;
          if (i + 2 < lastNumbers.length) {
            const nextNumber = lastNumbers[i + 2];
            if (P2_ENTRY_NUMBERS.includes(nextNumber)) {
              // LOSS: somar também em Entradas
              losses++;
              entradas++;
              currentNegativeSequence++;
              if (currentNegativeSequence > maxNegativeSequence) {
                maxNegativeSequence = currentNegativeSequence;
              }
            } else {
              // WIN: não soma Entradas adicional
              wins++;
              currentNegativeSequence = 0;
            }
          }
        }
      }
    }

    return { entradas, wins, losses, maxNegativeSequence };
  }, [lastNumbers, p2Mode]);

  const calculatedTorreStats = React.useMemo(() => {
    let entradas = 0, wins = 0, losses = 0;
    let maxNegativeSequence = 0, currentNegativeSequence = 0;
    let exposedNumbers: number[] = [];

    for (let i = 0; i < lastNumbers.length; i++) {
      const number = lastNumbers[i];
      
      if (exposedNumbers.length > 0) {
        entradas++;
        if (exposedNumbers.includes(number) || number === 0) {
          losses++;
          currentNegativeSequence++;
          if (currentNegativeSequence > maxNegativeSequence) {
            maxNegativeSequence = currentNegativeSequence;
          }
        } else {
          wins++;
          currentNegativeSequence = 0;
        }
      }

      exposedNumbers = [];
      for (const key in TORRE_STREETS) {
        if (TORRE_STREETS[key].includes(number)) {
          exposedNumbers = TORRE_STREETS[key];
          break;
        }
      }
    }

    return { entradas, wins, losses, maxNegativeSequence, currentNegativeSequence };
  }, [lastNumbers]);
  // ===== Fim calculadoras =====
  // Janela e cálculo 32P1 para card 32P3
  const [window32P1, setWindow32P1] = useState<number>(0);

  const calculated32P1Stats = React.useMemo(() => {
    const source = window32P1 > 0 ? lastNumbers.slice(-window32P1) : lastNumbers;
    const total = source.length;
    let wins = 0, losses = 0;
    for (const n of source) {
      if (n === 0) { losses++; continue; }
      if (n % 3 === 0) wins++; else losses++;
    }
    const winTotal = wins;
    return { winTotal, wins, losses, total };
  }, [lastNumbers, window32P1]);
  
  // Controle para evitar duplicação de avaliação BET Terminais
  const lastEvaluatedBetTerminais = useRef<string>('');
  // Controle para evitar duplicação de avaliação Torre
  const lastEvaluatedTorre = useRef<string>('');
  // Controle para evitar duplicação de avaliação P2
  const lastEvaluatedP2 = useRef<string>('');

  // Avaliar BET Terminais APÓS atualizar a lista (ativação) e ANTES para classificação - DESABILITADO
  const evaluateBetTerminais_OLD_DISABLED = (selectedNumber: number, currentNumbers: number[]) => {
    const snapshotBefore = currentNumbers; // lista ANTES do novo número
    const snapshotAfter = [...currentNumbers, selectedNumber]; // lista APÓS o novo número

    // Criar chave única para evitar duplicação (considera estado pendente e último número anterior)
    const lastPrevNumber = snapshotBefore[snapshotBefore.length - 1] ?? 'none';
    const evaluationKey = `${selectedNumber}-${snapshotBefore.length}-${lastPrevNumber}-${betTerminaisPendingEntrada ? 'pending' : 'idle'}`;
    if (lastEvaluatedBetTerminais.current === evaluationKey) {
      console.log(`🚫 BET TERMINAIS - Avaliação duplicada evitada para ${selectedNumber} com chave ${evaluationKey}`);
      return;
    }
    lastEvaluatedBetTerminais.current = evaluationKey;

    // Contagens ANTES e APÓS
    const countsBefore = Array(10).fill(0);
    snapshotBefore.forEach(n => { countsBefore[Math.abs(n) % 10]++; });
    const countsAfter = Array(10).fill(0);
    snapshotAfter.forEach(n => { countsAfter[Math.abs(n) % 10]++; });

    // Ordenar terminais por frequência
    const terminaisBefore = countsBefore.map((count, terminal) => ({ terminal, count }))
      .sort((a, b) => b.count - a.count || a.terminal - b.terminal);
    const terminaisAfter = countsAfter.map((count, terminal) => ({ terminal, count }))
      .sort((a, b) => b.count - a.count || a.terminal - b.terminal);

    const leastThreeBefore = terminaisBefore.slice(-3).map(t => t.terminal);
    const leastThreeAfter = terminaisAfter.slice(-3).map(t => t.terminal);

    const terminal = Math.abs(selectedNumber) % 10;

    // Fase de ATIVAÇÃO: só ativa se, APÓS atualizar a lista, o terminal do número selecionado
    // faz parte dos 3 menos frequentes atualizados
    if (!betTerminaisPendingEntrada) {
      if (leastThreeAfter.includes(terminal)) {
        setBetTerminaisPendingEntrada(true);
        setAnimatingBetTerminais('yellow');
        // Contabiliza Entrada na ativação da borda
        setBetTerminaisEntradas(prev => prev + 1);
        if (avisosSonorosAtivos) {
          try { soundGenerator.playBellSound(); } catch {}
        }
      }
      // Não classifica WIN/LOSS neste mesmo número
      return;
    }

    // Fase de CLASSIFICAÇÃO: comparar número atual com os 3 menos frequentes ANTES dele
    const inLeastThreeBefore = leastThreeBefore.includes(terminal);

    if (inLeastThreeBefore) {
      // LOSS enquanto o padrão estiver ativo
      setBetTerminaisLosses(prev => prev + 1);
      // Contabiliza Entrada sempre que LOSS é incrementado
      setBetTerminaisEntradas(prev => prev + 1);
      setBetTerminaisNegSeqCurrent(prev => {
        const next = prev + 1;
        setBetTerminaisNegSeqMax(m => Math.max(m, next));
        return next;
      });
      setBetTerminaisPosSeqCurrent(0);
      // Mantém a borda ativa e continua aguardando WIN
    } else {
      // WIN: remover borda e encerrar padrão
      setBetTerminaisWins(prev => prev + 1);
      setBetTerminaisNegSeqCurrent(0);
      setBetTerminaisPosSeqCurrent(prev => {
        const next = prev + 1;
        setBetTerminaisPosSeqMax(m => Math.max(m, next));
        return next;
      });
      setAnimatingBetTerminais(undefined);
      setBetTerminaisPendingEntrada(false);
    }
  };

  // Recalcular BET Terminais a partir de lastNumbers (após cargas em lote/simulações)
  const recalculateBetTerminaisFromLastNumbers = () => {
    // Passo determinístico: computa Entradas/WIN/LOSS sem depender de estados incrementais
    let wins = 0;
    let losses = 0;
    let entradas = 0;
    let negSeqCurrent = 0;
    let negSeqMax = 0;
    let posSeqCurrent = 0;
    let posSeqMax = 0;
    let pending = false;

    const countTerminalsAsc = (nums: number[]) => {
      const counts = Array(10).fill(0);
      for (const n of nums) counts[Math.abs(n) % 10]++;
      return counts.map((count, terminal) => ({ terminal, count }))
        .sort((a, b) => a.count - b.count || a.terminal - b.terminal);
    };

    for (let i = 0; i < lastNumbers.length; i++) {
      const selected = lastNumbers[i];
      const terminal = Math.abs(selected) % 10;
      const before = lastNumbers.slice(0, i);
      const after = lastNumbers.slice(0, i + 1);

      const leastThreeBefore = countTerminalsAsc(before).slice(0, 3).map(t => t.terminal);
      const leastThreeAfter = countTerminalsAsc(after).slice(0, 3).map(t => t.terminal);

      if (!pending) {
        if (leastThreeAfter.includes(terminal)) {
          pending = true;
          entradas++;
        }
      } else {
        const inLeastBefore = leastThreeBefore.includes(terminal);
        if (inLeastBefore) {
          losses++;
          entradas++;
          negSeqCurrent++;
          if (negSeqCurrent > negSeqMax) negSeqMax = negSeqCurrent;
          posSeqCurrent = 0;
        } else {
          wins++;
          negSeqCurrent = 0;
          posSeqCurrent++;
          if (posSeqCurrent > posSeqMax) posSeqMax = posSeqCurrent;
          pending = false;
        }
      }
    }

    setBetTerminaisWins(wins);
    setBetTerminaisLosses(losses);
    setBetTerminaisEntradas(entradas);
    setBetTerminaisNegSeqCurrent(negSeqCurrent);
    setBetTerminaisNegSeqMax(negSeqMax);
    setBetTerminaisPosSeqCurrent(posSeqCurrent);
    setBetTerminaisPosSeqMax(posSeqMax);
    setBetTerminaisPendingEntrada(pending);
    setAnimatingBetTerminais(pending ? 'yellow' : undefined);

    lastEvaluatedBetTerminais.current = '';
  };

  // Avaliar Torre: ativa borda nos números de entrada e classifica próximo(s) números
  const evaluateTorre = (selectedNumber: number, currentNumbersSnapshot?: number[]) => {
    const snapshot = currentNumbersSnapshot ?? lastNumbers;
    // Recriar o estado de exposição baseado no último número
    const lastNumber = snapshot[snapshot.length - 1];
    
    // Evitar avaliação duplicada para o mesmo número e snapshot
    const evaluationKey = `torre-${selectedNumber}-${snapshot.length}-${lastNumber ?? 'none'}`;
    if (lastEvaluatedTorre.current === evaluationKey) {
      return;
    }
    lastEvaluatedTorre.current = evaluationKey;

    // 1. Verificar se havia aposta pendente (baseado no último número)
    let exposedNumbers: number[] = [];
    if (lastNumber !== undefined) {
      for (const key in TORRE_STREETS) {
        if (TORRE_STREETS[key].includes(lastNumber)) {
          exposedNumbers = TORRE_STREETS[key];
          break;
        }
      }
    }

    // Se havia números expostos, avaliar WIN/LOSS
    if (exposedNumbers.length > 0) {
      // setTorreEntradasCount(prev => prev + 1); // Contagem implícita no useMemo
      const isLoss = exposedNumbers.includes(selectedNumber) || selectedNumber === 0;
      
      if (isLoss) {
        setTorreLossCount(prev => prev + 1);
        // setAnimatingTorre('yellow'); // Removido conforme solicitação
      } else {
        setTorreWinCount(prev => prev + 1);
        setAnimatingTorre('green');
        setTimeout(() => {
          clearTorreVisuals();
        }, 1000);
      }
    }

    // 2. Definir próxima exposição (Status Visual)
    let nextExposed = false;
    for (const key in TORRE_STREETS) {
      if (TORRE_STREETS[key].includes(selectedNumber)) {
        nextExposed = true;
        break;
      }
    }
    
    if (nextExposed) {
      setTorrePendingEntrada(true);
      // Sem borda amarela na entrada (solicitação do usuário)
      // setAnimatingTorre(prev => prev === 'green' ? 'green' : 'yellow');
    } else {
      setTorrePendingEntrada(false);
      setAnimatingTorre(prev => prev === 'green' ? 'green' : undefined);
    }
  };

  // Recalcular Torre a partir de lastNumbers (após cargas em lote/simulações)
  const recalculateTorreFromLastNumbers = () => {
    let wins = 0;
    let losses = 0;
    let exposedNumbers: number[] = [];
    let pending = false;

    for (let i = 0; i < lastNumbers.length; i++) {
      const number = lastNumbers[i];
      
      if (exposedNumbers.length > 0) {
         if (exposedNumbers.includes(number) || number === 0) {
           losses++;
         } else {
           wins++;
         }
      }
      
      exposedNumbers = [];
      for (const key in TORRE_STREETS) {
        if (TORRE_STREETS[key].includes(number)) {
          exposedNumbers = TORRE_STREETS[key];
          break;
        }
      }
    }

    setTorreWinCount(wins);
    setTorreLossCount(losses);
    setTorrePendingEntrada(exposedNumbers.length > 0);
    setAnimatingTorre(undefined);
  };

  // Avaliar P2 com modos 1 (um gatilho) e 2 (dois gatilhos consecutivos)
  const evaluateP2 = (selectedNumber: number, currentNumbersSnapshot: number[]) => {
    const lastPrevNumber = currentNumbersSnapshot[currentNumbersSnapshot.length - 1] ?? 'none';
    const evaluationKey = `p2-${selectedNumber}-${currentNumbersSnapshot.length}-${lastPrevNumber}-${p2PendingEntrada ? 'pending' : 'idle'}-${p2Mode}`;
    if (lastEvaluatedP2.current === evaluationKey) return;
    lastEvaluatedP2.current = evaluationKey;

    const isEntry = P2_ENTRY_NUMBERS.includes(selectedNumber);
    const prev = currentNumbersSnapshot[currentNumbersSnapshot.length - 1];
    const prevIsEntry = P2_ENTRY_NUMBERS.includes(prev);

    if (!p2PendingEntrada) {
      const shouldActivate = p2Mode === 1 ? isEntry : (isEntry && prevIsEntry);
      if (shouldActivate) {
        setP2PendingEntrada(true);
        setAnimatingP2('yellow');
        if (avisosSonorosAtivos) {
          try { soundGenerator.playBellSound(); } catch {}
        }
        return; // aguarda próximo para classificar
      }
      return;
    }

    // Já pendente: classificar próximo número
    if (P2_ENTRY_NUMBERS.includes(selectedNumber)) {
      setP2LossCount(c => c + 1);
      setAnimatingP2('yellow');
    } else {
      setP2WinCount(c => c + 1);
      // Mostrar verde breve no WIN e limpar após pequeno atraso
      setAnimatingP2('green');
      setP2PendingEntrada(false);
      setTimeout(() => {
        setAnimatingP2(undefined);
      }, 350);
    }
  };

  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceDigits, setVoiceDigits] = useState<string>('');
  
  const drawnHistoryRef = useRef<number[]>([]);

  // Atualiza lógica do Espanhol conforme números são adicionados
  useEffect(() => {
    if (!espanholEnabled || espanholLocked) {
      prevLastNumbersLenRef.current = lastNumbers.length;
      return;
    }
    const prevLen = prevLastNumbersLenRef.current;
    if (lastNumbers.length <= prevLen) {
      prevLastNumbersLenRef.current = lastNumbers.length;
      return;
    }
    const newAdded = lastNumbers.slice(prevLen);
    setEspanholChamados(prev => [...prev, ...newAdded].slice(-200));

    const counts = new Map(espanholCountsRef.current);
    const newReps: number[] = [];

    // Começar dos valores atuais dos módulos
    let m1 = espanholModulo1X;
    let m2 = espanholModulo2X;
    let m3 = espanholModulo3X;

    for (const num of newAdded) {
      // Atualiza contagem do número
      const c = (counts.get(num) || 0) + 1;
      counts.set(num, c);
      if (c === 2) {
        newReps.push(num);
      }

      // Quantidade de números repetidos (contagem >= 2)
      const repCount = Array.from(counts.values()).filter(v => v >= 2).length;

      // Incrementar módulos pelo repCount a cada número chamado
      if (m1 < 24) {
        const before = m1;
        m1 = Math.min(24, m1 + repCount);
        const overflow1 = repCount - (m1 - before);
        if (overflow1 > 0) {
          if (m2 < 32) {
            const before2 = m2;
            m2 = Math.min(32, m2 + overflow1);
            const overflow2 = overflow1 - (m2 - before2);
            if (overflow2 > 0) {
              m3 = Math.min(64, m3 + overflow2);
            }
          } else {
            m3 = Math.min(64, m3 + overflow1);
          }
        }
      } else if (m2 < 32) {
        const before2 = m2;
        m2 = Math.min(32, m2 + repCount);
        const overflow2 = repCount - (m2 - before2);
        if (overflow2 > 0) {
          m3 = Math.min(64, m3 + overflow2);
        }
      } else {
        m3 = Math.min(64, m3 + repCount);
      }

      // Vitória quando um número é chamado pela terceira vez (apenas se 'Apostando' estiver ativo)
      if (!espanholWinTriggeredRef.current && c === 3 && apostandoEspanhol) {
        const activeMultiplier = m3 > 0 ? 4 : (m2 > 0 ? 2 : 1);
        setEspanholWinValue(36 * espanholValorInicial * activeMultiplier);
        espanholWinTriggeredRef.current = true;
        if (avisosSonorosAtivos) {
          try { soundGenerator.playBellSound(); } catch {}
        }
        setEspanholLocked(true);
      }
    }

    // Persistir contagens
    espanholCountsRef.current = counts;

    if (newReps.length > 0) {
      setEspanholRepetidos(prev => [...prev, ...newReps]);
    }

    if (apostandoEspanhol) {
      setEspanholModulo1X(m1);
      setEspanholModulo2X(m2);
      setEspanholModulo3X(m3);

      const total = (espanholValorInicial * (m1 * 1 + m2 * 2 + m3 * 4));
      setEspanholTotal(total);
    }

    // Aviso visual será exibido no container quando m3 >= 64


    prevLastNumbersLenRef.current = lastNumbers.length;
  }, [lastNumbers, espanholEnabled, espanholValorInicial, espanholModulo1X, espanholModulo2X, espanholModulo3X, espanholLocked, apostandoEspanhol]);


  // Garantir atualização do BET Terminais e Torre em TODOS os fluxos de adição
  useEffect(() => {
    const prevLen = prevLastNumbersLenRef.current;
    if (lastNumbers.length <= prevLen) {
      prevLastNumbersLenRef.current = lastNumbers.length;
      return;
    }
    for (let i = prevLen; i < lastNumbers.length; i++) {
      const num = lastNumbers[i];
      const prevSnapshot = lastNumbers.slice(0, i);
      // evaluateTorre(num); // DESABILITADO - usando evaluateTorreNumber
      // evaluateP2(num, prevSnapshot); // DESABILITADO - usando evaluateP2Number
      // evaluateBetTerminais(num, prevSnapshot); // DESABILITADO - usando evaluateBetTerminaisNumber
    }
    prevLastNumbersLenRef.current = lastNumbers.length;
  }, [lastNumbers]);

  // Limpa estados do recurso Espanhol
  const clearEspanhol = () => {
    setEspanholChamados([]);
    setEspanholRepetidos([]);
    setEspanholModulo1X(0);
    setEspanholModulo2X(0);
    setEspanholModulo3X(0);
    setEspanholTotal(0);
    setEspanholWinValue(null);
    setEspanholLocked(false);
    espanholCountsRef.current = new Map();
    prevLastNumbersLenRef.current = lastNumbers.length;
    espanholWinTriggeredRef.current = false;
  };

  // Zerar módulos quando toggle 'Apostando' é desmarcado
  useEffect(() => {
    if (!apostandoEspanhol) {
      setEspanholModulo1X(0);
      setEspanholModulo2X(0);
      setEspanholModulo3X(0);
      setEspanholTotal(0);
    }
  }, [apostandoEspanhol]);

  // Estados para destacar números na race quando popup aparecer
  const [highlightedBetNumbers, setHighlightedBetNumbers] = useState<number[]>([]);
  const [highlightedRiskNumbers, setHighlightedRiskNumbers] = useState<number[]>([]);
  const [highlightedBaseNumbers, setHighlightedBaseNumbers] = useState<number[]>([]);
  
  // Estados para o modal de cálculo de lucro
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [showMobileDashboard, setShowMobileDashboard] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [showMobileProfitPage, setShowMobileProfitPage] = useState(false);
  const [showMobileHistoryPage, setShowMobileHistoryPage] = useState(false);
  const [showMobileCreateBalancePage, setShowMobileCreateBalancePage] = useState(false);
  const [recentSaldos, setRecentSaldos] = useState<Array<{ data: string; saldo_inicial: number; saldo_atual: number }>>([]);
  useEffect(() => {
    if (showMobileCreateBalancePage) {
      const last = Number(lastSaldoRecord?.saldo_atual ?? currentSaldoRecord?.saldo_atual ?? balance) || 0;
      setCreateSaldoInicial(last);
      setCreateSaldoAtual(last);
      setCreateDataCadastro(new Date().toISOString().split('T')[0]);
    }
  }, [showMobileCreateBalancePage, lastSaldoRecord, currentSaldoRecord, balance]);
  const [showMobileProfitModal, setShowMobileProfitModal] = useState(false);
  const [profitParams, setProfitParams] = useState({
    days: 30,
    startDate: new Date().toISOString().split('T')[0],
    initialValue: 100.00,
    dailyProfitPercent: 3.00,
    compoundInterest: true
  });
  const [profitResults, setProfitResults] = useState<Array<{
    date: string;
    currentBalance: number;
    dailyProfit: number;
    totalAccumulated: number;
  }>>([]);
  
  // Estado para controlar visibilidade do container de saldo
  const [showSaldoContainer, setShowSaldoContainer] = useState(false);
  
  // Estado para controlar visibilidade do painel maior de saldo
  const [showLargeSaldoPanel, setShowLargeSaldoPanel] = useState(false);
  
  // Estado para contar números sorteados sem padrão detectado
  const [numbersWithoutPattern, setNumbersWithoutPattern] = useState<number>(0);
  
  // Estado para acumular o total de números sem padrão (para calcular média)
  const [totalNumbersWithoutPattern, setTotalNumbersWithoutPattern] = useState<number>(0);
  
  // Estado para contar quantas vezes o popup apareceu (Entrada)
  const [patternDetectedCount, setPatternDetectedCount] = useState<number>(0);

  // Estados para contar WIN e LOSS (Padrão 171)
  const [winCount, setWinCount] = useState<number>(0);
  const [lossCount, setLossCount] = useState<number>(0);
  
  // Estado para controlar a ordem das linhas das estatísticas
  const [statisticsRowOrder, setStatisticsRowOrder] = useState<number>(0); // 0, 1, 2 para diferentes ordens
  
  // Função para alternar a ordem das linhas das estatísticas
  const toggleStatisticsRowOrder = () => {
    setStatisticsRowOrder(prev => {
      const newOrder = (prev + 1) % 3;
      // Feedback visual temporário
      console.log(`🔄 Ordem das linhas alterada: ${prev + 1} → ${newOrder + 1}`);
      return newOrder;
    });
  };
  // Estados para contar WIN e LOSS P2 (persistentes)
  const [p2WinCount, setP2WinCount] = useState<number>(0);
  const [p2LossCount, setP2LossCount] = useState<number>(0);

  // Estados para contar WIN e LOSS Torre (persistentes)
  const [torreWinCount, setTorreWinCount] = useState<number>(0);
  const [torreLossCount, setTorreLossCount] = useState<number>(0);
  // Evitar limpeza imediata: evaluateTorre controla transição verde->clear
  useEffect(() => {
    // noop
  }, [torreWinCount, torrePendingEntrada]);

  // (Removido) Estados para o modal do Padrão 32

  // Estado para controlar se estamos aguardando a próxima dezena após popup
  const [waitingForNextNumber, setWaitingForNextNumber] = useState<boolean>(false);
  const waitingForNextNumberRef = useRef<boolean>(false);
  const [lastPatternNumbers, setLastPatternNumbers] = useState<{covered: number[], risk: number[]}>({covered: [], risk: []});
  const lastPatternNumbersRef = useRef<{covered: number[], risk: number[]}>({covered: [], risk: []});
  const isSimulatingRef = useRef<boolean>(false);

  // Estados para edição inline do saldo no header
  const [isEditingBalance, setIsEditingBalance] = useState<boolean>(false);
  useEffect(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (user && w <= 768) setShowMobileDashboard(true);
  }, [user]);

  useEffect(() => {
    const loadRecent = async () => {
      if (!user) return;
      try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const dataFinal = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        
        const { saldos } = await saldoAPI.getHistory(user.id, undefined, dataFinal);
        const filtered = (saldos || []).slice(0, 4);
        setRecentSaldos(filtered);
      } catch (error) {
        console.error('Erro ao carregar saldos recentes:', error);
        setRecentSaldos([]);
      }
    };
    loadRecent();
  }, [user, showMobileDashboard]);
  const refreshAllUI = async () => {
    if (!user) return;
    await refreshBalance();
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const dataFinal = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      const { saldos } = await saldoAPI.getHistory(user.id, undefined, dataFinal);
      const filtered = (saldos || []).slice(0, 4);
      setRecentSaldos(filtered);
    } catch (error) {
      console.error('Erro ao carregar saldos recentes:', error);
      setRecentSaldos([]);
    }
  };
  const [editBalanceValue, setEditBalanceValue] = useState<string>('');
  const editBalanceInputRef = useRef<HTMLInputElement>(null);
  const createBalanceSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showMobileCreateBalancePage && createBalanceSectionRef.current) {
      createBalanceSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showMobileCreateBalancePage]);

  // Função para iniciar edição do saldo
  const startEditingBalance = () => {
    setEditBalanceValue((balance || 0).toFixed(2));
    setIsEditingBalance(true);
    // Usar setTimeout para garantir que o input seja renderizado antes de focar
    setTimeout(() => {
      if (editBalanceInputRef.current) {
        editBalanceInputRef.current.focus();
        editBalanceInputRef.current.select(); // Seleciona todo o texto
      }
    }, 0);
  };

  // Função para salvar novo saldo
  const saveBalance = async () => {
    const raw = (editBalanceValue || '').trim();
    let normalized = raw;
    if (raw.includes(',') && raw.includes('.')) {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else if (raw.includes(',')) {
      normalized = raw.replace(',', '.');
    } else {
      normalized = raw;
    }
    const newBalance = parseFloat(normalized);
    if (isNaN(newBalance)) {
      alert('Por favor, insira um valor válido');
      return;
    }

    console.log('💾 Salvando saldo via edição rápida:', newBalance);
    console.log('📊 Registro atual:', currentSaldoRecord);
    
    const success = await adjustBalance(newBalance, 'Edição rápida via header');
    if (success) {
      console.log('✅ Saldo salvo com sucesso!');
      setIsEditingBalance(false);
      setEditBalanceValue('');
      await refreshBalance();
    } else {
      console.error('❌ Falha ao salvar saldo');
      alert('Erro ao atualizar saldo. Verifique o console para mais detalhes.');
    }
  };

  // Função para cancelar edição
  const cancelEditingBalance = () => {
    setIsEditingBalance(false);
    setEditBalanceValue('');
  };

  // Função para lidar com teclas durante edição
  const handleBalanceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveBalance();
    } else if (e.key === 'Escape') {
      cancelEditingBalance();
    }
  };

  // useEffect para lidar com a tecla ESC e notificação sonora
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && patternAlert) {
        setPatternAlert(null);
      }
    };

    // Adicionar listener para tecla ESC
    document.addEventListener('keydown', handleKeyDown);

    // Tocar som quando o popup aparecer (apenas se avisos sonoros estiverem ativos)
    if (patternAlert && avisosSonorosAtivos) {
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
  }, [patternAlert, avisosSonorosAtivos]);

  // useEffect para inicializar o reconhecimento de voz - VERSÃO ORIGINAL QUE FUNCIONAVA
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';
      recognitionInstance.maxAlternatives = 3;

      // Opcional: adicionar gramática com vocabulário de números para melhorar acurácia
      try {
        const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
        if (SpeechGrammarList) {
          const grammarList = new SpeechGrammarList();
          const palavras = [
            'zero','um','dois','três','tres','quatro','cinco','seis','sete','oito','nove','dez','onze','doze',
            'treze','quatorze','catorze','quinze','dezesseis','dezessete','dezoito','dezenove',
            'vinte','vinte e um','vinte um','vinte e dois','vinte dois','vinte e três','vinte tres','vinte três',
            'vinte e quatro','vinte quatro','vinte e cinco','vinte cinco','vinte e seis','vinte seis','vinte e sete','vinte sete',
            'vinte e oito','vinte oito','vinte e nove','vinte nove',
            'trinta','trinta e um','trinta um','trinta e dois','trinta dois','trinta e três','trinta tres','trinta três',
            'trinta e quatro','trinta quatro','trinta e cinco','trinta cinco','trinta e seis','trinta seis'
          ];
          const jsgf = `#JSGF V1.0; grammar numeros; public <numero> = ${palavras.join(' | ')} ;`;
          grammarList.addFromString(jsgf, 1);
          recognitionInstance.grammars = grammarList;
        }
      } catch (e) {
        console.warn('Gramática de voz não suportada, continuando sem ela');
      }
      
      // Configurações para ser mais tolerante a pausas
      if ('webkitSpeechRecognition' in window) {
        recognitionInstance.webkitContinuous = true;
        recognitionInstance.webkitInterimResults = true;
      }
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        // Processar resultados finais e também intermediários com confiança moderada
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            console.log('✅ FINAL:', result[0].transcript);
          } else if (result[0].confidence >= 0.4) {
            interimTranscript += result[0].transcript;
            console.log('⚡ INTERMEDIÁRIO:', result[0].transcript, 'Confiança:', result[0].confidence);
          }
        }
        // Atualizar buffer de voz para feedback em tempo real e inserir números em tempo real
        if (interimTranscript.trim()) {
          setVoiceBuffer(interimTranscript.trim());
          processVoiceInputContinuous(interimTranscript, 'interim');
        }
        // Confirmar números quando houver parte final
        if (finalTranscript.trim()) {
          processVoiceInputContinuous(finalTranscript, 'final');
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          // Reiniciar automaticamente em caso de erro de captura
          if (isListening) {
            setTimeout(() => {
              recognitionInstance.start();
            }, 1000);
          }
        } else {
          setIsListening(false);
        }
      };
      
      recognitionInstance.onend = () => {
        console.log('Reconhecimento terminou');
        // Reiniciar com delay curto para capturar todos os números
        // mas permitir pausas naturais na fala
        if (isListening) {
          setTimeout(() => {
            if (isListening) {
              try {
                recognitionInstance.start();
                console.log('Reconhecimento reiniciado');
              } catch (error) {
                console.error('Erro ao reiniciar:', error);
              }
            }
          }, 500); // 0.5 segundos - reinicia rápido sem perder números
        }
      };
      
      setRecognition(recognitionInstance);
    }
  }, [isListening]);

  // useEffect para adicionar event listener de Ctrl+V (colar imagem)
  useEffect(() => {
    if (!showAddNumbersModal) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const numbers = await handlePasteImage(event);
      
      if (numbers) {
        // Adicionar números extraídos ao input existente
        const currentInput = addNumbersInput.trim();
        const newInput = currentInput 
          ? `${currentInput},${numbers}` 
          : numbers;
        
        setAddNumbersInput(newInput);
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [showAddNumbersModal, addNumbersInput, handlePasteImage]);

  // Função para processar entrada de voz contínua em tempo real
  const processVoiceInputContinuous = (transcript: string, commitMode: 'interim' | 'final' = 'final') => {
    console.log('🎤 RECEBIDO:', transcript, 'commitMode:', commitMode);
    
    // Evitar processar transcripts vazios ou muito curtos
    if (!transcript || transcript.trim().length < 2) {
      console.log('❌ Transcript muito curto, ignorando');
      return;
    }
    
    // Contar quantos números já foram processados para reiniciar preventivamente
    const currentNumbers = addNumbersInput.split(',').filter(n => n.trim()).length;
    console.log(`📊 NÚMEROS JÁ PROCESSADOS: ${currentNumbers}`);
    
    // Converter palavras em números - cobre variações com/sem acento e com/sem "e"
    const wordToNumber: { [key: string]: string } = {
      // Números compostos com zero primeiro (mais específicos)
      'zero um': '1', 'zero dois': '2', 'zero três': '3', 'zero tres': '3', 'zero quatro': '4', 
      'zero cinco': '5', 'zero seis': '6', 'zero sete': '7', 'zero oito': '8', 'zero nove': '9',
      
      // Números simples
      'zero': '0', 'um': '1', 'dois': '2', 'três': '3', 'tres': '3', 'quatro': '4', 'cinco': '5',
      'seis': '6', 'sete': '7', 'oito': '8', 'nove': '9', 'dez': '10',
      'onze': '11', 'doze': '12', 'treze': '13', 'quatorze': '14', 'catorze': '14', 'quinze': '15',
      'dezesseis': '16', 'dezessete': '17', 'dezoito': '18', 'dezenove': '19',
      
      // Vinte com variações de ligação
      'vinte': '20', 'vinte e um': '21', 'vinte e dois': '22', 'vinte e três': '23', 'vinte e tres': '23',
      'vinte e quatro': '24', 'vinte e cinco': '25', 'vinte e seis': '26',
      'vinte e sete': '27', 'vinte e oito': '28', 'vinte e nove': '29',
      'vinte um': '21', 'vinte dois': '22', 'vinte tres': '23', 'vinte três': '23', 'vinte quatro': '24',
      'vinte cinco': '25', 'vinte seis': '26', 'vinte sete': '27', 'vinte oito': '28', 'vinte nove': '29',
      
      // Trinta
      'trinta': '30', 'trinta e um': '31', 'trinta e dois': '32', 'trinta e três': '33', 'trinta e tres': '33',
      'trinta e quatro': '34', 'trinta e cinco': '35', 'trinta e seis': '36',
      'trinta um': '31', 'trinta dois': '32', 'trinta tres': '33', 'trinta três': '33', 'trinta quatro': '34',
      'trinta cinco': '35', 'trinta seis': '36'
    };

    let processedText = transcript.toLowerCase().trim();
    
    // Primeiro, substituir números compostos (mais específicos primeiro)
    Object.keys(wordToNumber)
      .sort((a, b) => b.length - a.length) // Ordenar por tamanho decrescente
      .forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        processedText = processedText.replace(regex, wordToNumber[word]);
      });

    console.log('📝 ANTES:', transcript);
    console.log('🔄 DEPOIS:', processedText);

    // Extrair sequências de dígitos e dividir em pares de 2 dígitos
    const tokenMatches = processedText.match(/\d+/g) || [];
    const twoDigitPairs: string[] = [];
    for (let i = 0; i < tokenMatches.length; i++) {
      const t = tokenMatches[i];
      if (t.length === 1) {
        // Tratar dígitos soltos como "0X" para manter dois dígitos
        twoDigitPairs.push(('0' + t).slice(-2));
      } else if (t.length === 2) {
        twoDigitPairs.push(t);
      } else {
        // Cortar sequências longas em pares: "2824" => ["28","24"]
        for (let j = 0; j < t.length; j += 2) {
          const pair = t.slice(j, j + 2);
          twoDigitPairs.push(pair.length === 2 ? pair : ('0' + pair));
        }
      }
    }
    
    // Mesclar padrão especial "0" seguido de dígito único quando vierem como tokens separados
    // (casos como "zero quatro" transcritos em "0" e "4")
    const mergedPairs: string[] = [];
    for (let i = 0; i < twoDigitPairs.length; i++) {
      const p = twoDigitPairs[i];
      if (p === '00' && (i + 1) < twoDigitPairs.length && /^0[1-9]$/.test(twoDigitPairs[i + 1])) {
        // "00" + "0X" => manter apenas "0X" (evita inserir "00" extra)
        mergedPairs.push(twoDigitPairs[i + 1]);
        i++;
      } else {
        mergedPairs.push(p);
      }
    }
    
    // Filtrar números válidos (00-36)
    const numbers = mergedPairs.filter(t => {
      const n = parseInt(t);
      return !isNaN(n) && n >= 0 && n <= 36;
    });
    
    if (numbers.length > 0) {
      console.log('🔢 NÚMEROS ENCONTRADOS:', numbers);
      
      // Formatar números para 2 dígitos e adicionar vírgula
      const formattedNumbers = numbers.map(num => {
        const number = parseInt(num);
        if (number >= 0 && number <= 36) {
          return number.toString().padStart(2, '0');
        }
        return null;
      }).filter(Boolean) as string[];
      
      // Adicionar números ao campo de texto se temos números válidos
      if (formattedNumbers.length > 0) {
        // No interim, evitar duplicações simples contra os últimos pares adicionados
        const toAppend = commitMode === 'interim'
          ? formattedNumbers.filter(p => {
              const recent = lastAppendedPairsRef.current.slice(-3);
              return !recent.includes(p);
            })
          : formattedNumbers;
        if (toAppend.length === 0) {
          return;
        }
        const currentInput = addNumbersInput;
        const newNumbers = toAppend.join(',');
        
        // Adicionar ao final para manter ordem cronológica
        const newInput = currentInput ? `${currentInput},${newNumbers}` : newNumbers;
        
        console.log('Números formatados:', toAppend);
        
        setAddNumbersInput(newInput);
        // Atualizar rastro de pares adicionados
        lastAppendedPairsRef.current.push(...toAppend);
        if (lastAppendedPairsRef.current.length > 50) {
          lastAppendedPairsRef.current = lastAppendedPairsRef.current.slice(-50);
        }
        
        // Reinício preventivo desabilitado (evitar interrupções durante ditado longo)
        const totalNumbers = newInput.split(',').filter(n => n.trim()).length;
        if (totalNumbers > 0 && totalNumbers % 100 === 0 && recognition && isListening) {
          console.log(`🔄 REINÍCIO PREVENTIVO (raro) após ${totalNumbers} números`);
          setTimeout(() => {
            if (recognition && isListening) {
              try {
                recognition.stop();
                setTimeout(() => {
                  if (isListening) {
                    recognition.start();
                    console.log('✅ Reconhecimento reiniciado preventivamente');
                  }
                }, 200);
              } catch (error) {
                console.error('Erro no reinício preventivo:', error);
              }
            }
          }, 200);
        }
      }
    }
  };

  // Função para detectar se é dispositivo móvel
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Função para verificar permissão de microfone específica para modal
  const checkModalMicrophonePermission = async () => {
    try {
      console.log('Verificando permissão de microfone para modal...');
      
      // Para dispositivos móveis, verificar permissões explicitamente
      if (isMobileDevice()) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('Status da permissão:', permission.state);
        
        if (permission.state === 'denied') {
          alert('Permissão de microfone negada. Vá em Configurações > Site > Permissões e permita o acesso ao microfone.');
          return false;
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      console.log('Permissão de microfone concedida para modal');
      
      // Parar o stream imediatamente após verificar a permissão
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Erro ao verificar permissão de microfone para modal:', error);
      
      let errorMessage = 'Erro ao acessar microfone: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permissão negada. Permita o acesso ao microfone nas configurações do navegador.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Microfone não encontrado.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Microfone está sendo usado por outro aplicativo.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      return false;
    }
  };

  // Função para iniciar/parar reconhecimento de voz - VERSÃO ORIGINAL
  const toggleVoiceRecognition = async () => {
    if (!recognition) {
      alert('Reconhecimento de voz não suportado neste navegador');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setVoiceBuffer('');
    } else {
      // Verificar permissão de microfone antes de iniciar
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        return;
      }
      try {
        recognition.start();
        setIsListening(true);
      } catch (error: any) {
        console.error('Erro ao iniciar reconhecimento:', error);
        alert('Erro ao iniciar reconhecimento de voz: ' + (error?.message || 'desconhecido'));
      }
    }
  };

  // Função para processar entrada de voz contínua da roleta (baseada na que funciona)
  const processRouletteVoiceInputContinuous = (transcript: string) => {
    console.log('Processando entrada de voz da roleta (contínua):', transcript);
    
    // Atualizar popup com o que foi falado
    setVoiceTranscript(transcript);
    setShowVoicePopup(true);
    
    // Converter palavras em números (mesma lógica da tela principal)
    const wordToNumber: { [key: string]: string } = {
      'zero': '0', 'um': '1', 'dois': '2', 'três': '3', 'quatro': '4', 'cinco': '5',
      'seis': '6', 'sete': '7', 'oito': '8', 'nove': '9', 'dez': '10',
      'onze': '11', 'doze': '12', 'treze': '13', 'quatorze': '14', 'quinze': '15',
      'dezesseis': '16', 'dezessete': '17', 'dezoito': '18', 'dezenove': '19',
      'vinte': '20', 'vinte e um': '21', 'vinte e dois': '22', 'vinte e três': '23',
      'vinte e quatro': '24', 'vinte e cinco': '25', 'vinte e seis': '26',
      'vinte e sete': '27', 'vinte e oito': '28', 'vinte e nove': '29',
      'trinta': '30', 'trinta e um': '31', 'trinta e dois': '32', 'trinta e três': '33',
      'trinta e quatro': '34', 'trinta e cinco': '35', 'trinta e seis': '36'
    };

    let processedText = transcript.toLowerCase().trim();
    
    // Substituir palavras por números
    Object.keys(wordToNumber).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      processedText = processedText.replace(regex, wordToNumber[word]);
    });

    // Extrair apenas dígitos individuais
    const digits = processedText.match(/\d/g);
    
    if (digits) {
      console.log('Dígitos extraídos:', digits);
      
      // Adicionar cada dígito ao buffer
      let newBuffer = rouletteVoiceBuffer;
      digits.forEach(digit => {
        newBuffer += digit;
      });
      
      console.log('Novo buffer:', newBuffer);
      
      // Processar buffer para formar números de 2 dígitos
      let numbersAdded = false;
      let currentBuffer = newBuffer;
      
      while (currentBuffer.length >= 2) {
        const twoDigits = currentBuffer.substring(0, 2);
        const number = parseInt(twoDigits);
        
        console.log('Processando par:', twoDigits, 'Número:', number);
        
        if (number >= 0 && number <= 36) {
          console.log(`Adicionando número ${number} aos últimos números via voz`);
          addToLastNumbers(number);
          addToHistoryWithoutPopup(number); // Adicionar ao histórico para atualizar estatísticas
          numbersAdded = true;
          currentBuffer = currentBuffer.substring(2);
          
          // Atualizar popup com o número adicionado
          setVoiceDigits(`${number.toString().padStart(2, '0')}`);
        } else {
          // Se o número não é válido, tentar com apenas 1 dígito
          const oneDigit = currentBuffer.substring(0, 1);
          const singleNumber = parseInt(oneDigit);
          if (singleNumber >= 0 && singleNumber <= 9) {
            console.log(`Adicionando número 0${singleNumber} aos últimos números via voz`);
            addToLastNumbers(singleNumber);
            addToHistoryWithoutPopup(singleNumber); // Adicionar ao histórico para atualizar estatísticas
            numbersAdded = true;
            setVoiceDigits(`0${singleNumber}`);
            currentBuffer = currentBuffer.substring(1);
          } else {
            currentBuffer = currentBuffer.substring(1);
          }
        }
      }
      
      // Atualizar o buffer com os dígitos restantes
      setRouletteVoiceBuffer(currentBuffer);
      console.log('Buffer restante:', currentBuffer);
      
      // Se números foram adicionados, fechar popup após delay
      if (numbersAdded) {
        setTimeout(() => {
          setShowVoicePopup(false);
          setVoiceTranscript('');
          setVoiceDigits('');
          setRouletteVoiceBuffer(''); // Limpar buffer após sucesso
        }, 1500);
      }
    }
  };

  // Função para verificar permissão de microfone
  const checkMicrophonePermission = async () => {
    try {
      console.log('Verificando permissão de microfone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Permissão de microfone concedida');
      // Parar o stream imediatamente após verificar a permissão
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Erro ao verificar permissão de microfone:', error);
      alert('Permissão de microfone negada. Por favor, permita o acesso ao microfone e tente novamente.');
      return false;
    }
  };

  // Função para iniciar/parar reconhecimento de voz da roleta
  const toggleRouletteVoiceRecognition = async () => {
    console.log('toggleRouletteVoiceRecognition chamado, isRouletteListening:', isRouletteListening);
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isRouletteListening) {
      // Parar reconhecimento
      console.log('Parando reconhecimento de voz');
      if (rouletteRecognition) {
        rouletteRecognition.stop();
      }
      setIsRouletteListening(false);
      setRouletteVoiceBuffer(''); // Limpar buffer ao parar
      setShowVoicePopup(false); // Fechar popup
      setVoiceTranscript('');
      setVoiceDigits('');
    } else {
      // Verificar permissão de microfone primeiro
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        return;
      }

      // Iniciar reconhecimento
      console.log('Iniciando reconhecimento de voz');
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';
      recognitionInstance.maxAlternatives = 1;
      
      console.log('Configuração do reconhecimento:', {
        continuous: recognitionInstance.continuous,
        interimResults: recognitionInstance.interimResults,
        lang: recognitionInstance.lang,
        maxAlternatives: recognitionInstance.maxAlternatives
      });
      
      recognitionInstance.onstart = () => {
        console.log('Reconhecimento de voz iniciado com sucesso');
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Erro no reconhecimento de voz da roleta:', event.error);
        console.error('Detalhes do erro:', event);
        
        let errorMessage = 'Erro no reconhecimento de voz: ';
        switch (event.error) {
          case 'not-allowed':
            errorMessage += 'Permissão negada. Permita o acesso ao microfone.';
            break;
          case 'no-speech':
            errorMessage += 'Nenhuma fala detectada.';
            break;
          case 'audio-capture':
            errorMessage += 'Erro na captura de áudio.';
            break;
          case 'network':
            errorMessage += 'Erro de rede.';
            break;
          default:
            errorMessage += event.error;
        }
        
        setVoiceTranscript(errorMessage);
        
        // Parar reconhecimento em caso de erro crítico
        if (['not-allowed', 'audio-capture'].includes(event.error)) {
          setIsRouletteListening(false);
          setShowVoicePopup(false);
        }
      };
      
      recognitionInstance.onend = () => {
        console.log('Reconhecimento de voz terminou');
        if (isRouletteListening) {
          // Reiniciar automaticamente se ainda estiver ativo
          setTimeout(() => {
            if (isRouletteListening) {
              console.log('Reiniciando reconhecimento automaticamente');
              try {
                recognitionInstance.start();
              } catch (error) {
                console.error('Erro ao reiniciar reconhecimento:', error);
                setIsRouletteListening(false);
                setShowVoicePopup(false);
              }
            }
          }, 100);
        }
      };
      
      setRouletteRecognition(recognitionInstance);
      
      try {
        recognitionInstance.start();
        console.log('Comando start() executado');
        setIsRouletteListening(true);
        setShowVoicePopup(true); // Mostrar popup
      } catch (error) {
        console.error('Erro ao iniciar reconhecimento:', error);
        alert('Erro ao iniciar reconhecimento de voz: ' + error.message);
      }
    }
  };

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
    console.log(`[DEBUG] Detectando padrão no histórico:`, history);
    
    if (history.length < 2) {
      console.log(`[DEBUG] Histórico muito pequeno (${history.length} números)`);
      return null;
    }
    
    // Verificar apenas os últimos 2 números sorteados consecutivamente
    const lastNumber = history[history.length - 1];
    const secondLastNumber = history[history.length - 2];
    
    console.log(`[DEBUG] Últimos 2 números: ${secondLastNumber} e ${lastNumber}`);
    
    // Encontrar posições na sequência da roleta
    const pos1 = ROULETTE_SEQUENCE.indexOf(lastNumber);
    const pos2 = ROULETTE_SEQUENCE.indexOf(secondLastNumber);
    
    console.log(`[DEBUG] Posições na roleta: ${secondLastNumber}(pos ${pos2}) e ${lastNumber}(pos ${pos1})`);
    
    if (pos1 === -1 || pos2 === -1) return null;
    
    // Calcular distância considerando que a roleta é circular
    const distance = Math.min(
      Math.abs(pos1 - pos2),
      37 - Math.abs(pos1 - pos2)
    );
    
    console.log(`[DEBUG] Distância entre números: ${distance}`);
    
    // Se a distância for <= 4 (grupo de até 5 números), detectou padrão
    if (distance <= 4) {
      console.log(`[DEBUG] PADRÃO DETECTADO! Distância ${distance} <= 4`);
      
      const strategy = calculateBettingStrategy([secondLastNumber, lastNumber]);
      
      let message = `Padrão detectado! Os números ${secondLastNumber} e ${lastNumber} saíram consecutivamente em um grupo de ${distance + 1} números na sequência da roleta.`;
      
      if (strategy) {
        message += `\n\n🎯 ESTRATÉGIA DE APOSTA:\nAposte nos números: ${strategy.betNumbers.join(' e ')}\n(cada um com 7 vizinhos de cada lado)\n\n📊 COBERTURA:\n• Números apostados (30): ${strategy.coveredNumbers.join(', ')}\n• Números no risco (7): ${strategy.riskNumbers.join(', ')}`;
        console.log(`[DEBUG] Estratégia calculada:`, strategy);
      }
      
      const alert = {
        numbers: [secondLastNumber, lastNumber],
        positions: [pos2, pos1],
        message: message
      };
      
      console.log(`[DEBUG] Retornando alerta:`, alert);
      return alert;
    } else {
      console.log(`[DEBUG] Sem padrão - distância ${distance} > 4`);
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
      // WIN: quando o número NÃO está nos 7 números de risco
      // LOSS: quando o número ESTÁ nos 7 números de risco
      if (lastPatternNumbersRef.current.risk.includes(number)) {
        setLossCount((prev) => prev + 1);
      } else {
        setWinCount((prev) => prev + 1);
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
      
      // Acumular o valor atual antes de zerar
      setTotalNumbersWithoutPattern((prev) => prev + numbersWithoutPattern);
      
      // Zerar contador de números sem padrão quando padrão é detectado
      setNumbersWithoutPattern(0);

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
    } else {
      // Se não detectou padrão, incrementar contador
      setNumbersWithoutPattern((prev) => prev + 1);
    }
  };

  const addToHistory = (number: number) => {
    // Atualizar histórico de forma síncrona na ref para evitar estado obsoleto
    const updatedHistory = [...drawnHistoryRef.current, number].slice(-20);
    drawnHistoryRef.current = updatedHistory;
    setDrawnHistory(updatedHistory);

    // Se estamos aguardando a próxima dezena após um popup
    if (waitingForNextNumberRef.current) {
      // WIN: quando o número NÃO está nos 7 números de risco
      // LOSS: quando o número ESTÁ nos 7 números de risco
      if (lastPatternNumbersRef.current.risk.includes(number)) {
        setLossCount((prev) => prev + 1);
      } else {
        setWinCount((prev) => prev + 1);
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
      
      // Acumular o valor atual antes de zerar
      setTotalNumbersWithoutPattern((prev) => prev + numbersWithoutPattern);
      
      // Zerar contador de números sem padrão quando padrão é detectado
      setNumbersWithoutPattern(0);

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
    } else {
      // Se não detectou padrão, incrementar contador
      setNumbersWithoutPattern((prev) => prev + 1);
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
    setHighlightedBaseNumbers([]);
    setPatternDetectedCount(0);
    setWinCount(0);
    setLossCount(0);
    setP2WinCount(0); // Resetar contadores P2
    setP2LossCount(0); // Resetar contadores P2
    setTorreWinCount(0); // Resetar contadores Torre
    setTorreLossCount(0); // Resetar contadores Torre

    // Resetar BET Terminais
    setBetTerminaisWins(0);
    setBetTerminaisLosses(0);
    setBetTerminaisEntradas(0);
    setBetTerminaisNegSeqCurrent(0);
    setBetTerminaisNegSeqMax(0);
    setBetTerminaisPosSeqCurrent(0);
    setBetTerminaisPosSeqMax(0);
    lastEvaluatedBetTerminais.current = ''; // Resetar controle de duplicação
    
    // Resetar controle de duplicação P2
    lastProcessedP2Key.current = '';
    
    setWaitingForNextNumber(false);
    setLastPatternNumbers({covered: [], risk: []});
    waitingForNextNumberRef.current = false;
    lastPatternNumbersRef.current = {covered: [], risk: []};
    isSimulatingRef.current = false;
    setNumbersWithoutPattern(0); // Zerar contador ao limpar tela
    setTotalNumbersWithoutPattern(0); // Zerar total acumulado ao limpar tela

    // Limpar container do Espanhol clássico
     clearEspanhol();
    prevLastNumbersLenRef.current = 0; // garantir reset do ponteiro de processamento
  };

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'bg-green-600';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'bg-red-700' : 'bg-gray-800';
  };

  const getTextColor = (num: number): string => {
    return 'text-white';
  };

  // Formata valores monetários em BRL
  const formatCurrency = (value: number): string => {
    if (!isFinite(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // (Removido) Função para calcular estatísticas do Padrão 32

  // Função para adicionar número aos últimos sorteados
  const addToLastNumbers = (num: number) => {
    // Se devemos limpar a borda de BET Terminais na próxima jogada (após WIN), faça agora
    if ((window as any).betTerminaisClearOnNext || false) {
      setAnimatingBetTerminais(undefined);
      (window as any).betTerminaisClearOnNext = false;
    }

    // CRÍTICO: Verificar WIN do Padrão Detectado ANTES de adicionar o número
    if (patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && patternAlert.betNumbers) {
      if (patternAlert.betNumbers.includes(num)) {
        console.log(`[CRITICAL WIN] Número ${num} é um WIN do Padrão Detectado! Removendo padrão...`);
        // WIN detectado! Remover o padrão imediatamente
        setPatternAlert(null);
        setHighlightedBetNumbers([]);
        setHighlightedRiskNumbers([]);
        setHighlightedBaseNumbers([]);
      }
    }
    
    // Avaliar P2, TORRE e BET Terminais antes de atualizar demais lógicas
    // evaluateTorre(num, lastNumbers);

    setLastNumbers(prev => {
      const newList = [...prev, num]; // CORREÇÃO: Adicionar no FINAL - ordem cronológica correta
      const updatedList = newList.slice(-60); // Manter apenas os últimos 60
      
      evaluateTorreNumber(num, torrePendingEntrada, setTorrePendingEntrada, setAnimatingTorre, setTorreWinCount, setTorreLossCount, clearTorreVisuals);

      console.log('[DEBUG MAIN] Chamando evaluateBetTerminaisNumber para:', num);
      evaluateBetTerminaisNumber(num, betTerminaisPendingEntrada, setBetTerminaisPendingEntrada, setAnimatingBetTerminais, setBetTerminaisWins, setBetTerminaisLosses, setBetTerminaisEntradas, setBetTerminaisNegSeqCurrent, setBetTerminaisNegSeqMax, setBetTerminaisPosSeqCurrent, setBetTerminaisPosSeqMax, prev);
      
      console.log('[DEBUG MAIN] Chamando evaluateP2Number para:', num);
      evaluateP2Number(num, p2PendingEntrada, setP2PendingEntrada, setAnimatingP2, setP2WinCount, setP2LossCount, prev, p2Mode);

      // Avaliar NovesFora: ativa na entrada (número alvo) e classifica no próximo
      if (!novesForaPendingEntrada) {
        if (NOVES_FORA_ENTRY_SET.has(num)) {
          setNovesForaPendingEntrada(true);
          setAnimatingNovesFora('yellow');
          if (avisosSonorosAtivos) {
            try { soundGenerator.playBellSound(); } catch {}
          }
        }
      } else {
        if (NOVES_FORA_ENTRY_SET.has(num)) {
          // LOSS: mantém pendência e borda amarela
          setAnimatingNovesFora('yellow');
        } else {
          // WIN: mostra verde curto e encerra pendência
          setAnimatingNovesFora('green');
          setNovesForaPendingEntrada(false);
          setTimeout(() => {
            setAnimatingNovesFora(undefined);
          }, 350);
        }
      }
      
      // evaluateP2(num, prev); // DESABILITADO - usando evaluateP2Number
      // Avaliar BET Terminais com a LISTA ANTERIOR (prev) para decidir Entrada,
      // e classificar WIN/LOSS no número atual com base nos 3 menos frequentes antes dele
      // evaluateBetTerminais(num, prev) // DESABILITADO - usando evaluateBetTerminaisNumber
      
      // SOLUÇÃO DEFINITIVA: Verificar sequência específica 18-15-10 EXATA
      let specialSequenceDetected = false;
      
      if (updatedList.length >= 3) {
        const last3 = updatedList.slice(-3);
        
        // Verificar se temos EXATAMENTE a sequência 18-15-10 (nesta ordem)
        const isExactSequence = (last3[0] === 18 && last3[1] === 15 && last3[2] === 10);
        
        // Criar chave única para esta sequência específica
        const sequenceKey = `${last3[0]}-${last3[1]}-${last3[2]}`;
        
        if (isExactSequence && lastProcessedP2Key.current !== sequenceKey) {
          console.log("SEQUÊNCIA ESPECIAL P2 DETECTADA: 18-15-10");
          
          // Marcar AMBAS as chaves como processadas para evitar execução dupla
          lastProcessedP2Key.current = sequenceKey; // Chave de 3 números
          const twoNumberKey = `${last3[1]}-${last3[2]}`; // Chave de 2 números (15-10)
          
          // Usar uma variável global para marcar que já processamos esta sequência
          (window as any).processedP2Sequences = (window as any).processedP2Sequences || new Set();
          (window as any).processedP2Sequences.add(twoNumberKey);
          
          specialSequenceDetected = true;
          
          // Forçar incremento de WIN para P2
          setP2WinCount(prev => prev + 1);
          
          // Sequência especial detectada: apenas incrementa WIN e retorna
          // UI da P2 permanece totalmente controlada por estado no StatisticsCards
          return updatedList; // RETORNAR IMEDIATAMENTE para evitar execução da detecção radical
        }
      }
      
      // P2 logic moved to StatisticsCards.tsx - no duplicate logic here
      
      // Detectar sequências de 3 números seguidos na mesma categoria
      const alerts = detectSequenceAlerts(updatedList);
      setSequenceAlerts(alerts);
      
      // Contar sequências consecutivas para dúzias e colunas
      if (updatedList.length >= 3) {
        const last3 = updatedList.slice(-3);
        
        // Função auxiliar para obter dúzia
        const getDozen = (n: number) => {
          if (n === 0) return null;
          if (n >= 1 && n <= 12) return 1;
          if (n >= 13 && n <= 24) return 2;
          if (n >= 25 && n <= 36) return 3;
          return null;
        };
        
        // Função auxiliar para obter coluna
        const getColumn = (n: number) => {
          if (n === 0) return null;
          if (n % 3 === 0) return 3;
          if (n % 3 === 1) return 1;
          if (n % 3 === 2) return 2;
          return null;
        };
        
        // Contar sequência de dúzias
        const dozens = last3.map(getDozen);
        if (dozens[0] !== null && dozens[0] === dozens[1] && dozens[1] === dozens[2]) {
          // Contar quantos números seguidos na mesma dúzia
          let count = 3;
          for (let i = updatedList.length - 4; i >= 0; i--) {
            if (getDozen(updatedList[i]) === dozens[0]) {
              count++;
            } else {
              break;
            }
          }
          setDozenSequenceCount({ dozen: dozens[0], count });
        } else {
          setDozenSequenceCount(null);
        }
        
        // Contar sequência de colunas
        const columns = last3.map(getColumn);
        if (columns[0] !== null && columns[0] === columns[1] && columns[1] === columns[2]) {
          // Contar quantos números seguidos na mesma coluna
          let count = 3;
          for (let i = updatedList.length - 4; i >= 0; i--) {
            if (getColumn(updatedList[i]) === columns[0]) {
              count++;
            } else {
              break;
            }
          }
          setColumnSequenceCount({ column: columns[0], count });
        } else {
          setColumnSequenceCount(null);
        }
        
        // Função auxiliar para obter cor
        const getColor = (n: number) => {
          const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
          if (n === 0) return 'green';
          return reds.includes(n) ? 'red' : 'black';
        };
        
        // Contar sequência de cores
        const colors = last3.map(getColor);
        if (colors[0] !== 'green' && colors[0] === colors[1] && colors[1] === colors[2]) {
          let count = 3;
          for (let i = updatedList.length - 4; i >= 0; i--) {
            if (getColor(updatedList[i]) === colors[0]) {
              count++;
            } else {
              break;
            }
          }
          setColorSequence({ color: colors[0], count });
        } else {
          setColorSequence(null);
        }
        
        // Função auxiliar para alto/baixo
        const getHighLow = (n: number) => {
          if (n === 0) return null;
          return n >= 1 && n <= 18 ? 'low' : 'high';
        };
        
        // Contar sequência de alto/baixo
        const highLows = last3.map(getHighLow);
        if (highLows[0] !== null && highLows[0] === highLows[1] && highLows[1] === highLows[2]) {
          let count = 3;
          for (let i = updatedList.length - 4; i >= 0; i--) {
            if (getHighLow(updatedList[i]) === highLows[0]) {
              count++;
            } else {
              break;
            }
          }
          setHighLowSequence({ type: highLows[0], count });
        } else {
          setHighLowSequence(null);
        }
        
        // Função auxiliar para par/ímpar
        const getEvenOdd = (n: number) => {
          if (n === 0) return null;
          return n % 2 === 0 ? 'even' : 'odd';
        };
        
        // Contar sequência de par/ímpar
        const evenOdds = last3.map(getEvenOdd);
        if (evenOdds[0] !== null && evenOdds[0] === evenOdds[1] && evenOdds[1] === evenOdds[2]) {
          let count = 3;
          for (let i = updatedList.length - 4; i >= 0; i--) {
            if (getEvenOdd(updatedList[i]) === evenOdds[0]) {
              count++;
            } else {
              break;
            }
          }
          setEvenOddSequence({ type: evenOdds[0], count });
        } else {
          setEvenOddSequence(null);
        }
      }
      
      return updatedList;
    });
  };

  const toggleNumber = (num: number) => {
    setLastSelectedNumber(num);
    
    // Adicionar número aos últimos números
    addToLastNumbers(num);
    
    // Adicionar ao histórico para detecção de padrões (COM popup na seleção manual)
    addToHistory(num);
    
    setSelected(prev => ({
      ...prev,
      numbers: prev.numbers.includes(num)
        ? prev.numbers.filter(n => n !== num)
        : [...prev.numbers, num]
    }));
  };

  // P2 logic completely removed - handled in StatisticsCards.tsx

  // Função para simular sorteio (para teste)
  const simulateDrawing = () => {
    // NÃO marcar como simulação para permitir popup na simulação manual
    const randomNum = Math.floor(Math.random() * 37); // 0-36
    addToLastNumbers(randomNum);
    addToHistory(randomNum); // Usar função COM popup para simulações manuais
    setLastDrawnNumber(randomNum);
    setLastSelectedNumber(randomNum); // Marcar também na race
    // Limpar a borda após 2 segundos
    setTimeout(() => {
      setLastDrawnNumber(null);
    }, 2000);
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
    
    // Marcar como simulação para evitar popup
    isSimulatingRef.current = true;
    
    // Aplicar números em sequência com intervalo de 700ms
    // Ordem: na sequência digitada (10,11,12,13,14 = 10 primeiro, 14 último)
    
    let index = 0;
    const interval = setInterval(() => {
      if (index >= validNumbers.length) {
        clearInterval(interval);
        isSimulatingRef.current = false; // Resetar flag após processar todos os números
        // Recalcular BET Terminais ao final de cargas em lote - DESABILITADO
        // recalculateBetTerminaisFromLastNumbers();
        // Recalcular Torre ao final de cargas em lote - DESABILITADO
        // recalculateTorreFromLastNumbers();
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

  // Padrão 171 forçado removido

  // Função para calcular lucro
  const calculateProfit = () => {
    if (profitParams.initialValue <= 0 || profitParams.dailyProfitPercent <= 0) {
      alert('Por favor, preencha valores válidos para Valor Inicial e % Lucro ao Dia.');
      return;
    }

    const results = [];
    let currentBalance = profitParams.initialValue;
    let totalAccumulated = 0;
    const startDate = new Date(profitParams.startDate);

    for (let day = 0; day < profitParams.days; day++) {
      // Criar data corretamente para evitar problemas de fuso horário
      const [year, month, dayOfMonth] = profitParams.startDate.split('-').map(Number);
      const currentDate = new Date(year, month - 1, dayOfMonth + day);
      
      let dailyProfit;
      if (profitParams.compoundInterest) {
        // Juros compostos: lucro baseado no saldo atual
        dailyProfit = currentBalance * (profitParams.dailyProfitPercent / 100);
      } else {
        // Juros simples: lucro baseado no valor inicial
        dailyProfit = profitParams.initialValue * (profitParams.dailyProfitPercent / 100);
      }
      
      // Registrar linha mostrando o saldo ANTES de aplicar o lucro do dia
      totalAccumulated += dailyProfit;
      results.push({
        date: currentDate.toLocaleDateString('pt-BR'),
        currentBalance: parseFloat(currentBalance.toFixed(2)),
        dailyProfit: parseFloat(dailyProfit.toFixed(2)),
        totalAccumulated: parseFloat(totalAccumulated.toFixed(2))
      });
      // Aplicar lucro ao saldo para o próximo dia
      currentBalance += dailyProfit;
    }

    setProfitResults(results);
  };

  // Função para imprimir resultados
  const printResults = () => {
    if (profitResults.length === 0) return;

    const totalFinalBalance = profitResults[profitResults.length - 1]?.currentBalance || 0;
    const totalProfit = profitResults[profitResults.length - 1]?.totalAccumulated || 0;
    const interestType = profitParams.compoundInterest ? 'Compostos' : 'Simples';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Cálculo de Lucro</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #4CAF50;
            margin: 0;
          }
          .header p {
            margin-top: 10px;
            margin-bottom: 0px;
          }
          .params {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            margin-top: 10px;
          }
          .params h3 {
            margin-top: 0;
            color: #333;
            text-align: center;
            margin-bottom: 20px;
          }
          .params-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            text-align: center;
          }
          .param-item {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .param-label {
            font-weight: bold;
            margin-bottom: 8px;
            color: #555;
            font-size: 14px;
          }
          .param-value {
            background-color: white;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #ddd;
            font-size: 14px;
            color: #333;
            min-width: 80px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            margin-top: -10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
          }
          td:first-child {
            text-align: center;
          }
          .totals {
            background-color: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .totals h3 {
            margin-top: 0;
            color: #2e7d32;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: bold;
          }
          .print-btn {
            position: fixed;
            top: 30px;
            right: 30px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
          }
          .print-btn:hover {
            background-color: #1976D2;
            transform: scale(1.1);
          }
          @media print {
            .print-btn {
              display: none !important;
            }
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 Relatório de Cálculo de Lucro</h1>
          <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        <div class="params">
          <h3>📋 Parâmetros Utilizados</h3>
          <div class="params-grid">
            <div class="param-item">
              <div class="param-label">Quantidade de Dias</div>
              <div class="param-value">${profitParams.days} dias</div>
            </div>
            <div class="param-item">
              <div class="param-label">Data Inicial</div>
              <div class="param-value">${new Date(profitParams.startDate).toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="param-item">
              <div class="param-label">Valor Inicial</div>
              <div class="param-value">R$ ${profitParams.initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="param-item">
              <div class="param-label">% Lucro ao Dia</div>
              <div class="param-value">${profitParams.dailyProfitPercent.toFixed(2)}%</div>
            </div>
            <div class="param-item">
              <div class="param-label">Tipo de Juros</div>
              <div class="param-value">${interestType}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Saldo Atual (R$)</th>
              <th>Lucro Diário (R$)</th>
              <th>Total Acumulado (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${profitResults.map(result => `
              <tr>
                <td>${result.date}</td>
                <td>R$ ${result.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>R$ ${result.dailyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>R$ ${result.totalAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <h3>📊 Resumo Final</h3>
          <div class="total-row">
            <span>Saldo Final:</span>
            <span>R$ ${totalFinalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="total-row">
            <span>Lucro Total:</span>
            <span>R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="total-row">
            <span>Rentabilidade:</span>
            <span>${((totalProfit / profitParams.initialValue) * 100).toFixed(2)}%</span>
          </div>
          <div class="total-row">
            <span>Média Diária:</span>
            <span>R$ ${(totalProfit / profitParams.days).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <button class="print-btn" onclick="window.print()" title="Imprimir Relatório">
          🖨️
        </button>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // Função para simular sorteio automático dos primeiros 60 números
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
      // Recalcular BET Terminais ao finalizar simulação - DESABILITADO
      // recalculateBetTerminaisFromLastNumbers()
      // Recalcular Torre ao finalizar simulação - DESABILITADO
      // recalculateTorreFromLastNumbers()
    } else {
      setIsSimulating(true);
      isSimulatingRef.current = true;
      let count = 0;
      
      const interval = setInterval(() => {
        if (count >= 60) {
          clearInterval(interval);
          setIsSimulating(false);
          isSimulatingRef.current = false;
          setLastDrawnNumber(null); // Limpar borda ao finalizar
          // Recalcular BET Terminais ao finalizar simulação - DESABILITADO
          // recalculateBetTerminaisFromLastNumbers();
          // Recalcular Torre ao finalizar simulação - DESABILITADO
          // recalculateTorreFromLastNumbers();
          return;
        }
        
        const randomNum = Math.floor(Math.random() * 37); // 0-36
        console.log('[DEBUG SIMULAÇÃO] Adicionando número via simulação:', randomNum);
        addToLastNumbers(randomNum);
        addToHistoryWithoutPopup(randomNum); // Usar função sem popup para simulações automáticas
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

  // useEffect para detectar padrão de corrida automaticamente
  useEffect(() => {
    if (lastNumbers.length >= 2) {
      // CRÍTICO: Se já existe um padrão ativo, não detectar novos padrões
      // O padrão só deve ser limpo quando há WIN/LOSS, não re-detectado
      console.log('[DEBUG] Verificando padrão ativo:', { patternAlert: !!patternAlert, type: patternAlert?.type });
      if (patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo) {
        console.log('[DEBUG] Padrão já ativo, não detectando novos padrões');
        return;
      }
      // Converter lastNumbers para o formato esperado pela função checkForRaceCondition
      // CRÍTICO: Reverter ordem pois checkForRaceCondition espera mais recente primeiro
      const reversedNumbers = [...lastNumbers].reverse();
      const history = reversedNumbers.map((number, index) => ({
        number,
        color: getNumberColor(number) as 'green' | 'red' | 'black',
        createdAt: new Date(Date.now() - (index * 1000))
      }));

      const raceResult = checkForRaceCondition(history);
      
      if (raceResult.hasRace) {
        console.log('[DEBUG] Padrão de corrida detectado automaticamente:', {
          ...raceResult,
          riskNumbersDetalhado: raceResult.riskNumbers.map((num, index) => ({
            numero: num,
            posicao: index,
            isPrimeiro: index === 0,
            isUltimo: index === raceResult.riskNumbers.length - 1
          }))
        });
        
        // CRÍTICO: Verificar se já existe um padrão ativo e se o novo número é um WIN
        const lastNumber = lastNumbers[0]; // O número mais recente
        if (patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && patternAlert.betNumbers) {
          if (patternAlert.betNumbers.includes(lastNumber)) {
            console.log(`[CRITICAL WIN DETECTED] Número ${lastNumber} é WIN do padrão ativo! NÃO criando novo padrão.`);
            // WIN detectado! Não criar novo padrão, manter o estado limpo
            return;
          }
        }
        
        // Gerar mensagem do alerta
        const message = `Race detectada! Aposte nos números: ${raceResult.raceNumbers.join(' e ')}\n\nNúmeros no risco (7): ${raceResult.riskNumbers.join(', ')}\n\nCobertura: ${raceResult.coveredNumbers.length} números (${Math.round((raceResult.coveredNumbers.length / 37) * 100)}%)`;
        
        // Só mostrar popup se NÃO estiver simulando
        if (!isSimulatingRef.current) {
          // Definir o alerta do padrão - mostrar os últimos 2 números que geraram o padrão
          const lastTwoNumbers = lastNumbers.slice(-2); // Os 2 últimos números sorteados (penúltimo e último)
          setPatternAlert({
            numbers: lastTwoNumbers,
            positions: lastTwoNumbers.map(num => ROULETTE_SEQUENCE.indexOf(num)),
            message: message,
            type: 'race',
            betNumbers: raceResult.coveredNumbers,  // Os 30 números para apostar (amarelo)
            riskNumbers: raceResult.riskNumbers,    // Os 7 números de risco
            baseNumbers: raceResult.raceNumbers     // Os 2 números base (azul)
          });
          
          // Destacar números conforme o padrão detectado
          setHighlightedBetNumbers(raceResult.coveredNumbers); // Números cobertos (amarelo)
          setHighlightedRiskNumbers(raceResult.riskNumbers); // Números de risco (borda especial)
          setHighlightedBaseNumbers(raceResult.raceNumbers); // Números base para apostar (azul)
          
        }
      } else {
        // Limpar destaques se não há padrão (SEMPRE, mesmo durante simulação)
        setPatternAlert(null);
        setHighlightedBetNumbers([]);
        setHighlightedRiskNumbers([]);
        setHighlightedBaseNumbers([]);
      }
    }
  }, [lastNumbers]);

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

  if (showMobileDashboard) {
    return (
      <div className="min-h-screen bg-gray-100 -mt-8">
        <MobileMenu 
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          onMenuItemClick={(item) => {
            if (item === '4cores') {
              setShowFourColorsMobile(true);
            } else if (item === 'progressao-cores') {
              setShowColorProgressionMobile(true);
            }
          }}
        />
        
        <FourColorsMobile 
          isOpen={showFourColorsMobile}
          onClose={() => setShowFourColorsMobile(false)}
        />
        
        <ColorProgressionMobile 
          isOpen={showColorProgressionMobile}
          onClose={() => setShowColorProgressionMobile(false)}
        />
        
        <div className="bg-green-700 p-3 flex items-center justify-between sticky top-0 z-20">
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <img src="/logo-171.svg" alt="Logo 171" className="w-6 h-6" />
            <div className="text-white font-bold text-sm md:hidden">Roleta 171</div>
          </button>
          <div className="flex items-center gap-2">
            <div className="text-white text-xs">{user?.nome}</div>
            <button
              onClick={() => onLogout && onLogout()}
              className="text-white text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
        <div className="p-3 space-y-3">
          <div className="bg-green-700 rounded-lg p-3 text-white">
            <div className="text-xs font-semibold">Saldo Atualizado</div>
            {isEditingBalance ? (
              <div className="flex items-center gap-2 text-sm justify-end">
                <input
                  ref={editBalanceInputRef}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={editBalanceValue}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/[^\d]/g, '');
                    if (!raw) {
                      setEditBalanceValue('');
                      return;
                    }
                    const cents = raw.slice(-2).padStart(2, '0');
                    let ints = raw.slice(0, -2);
                    ints = ints.replace(/^0+/, '');
                    if (ints.length === 0) ints = '0';
                    const withThousands = ints.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                    const masked = `${withThousands},${cents}`;
                    setEditBalanceValue(masked);
                  }}
                  onBlur={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) return;
                    let normalized = raw;
                    if (raw.includes(',') && raw.includes('.')) {
                      normalized = raw.replace(/\./g, '').replace(',', '.');
                    } else if (raw.includes(',')) {
                      normalized = raw.replace(',', '.');
                    }
                    const num = parseFloat(normalized);
                    if (!isNaN(num)) setEditBalanceValue(num.toFixed(2));
                  }}
                  className="w-28 p-1 rounded text-right text-green-900"
                  step="0.01"
                />
                <button onClick={saveBalance} className="bg-white text-green-700 rounded px-2 py-1 font-semibold">Salvar</button>
                <button onClick={cancelEditingBalance} className="bg-green-600 text-white rounded px-2 py-1">Cancelar</button>
              </div>
            ) : (
              <div className="flex items-center text-sm justify-between w-full">
                <div>
                  <button
                    onClick={refreshAllUI}
                    className="text-white rounded px-[9px] py-[3px] text-[13px] leading-none"
                    title="Atualizar valores da tela"
                    aria-label="Atualizar"
                  >
                    ⟳
                  </button>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span>R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <button onClick={startEditingBalance} className="text-green-200">✏️</button>
                  <span className="text-green-200">|</span>
                  <span>{(() => { const si = currentSaldoRecord?.saldo_inicial || 0; const bal = balance || 0; const lucroPerc = si > 0 ? ((bal - si) / si) * 100 : 0; return `${lucroPerc >= 0 ? '+' : ''}${lucroPerc.toFixed(2)}%`; })()}</span>
                </div>
              </div>
            )}
          </div>

          {!showMobileProfitPage && !showMobileHistoryPage && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowMobileProfitPage(true)} className="bg-blue-600 text-white rounded-lg p-3 text-xs font-semibold">Calcular Lucro</button>
                <button onClick={() => setShowMobileCreateBalancePage(true)} className="bg-amber-600 text-white rounded-lg p-3 text-xs font-semibold">Cadastrar Saldo</button>
              </div>

              <div className="bg-gray-100 rounded-lg p-3">
                <div className="text-[13px] font-semibold -mt-[8px] mb-[6px]">Saldo Atual</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-gray-600">Data</div>
                    <div className="font-bold text-gray-800">{new Date().toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Saldo Inicial</div>
                    <div className="font-bold text-gray-800">R$ {(Number(currentSaldoRecord?.saldo_inicial) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Saldo Atual</div>
                    <div className="font-bold text-gray-800">R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Lucro</div>
                    <div className="font-bold mb-[10px]">
                      {(() => {
                        const si = currentSaldoRecord?.saldo_inicial || 0;
                        const bal = balance || 0;
                        const vlrLucro = bal - si;
                        const perLucro = si > 0 ? (vlrLucro / si) * 100 : 0;
                        return (
                          <div className="flex items-center justify-between">
                            <span className={vlrLucro >= 0 ? 'text-green-600' : 'text-amber-900'}>
                              R$ {vlrLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={perLucro >= 0 ? 'text-green-600' : 'text-red-800'}>
                              {`${perLucro >= 0 ? '+' : ''}${perLucro.toFixed(2)}%`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { p: 0.0234, bg: 'bg-blue-50', text: 'text-blue-800', sub: 'text-blue-600' },
                    { p: 0.0373, bg: 'bg-blue-100', text: 'text-blue-800', sub: 'text-blue-600' },
                    { p: 0.0473, bg: 'bg-blue-200', text: 'text-blue-900', sub: 'text-blue-700' },
                    { p: 0.10,   bg: 'bg-blue-300', text: 'text-blue-900', sub: 'text-blue-700' }
                  ].map((it, idx) => (
                    <div key={idx} className={`text-center ${it.bg} rounded p-2 border border-blue-400 -mt-[6px] -mb-[6px]`}>
                      <div className="text-blue-700 text-xs">{(it.p * 100).toFixed(2)}%</div>
                      <div className={`${it.text} font-bold text-xs`}>R$ {((Number(currentSaldoRecord?.saldo_inicial) || 0) * (1 + it.p)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className={`${it.sub} text-[11px]`}>({((Number(currentSaldoRecord?.saldo_inicial) || 0) * it.p).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="-mt-[8px] bg-white rounded-lg border border-gray-200 p-2">
                <div className="h-[150px]">
                  {(() => {
                    const todayLabel = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const recentAsc = [...recentSaldos.slice(0, 4)].reverse();
                    const labels = [
                      ...recentAsc.map((s) => {
                        const [ano, mes, dia] = s.data.split('-');
                        return `${dia}/${mes}`;
                      }),
                      todayLabel
                    ];
                    const values = [
                      ...recentAsc.map((s) => Number(s.saldo_atual || 0)),
                      (balance || 0)
                    ];
                    const profits = [
                      ...recentAsc.map((s) => Number(s.saldo_atual || 0) - Number(s.saldo_inicial || 0)),
                      Number(balance || 0) - Number(currentSaldoRecord?.saldo_inicial || 0)
                    ];
                    const data: any = {
                      labels,
                      datasets: [
                        {
                          data: values,
                          backgroundColor: profits.map((p) => p < 0 ? 'rgba(255,182,193,0.85)' : 'rgba(16,185,129,0.7)'),
                          borderColor: profits.map((p) => p < 0 ? 'rgba(255,182,193,1)' : '#10b981'),
                          borderWidth: 1,
                          borderRadius: 4,
                          profits
                        }
                      ]
                    };
                    const options = {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false } },
                        y: { grid: { display: false } }
                      }
                    };
                    return <Bar data={data} options={options as any} />;
                  })()}
                </div>
              </div>

              <div>
                <button onClick={() => setShowMobileHistoryPage(true)} className="w-full bg-purple-600 text-white rounded-lg p-3 text-xs font-semibold">Histórico de Saldos</button>
              </div>
              <div className="mt-2 bg-white rounded-lg border border-gray-200">
                <div className="px-2 py-1 border-b">
                  <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold text-gray-700">
                    <div>Data</div>
                    <div className="text-right">Sld Inicial</div>
                    <div className="text-right">Sld Final</div>
                    <div className="text-right">Vlr Lucro</div>
                    <div className="text-right">% Lucro</div>
                  </div>
                </div>
                <div className="px-2 py-1">
                  {recentSaldos.length === 0 ? (
                    <div className="text-center text-[11px] text-gray-500">Sem registros</div>
                  ) : (
                    <div className="space-y-1">
                      {recentSaldos.slice(0,4).map((s, i) => {
                        const saldoAtual = Number(s.saldo_atual || 0);
                        const saldoInicial = Number(s.saldo_inicial || 0);
                        const vlrLucro = saldoAtual - saldoInicial;
                        const perLucro = saldoInicial > 0 ? (vlrLucro / saldoInicial) * 100 : 0;
                        const [ano, mes, dia] = s.data.split('-');
                        return (
                          <div key={i} className="grid grid-cols-5 gap-1 text-[11px]">
                            <div className="text-gray-700">{`${dia}/${mes}/${ano.slice(2)}`}</div>
                            <div className="text-right">{saldoInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="text-right">{saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className={`text-right ${vlrLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`}>{vlrLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className={`text-right ${perLucro >= 0 ? 'text-green-600' : 'text-red-800'}`}>{`${perLucro >= 0 ? '+' : ''}${perLucro.toFixed(2)}%`}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {showMobileProfitPage && (
            <div className="bg-white rounded-xl shadow p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-800">💰 Calcular Lucro</h2>
                <button className="text-gray-500 text-xl" onClick={() => { setShowMobileProfitPage(false); setProfitResults([]); }}>×</button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="space-y-2">
                  <label className="block">Qtde. Dias:</label>
                  <input type="number" value={profitParams.days} onChange={(e) => setProfitParams(prev => ({ ...prev, days: parseInt(e.target.value) || 30 }))} className="w-full p-2 border rounded" min="1" max="365" />
                </div>
                <div className="space-y-2">
                  <label className="block">Data Inicial:</label>
                  <input type="date" value={profitParams.startDate} onChange={(e) => setProfitParams(prev => ({ ...prev, startDate: e.target.value }))} className="w-full p-2 border rounded" />
                </div>
                <div className="space-y-2">
                  <label className="block">Valor Inicial (R$):</label>
                  <input type="text" inputMode="decimal" value={profitParams.initialValue.toString()} onChange={(e) => setProfitParams(prev => ({ ...prev, initialValue: parseFloat(e.target.value.replace(',', '.')) || 0 }))} className="w-full p-2 border rounded text-right" placeholder="100.00" />
                </div>
                <div className="space-y-2">
                  <label className="block">% Lucro ao Dia:</label>
                  <input type="text" inputMode="decimal" value={profitParams.dailyProfitPercent.toString()} onChange={(e) => setProfitParams(prev => ({ ...prev, dailyProfitPercent: parseFloat(e.target.value.replace(',', '.')) || 0 }))} className="w-full p-2 border rounded text-right" placeholder="3.00" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="compoundInterestMobilePage" checked={profitParams.compoundInterest} onChange={(e) => setProfitParams(prev => ({ ...prev, compoundInterest: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="compoundInterestMobilePage">Juros Compostos?</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setProfitParams({ days: 30, startDate: new Date().toISOString().split('T')[0], initialValue: 100, dailyProfitPercent: 3, compoundInterest: false }); setProfitResults([]); }} className="bg-red-600 text-white rounded p-2">🗑️ Limpar</button>
                  <button onClick={printResults} disabled={profitResults.length === 0} className={`rounded p-2 ${profitResults.length === 0 ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white'}`}>🖨️ Imprimir</button>
                  <button onClick={calculateProfit} className="bg-green-600 text-white rounded p-2">🧮 Calcular</button>
                </div>
                <div className="pt-2 border-t">
                  <h3 className="text-sm font-bold mb-2">📊 Resultados</h3>
                  {profitResults.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-green-50 p-2 rounded">
                          <div className="text-gray-600">Total de Lucro</div>
                          <div className="text-right font-bold text-green-600">R$ {profitResults[profitResults.length - 1]?.totalAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="text-gray-600">Total Geral</div>
                          <div className="text-right font-bold text-blue-600">R$ {profitResults[profitResults.length - 1]?.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="text-gray-600">Média Diária</div>
                          <div className="text-right font-bold text-purple-600">R$ {((profitResults[profitResults.length - 1]?.totalAccumulated || 0) / profitParams.days).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr>
                            <th className="text-left p-1 border-b">Data</th>
                            <th className="text-right p-1 border-b">Saldo Atual</th>
                            <th className="text-right p-1 border-b">Lucro Diário</th>
                            <th className="text-right p-1 border-b">Total Acum.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profitResults.map((result, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="p-1 border-b">{result.date}</td>
                          <td className="p-1 border-b text-right">R$ {result.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-1 border-b text-right text-green-600">R$ {result.dailyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-1 border-b text-right font-semibold">R$ {result.totalAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-6">
                      <div className="text-3xl mb-2">📈</div>
                      <div>Preencha os parâmetros e clique em "Calcular" para ver os resultados</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showMobileHistoryPage && (
            <div className="bg-white rounded-xl shadow p-3">
              <div className="flex items-center justify-between mb-2">
                <button className="text-blue-600 text-sm font-semibold" onClick={() => setShowMobileHistoryPage(false)}>← Voltar</button>
                <h2 className="text-sm font-bold text-gray-800">📊 Histórico de Saldos</h2>
                <div className="w-12" />
              </div>
              <HistoricoSaldos onClose={() => setShowMobileHistoryPage(false)} variant="inline" />
            </div>
          )}

          {showMobileCreateBalancePage && (
            <div ref={createBalanceSectionRef} className="bg-white rounded-xl shadow p-3">
              <div className="flex items-center justify-between mb-2">
                <button className="text-blue-600 text-sm font-semibold" onClick={() => setShowMobileCreateBalancePage(false)}>← Voltar</button>
                <h2 className="text-sm font-bold text-gray-800">🔥 Criar Registro de Saldo</h2>
                <div className="w-12" />
              </div>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data de Cadastro</label>
                  <input type="date" value={createDataCadastro} onChange={(e) => setCreateDataCadastro(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Saldo Inicial (R$)</label>
                  <input type="number" inputMode="decimal" step="0.01" value={createSaldoInicial.toFixed(2)} onChange={(e) => setCreateSaldoInicial(parseFloat(e.target.value.replace(',', '.')) || 0)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Saldo Atual (R$)</label>
                  <input type="number" inputMode="decimal" step="0.01" value={createSaldoAtual.toFixed(2)} onChange={(e) => setCreateSaldoAtual(parseFloat(e.target.value.replace(',', '.')) || 0)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor do Lucro (R$)</label>
                  <input type="text" value={`${createValorLucro >= 0 ? '+' : ''}R$ ${createValorLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} readOnly className={`w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-right font-semibold ${createValorLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Percentual do Lucro (%)</label>
                  <input type="text" value={`${createPercentualLucro >= 0 ? '+' : ''}${createPercentualLucro.toFixed(2)}%`} readOnly className={`w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-right font-semibold ${createPercentualLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowMobileCreateBalancePage(false)} className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold">❌ Cancelar</button>
                <button onClick={async () => { try { const success = await createSaldoRecord(createDataCadastro, createSaldoInicial, createSaldoAtual); if (success) { setShowMobileCreateBalancePage(false); setCreateDataCadastro(new Date().toISOString().split('T')[0]); setCreateSaldoInicial(createSaldoAtual); setCreateSaldoAtual(createSaldoAtual); } } catch (error) { console.error('Erro ao criar saldo:', error); } }} className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold">💾 Criar Registro</button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    );
  }

  return (
    <>
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
              
              {/* Informações de diagnóstico para dispositivos móveis */}
              {isMobileDevice() && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 text-center mb-3">
                    <strong>Tablet/Mobile detectado:</strong> Se o microfone não funcionar, verifique:
                    <br />• Permissões do Chrome para este site
                    <br />• Configurações de microfone do dispositivo
                    <br />• Tente falar mais próximo ao microfone
                  </p>
                  
                  {/* Botão de teste de microfone */}
                  <button
                    onClick={async () => {
                      try {
                        console.log('Testando microfone...');
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        console.log('Microfone funcionando:', stream);
                        alert('✅ Microfone funcionando! Stream de áudio capturado com sucesso.');
                        stream.getTracks().forEach(track => track.stop());
                      } catch (error) {
                        console.error('Erro no teste de microfone:', error);
                        alert('❌ Erro no microfone: ' + error.message);
                      }
                    }}
                    className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                  >
                    🎤 Testar Microfone
                  </button>
                </div>
              )}
              
              <div className="relative">
                <textarea
                  ref={(el) => {
                    if (el && showAddNumbersModal) {
                      setTimeout(() => el.focus(), 100);
                    }
                  }}
                  value={addNumbersInput}
                  onChange={(e) => setAddNumbersInput(e.target.value)}
                  placeholder="01,36,00,16,17,00,26..."
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                
                {/* Botão de microfone */}
                <button
                  onClick={toggleVoiceRecognition}
                  className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg ring-2 ring-red-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isListening ? 'Parar gravação contínua (clique para parar)' : 'Iniciar gravação contínua (fale os números)'}
                >
                  {isListening ? (
                    // Ícone de "parar" quando está gravando
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                  ) : (
                    // Ícone de microfone quando não está gravando
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Feedback em tempo real do reconhecimento */}
              {isListening && voiceBuffer && (
                <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                  <span className="inline-flex w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Reconhecendo: {voiceBuffer}</span>
                </div>
              )}
              
              {/* Feedback de processamento de imagem OCR */}
              {isProcessingOCR && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-purple-800">Processando imagem...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-600 mt-1 text-center">{ocrProgress}%</p>
                </div>
              )}
              
              {/* Dica sobre Ctrl+V */}
              {!isProcessingOCR && !isListening && (
                <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600 text-center">
                    💡 <strong>Dica:</strong> Copie a tela de números do site e pressione <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+V</kbd> para extrair automaticamente
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddNumbersModal(false);
                    setAddNumbersInput('');
                    setVoiceBuffer(''); // Limpar também o buffer de voz
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setAddNumbersInput('');
                    setVoiceBuffer(''); // Limpar também o buffer de voz
                  }}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                >
                  Limpar
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

      {/* Popup de feedback de voz para roleta */}
      {showVoicePopup && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-blue-500 rounded-xl shadow-2xl p-6 z-50 min-w-[450px] max-w-[600px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-lg text-gray-800">Reconhecimento de Voz Ativo</span>
            </div>
            <button
              onClick={() => {
                if (isRouletteListening) {
                  toggleRouletteVoiceRecognition();
                }
                setShowVoicePopup(false);
                setVoiceTranscript('');
                setVoiceDigits('');
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              Fechar
            </button>
          </div>
          
          <div className="mb-4">
            <span className="text-sm font-semibold text-gray-700 mb-2 block">Texto Reconhecido:</span>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-base min-h-[50px] flex items-center">
              <span className="text-gray-800">{voiceTranscript || 'Aguardando sua voz...'}</span>
            </div>
          </div>
          
          <div>
            <span className="text-sm font-semibold text-gray-700 mb-2 block">Números Detectados:</span>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-xl font-bold text-blue-800 min-h-[60px] flex items-center justify-center">
              {voiceDigits || 'Nenhum número detectado'}
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            💡 Dica: Fale números de 0 a 36 claramente para melhor reconhecimento
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-auto p-6 bg-green-700 rounded-xl shadow-2xl" style={{marginTop: '-20px'}}>
      {/* Título e botões na mesma linha */}
      <div className="flex justify-between items-center" style={{marginTop: '-13px', marginBottom: '9px'}}>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-3 focus:outline-none hover:opacity-80 transition-opacity" 
            onClick={() => setShowConfigModal(true)}
            title="Abrir Configurações"
          >
            <img src="/logo-171.svg" alt="Logo 171" className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-white" style={{marginTop: '-15px'}}>Roleta 171</h1>
          </button>
          {user && (
            <div className="text-xs" style={{marginTop: '-10px', marginLeft: '36px'}}>
              <span style={{color: 'white'}}>{user.nome}</span>
              <span style={{color: '#86efac', letterSpacing: '4px'}}> | </span>
              {isEditingBalance ? (
                <div className="inline-flex items-center gap-1">
                  <input
                    ref={editBalanceInputRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={editBalanceValue}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/[^\d]/g, '');
                      if (!raw) {
                        setEditBalanceValue('');
                        return;
                      }
                      const cents = raw.slice(-2).padStart(2, '0');
                      let ints = raw.slice(0, -2);
                      ints = ints.replace(/^0+/, '');
                      if (ints.length === 0) ints = '0';
                      const withThousands = ints.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                      const masked = `${withThousands},${cents}`;
                      setEditBalanceValue(masked);
                    }}
                    onKeyDown={handleBalanceKeyDown}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw) return;
                      let normalized = raw;
                      if (raw.includes(',') && raw.includes('.')) {
                        normalized = raw.replace(/\./g, '').replace(',', '.');
                      } else if (raw.includes(',')) {
                        normalized = raw.replace(',', '.');
                      }
                      const num = parseFloat(normalized);
                      if (!isNaN(num)) setEditBalanceValue(num.toFixed(2));
                    }}
                    className="bg-green-600 text-white border border-green-400 rounded px-1 py-0 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-green-300"
                    style={{fontSize: '12px', height: '18px'}}
                  />
                  <button
                    onClick={saveBalance}
                    className="text-green-300 hover:text-green-100 text-xs"
                    title="Salvar (Enter)"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelEditingBalance}
                    className="text-red-300 hover:text-red-100 text-xs"
                    title="Cancelar (Esc)"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1">
                  <span 
                    style={{color: (balance || 0) < 0 ? '#ef4444' : '#86efac', cursor: 'pointer'}}
                    onClick={() => {
                      setShowLargeSaldoPanel(true);
                      setTimeout(() => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }, 100);
                    }}
                    title="Clique para ver o saldo atual"
                  >
                    R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={startEditingBalance}
                    className="text-green-300 hover:text-green-100 text-xs ml-1"
                    title="Editar saldo rapidamente"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <span style={{color: '#86efac', letterSpacing: '4px'}}> | </span>
              <span className={(currentSaldoRecord?.per_lucro || 0) < 0 ? 'text-yellow-100' : ''} style={{color: (currentSaldoRecord?.per_lucro || 0) < 0 ? undefined : '#86efac'}}>
                {currentSaldoRecord?.per_lucro ? `${currentSaldoRecord.per_lucro > 0 ? '+' : ''}${currentSaldoRecord.per_lucro.toFixed(2)}%` : '0,00%'}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddNumbersModal(true)}
            className="bg-yellow-100 hover:bg-yellow-200 text-black text-xs rounded transition-colors font-semibold flex items-center justify-center"
            style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
            title="Adicionar números já sorteados"
          >
            ➕
          </button>
          <button
            onClick={() => setShowMonthlyGraphModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors font-semibold flex items-center justify-center"
            style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
            title="Gráfico Mensal - Visualizar lucros por período"
          >
            📊
          </button>
          <button
            onClick={() => setShowProfitModal(true)}
            className="bg-amber-800 hover:bg-amber-900 text-white text-xs rounded transition-colors font-semibold flex items-center justify-center"
            style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
            title="Calcular lucro com base em parâmetros financeiros"
          >
            📈
          </button>
          {/* Novo botão Registro de Entradas (Dúzias e Colunas) */}
          <button
            onClick={() => setShowDuzColPanel(v => !v)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors font-semibold flex items-center justify-center"
            style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
            title="4 Cores"
          >
            📑
          </button>
          <button
            onClick={() => setShowColorProgressionDesktop(v => !v)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs rounded transition-colors font-semibold flex items-center justify-center"
            style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
            title="Progressão de Cores"
          >
            🎨
          </button>
          <button
            onClick={simulateAutoDrawing}
            className={cn(
               "text-black text-xs rounded transition-colors font-semibold flex items-center justify-center",
               isSimulating 
                 ? "bg-red-500 hover:bg-red-600 text-white" 
                 : "bg-gray-400 hover:bg-gray-500"
             )}
            style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
            title="Simular vários Números"
          >
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
          </button>
          <button
            onClick={() => setShowAreasRoleta(v => !v)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors font-semibold flex items-center justify-center"
            style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
            title="Áreas da Roleta - Visualizar distribuição por cores"
          >
            🎯
          </button>
          <button
            onClick={clearScreen}
            className="bg-white hover:bg-gray-100 text-black text-xs rounded transition-colors border border-gray-300 flex items-center justify-center"
            style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
            title="Limpar toda a tela e iniciar novo sorteio"
          >
            🗑️
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors flex items-center justify-center"
              style={{height: '22px', width: '35px', fontSize: '11px', lineHeight: '1'}}
              title="Sair do sistema"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 01-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Box com últimos números sorteados */}
      <div className="bg-gray-600 rounded-lg p-4" style={{marginBottom: '12px', marginTop: '-11px'}}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-semibold">Últimos Números Sorteados:</h3>
          <div className="flex gap-2">

            <button
              onClick={simulateDrawing}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              style={{height: '22px', fontSize: '13px'}}
              title="Simular um número"
            >
              🎲
            </button>
            
            <button
              onClick={toggleRouletteVoiceRecognition}
              className={`${isRouletteListening ? 'text-red-400 hover:text-red-300 animate-pulse' : 'text-green-400 hover:text-green-300'} transition-colors flex items-center justify-center`}
              style={{height: '22px', fontSize: '13px'}}
              title={isRouletteListening ? "Parar reconhecimento de voz" : "Iniciar reconhecimento de voz para seleção"}
            >
              🎤
            </button>
            
            <button
              onClick={() => {
                if (lastNumbers.length > 0) {
                  const newNumbers = lastNumbers.slice(0, -1);
                  setLastNumbers(newNumbers);
                  // Marcar o novo número mais recente na race
                  setLastSelectedNumber(newNumbers.length > 0 ? newNumbers[newNumbers.length - 1] : null);
                }
              }}
              disabled={lastNumbers.length === 0}
              className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              style={{height: '22px', fontSize: '13px'}}
              title="Remover último número"
>
              🗑️
            </button>
            
            <button
              onClick={() => {
                if (lastNumbers.length >= 5) {
                  const newNumbers = lastNumbers.slice(5);
                  setLastNumbers(newNumbers);
                  // Marcar o novo número mais recente na race
                  setLastSelectedNumber(newNumbers.length > 0 ? newNumbers[newNumbers.length - 1] : null);
                }
              }}
              disabled={lastNumbers.length < 5}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-2 py-1 rounded transition-colors flex items-center justify-center text-xs font-semibold"
              style={{height: '22px', fontSize: '11px'}}
              title="Remover os 5 primeiros números da lista"
            >
              -5
            </button>
            
            <button
              onClick={() => setShowConfigModal(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors flex items-center justify-center"
              style={{height: '22px', fontSize: '13px'}}
              title="Configurações do Sistema"
            >
              ⚙️
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[74px] items-start">
          {lastNumbers.length === 0 ? (
            <span className="text-gray-300 text-sm flex items-center h-full">Nenhum número sorteado ainda</span>
          ) : (
            lastNumbers.slice().reverse().map((num, index) => {
              const isLastSelected = lastSelectedNumber === num;
              return (
                <span
                  key={`${num}-${lastNumbers.length - 1 - index}`}
                  className={cn(
                    'w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center text-white border-2 border-gray-400',
                    getNumberColor(num),
                    isLastSelected ? 'ring-2 ring-yellow-400 scale-110' : ''
                  )}
                  title={`Posição: ${index + 1} (Último: ${index === 0 ? 'Sim' : 'Não'})`}
                >
                  {num}
                </span>
              );
            })
          )}</div>
      </div>
      
      {/* Layout Principal */}
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
                <div className="bg-gray-700 rounded-lg p-3 px-6">
                  {/* Formato da race real */}
                  <div className="w-full font-mono">
                    {/* Linha superior: 05 24 16 33 01 20 14 31 09 22 18 29 07 28 12 35 03 26 */}
                    <div className="flex justify-center gap-1 mb-1 mt-2.5">
                      {[5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3].map((num, index) => {
                        const isLastSelected = lastSelectedNumber === num;
                        // Para o padrão principal (race), usar dados diretos do patternAlert
                        const isHighlightedBet = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo 
                          ? patternAlert.betNumbers?.includes(num) || false
                          : highlightedBetNumbers.includes(num);
                        const isHighlightedRisk = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo
                          ? patternAlert.riskNumbers?.includes(num) || false
                          : highlightedRiskNumbers.includes(num);
                        const isHighlightedBase = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo
                          ? patternAlert.baseNumbers?.includes(num) || false
                          : highlightedBaseNumbers.includes(num);
                        
                        
                        // Verificar se é um dos 2 números para apostar no Padrão Detectado
                        const isDetectedBetNumber = patternAlert?.type === 'race' && alertaPadrao171Ativo && patternAlert?.betNumbers?.includes(num);
                          
                        
                        // Verificar se é primeiro ou último número exposto no Padrão Detectado
                        // USAR A MESMA LÓGICA DO CARD RISCO!
                        const riskNumbers = patternAlert?.message.includes('Números no risco (7):') ? 
                          patternAlert.message.split('Números no risco (7): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
                          [];
                        const isFirstRiskDetected = riskNumbers.length > 0 && riskNumbers[0] === num;
                        const isLastRiskDetected = riskNumbers.length > 0 && riskNumbers[6] === num;
                        
                        // Debug logs para TODOS os números da race sequence (linha inferior)
                        if (patternAlert && (num === 26 || num === 21)) {
                          console.log(`🚨 NÚMERO CRÍTICO ${num} - RACE SEQUENCE INFERIOR:`, {
                            numero: num,
                            isHighlightedRisk,
                            isFirstRiskDetected,
                            isLastRiskDetected,
                            shouldHaveBorder: isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected),
                            riskNumbers: riskNumbers,
                            originalRiskNumbers: patternAlert?.riskNumbers,
                            patternAlert: patternAlert,
                            APLICANDO_BORDAS_INLINE: (isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)),
                            highlightedRiskNumbers: highlightedRiskNumbers
                          });
                        }
                        
                        // Debug logs para TODOS os números da race sequence (linha superior)
                        if (patternAlert && (num === 26 || num === 21)) {
                          console.log(`🚨 NÚMERO CRÍTICO ${num} - RACE SEQUENCE SUPERIOR:`, {
                            numero: num,
                            isHighlightedRisk,
                            isFirstRiskDetected,
                            isLastRiskDetected,
                            shouldHaveBorder: isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected),
                            riskNumbers: riskNumbers,
                            originalRiskNumbers: patternAlert?.riskNumbers,
                            patternAlert: patternAlert,
                            APLICANDO_BORDAS_INLINE: (isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)),
                            highlightedRiskNumbers: highlightedRiskNumbers
                          });
                        }
                        
                        return (
                          <div
                            key={`race-top-${num}`}
                            className={cn(
                              'w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white border-2',
                              getNumberColor(num),
                              isLastSelected 
                                ? 'border-yellow-400 border-2 ring-2 ring-yellow-300 scale-125 shadow-lg animate-pulse' 
                                : isDetectedBetNumber
                                ? 'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse'
                                : 'border-gray-400',
                              // PRIORIDADE MÁXIMA: Padrão Principal (Detectado) - SEMPRE tem precedência
                              patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedBase ? 'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse' : 
                              patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedBet && !isHighlightedBase ? 'bg-yellow-400 text-black ring-1 ring-yellow-500' : 
                              (patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)) ? 'ring-2 ring-white border-2 border-white animate-pulse shadow-white shadow-md' : '',
                            )}
                            style={
                              (isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)) ? {
                                border: '2px solid white !important',
                                boxShadow: '0 0 0 2px white, 0 0 10px white !important',
                                animation: 'pulse 2s infinite !important'
                              } : {}
                            }
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
                          // Para o padrão principal (race), usar dados diretos do patternAlert
                          const isHighlightedBet = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo 
                            ? patternAlert.betNumbers?.includes(num) || false
                            : highlightedBetNumbers.includes(num);
                          const isHighlightedRisk = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo
                            ? patternAlert.riskNumbers?.includes(num) || false
                            : highlightedRiskNumbers.includes(num);
                          const isHighlightedBase = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo
                            ? patternAlert.baseNumbers?.includes(num) || false
                            : highlightedBaseNumbers.includes(num);
                          
                          
                          // Verificar se é um dos 2 números para apostar no Padrão Detectado
                          const isDetectedBetNumber = patternAlert?.type === 'race' && alertaPadrao171Ativo && patternAlert?.betNumbers?.includes(num);
                          
                          
                        // Verificar se é primeiro ou último número exposto no Padrão Detectado
                        // USAR A MESMA LÓGICA DO CARD RISCO!
                        const riskNumbers = patternAlert?.message.includes('Números no risco (7):') ? 
                          patternAlert.message.split('Números no risco (7): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
                          [];
                        const isFirstRiskDetected = riskNumbers.length > 0 && riskNumbers[0] === num;
                        const isLastRiskDetected = riskNumbers.length > 0 && riskNumbers[6] === num;
                          
                          return (
                            <div
                              className={cn(
                                'w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white border-2 -ml-2.5',
                                getNumberColor(num),
                                isLastSelected 
                                  ? 'border-yellow-400 border-2 ring-2 ring-yellow-300 scale-125 shadow-lg animate-pulse' 
                                  : isDetectedBetNumber
                                  ? 'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse'
                                  : 'border-gray-400',
                                // PRIORIDADE MÁXIMA: Padrão Principal (Detectado) - SEMPRE tem precedência
                                patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedBase ? 'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse' : 
                                patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedBet && !isHighlightedBase ? 'bg-yellow-400 text-black ring-1 ring-yellow-500' : 
                                (patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)) ? 'ring-2 ring-white border-2 border-white animate-pulse shadow-white shadow-md' : '',
                              )}
                              title={`Posição ${ROULETTE_SEQUENCE.indexOf(num) + 1} na roleta: ${num}`}
                            >
                              {num.toString().padStart(2, '0')}
                            </div>
                          );
                        })()}
                        
                        {/* Espaços vazios para posicionar o 26 acima do 0 */}
                        {Array.from({length: 16}, (_, i) => (
                          <div key={`spacer-${i}`} className="w-7 h-7"></div>
                        ))}
                        
                        {/* 26 posicionado acima do 0 */}
                        {(() => {
                          const num = 26;
                          const isLastSelected = lastSelectedNumber === num;
                          // Para o padrão principal (race), usar dados diretos do patternAlert
                          const isHighlightedBet = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo 
                            ? patternAlert.betNumbers?.includes(num) || false
                            : highlightedBetNumbers.includes(num);
                          const isHighlightedRisk = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo
                            ? patternAlert.riskNumbers?.includes(num) || false
                            : highlightedRiskNumbers.includes(num);
                          const isHighlightedBase = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo
                            ? patternAlert.baseNumbers?.includes(num) || false
                            : highlightedBaseNumbers.includes(num);
                          
                          
                          // Verificar se é um dos 2 números para apostar no Padrão Detectado
                          const isDetectedBetNumber = patternAlert?.type === 'race' && alertaPadrao171Ativo && patternAlert?.betNumbers?.includes(num);
                          
                          
                          // Verificar se é primeiro ou último número exposto no Padrão Detectado
                          // USAR A MESMA LÓGICA DO CARD RISCO!
                          const riskNumbers = patternAlert?.message.includes('Números no risco (7):') ? 
                            patternAlert.message.split('Números no risco (7): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
                            [];
                          const isFirstRiskDetected = riskNumbers.length > 0 && riskNumbers[0] === num;
                          const isLastRiskDetected = riskNumbers.length > 0 && riskNumbers[6] === num;
                          
                          return (
                            <div
                              className={cn(
                                'w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white border-2',
                                getNumberColor(num),
                                isLastSelected 
                                  ? 'border-yellow-400 border-2 ring-2 ring-yellow-300 scale-125 shadow-lg animate-pulse' 
                                  : isDetectedBetNumber
                                  ? 'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse'
                                  : 'border-gray-400',
                                // PRIORIDADE MÁXIMA: Padrão Principal (Detectado) - SEMPRE tem precedência
                                patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedBase ? 'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse' : 
                                patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedBet && !isHighlightedBase ? 'bg-yellow-400 text-black ring-1 ring-yellow-500' : 
                                (patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)) ? 'ring-2 ring-white border-2 border-white animate-pulse shadow-white shadow-md' : '',
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
                        // Para o padrão principal (race), usar dados diretos do patternAlert
                        const isHighlightedBet = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo 
                          ? patternAlert.betNumbers?.includes(num) || false
                          : highlightedBetNumbers.includes(num);
                        const isHighlightedRisk = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo
                          ? patternAlert.riskNumbers?.includes(num) || false
                          : highlightedRiskNumbers.includes(num);
                        const isHighlightedBase = patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo
                          ? patternAlert.baseNumbers?.includes(num) || false
                          : highlightedBaseNumbers.includes(num);
                        
                        
                        // Verificar se é um dos 2 números para apostar no Padrão Detectado
                        const isDetectedBetNumber = patternAlert?.type === 'race' && alertaPadrao171Ativo && patternAlert?.betNumbers?.includes(num);
                          
                        
                        // Verificar se é primeiro ou último número exposto no Padrão Detectado
                        // USAR A MESMA LÓGICA DO CARD RISCO!
                        const riskNumbers = patternAlert?.message.includes('Números no risco (7):') ? 
                          patternAlert.message.split('Números no risco (7): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
                          [];
                        const isFirstRiskDetected = riskNumbers.length > 0 && riskNumbers[0] === num;
                        const isLastRiskDetected = riskNumbers.length > 0 && riskNumbers[6] === num;
                        
                        return (
                          <div
                            key={`race-bottom-${num}`}
                            className={cn(
                              'w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white border-2',
                              getNumberColor(num),
                              isLastSelected 
                                ? 'border-yellow-400 border-2 ring-2 ring-yellow-300 scale-125 shadow-lg animate-pulse' 
                                : isDetectedBetNumber
                                ? 'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse'
                                : 'border-gray-400',
                              // Prioridade: Padrão Principal (Detectado) tem prioridade sobre Padrão Forçado
                              // PRIORIDADE MÁXIMA: Padrão Principal (Detectado) - SEMPRE tem precedência
                              patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedBase ? 'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse' : 
                              patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedBet && !isHighlightedBase ? 'bg-yellow-400 text-black ring-1 ring-yellow-500' : 
                              (patternAlert && patternAlert.type === 'race' && alertaPadrao171Ativo && isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)) ? 'ring-2 ring-white border-2 border-white animate-pulse shadow-white shadow-md' : '',
                            )}
                            style={
                              (isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)) ? {
                                border: '2px solid white !important',
                                boxShadow: '0 0 0 2px white, 0 0 10px white !important',
                                animation: 'pulse 2s infinite !important'
                              } : {}
                            }
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

          {/* Container de Padrão Detectado - Sempre visível quando ativo */}
          {patternAlert && alertaPadrao171Ativo && (
            <div 
              className="bg-white rounded-lg p-3 h-fit transform-gpu animate-slide-in-right mb-4"
              style={{
                marginTop: '-21px',
                marginBottom: '35px',
                willChange: 'transform, opacity, filter'
              }}
            >
              {/* Botão X no canto superior direito */}
              <button
                onClick={() => {
                  setPatternAlert(null);
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg w-6 h-6 flex items-center justify-center rounded-full border border-red-400 hover:border-red-500 transition-colors leading-none z-10"
              >
                ×
              </button>

              {/* Cabeçalho */}
              <div className="flex justify-between items-center -mt-1.5" style={{marginBottom: '3px'}}>
                <h3 className="text-gray-800 font-bold text-sm flex items-center gap-1">
                  <span className="text-lg">🎯</span>
                  Padrão Detectado - Estratégia 171
                </h3>
              </div>
              
              {/* Conteúdo em 3 colunas */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                {/* Coluna 1: Números Sugeridos */}
                <div className="bg-green-50 p-2 rounded border border-green-200 min-h-[150px]">
                  <h4 className="font-bold text-green-800 mb-7 flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className="text-sm mr-1">💰</span>
                      APOSTAR
                    </div>
                    <span className="font-normal text-green-700">Números + 7 vizinhos:</span>
                  </h4>
                  <div className="flex justify-center gap-1 mb-2">
                    {(() => {
                      let strategy = ['15', '23']; // valores padrão
                      
                      if (patternAlert?.message.includes('Aposte nos números:')) {
                        const numbersText = patternAlert.message.split('Aposte nos números: ')[1]?.split('\n')[0];
                        if (numbersText) {
                          strategy = numbersText.split(' e ').map(s => s.trim());
                        }
                      }
                      
                      return strategy.map((numStr, index) => {
                        const num = parseInt(numStr.trim());
                        return (
                          <div
                            key={num}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[20px] shadow ${
                              getNumberColor(num)
                            } ring-1 ring-green-300`}
                          >
                            {num}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="text-center">
                    <span className="bg-green-200 text-green-800 px-1 py-0.5 rounded text-sm font-semibold">
                      30 números (81%)  -  ou  -  32 números (86%)
                    </span>
                  </div>
                </div>
                
                {/* Coluna 2: Números de Risco */}
                <div className="bg-red-50 p-2 rounded border border-red-200 min-h-[150px]">
                  <h4 className="font-bold text-red-800 mb-7 flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className="text-sm mr-1">⚠️</span>
                      RISCO
                    </div>
                    <span className="font-normal text-red-700">Números expostos:</span>
                  </h4>
                  <div className="flex flex-wrap gap-0.5 justify-center mb-2">
                    {(() => {
                      const riskNumbers = patternAlert?.message.includes('Números no risco (7):') ? 
                        patternAlert.message.split('Números no risco (7): ')[1]?.split('\n')[0]?.split(', ').map(n => parseInt(n.trim())) : 
                        [14, 31, 9, 22, 18, 29, 7];
                      
                      return riskNumbers.slice(0, 7).map((num, index) => {
                        const isFirst = index === 0;  // Primeiro da lista (26)
                        const isLast = index === 6;   // Último da lista (21) - forçando index 6
                        const isHighlighted = isFirst || isLast;
                        
                        console.log(`🎯 CARD RISCO - Número ${num}:`, {
                          index,
                          isFirst,
                          isLast,
                          isHighlighted,
                          totalNumbers: riskNumbers.length,
                          forcedCondition: `index === 0 (${index === 0}) || index === 6 (${index === 6})`
                        });
                        
                        return (
                          <div
                            key={num}
                            className={cn(
                              'rounded-full flex items-center justify-center text-white font-bold',
                              getNumberColor(num),
                              // Destaque especial para primeiro e último número
                              isHighlighted 
                                ? 'w-12 h-12 text-[22px] animate-pulse scale-110 shadow-lg ring-2 ring-white' 
                                : 'w-10 h-10 text-[20px]'
                            )}
                          >
                            {num}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="text-center mt-3">
                    <span className="bg-red-200 text-red-800 px-1 py-0.5 rounded text-sm font-semibold">
                      7 números (19%)  -  ou  -  5 números (13%)
                    </span>
                  </div>
                </div>

                {/* Coluna 3: Padrão Detectado */}
                <div className="bg-blue-50 p-2 rounded border border-blue-200 min-h-[150px]">
                  <h4 className="font-semibold text-blue-800 mb-7 flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      📊 PADRÃO 171
                    </div>
                    <span className="font-normal text-blue-700">Números consecutivos:</span>
                  </h4>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {(() => {
                        // Mostrar os 2 últimos números sorteados (mais antigo à esquerda, mais recente à direita)
                        const nums =
                          lastNumbers.length >= 2
                            ? lastNumbers.slice(-2) // ordem: penúltimo (à esquerda), último (à direita)
                            : lastNumbers.length === 1
                              ? [lastNumbers[0]]
                              : [];
                        const positions = nums.map(n => ROULETTE_SEQUENCE.indexOf(n));
                        return nums.map((num, index) => (
                          <div key={`${num}-${index}`} className="flex flex-col items-center">
                            <div className="text-sm text-gray-400 mb-0.5 font-mono" style={{fontSize: '12px'}}>
                              {positions[index] + 1}
                            </div>
                            <div
                              className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[20px] ${
                                getNumberColor(num)
                              } shadow-sm`}
                            >
                              {num}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Container Áreas da Roleta */}
          <AreasRoleta
            isOpen={showAreasRoleta}
            onClose={() => setShowAreasRoleta(false)}
            lastNumbers={lastNumbers}
            avisosSonorosAtivos={avisosSonorosAtivos}
          />
          
          {/* Container Espanhol */}
          {espanholEnabled && (
            <div 
              className="bg-white rounded-lg p-3 h-fit transform-gpu animate-slide-in-right mb-4"
              style={{ marginTop: '-21px', marginBottom: '35px', willChange: 'transform, opacity, filter' }}
            >
              <button
                onClick={() => { setEspanholEnabled(false); }}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg w-6 h-6 flex items-center justify-center rounded-full border border-red-400 hover:border-red-500 transition-colors leading-none z-10"
              >
                ×
              </button>
              <div className="grid grid-cols-10 items-center -mt-1.5" style={{marginBottom: '3px', marginLeft: '12px'}}>
                <h3 className="text-gray-800 font-bold text-sm flex items-center gap-1 col-span-5">
                  Espanhol
                </h3>
                <div className="col-start-6 col-span-3 flex items-center gap-2 flex-nowrap">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <label className="text-gray-700 text-sm">Valor Inicial:</label>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-sm">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={espanholValorInicial.toFixed(2)}
                        onChange={(e) => setEspanholValorInicial(parseFloat(e.target.value) || 0)}
                        className="w-24 p-1 border border-gray-300 rounded text-right"
                      />
                    </div>
                  </div>
                  <button
                    onClick={clearEspanhol}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
                    title="Limpar campos e valores"
                  >
                    Limpar
                  </button>
                  <div className="flex items-center gap-2 ml-auto" style={{ marginLeft: '102px' }}>
                    <input type="checkbox" id="apostandoEspanhol" checked={apostandoEspanhol} onChange={(e) => setApostandoEspanhol(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
                    <label htmlFor="apostandoEspanhol" className="text-gray-800 text-sm cursor-pointer">Apostando</label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-2 text-sm">
                <div className="col-span-5 bg-gray-50 p-2 rounded border border-gray-200 min-h-[150px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-800">Números Chamados</h4>
                    <span className="text-xs text-gray-500">Total: {espanholChamados.slice(-120).length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {espanholChamados.slice(-120).map((num, idx) => (
                      <div
                        key={`${num}-${idx}`}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[14px] ${getNumberColor(num)} border border-gray-300`}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-3 bg-yellow-50 p-2 rounded border border-yellow-200 min-h-[150px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-yellow-800">Repetidos</h4>
                    <span className="text-xs text-gray-500">Total: {espanholRepetidos.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {espanholRepetidos.map((num, idx) => (
                      <div
                        key={`${num}-${idx}`}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[14px] ${getNumberColor(num)} border border-gray-300`}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 bg-blue-50 p-2 rounded border border-blue-200 min-h-[150px]">
                  {espanholModulo3X >= 64 && (
                    <div className="bg-amber-100 border border-amber-300 text-amber-800 rounded p-2 text-xs mb-2">
                      Atenção: limite do Módulo-3 (64) atingido. Considere parar.
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-800">Módulo-1:</span>
                        <span className="font-semibold text-blue-800">{espanholModulo1X}</span>
                      </div>
                      <span className="text-red-700">{formatCurrency(espanholValorInicial * espanholModulo1X * 1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-800">Módulo-2:</span>
                        <span className="font-semibold text-blue-800">{espanholModulo2X}</span>
                      </div>
                      <span className="text-red-700">{formatCurrency(espanholValorInicial * espanholModulo2X * 2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-800">Módulo-3:</span>
                        <span className="font-semibold text-blue-800">{espanholModulo3X}</span>
                      </div>
                      <span className="text-red-700">{formatCurrency(espanholValorInicial * espanholModulo3X * 4)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Total:</span>
                        <span className="text-gray-800">{formatCurrency(espanholTotal)}</span>
                      </div>
                      {espanholWinValue !== null && (
                        <div className="mt-1 text-sm flex justify-between items-center">
                          <span className="text-green-700 font-semibold">Vitória: {formatCurrency(espanholWinValue)}</span>
                          <span className="text-blue-700 font-semibold">{formatCurrency(espanholWinValue - espanholTotal)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Painel de Registro de Entradas - Full width e empurra Estatísticas para baixo */}
          {showDuzColPanel && (
            <FourColorsPanel 
              isOpen={showDuzColPanel} 
              onClose={() => setShowDuzColPanel(false)} 
              lastNumbers={lastNumbers}
            />
          )}

          {/* Progressão de Cores Desktop - Empurra Estatísticas para baixo */}
          {showColorProgressionDesktop && (
            <ColorProgressionDesktop 
              isOpen={showColorProgressionDesktop} 
              onClose={() => setShowColorProgressionDesktop(false)} 
              lastNumbers={lastNumbers}
            />
          )}

          {/* Container de Estatísticas - Sempre visível, empurrado para baixo quando Padrão Detectado estiver ativo */}
          <div 
            className="bg-gray-800 rounded-lg p-3 h-fit transform-gpu transition-all duration-300"
            style={{
              marginTop: showColorProgressionDesktop ? '0px' : showDuzColPanel ? '0px' : (patternAlert || espanholEnabled) ? '-21px' : '-26px',
              willChange: 'transform, opacity, filter'
            }}
          >
        {/* Cabeçalho com título à esquerda e total à direita */}
        <div className="flex justify-between items-center -mt-1.5" style={{marginBottom: '3px'}}>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-sm">📊 Estatística das Rodadas</h3>
            <button
              onClick={toggleStatisticsRowOrder}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-xs opacity-60 hover:opacity-100 focus:outline-none hover:bg-gray-700 rounded px-1 py-0.5"
              title={`Ordem atual: ${statisticsRowOrder + 1}/3 - Clique para alternar (${statisticsRowOrder === 0 ? '1-2-3' : statisticsRowOrder === 1 ? '3-1-2' : '2-3-1'})`}
            >
              ⚡
            </button>
          </div>
          <div className="text-white text-sm">
            <span className="text-gray-300">Total de Números: </span>
            <span className="font-bold text-yellow-300" style={{fontSize: '17px'}}>{lastNumbers.length}</span>
          </div>
        </div>
        
        {/* Usar o componente StatisticsCards com tema escuro */}
        <div className="[&_.bg-white]:bg-gray-700 [&_.text-gray-800]:text-white [&_.text-gray-600]:text-gray-300 [&_.text-gray-500]:text-gray-400 [&_.shadow-md]:shadow-lg">
          <StatisticsCards 
            rowOrder={statisticsRowOrder}
            statistics={calculateStatistics(lastNumbers.map(num => ({
              number: num,
              color: num === 0 ? 'green' as const : 
                     [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'red' as const : 'black' as const,
              createdAt: new Date()
            })))} 
            patternDetectedCount={patternDetectedCount}
            winCount={winCount}
            lossCount={lossCount}
            p2WinCount={p2WinCount}
            p2LossCount={p2LossCount}
            setP2WinCount={setP2WinCount}
            setP2LossCount={setP2LossCount}
            torreWinCount={torreWinCount}
            torreLossCount={torreLossCount}
            setTorreWinCount={setTorreWinCount}
            setTorreLossCount={setTorreLossCount}
            numbersWithoutPattern={numbersWithoutPattern}
            totalNumbersWithoutPattern={totalNumbersWithoutPattern}
            lastNumbers={lastNumbers}
            pattern171Stats={{
              entradas: patternDetectedCount,
              wins: winCount,
              losses: lossCount
            }}
            avisosSonorosAtivos={avisosSonorosAtivos}
            animatingBetTerminais={animatingBetTerminais}
            animatingTorre={animatingTorre}
            animatingP2={animatingP2}
            animatingNovesFora={animatingNovesFora}
            p2Mode={p2Mode}
            setP2Mode={setP2Mode}
            betTerminaisStats={{
                entradas: betTerminaisEntradas,
                wins: betTerminaisWins,
                losses: betTerminaisLosses,
                winPercentage: (betTerminaisWins + betTerminaisLosses) > 0 ? Math.round((betTerminaisWins / (betTerminaisWins + betTerminaisLosses)) * 100) : 0,
                lossPercentage: (betTerminaisWins + betTerminaisLosses) > 0 ? Math.round((betTerminaisLosses / (betTerminaisWins + betTerminaisLosses)) * 100) : 0,
                negativeSequenceCurrent: betTerminaisNegSeqCurrent,
                negativeSequenceMax: betTerminaisNegSeqMax,
                positiveSequenceCurrent: betTerminaisPosSeqCurrent,
                positiveSequenceMax: betTerminaisPosSeqMax
              }}
              calculatedP2Stats={calculatedP2Stats}
              dozenSequenceCount={dozenSequenceCount}
              columnSequenceCount={columnSequenceCount}
              colorSequence={colorSequence}
              highLowSequence={highLowSequence}
              evenOddSequence={evenOddSequence}
              calculatedTorreStats={calculatedTorreStats}
              window32P1={window32P1}
              calculated32P1Stats={calculated32P1Stats}
              ROULETTE_SEQUENCE={ROULETTE_SEQUENCE}
           />
        </div>

        {/* Card de Saldo Atual - Movido para depois das estatísticas */}
        <div className="mt-4">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 shadow-lg border border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-lg flex items-center">
                💰 Saldo Atual
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-white/80 text-sm mb-1">Data</div>
                <div className="text-white font-bold text-base">
                  {currentSaldoRecord?.data ? new Date(currentSaldoRecord.data + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/80 text-sm mb-1">Saldo Inicial</div>
                <div className="text-white font-bold text-base">
                  R$ {(Number(currentSaldoRecord?.saldo_inicial) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/80 text-sm mb-1">Saldo Atual</div>
                <div className="text-white font-bold text-base">
                  R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/80 text-sm mb-1">Valor do Lucro</div>
                <div className={`font-bold text-base ${(Number(currentSaldoRecord?.vlr_lucro) || 0) >= 0 ? 'text-green-200' : 'text-amber-900'}`}>
                  {(Number(currentSaldoRecord?.vlr_lucro) || 0) >= 0 ? '+' : ''}R$ {(Number(currentSaldoRecord?.vlr_lucro) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/80 text-sm mb-1">Percentual do Lucro</div>
                <div className={`font-bold text-base ${(currentSaldoRecord?.per_lucro || 0) >= 0 ? 'text-green-200' : 'text-amber-900'}`}>
                  {(currentSaldoRecord?.per_lucro || 0) >= 0 ? '+' : ''}{(currentSaldoRecord?.per_lucro || 0).toFixed(2)}%
                </div>
              </div>
            </div>
            
            {/* Linha de Sugestões de % de Lucro */}
            <div className="mt-4 pt-3 border-t border-green-400/30">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-white/60 text-base mb-1">Sugestão</div>
                  <div className="text-white/60 text-base">(% Lucro)</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-200 text-base mb-1">2,34%</div>
                  <div className="text-white font-bold text-base flex items-center justify-center gap-1">
                    <span>R$ {((Number(currentSaldoRecord?.saldo_inicial) || 0) * 1.0234).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-green-300 text-sm">
                      ({((Number(currentSaldoRecord?.saldo_inicial) || 0) * 0.0234).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-200 text-base mb-1">3,73%</div>
                  <div className="text-white font-bold text-base flex items-center justify-center gap-1">
                    <span>R$ {((Number(currentSaldoRecord?.saldo_inicial) || 0) * 1.0373).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-green-300 text-sm">
                      ({((Number(currentSaldoRecord?.saldo_inicial) || 0) * 0.0373).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-200 text-base mb-1">4,73%</div>
                  <div className="text-white font-bold text-base flex items-center justify-center gap-1">
                    <span>R$ {((Number(currentSaldoRecord?.saldo_inicial) || 0) * 1.0473).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-green-300 text-sm">
                      ({((Number(currentSaldoRecord?.saldo_inicial) || 0) * 0.0473).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-200 text-base mb-1">10,00%</div>
                  <div className="text-white font-bold text-base flex items-center justify-center gap-1">
                    <span>R$ {((Number(currentSaldoRecord?.saldo_inicial) || 0) * 1.10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-green-300 text-sm">
                      ({((Number(currentSaldoRecord?.saldo_inicial) || 0) * 0.10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>

    {showMobileDashboard && (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-[9998] flex items-start justify-center p-2">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto mt-2 mb-4 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center gap-2">
              <img src="/logo-171.svg" alt="Logo 171" className="w-6 h-6" />
              <div className="text-xs font-bold">Roleta 171</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-gray-700 text-xs">{user?.nome}</div>
              <button
                onClick={() => onLogout && onLogout()}
                className="text-white text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                title="Sair"
                aria-label="Sair"
              >
                <LogOut size={14} />
              </button>
              <button onClick={() => setShowMobileDashboard(false)} className="text-gray-500 text-xl">×</button>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div className="bg-green-700 rounded-lg p-3 text-white">
              <div className="text-xs font-semibold">{user?.nome}</div>
              <div className="flex items-center gap-1 text-sm">
                <span>R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <button onClick={startEditingBalance} className="text-green-200">✏️</button>
                <span className="text-green-200">|</span>
                <span>{(currentSaldoRecord?.per_lucro || 0) >= 0 ? '+' : ''}{(currentSaldoRecord?.per_lucro || 0).toFixed(2)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowMobileProfitModal(true)} className="bg-blue-600 text-white rounded-lg p-3 text-xs font-semibold">Calcular Lucro</button>
              <button onClick={() => setShowCreateBalanceModal(true)} className="bg-amber-600 text-white rounded-lg p-3 text-xs font-semibold">Cadastrar Saldo</button>
            </div>

            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-xs font-semibold mb-2">Saldo Atual</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-600">Data</div>
                  <div className="font-bold text-gray-800">{new Date().toLocaleDateString('pt-BR')}</div>
                </div>
                <div>
                  <div className="text-gray-600">Saldo Inicial</div>
                  <div className="font-bold text-gray-800">R$ {(Number(currentSaldoRecord?.saldo_inicial) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-gray-600">Saldo Atual</div>
                  <div className="font-bold text-gray-800">R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-gray-600">Valor do Lucro</div>
                  <div className={(Number(currentSaldoRecord?.vlr_lucro) || 0) >= 0 ? 'text-green-600 font-bold' : 'text-amber-900 font-bold'}>{(Number(currentSaldoRecord?.vlr_lucro) || 0) >= 0 ? '+' : ''}R$ {(Number(currentSaldoRecord?.vlr_lucro) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-gray-600">Percentual do Lucro</div>
                  <div className={(currentSaldoRecord?.per_lucro || 0) >= 0 ? 'text-green-600 font-bold' : 'text-amber-900 font-bold'}>{(currentSaldoRecord?.per_lucro || 0) >= 0 ? '+' : ''}{(currentSaldoRecord?.per_lucro || 0).toFixed(2)}%</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  { p: 0.0234 },
                  { p: 0.0373 },
                  { p: 0.0473 },
                  { p: 0.10 }
                ].map((it, idx) => (
                  <div key={idx} className="text-center bg-white rounded p-2">
                    <div className="text-yellow-600 text-xs">{(it.p * 100).toFixed(2)}%</div>
                    <div className="text-gray-800 font-bold text-xs">R$ {((currentSaldoRecord?.saldo_inicial || 0) * (1 + it.p)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-green-600 text-[11px]">({((currentSaldoRecord?.saldo_inicial || 0) * it.p).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button onClick={() => setShowMobileHistory(true)} className="w-full bg-purple-600 text-white rounded-lg p-3 text-xs font-semibold">Histórico de Saldos</button>
            </div>

            {showMobileHistory && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-start justify-center p-2" onClick={() => setShowMobileHistory(false)}>
                <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <HistoricoSaldos onClose={() => setShowMobileHistory(false)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {showMobileProfitModal && (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center p-2" onClick={() => setShowMobileProfitModal(false)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-3 border-b">
            <h2 className="text-sm font-bold text-gray-800">💰 Calcular Lucro</h2>
            <button className="text-gray-500 text-xl" onClick={() => { setShowMobileProfitModal(false); setProfitResults([]); }}>×</button>
          </div>
          <div className="p-3 space-y-3 text-xs">
            <div className="space-y-2">
              <label className="block">Qtde. Dias:</label>
              <input type="number" value={profitParams.days} onChange={(e) => setProfitParams(prev => ({ ...prev, days: parseInt(e.target.value) || 30 }))} className="w-full p-2 border rounded" min="1" max="365" />
            </div>
            <div className="space-y-2">
              <label className="block">Data Inicial:</label>
              <input type="date" value={profitParams.startDate} onChange={(e) => setProfitParams(prev => ({ ...prev, startDate: e.target.value }))} className="w-full p-2 border rounded" />
            </div>
            <div className="space-y-2">
              <label className="block">Valor Inicial (R$):</label>
              <input type="number" value={profitParams.initialValue.toFixed(2)} onChange={(e) => setProfitParams(prev => ({ ...prev, initialValue: parseFloat(e.target.value) || 0 }))} className="w-full p-2 border rounded text-right" min="0" step="0.01" placeholder="100.00" />
            </div>
            <div className="space-y-2">
              <label className="block">% Lucro ao Dia:</label>
              <input type="number" value={profitParams.dailyProfitPercent.toFixed(2)} onChange={(e) => setProfitParams(prev => ({ ...prev, dailyProfitPercent: parseFloat(e.target.value) || 0 }))} className="w-full p-2 border rounded text-right" min="0" step="0.01" placeholder="3.00" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="compoundInterestMobile" checked={profitParams.compoundInterest} onChange={(e) => setProfitParams(prev => ({ ...prev, compoundInterest: e.target.checked }))} className="w-4 h-4" />
              <label htmlFor="compoundInterestMobile">Juros Compostos?</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { setProfitParams({ days: 30, startDate: new Date().toISOString().split('T')[0], initialValue: 100, dailyProfitPercent: 3, compoundInterest: false }); setProfitResults([]); }} className="bg-red-600 text-white rounded p-2">🗑️ Limpar</button>
              <button onClick={printResults} disabled={profitResults.length === 0} className={`rounded p-2 ${profitResults.length === 0 ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white'}`}>🖨️ Imprimir</button>
              <button onClick={calculateProfit} className="bg-green-600 text-white rounded p-2">🧮 Calcular</button>
            </div>
            <div className="pt-2 border-t">
              <h3 className="text-sm font-bold mb-2">📊 Resultados</h3>
              {profitResults.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-gray-600">Total de Lucro</div>
                      <div className="text-right font-bold text-green-600">R$ {profitResults[profitResults.length - 1]?.totalAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-gray-600">Total Geral</div>
                      <div className="text-right font-bold text-blue-600">R$ {profitResults[profitResults.length - 1]?.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-gray-600">Média Diária</div>
                      <div className="text-right font-bold text-purple-600">R$ {((profitResults[profitResults.length - 1]?.totalAccumulated || 0) / profitParams.days).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr>
                        <th className="text-left p-1 border-b">Data</th>
                        <th className="text-right p-1 border-b">Saldo Atual</th>
                        <th className="text-right p-1 border-b">Lucro Diário</th>
                        <th className="text-right p-1 border-b">Total Acum.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitResults.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-1 border-b">{result.date}</td>
                          <td className="p-1 border-b text-right">R$ {result.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-1 border-b text-right text-green-600">R$ {result.dailyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-1 border-b text-right font-semibold">R$ {result.totalAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <div className="text-3xl mb-2">📈</div>
                  <div>Preencha os parâmetros e clique em "Calcular" para ver os resultados</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Cálculo de Lucro */}
    {showProfitModal && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[500px] flex">
          {/* Lado Esquerdo - Formulário */}
          <div className="w-1/2 p-6 border-r border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">💰 Calcular Lucro</h2>
              <button
                onClick={() => {
                  setShowProfitModal(false);
                  setProfitResults([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-lg w-8 h-8 flex items-center justify-center rounded-full border border-red-400 hover:border-red-500 transition-colors leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Primeira linha: Qtde. Dias e Data Inicial */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qtde. Dias:
                  </label>
                  <input
                    type="number"
                    value={profitParams.days}
                    onChange={(e) => setProfitParams(prev => ({
                      ...prev,
                      days: parseInt(e.target.value) || 30
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                    max="365"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial:
                  </label>
                  <input
                    type="date"
                    value={profitParams.startDate}
                    onChange={(e) => setProfitParams(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Segunda linha: Valor Inicial e % Lucro ao Dia */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Inicial (R$):
                  </label>
                  <input
                    type="number"
                    value={profitParams.initialValue.toFixed(2)}
                    onChange={(e) => setProfitParams(prev => ({
                      ...prev,
                      initialValue: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    min="0"
                    step="0.01"
                    placeholder="100.00"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    % Lucro ao Dia:
                  </label>
                  <input
                    type="number"
                    value={profitParams.dailyProfitPercent.toFixed(2)}
                    onChange={(e) => setProfitParams(prev => ({
                      ...prev,
                      dailyProfitPercent: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    min="0"
                    step="0.01"
                    placeholder="3.00"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="compoundInterest"
                  checked={profitParams.compoundInterest}
                  onChange={(e) => setProfitParams(prev => ({
                    ...prev,
                    compoundInterest: e.target.checked
                  }))}
                  className="mr-2 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="compoundInterest" className="text-sm font-medium text-gray-700">
                  Juros Compostos?
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setProfitParams({
                      days: 30,
                      startDate: new Date().toISOString().split('T')[0],
                      initialValue: 100,
                      dailyProfitPercent: 3,
                      compoundInterest: false
                    });
                    setProfitResults([]);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  🗑️ Limpar
                </button>
                <button
                  onClick={printResults}
                  disabled={profitResults.length === 0}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    profitResults.length === 0 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  🖨️ Imprimir
                </button>
                <button
                  onClick={calculateProfit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  🧮 Calcular
                </button>
              </div>

              {/* Totalizadores abaixo dos botões */}
              {profitResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-gray-600">Total de Lucro:</div>
                      <div className="text-base font-bold text-green-600 text-right">
                        R$ {profitResults[profitResults.length - 1]?.totalAccumulated.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0,00'}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-gray-600">Total Geral:</div>
                      <div className="text-base font-bold text-blue-600 text-right">
                        R$ {profitResults[profitResults.length - 1]?.currentBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0,00'}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-gray-600">Média Diária:</div>
                      <div className="text-base font-bold text-purple-600 text-right">
                        R$ {((profitResults[profitResults.length - 1]?.totalAccumulated || 0) / profitParams.days).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito - Resultados */}
          <div className="w-1/2 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Resultados</h3>
            
            {profitResults.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="overflow-y-auto" style={{maxHeight: 'calc(11 * 2.5rem - 50px)'}}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="text-left p-2 border-b font-semibold">Data</th>
                        <th className="text-right p-2 border-b font-semibold">Saldo Atual</th>
                        <th className="text-right p-2 border-b font-semibold">Lucro Diário</th>
                        <th className="text-right p-2 border-b font-semibold">Total Acum.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitResults.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-2 border-b">{result.date}</td>
                          <td className="p-2 border-b text-right">R$ {result.currentBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          <td className="p-2 border-b text-right text-green-600">R$ {result.dailyProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          <td className="p-2 border-b text-right font-semibold">R$ {result.totalAccumulated.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Totalizadores removidos daqui - agora estão no lado esquerdo */}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p>Preencha os parâmetros e clique em "Calcular" para ver os resultados</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Gerenciador de Saldo Simplificado */}
    {showLargeSaldoPanel && (
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">💰 Saldo Atual</h3>
            <button
              onClick={() => setShowLargeSaldoPanel(false)}
              className="text-gray-500 hover:text-gray-700 text-lg w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-400 transition-colors"
              title="Fechar"
            >
              ×
            </button>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Data */}
          <div className="bg-gray-50 p-4 rounded-lg border text-center">
            <div className="text-sm text-gray-600 mb-1">Data</div>
            <div className="text-xl font-bold text-gray-800">
              {currentSaldoRecord?.data ? new Date(currentSaldoRecord.data + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
          {/* Saldo Inicial */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <div className="text-sm text-blue-600 mb-1">Saldo Inicial</div>
            <div className="text-xl font-bold text-blue-800">
              R$ {(currentSaldoRecord?.saldo_inicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Saldo Atual */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div className="text-sm text-green-600 mb-1">Saldo Atual</div>
            <div className="text-xl font-bold text-green-800">
              R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Valor do Lucro */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
            <div className="text-sm text-yellow-600 mb-1">Valor do Lucro</div>
            <div className={`text-xl font-bold ${(currentSaldoRecord?.vlr_lucro || 0) >= 0 ? 'text-green-600' : 'text-amber-900'}`}>
              {(currentSaldoRecord?.vlr_lucro || 0) >= 0 ? '+' : ''}R$ {(currentSaldoRecord?.vlr_lucro || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Percentual do Lucro */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
            <div className="text-sm text-purple-600 mb-1">Percentual do Lucro</div>
            <div className={`text-xl font-bold ${(currentSaldoRecord?.per_lucro || 0) >= 0 ? 'text-green-600' : 'text-amber-900'}`}>
              {(currentSaldoRecord?.per_lucro || 0) >= 0 ? '+' : ''}{(currentSaldoRecord?.per_lucro || 0).toFixed(2)}%
            </div>
          </div>
        </div>



        {/* Botões de Ação */}
        <div className="flex gap-4 justify-between">
          <div className="flex gap-4">
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              📊 Histórico de Saldos
            </button>
            <button 
              onClick={async () => {
                // Buscar o último saldo cadastrado do banco de dados
                try {
                  if (!user) return;
                  const { saldo } = await saldoAPI.getLast(user.id);
                  
                  const lastSaldo = Number(saldo?.saldo_atual) || 0;
                  setCreateSaldoInicial(lastSaldo);
                  setCreateSaldoAtual(lastSaldo);
                  setCreateDataCadastro(new Date().toISOString().split('T')[0]);
                  setShowCreateBalanceModal(true);
                } catch (error) {
                  console.log('Nenhum saldo anterior encontrado, usando 0 como padrão');
                  setCreateSaldoInicial(0);
                  setCreateSaldoAtual(0);
                  setCreateDataCadastro(new Date().toISOString().split('T')[0]);
                  setShowCreateBalanceModal(true);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ➕ Cadastrar Saldo
            </button>
          </div>
          <button 
            onClick={() => {
              // Preencher o modal de edição com o registro atualmente exibido
              setEditSaldoInicial(currentSaldoRecord?.saldo_inicial || 0);
              setEditSaldoAtual(currentSaldoRecord?.saldo_atual ?? balance ?? 0);
              setEditDataCadastro(currentSaldoRecord?.data || new Date().toISOString().split('T')[0]);
              setShowEditBalanceModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            ✏️ Editar Saldo
          </button>
        </div>
      </div>
    </div>
    )}

    {/* Modal de Saldo */}
    {showBalanceModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
        <div className="bg-white rounded-t-lg shadow-lg w-full max-w-4xl p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">💰 Saldo Atual</h3>
            <button
              onClick={() => setShowBalanceModal(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Data */}
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="text-sm text-gray-600 mb-1">Data</div>
              <div className="text-lg font-semibold text-gray-800">
                {currentSaldoRecord?.data ? new Date(currentSaldoRecord.data + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Saldo Inicial */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 mb-1">Saldo Inicial</div>
              <div className="text-lg font-semibold text-blue-800">
                R$ {(currentSaldoRecord?.saldo_inicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 mb-1">Saldo Atual</div>
              <div className="text-lg font-semibold text-green-800">
                R$ {(balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Valor do Lucro */}
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 mb-1">Valor do Lucro</div>
              <div className={`text-lg font-semibold ${(currentSaldoRecord?.vlr_lucro || 0) >= 0 ? 'text-green-600' : 'text-amber-900'}`}>
                {(currentSaldoRecord?.vlr_lucro || 0) >= 0 ? '+' : ''}R$ {(currentSaldoRecord?.vlr_lucro || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Percentual do Lucro */}
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 mb-1">Percentual do Lucro</div>
              <div className={`text-lg font-semibold ${(currentSaldoRecord?.per_lucro || 0) >= 0 ? 'text-green-600' : 'text-amber-900'}`}>
                {(currentSaldoRecord?.per_lucro || 0) >= 0 ? '+' : ''}{(currentSaldoRecord?.per_lucro || 0).toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowBalanceModal(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Editar Saldo */}
    {showEditBalanceModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <h2 className="text-xl font-bold text-gray-800">Saldo Atual</h2>
            </div>
            <button
              onClick={() => setShowEditBalanceModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Campos de entrada */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Data de Cadastro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data de Cadastro</label>
              <input
                type="date"
                value={editDataCadastro}
                onChange={(e) => setEditDataCadastro(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Saldo Inicial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Inicial (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editSaldoInicial}
                onChange={(e) => setEditSaldoInicial(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              />
            </div>

            {/* Saldo Atual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Atual (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editSaldoAtual}
                onChange={(e) => setEditSaldoAtual(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              />
            </div>

            {/* Valor do Lucro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Lucro (R$)</label>
              <input
                type="text"
                value={`${valorLucro >= 0 ? '+' : ''}${valorLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right ${valorLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`}
                readOnly
              />
            </div>

            {/* Percentual do Lucro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Percentual do Lucro (%)</label>
              <input
                type="text"
                value={`${percentualLucro >= 0 ? '+' : ''}${percentualLucro.toFixed(2)}`}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right ${percentualLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`}
                readOnly
              />
            </div>
          </div>



          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowEditBalanceModal(false)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
            >
              <span>❌</span>
              Cancelar
            </button>
              <button
              onClick={async () => {
                try {
                  // Atualizar todos os campos do registro de saldo
                  const success = await updateSaldoRecord({
                    data: editDataCadastro,
                    saldo_atual: editSaldoAtual
                  });
                  
                  if (success) {
                    console.log('Saldo atualizado com sucesso!');
                    setShowEditBalanceModal(false);
                  } else {
                    console.error('Erro ao atualizar saldo');
                  }
                } catch (error) {
                  console.error('Erro ao salvar saldo:', error);
                }
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
            >
              <span>💾</span>
              Salvar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Cadastrar Saldo */}
    {showCreateBalanceModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <h2 className="text-xl font-bold text-gray-800">Criar Registro de Saldo</h2>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={() => setShowCreateBalanceModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Campos de entrada */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Data de Cadastro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data de Cadastro</label>
              <input
                type="date"
                value={createDataCadastro}
                onChange={(e) => setCreateDataCadastro(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Saldo Inicial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Inicial (R$)</label>
              <input
                type="number"
                step="0.01"
                value={createSaldoInicial.toFixed(2)}
                onChange={(e) => setCreateSaldoInicial(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              />
            </div>

            {/* Saldo Atual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Atual (R$)</label>
              <input
                type="number"
                step="0.01"
                value={createSaldoAtual.toFixed(2)}
                onChange={(e) => setCreateSaldoAtual(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              />
            </div>

            {/* Valor do Lucro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Lucro (R$)</label>
              <input
                type="text"
                value={`${createValorLucro >= 0 ? '+' : ''}R$ ${createValorLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                readOnly
                className={`w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-right font-semibold ${createValorLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`}
              />
            </div>

            {/* Percentual do Lucro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Percentual do Lucro (%)</label>
              <input
                type="text"
                value={`${createPercentualLucro >= 0 ? '+' : ''}${createPercentualLucro.toFixed(2)}%`}
                readOnly
                className={`w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-right font-semibold ${createPercentualLucro >= 0 ? 'text-green-600' : 'text-amber-900'}`}
              />
            </div>
          </div>



          {/* Botões de ação */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setShowCreateBalanceModal(false)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
            >
              <span>❌</span>
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  // Criar novo registro de saldo
                  const success = await createSaldoRecord(
                    createDataCadastro,
                    createSaldoInicial,
                    createSaldoAtual
                  );
                  
                  if (success) {
                    console.log('Registro de saldo criado com sucesso!');
                    setShowCreateBalanceModal(false);
                    // Resetar os campos - usar o novo saldo atual como base
                    setCreateDataCadastro(new Date().toISOString().split('T')[0]);
                    setCreateSaldoInicial(Number(createSaldoAtual)); // Usar o saldo atual como novo saldo inicial
                    setCreateSaldoAtual(Number(createSaldoAtual));
                  } else {
                    console.error('Erro ao criar registro de saldo');
                  }
                } catch (error) {
                  console.error('Erro ao criar saldo:', error);
                }
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
            >
              <span>💾</span>
              Criar Registro
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Histórico de Saldos - reutilizando componente real */}
    {showHistoryModal && (
      <HistoricoSaldos onClose={() => setShowHistoryModal(false)} />
    )}

    {/* Modal de Gráfico Mensal */}
    {showMonthlyGraphModal && (
      <MonthlyGraphModal onClose={() => setShowMonthlyGraphModal(false)} />
    )}

    {/* Modal de Configurações */}
    {showConfigModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-700 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex justify-between items-center p-6 border-b border-gray-600">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ⚙️ Configurações do Sistema
            </h2>
            <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="alertaPadrao171" checked={alertaPadrao171Ativo} onChange={(e) => setAlertaPadrao171Ativo(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
              <label htmlFor="alertaPadrao171" className="text-white text-sm cursor-pointer">Ativar Alerta do Padrão 171</label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="avisosSonoros" checked={avisosSonorosAtivos} onChange={(e) => setAvisosSonorosAtivos(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
              <label htmlFor="avisosSonoros" className="text-white text-sm cursor-pointer">Ativar avisos sonoros</label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="espanhol" checked={espanholEnabled} onChange={(e) => setEspanholEnabled(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
              <label htmlFor="espanhol" className="text-white text-sm cursor-pointer">Espanhol</label>
            </div>

          </div>
          <div className="flex justify-end p-6 border-t border-gray-600">
            <button onClick={() => setShowConfigModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors">Salvar</button>
          </div>
        </div>
      </div>
    )}

    </>
  );
};

export default RouletteBoard;
