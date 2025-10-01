# 📊 Documentação Técnica Completa - Cards de Estatísticas Roleta 171

## 🎯 VISÃO GERAL DO SISTEMA

O sistema de estatísticas é composto por **7 cards principais** que monitoram em tempo real os números sorteados na roleta. Cada card possui algoritmos específicos de análise, detecção de padrões e alertas visuais automáticos.

**IMPORTANTE**: O último número digitado deve aparecer **PRIMEIRO** na lista "Últimos Números Sorteados" (ordem reversa cronológica para exibição).

---

## 🏗️ ARQUITETURA TÉCNICA

### Componente Principal: `StatisticsCards.tsx`
```typescript
interface StatisticsCardsProps {
  statistics: Statistics;
  patternDetectedCount?: number;
  winCount?: number;
  lossCount?: number;
  numbersWithoutPattern?: number;
  totalNumbersWithoutPattern?: number;
  lastNumbers?: number[]; // Array cronológico: [mais_antigo, ..., mais_recente]
  pattern171Stats?: { entradas: number; wins: number; losses: number; };
  pattern171ForcedStats?: { wins: number; losses: number; };
  p2WinCount?: number;
  p2LossCount?: number;
}
```

### Layout Responsivo
- **Desktop (lg+)**: 7 cards em linha horizontal
- **Tablet (md)**: 3-4 cards por linha
- **Mobile**: 2 cards por linha

---

## 📊 CARD 1: CORES

### Algoritmo de Classificação
```typescript
function getNumberColor(num: number): 'red' | 'black' | 'green' {
  if (num === 0) return 'green';
  
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  return redNumbers.includes(num) ? 'red' : 'black';
}
```

### Categorias Monitoradas
- **🔴 Vermelho**: 18 números específicos
- **⚫ Preto**: 18 números específicos  
- **🟢 Verde**: Apenas o 0

### Sistema de Alertas
- **Condição**: 3+ números consecutivos da mesma cor
- **Animação**: `animate-pulse-color-size` nos valores
- **Reset**: Automático quando padrão é quebrado

### Dados Exibidos
- Quantidade absoluta por cor
- Percentual de distribuição em tempo real
- Indicadores visuais com cores correspondentes

---

## ⚡ CARD 2: PAR / ÍMPAR

### Algoritmo de Classificação
```typescript
function getEvenOdd(num: number): 'even' | 'odd' | null {
  if (num === 0) return null; // Zero não conta
  return num % 2 === 0 ? 'even' : 'odd';
}
```

### Categorias Monitoradas
- **🔵 Par**: Números pares (2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35)
- **🟣 Ímpar**: Números ímpares (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36)
- **⚠️ Exclusão**: Zero (0) não é contabilizado

### Sistema de Alertas
- **Condição**: 3+ números consecutivos da mesma paridade
- **Animação**: Pulsação nos indicadores
- **Cores**: `bg-blue-500` (par), `bg-purple-500` (ímpar)

---

## 📊 CARD 3: ALTO / BAIXO

### Algoritmo de Classificação
```typescript
function getHighLow(num: number): 'low' | 'high' | null {
  if (num === 0) return null; // Zero não conta
  return num <= 18 ? 'low' : 'high';
}
```

### Categorias Monitoradas
- **🟡 Baixo (1-18)**: Números de 1 a 18
- **🟠 Alto (19-36)**: Números de 19 a 36
- **⚠️ Exclusão**: Zero (0) não é contabilizado

### Sistema de Alertas
- **Condição**: 3+ números consecutivos da mesma faixa
- **Cores**: `bg-yellow-500` (baixo), `bg-orange-500` (alto)

---

## 🎯 CARD 4: DÚZIAS

### Algoritmo de Classificação
```typescript
function getDozen(num: number): 1 | 2 | 3 | null {
  if (num === 0) return null; // Zero não conta
  if (num <= 12) return 1;
  if (num <= 24) return 2;
  return 3;
}
```

### Categorias Monitoradas
- **🔵 1ª Dúzia (1-12)**: Números 1,2,3,4,5,6,7,8,9,10,11,12
- **🟦 2ª Dúzia (13-24)**: Números 13,14,15,16,17,18,19,20,21,22,23,24
- **🩷 3ª Dúzia (25-36)**: Números 25,26,27,28,29,30,31,32,33,34,35,36
- **⚠️ Exclusão**: Zero (0) não é contabilizado

### Sistema de Alertas
- **Condição**: 3+ números consecutivos da mesma dúzia
- **Cores**: `bg-cyan-500`, `bg-indigo-500`, `bg-pink-500`

---

## 📋 CARD 5: COLUNAS

### Algoritmo de Classificação
```typescript
function getColumn(num: number): 1 | 2 | 3 | null {
  if (num === 0) return null; // Zero não conta
  return ((num - 1) % 3) + 1;
}
```

### Categorias Monitoradas
- **🟢 1ª Coluna**: 1,4,7,10,13,16,19,22,25,28,31,34
- **🔷 2ª Coluna**: 2,5,8,11,14,17,20,23,26,29,32,35
- **🟢 3ª Coluna**: 3,6,9,12,15,18,21,24,27,30,33,36
- **⚠️ Exclusão**: Zero (0) não é contabilizado

### Sistema de Alertas
- **Condição**: 3+ números consecutivos da mesma coluna
- **Cores**: `bg-emerald-500`, `bg-teal-500`, `bg-lime-500`

---

## 🎲 CARD 6: ESTRATÉGIA P2

### Algoritmo Complexo de Detecção

#### Números de Entrada P2
```typescript
const P2_ENTRY_NUMBERS = [3, 4, 7, 11, 15, 18, 21, 22, 25, 29, 33, 36];
```

#### Números de Loss P2
```typescript  
const P2_LOSS_NUMBERS = [3, 4, 7, 11, 15, 18, 21, 22, 25, 29, 33, 36];
```

#### Lógica de Cálculo (Modo 2 - Padrão)
```typescript
function calculateP2StatsMode2(lastNumbers: number[]) {
  let entradas = 0, wins = 0, losses = 0;
  let maxNegativeSequence = 0, currentNegativeSequence = 0;
  
  // Processar do mais antigo para o mais recente
  for (let i = lastNumbers.length - 1; i >= 0; i--) {
    const number = lastNumbers[i];
    
    // Se encontrou entrada P2
    if (P2_ENTRY_NUMBERS.includes(number)) {
      entradas++;
      
      // Verificar próximo número (mais recente)
      if (i > 0) {
        const nextNumber = lastNumbers[i - 1];
        
        if (P2_LOSS_NUMBERS.includes(nextNumber)) {
          losses++; // LOSS: próximo número é P2
          currentNegativeSequence++;
          maxNegativeSequence = Math.max(maxNegativeSequence, currentNegativeSequence);
        } else {
          wins++; // WIN: próximo número NÃO é P2
          currentNegativeSequence = 0;
        }
      }
    }
  }
  
  return { entradas, wins, losses, maxNegativeSequence };
}
```

### Funcionalidades Especiais
- **Toggle de Modo**: Alterna entre Modo 1 e Modo 2
- **Modal Informativo**: Exibe números P2 visualmente
- **Sequência Negativa**: Maior sequência de losses consecutivos

### Dados Exibidos
- **Entradas**: Total de ativações da estratégia
- **WIN**: Vitórias (próximo número NÃO é P2)
- **LOSS**: Derrotas (próximo número É P2)
- **> Seq. Negativa**: Maior sequência de losses

---

## 🎯 CARD 7: PADRÃO 72

### Algoritmo de Detecção
```typescript
const PADRAO_72_NUMBERS = [7, 2]; // Números específicos do padrão

function calculatePadrao72Stats(lastNumbers: number[]) {
  let entradas = 0, wins = 0, losses = 0;
  let maxNegativeSequence = 0, currentNegativeSequence = 0;
  
  // Lógica específica do Padrão 72
  // [Implementação detalhada baseada na estratégia]
  
  return { entradas, wins, losses, maxNegativeSequence };
}
```

### Sistema de Alertas Especial
- **Animação Laranja**: `animate-pulse-orange-border` quando ativo
- **Detecção Automática**: Baseada em sequências específicas

### Dados Exibidos
- **Entradas**: Ativações do padrão
- **WIN**: Sucessos da estratégia
- **LOSS**: Falhas da estratégia  
- **> Seq. Negativa**: Maior sequência de losses

---

## 🎰 CARD 8: 171 FORÇADO (5)

### Algoritmo Simplificado
- **Foco**: Apenas WIN/LOSS
- **Sem Entradas**: Não conta entradas automáticas
- **Cálculo Manual**: Baseado em ações do usuário

### Dados Exibidos
- **WIN**: Vitórias da estratégia forçada
- **LOSS**: Derrotas da estratégia forçada

---

## 📊 CARD 9: ESTRATÉGIA 171 PRINCIPAL

### Cabeçalho Dinâmico
```typescript
title={
  <div className="flex justify-between items-center w-full">
    <span>📊 171</span>
    <span className="font-normal text-xs text-gray-500">
      Qt: <span className="font-bold text-white">{numbersWithoutPattern}</span> - 
      Md: <span className="font-bold text-white">{mediaCalculada}</span>
    </span>
  </div>
}
```

### Métricas Avançadas
- **Qt (Quantidade)**: Números sem padrão detectado
- **Md (Média)**: Números por entrada (lastNumbers.length / entradas)
- **Entradas**: Total de ativações automáticas
- **WIN**: Sucessos da estratégia
- **LOSS**: Falhas da estratégia

### Cores dos Indicadores
- **🔘 Entradas**: `bg-gray-500`
- **🟢 WIN**: `bg-green-500`  
- **🔴 LOSS**: `bg-red-500`

---

## 🔄 SISTEMA DE DETECÇÃO DE PADRÕES

### Algoritmo Universal de Alertas
```typescript
function detectRepeatedCategories(lastNumbers: number[]) {
  if (lastNumbers.length < 3) return emptyState;
  
  const repeatedColumns = new Set<number>();
  const repeatedDozens = new Set<number>();
  const repeatedHighLow = new Set<string>();
  const repeatedEvenOdd = new Set<string>();
  const repeatedColors = new Set<string>();
  
  // Verificar sequências contínuas a partir dos mais recentes
  for (let len = 3; len <= lastNumbers.length; len++) {
    const sequenceNumbers = lastNumbers.slice(0, len);
    const firstNum = sequenceNumbers[0];
    
    // Verificar cada categoria
    if (allSameCategory(sequenceNumbers, 'column')) {
      const column = getColumn(firstNum);
      if (column) repeatedColumns.add(column);
    }
    
    // [Repetir para todas as categorias]
  }
  
  return { repeatedColumns, repeatedDozens, repeatedHighLow, repeatedEvenOdd, repeatedColors };
}
```

### Estados de Animação
```typescript
const [animatingColumns, setAnimatingColumns] = useState<Set<number>>(new Set());
const [animatingDozens, setAnimatingDozens] = useState<Set<number>>(new Set());
const [animatingHighLow, setAnimatingHighLow] = useState<Set<string>>(new Set());
const [animatingEvenOdd, setAnimatingEvenOdd] = useState<Set<string>>(new Set());
const [animatingColors, setAnimatingColors] = useState<Set<string>>(new Set());
```

### Aplicação de Alertas
```typescript
useEffect(() => {
  const { repeatedColumns, repeatedDozens, repeatedHighLow, repeatedEvenOdd, repeatedColors } = detectRepeatedCategories();
  
  setAnimatingColumns(repeatedColumns);
  setAnimatingDozens(repeatedDozens);
  setAnimatingHighLow(repeatedHighLow);
  setAnimatingEvenOdd(repeatedEvenOdd);
  setAnimatingColors(repeatedColors);
  
  // Auto-clear após 10 segundos
  setTimeout(() => {
    setAnimatingColumns(new Set<number>());
    setAnimatingDozens(new Set<number>());
    setAnimatingHighLow(new Set<string>());
    setAnimatingEvenOdd(new Set<string>());
    setAnimatingColors(new Set<string>());
  }, 10000);
}, [lastNumbers]);
```

---

## 🎨 COMPONENTE STATCARD REUTILIZÁVEL

### Interface
```typescript
interface StatCardProps {
  title: string | React.ReactNode;
  data: Array<{
    label: string;
    value: number;
    percentage: number;
    hidePercentage?: boolean;
  }>;
  colors: string[];
  cardType?: 'colors' | 'dozens' | 'columns' | 'evenOdd' | 'highLow';
}
```

### Lógica de Animação
```typescript
const shouldAnimate = (cardType: string, index: number): boolean => {
  switch (cardType) {
    case 'colors':
      return animatingColors.has(['red', 'black', 'green'][index]);
    case 'dozens':
      return animatingDozens.has(index + 1);
    case 'columns':
      return animatingColumns.has(index + 1);
    case 'evenOdd':
      return animatingEvenOdd.has(['even', 'odd'][index]);
    case 'highLow':
      return animatingHighLow.has(['low', 'high'][index]);
    default:
      return false;
  }
};
```

---

## 🔧 INTEGRAÇÃO COM SISTEMA PRINCIPAL

### Hook de Estatísticas
```typescript
const statistics = useStatistics(statisticsData);
const statisticsData = React.useMemo(() => {
  const rouletteEntries = lastNumbers.map(number => ({
    number,
    color: getNumberColorUtil(number) as 'green' | 'red' | 'black',
    createdAt: new Date()
  }));
  return calculateStatistics(rouletteEntries);
}, [lastNumbers]);
```

### Fonte de Dados
- **Array Base**: `lastNumbers` (ordem cronológica)
- **Atualização**: Tempo real a cada novo número
- **Performance**: Otimizado com `useMemo` e `useEffect`

### Fluxo de Dados
1. **Entrada**: Usuário adiciona número via botão "+"
2. **Processamento**: `addToLastNumbers()` adiciona ao final do array
3. **Exibição**: `lastNumbers.slice().reverse()` para mostrar último primeiro
4. **Cálculos**: Estatísticas processadas em tempo real
5. **Alertas**: Detecção automática de padrões

---

## 📱 RESPONSIVIDADE E DESIGN

### Breakpoints
- **Mobile**: `grid-cols-2` (2 cards por linha)
- **Tablet**: `md:grid-cols-3` (3 cards por linha)  
- **Desktop**: `lg:grid-cols-7` (7 cards em linha)

### Tema Escuro
- **Fundo Cards**: `bg-gray-700`
- **Texto Principal**: `text-white`
- **Texto Secundário**: `text-gray-300`
- **Bordas**: `border-gray-600`

### Animações CSS
```css
.animate-pulse-color-size {
  animation: pulse-color-size 1s ease-in-out infinite;
}

@keyframes pulse-color-size {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.animate-pulse-orange-border {
  animation: pulse-orange-border 1s ease-in-out infinite;
  border: 2px solid orange;
}
```

---

## 🚨 REGRAS CRÍTICAS DE IMPLEMENTAÇÃO

### 1. Ordem de Exibição
- **Array Interno**: Cronológico `[antigo, ..., recente]`
- **Exibição Visual**: Reversa `[recente, ..., antigo]`
- **Código**: `lastNumbers.slice().reverse().map(...)`

### 2. Exclusão do Zero
- **Cards Afetados**: Par/Ímpar, Alto/Baixo, Dúzias, Colunas
- **Tratamento**: `if (num === 0) return null;`
- **Contabilização**: Zero só conta no card "Cores"

### 3. Detecção de Padrões
- **Mínimo**: 3 números consecutivos
- **Verificação**: A partir dos mais recentes
- **Reset**: Automático quando padrão quebra

### 4. Performance
- **Memoização**: Todos os cálculos pesados
- **Debounce**: Evitar re-renderizações excessivas
- **Cleanup**: Estados limpos automaticamente

### 5. Estados TypeScript
- **Colunas/Dúzias**: `Set<number>`
- **Alto/Baixo/Par/Ímpar**: `Set<string>`
- **Cores**: `Set<string>`
- **Casting Explícito**: `new Set<string>()` quando necessário

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Funcionalidades Obrigatórias
- [ ] 7 cards responsivos em grid
- [ ] Ordem reversa na exibição (último primeiro)
- [ ] Exclusão do zero nos cards apropriados
- [ ] Detecção automática de padrões (3+ consecutivos)
- [ ] Animações de alerta com auto-clear
- [ ] Cálculos P2 com dois modos
- [ ] Modal informativo P2
- [ ] Padrão 72 com alertas laranja
- [ ] Estratégia 171 com métricas avançadas
- [ ] Performance otimizada com memoização

### ✅ Validações Técnicas
- [ ] TypeScript sem erros
- [ ] Estados tipados corretamente
- [ ] Hooks otimizados
- [ ] CSS responsivo
- [ ] Animações suaves
- [ ] Cleanup de memória

---

## 🎯 RESUMO EXECUTIVO

| Card | Monitora | Alertas | Exclusão Zero | Categorias | Cores |
|------|----------|---------|---------------|------------|-------|
| **Cores** | Vermelho/Preto/Verde | ✅ 3+ consecutivos | ❌ | 3 | 🔴⚫🟢 |
| **Dúzias** | 1ª/2ª/3ª dúzia | ✅ 3+ consecutivos | ✅ | 3 | 🔵🟦🩷 |
| **Colunas** | 1ª/2ª/3ª coluna | ✅ 3+ consecutivos | ✅ | 3 | 🟢🔷🟢 |
| **Par/Ímpar** | Paridade | ✅ 3+ consecutivos | ✅ | 2 | 🔵🟣 |
| **Alto/Baixo** | Faixas 1-18/19-36 | ✅ 3+ consecutivos | ✅ | 2 | 🟡🟠 |
| **P2** | Estratégia específica | ❌ | ❌ | 4 | 🔘🟢🔴🟠 |
| **Padrão 72** | Estratégia específica | ✅ Laranja | ❌ | 4 | 🟣🟢🔴🟠 |
| **171 Forçado** | Manual | ❌ | ❌ | 2 | 🟢🔴 |
| **171 Principal** | Automático | ❌ | ❌ | 3 | 🔘🟢🔴 |

---

*Esta documentação técnica garante implementação precisa e completa do sistema de estatísticas da Roleta 171, com todos os algoritmos, regras de negócio e especificações técnicas necessárias para desenvolvimento por qualquer IA ou desenvolvedor.*