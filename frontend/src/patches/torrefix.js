// PATCH PARA CORRIGIR O PROBLEMA DA TORRE
// Copie e cole este código no RouletteBoard.tsx

// 1. ADICIONE ESTE IMPORT NO TOPO DO ARQUIVO (junto com os outros imports):
// import { evaluateTorreNumber } from '../utils/torreEvaluator';

// 2. SUBSTITUA A FUNÇÃO addToLastNumbers PELA VERSÃO ABAIXO:

const addToLastNumbers = (num) => {
  console.log('[DEBUG] Adicionando número:', num);
  
  // Se devemos limpar a borda de BET Terminais na próxima jogada (após WIN), faça agora
  if ((window).betTerminaisClearOnNext || false) {
    setAnimatingBetTerminais(undefined);
    (window).betTerminaisClearOnNext = false;
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
  
  setLastNumbers(prev => {
    const newList = [...prev, num]; // CORREÇÃO: Adicionar no FINAL - ordem cronológica correta
    const updatedList = newList.slice(-60); // Manter apenas os últimos 60
    
    // Avaliar P2, TORRE e BET Terminais antes de atualizar demais lógicas
    evaluateTorre(num, prev);
    
    // *** NOVA LINHA ADICIONADA AQUI ***
    evaluateTorreNumber(num, torrePendingEntrada, setTorrePendingEntrada, setAnimatingTorre, setTorreWinCount, setTorreLossCount, clearTorreVisuals);
    
    // Classificação garantida do WIN da Torre no número atual (fallback)
    if (torrePendingEntrada && !TORRE_LOSS_SET.has(num)) {
      console.log('[DEBUG] WIN detectado (fallback), removendo borda.');
      setAnimatingTorre('green');
      setTorrePendingEntrada(false);
      setTimeout(() => {
        clearTorreVisuals();
        console.log('[DEBUG] Borda removida após WIN (fallback).');
      }, 350);
    }
    
    evaluateP2(num, prev);
    // Avaliar BET Terminais com a LISTA ANTERIOR (prev) para decidir Entrada,
    // e classificar WIN/LOSS no número atual com base nos 3 menos frequentes antes dele
    evaluateBetTerminais(num, prev);
    
    // ... resto da função permanece igual
    
    return updatedList;
  });
};
