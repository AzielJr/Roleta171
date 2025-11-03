import { useState, useEffect, useRef } from 'react';
import { useBalance } from '../contexts/BalanceContext';

interface EntryRecord {
  id: number;
  tipo: 'D' | 'C';
  resultado: 'WIN' | 'LOSS';
  valor: number;
  timestamp: Date;
}

interface DashboardStats {
  duzias: {
    total: number;
    wins: number;
    losses: number;
    winPercentage: number;
    lossPercentage: number;
    lucro: number;
  };
  colunas: {
    total: number;
    wins: number;
    losses: number;
    winPercentage: number;
    lossPercentage: number;
    lucro: number;
  };
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

function formatDateTimeLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const MM = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

function formatDateOnly(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function DuzColPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Configuração inicial
  const { balance } = useBalance();
  const [dataInicial, setDataInicial] = useState<string>(formatDateTimeLocal(new Date()));
  const [dataAtual, setDataAtual] = useState<string>(formatDateTimeLocal(new Date()));
  // const [dataFinal, setDataFinal] = useState<string>(formatDateOnly(new Date())); // removido
  const [saldoInicial, setSaldoInicial] = useState<string>('');
  const [valorEntrada, setValorEntrada] = useState<string>('')
  const valorEntradaNum = parseFloat(valorEntrada.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0
  const valorEntradaRef = useRef<HTMLInputElement>(null)

  // Registros
  const [entries, setEntries] = useState<EntryRecord[]>([]);

  // Estatísticas
  const calcStats = (): DashboardStats => {
    const duzias = entries.filter(e => e.tipo === 'D');
    const colunas = entries.filter(e => e.tipo === 'C');

    const calc = (list: EntryRecord[]) => {
      const wins = list.filter(r => r.resultado === 'WIN').length;
      const losses = list.filter(r => r.resultado === 'LOSS').length;
      const total = list.length;
      const winPercentage = total ? (wins / total) * 100 : 0;
      const lossPercentage = total ? (losses / total) * 100 : 0;
      const lucro = list.reduce((acc, r) => acc + (r.resultado === 'WIN' ? r.valor : -(r.valor * 2)), 0);
      return { total, wins, losses, winPercentage, lossPercentage, lucro };
    };

    return { duzias: calc(duzias), colunas: calc(colunas) };
  };

  const stats = calcStats();

  // Metas calculadas a partir do Saldo Inicial
  const parseBRL = (s: string) => {
    if (!s) return 0;
    const onlyNums = s.replace(/[^\d,.-]/g, '');
    const clean = onlyNums.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };
  const saldoInicialNum = parseBRL(saldoInicial);
  const meta5 = saldoInicialNum * 1.05;
  const meta10 = saldoInicialNum * 1.10;
  const totalLucro = stats.duzias.lucro + stats.colunas.lucro;
  const saldoAtualCalc = saldoInicialNum + totalLucro;

  // Adicionar entrada ao clicar no cabeçalho (incrementa 1 registro)
  const addEntry = (tipo: 'D' | 'C', resultado: 'WIN' | 'LOSS') => {
    if (valorEntradaNum <= 0) {
      alert('Digite o Vlr. de Entrada maior que zero para registrar.');
      return;
    }

    const valor = valorEntradaNum;

    const newEntry: EntryRecord = {
      id: Date.now(),
      tipo,
      resultado,
      valor,
      timestamp: new Date(),
    };
    setEntries(prev => [newEntry, ...prev]);

    setDataAtual(formatDateTimeLocal(new Date()));
  };

  useEffect(() => {
    if (isOpen) {
      const initial = (balance ?? 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      setSaldoInicial(initial)
      setValorEntrada('R$ 1,00')
      setTimeout(() => valorEntradaRef.current?.focus(), 0)
    }
  }, [isOpen, balance])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-[95%] sm:w-[90%] md:w-[80%] max-w-3xl mx-auto max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho compacto */}
        <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-bold text-base sm:text-lg text-center flex-1">REGISTRO DE ENTRADAS</h2>
            <button onClick={onClose} className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm sm:text-base" aria-label="Fechar">✕</button>
          </div>
        </div>

        <div className="px-3 py-2">
           {/* Campos compactos: label ao lado do input */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 mb-2">
             <div className="flex items-center gap-2">
               <span className="text-white text-sm whitespace-nowrap">Data Inicial:</span>
               <input type="datetime-local" value={dataInicial} onChange={e => setDataInicial(e.target.value)} className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm h-8 sm:h-6" />
             </div>
             <div className="flex items-center gap-2">
               <span className="text-white text-sm whitespace-nowrap">Atual:</span>
               <input type="datetime-local" value={dataAtual} onChange={e => setDataAtual(e.target.value)} className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm h-8 sm:h-6" />
             </div>
             <div className="col-span-2">
               <div className="grid grid-cols-2 gap-2">
                 {/* Esquerda: 50% Saldo Inicial */}
                 <div className="flex items-center gap-2">
                   <span className="text-white text-sm whitespace-nowrap">Saldo Inicial:</span>
                   <span className="text-white text-sm">R$</span>
                   <input type="text" value={saldoInicial} onChange={e => setSaldoInicial(e.target.value)} placeholder="0,00" className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm h-8 sm:h-6 text-right" />
                 </div>
                 {/* Direita: 50% dividido em duas metas */}
                 <div className="grid grid-cols-2 gap-2 items-center">
                   <div className="flex items-center gap-1">
                     <span className="text-white text-sm whitespace-nowrap">Meta 5%:</span>
                     <span className="text-green-300 text-sm font-semibold">{formatCurrency(meta5)}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <span className="text-white text-sm whitespace-nowrap">Meta 10%:</span>
                     <span className="text-green-300 text-sm font-semibold">{formatCurrency(meta10)}</span>
                   </div>
                 </div>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-white text-sm whitespace-nowrap">Saldo Atual:</span>
               <input type="text" value={formatCurrency(saldoAtualCalc)} readOnly className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm h-8 sm:h-6 text-right" />
             </div>
             <div className="flex items-center gap-2">
               <span className="text-white text-sm whitespace-nowrap">Vlr. Entrada:</span>
               <input ref={valorEntradaRef} type="text" value={valorEntrada} onChange={e => setValorEntrada(e.target.value)} placeholder="0,00" className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm h-8 sm:h-6 text-right" />
             </div>
             {valorEntradaNum <= 0 && (
               <div className="col-span-2 text-red-400 text-sm">Digite o Vlr. de Entrada para habilitar WIN/LOSS.</div>
             )}
           </div>

          {/* Divisória */}
          <div className="border-t border-gray-700 my-2" />

          {/* DÚZIAS e COLUNAS em duas colunas, layout super compacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* DÚZIAS */}
            <div className="border border-gray-700 rounded">
              <div className="bg-gray-800 text-white text-center py-2 sm:py-1 font-bold border-b border-gray-700 text-sm">DÚZIAS - {String(stats.duzias.total).padStart(2, '0')}</div>

              {/* Cabeçalhos clicáveis */}
              <div className="grid grid-cols-2 border-b border-gray-700">
                <button
                  className="text-center py-2 sm:py-1 text-white font-semibold border-r border-gray-700 bg-green-800 text-sm select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={valorEntradaNum <= 0}
                  onClick={() => addEntry('D', 'WIN')}
                  title={valorEntradaNum <= 0 ? 'Digite o Vlr. de Entrada' : 'Adicionar WIN em Dúzias'}
                >
                  WIN - {stats.duzias.wins}
                </button>
                <button
                  className="text-center py-2 sm:py-1 text-white font-semibold bg-red-800 text-sm select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={valorEntradaNum <= 0}
                  onClick={() => addEntry('D', 'LOSS')}
                  title={valorEntradaNum <= 0 ? 'Digite o Vlr. de Entrada' : 'Adicionar LOSS em Dúzias'}
                >
                  LOSS - {stats.duzias.losses}
                </button>
              </div>

              {/* Percentuais */}
              <div className="grid grid-cols-2 border-t border-gray-700">
                <div className="text-center py-1 text-white border-r border-gray-700 text-sm">{stats.duzias.winPercentage.toFixed(0)}%</div>
                <div className="text-center py-1 text-white text-sm">{stats.duzias.lossPercentage.toFixed(0)}%</div>
              </div>

              {/* Lucro */}
              <div className="border-t border-gray-700 px-2 py-1 text-center text-sm">
                <span className="text-white">Lucro: </span>
                <span className={`font-bold ${stats.duzias.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(stats.duzias.lucro)}</span>
              </div>
            </div>

            {/* COLUNAS */}
            <div className="border border-gray-700 rounded">
              <div className="bg-gray-800 text-white text-center py-2 sm:py-1 font-bold border-b border-gray-700 text-sm">COLUNAS - {String(stats.colunas.total).padStart(2, '0')}</div>

              {/* Cabeçalhos clicáveis */}
              <div className="grid grid-cols-2 border-b border-gray-700">
                <button
                  className="text-center py-2 sm:py-1 text-white font-semibold border-r border-gray-700 bg-green-800 text-sm select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={valorEntradaNum <= 0}
                  onClick={() => addEntry('C', 'WIN')}
                  title={valorEntradaNum <= 0 ? 'Digite o Vlr. de Entrada' : 'Adicionar WIN em Colunas'}
                >
                  WIN - {stats.colunas.wins}
                </button>
                <button
                  className="text-center py-2 sm:py-1 text-white font-semibold bg-red-800 text-sm select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={valorEntradaNum <= 0}
                  onClick={() => addEntry('C', 'LOSS')}
                  title={valorEntradaNum <= 0 ? 'Digite o Vlr. de Entrada' : 'Adicionar LOSS em Colunas'}
                >
                  LOSS - {stats.colunas.losses}
                </button>
              </div>

              {/* Percentuais */}
              <div className="grid grid-cols-2 border-t border-gray-700">
                <div className="text-center py-1 text-white border-r border-gray-700 text-sm">{stats.colunas.winPercentage.toFixed(0)}%</div>
                <div className="text-center py-1 text-white text-sm">{stats.colunas.lossPercentage.toFixed(0)}%</div>
              </div>

              {/* Lucro */}
              <div className="border-t border-gray-700 px-2 py-1 text-center text-sm">
                <span className="text-white">Lucro: </span>
                <span className={`font-bold ${stats.colunas.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(stats.colunas.lucro)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}