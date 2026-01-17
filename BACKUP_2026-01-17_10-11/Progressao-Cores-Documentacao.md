# 🎨 Progressão de Cores - Documentação Técnica

## 📋 Visão Geral

O **Progressão de Cores** é uma ferramenta de análise e gestão de apostas baseada na progressão de Fibonacci, focada em apostas de cores (vermelho/preto) na roleta. O sistema monitora automaticamente os números sorteados e calcula progressões de apostas em tempo real.

---

## 🎯 Funcionalidades Principais

### 1. Monitoramento Automático
- **Integração com números sorteados**: Sincroniza automaticamente com `lastNumbers`
- **Detecção de cores**: Identifica vermelho, preto e verde (zero)
- **Processamento em tempo real**: Atualiza instantaneamente a cada novo número

### 2. Sistema de Progressão Fibonacci
- **Valor de entrada configurável**: Define o valor inicial da progressão
- **12 níveis de progressão**: Fibonacci até o 12º nível
- **Indicador visual de posição**: Mostra a posição atual na progressão
- **Cores por aposta**: Identifica se a aposta foi em vermelho ou preto

### 3. Projeções de Metas 🎯
- **Ícone Target**: Localizado no canto superior direito, ao lado do botão fechar
- **4 metas percentuais**: 2,34%, 3,73%, 7,73%, 10,00%
- **Cálculo automático**: Baseado no saldo atual do usuário
- **Informações detalhadas**:
  - Percentual da meta
  - Valor a ganhar
  - Total a atingir (saldo + ganho)

---

## 🏗️ Arquitetura Técnica

### Componente: `ColorProgressionDesktop.tsx`

```typescript
interface ColorProgressionDesktopProps {
  isOpen: boolean;
  onClose: () => void;
  lastNumbers: number[];
}
```

### Estados Principais

```typescript
const [entryValue, setEntryValue] = useState<number>(1);
const [currentBalance, setCurrentBalance] = useState<number>(0);
const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
const [currentPosition, setCurrentPosition] = useState<number>(0);
const [wins, setWins] = useState<number>(0);
const [losses, setLosses] = useState<number>(0);
const [currentBetColor, setCurrentBetColor] = useState<'red' | 'black' | null>(null);
const [showGoalsPopup, setShowGoalsPopup] = useState<boolean>(false);
```

---

## 🎲 Lógica de Funcionamento

### Classificação de Números

```typescript
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

function getNumberColor(num: number): string {
  if (num === 0) return 'green';
  if (redNumbers.includes(num)) return 'red';
  if (blackNumbers.includes(num)) return 'black';
  return 'gray';
}
```

### Cálculo da Progressão Fibonacci

```typescript
const calculateProgression = (): number[] => {
  const progression = [entryValue];
  progression.push(entryValue * 2);
  
  for (let i = 2; i < 12; i++) {
    progression.push(progression[i - 1] + progression[i - 2]);
  }
  
  return progression;
};
```

**Exemplo com valor de entrada R$ 1,00:**
- Nível 1: R$ 1,00
- Nível 2: R$ 2,00
- Nível 3: R$ 3,00
- Nível 4: R$ 5,00
- Nível 5: R$ 8,00
- Nível 6: R$ 13,00
- Nível 7: R$ 21,00
- Nível 8: R$ 34,00
- Nível 9: R$ 55,00
- Nível 10: R$ 89,00
- Nível 11: R$ 144,00
- Nível 12: R$ 233,00

---

## 📊 Projeções de Metas

### Algoritmo de Cálculo

```typescript
const calculateGoals = () => {
  const currentBalance = balance;
  const goals = [
    { percentage: 2.34, label: '2,34%' },
    { percentage: 3.73, label: '3,73%' },
    { percentage: 7.73, label: '7,73%' },
    { percentage: 10.00, label: '10,00%' }
  ];

  return goals.map(goal => {
    const amountToWin = currentBalance * (goal.percentage / 100);
    const targetTotal = currentBalance + amountToWin;
    return {
      ...goal,
      amountToWin,
      targetTotal
    };
  });
};
```

### Exemplo Prático

**Saldo Atual: R$ 1.000,00**

| Meta | Percentual | Valor a Ganhar | Total a Atingir |
|------|-----------|----------------|-----------------|
| Meta 1 | 2,34% | R$ 23,40 | R$ 1.023,40 |
| Meta 2 | 3,73% | R$ 37,30 | R$ 1.037,30 |
| Meta 3 | 7,73% | R$ 77,30 | R$ 1.077,30 |
| Meta 4 | 10,00% | R$ 100,00 | R$ 1.100,00 |

---

## 🎮 Lógica de Win/Loss

### Detecção Automática

```typescript
useEffect(() => {
  if (lastNumbers.length > 0 && isOpen) {
    const lastNumber = lastNumbers[lastNumbers.length - 1];
    
    if (lastNumbers.length !== selectedNumbers.length) {
      setSelectedNumbers(prev => {
        const newSelectedNumbers = [lastNumber, ...prev];
        
        // Caso especial: Zero (sempre loss)
        if (lastNumber === 0) {
          const betValue = progression[currentPosition];
          setCurrentBalance(cb => cb - betValue);
          setLosses(l => l + 1);
          setCurrentPosition(pos => pos < 11 ? pos + 1 : pos);
          return newSelectedNumbers;
        }

        const lastColor = prev.length > 0 ? getNumberColor(prev[0]) : null;
        const currentColor = getNumberColor(lastNumber);

        // Win: mesma cor consecutiva
        if (lastColor && lastColor === currentColor && currentColor !== 'green') {
          const betValue = progression[currentPosition];
          setCurrentBalance(cb => cb + betValue);
          setWins(w => w + 1);
          setCurrentPosition(pos => pos > 0 ? pos - 1 : pos);
        } 
        // Loss: cores diferentes
        else if (lastColor && lastColor !== currentColor && currentColor !== 'green') {
          const betValue = progression[currentPosition];
          setCurrentBalance(cb => cb - betValue);
          setLosses(l => l + 1);
          setCurrentPosition(pos => pos < 11 ? pos + 1 : pos);
        }
        
        return newSelectedNumbers;
      });
    }
  }
}, [lastNumbers, isOpen]);
```

### Regras de Win/Loss

1. **WIN (Vitória)**:
   - Dois números consecutivos da mesma cor (vermelho ou preto)
   - Adiciona o valor da aposta ao saldo
   - Retrocede 1 nível na progressão
   - Incrementa contador de vitórias

2. **LOSS (Derrota)**:
   - Dois números consecutivos de cores diferentes
   - Zero (sempre é loss)
   - Subtrai o valor da aposta do saldo
   - Avança 1 nível na progressão (máximo nível 12)
   - Incrementa contador de derrotas

---

## 📱 Interface do Usuário

### Layout Principal

```
┌─────────────────────────────────────────────────────┐
│ Progressão de Cores              [🎯] [X]           │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────┬──────────────┐     │
│ │ Saldo        │ Resultado    │ Valor Entrada│     │
│ │ R$ 1000.00   │ R$ 0.00      │ [  1.00  ]   │     │
│ └──────────────┴──────────────┴──────────────┘     │
│                                                      │
│ ┌────────────────────────────────────────────┐     │
│ │ Números Selecionados                       │     │
│ │ [21] [34] [15] [3] [26] ...                │     │
│ └────────────────────────────────────────────┘     │
│                                                      │
│ ┌────────────────────────────────────────────┐     │
│ │ Estatísticas                               │     │
│ │ Total Preto: 5 (45.5%)                     │     │
│ │ Total Vermelho: 6 (54.5%)                  │     │
│ │ Total Win: 3 (60.0%) R$ 15.00              │     │
│ │ Total Loss: 2 (40.0%) R$ 8.00              │     │
│ └────────────────────────────────────────────┘     │
│                                                      │
│ ┌────────────────────────────────────────────┐     │
│ │ Progressão de Apostas                      │     │
│ │ [#1] [#2] [#3] [#4] [#5] [#6]              │     │
│ │ 1.00 2.00 3.00 5.00 8.00 13.00             │     │
│ │ [#7] [#8] [#9] [#10] [#11] [#12]           │     │
│ │ 21.00 34.00 55.00 89.00 144.00 233.00      │     │
│ └────────────────────────────────────────────┘     │
│                                                      │
│ [Limpar Tudo]  [Desfazer Último]                   │
└─────────────────────────────────────────────────────┘
```

### Popup de Projeções de Metas

```
┌─────────────────────────────────────────────────────┐
│ 🎯 Projeções de Metas                          [X]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐    │
│ │ Saldo Atual                                 │    │
│ │ R$ 1.000,00                                 │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌──────────────────┬──────────────────┐            │
│ │ Meta 2,34%  [2.34%]                 │            │
│ │ Valor a Ganhar: R$ 23,40            │            │
│ │ Total a Atingir: R$ 1.023,40        │            │
│ └──────────────────┴──────────────────┘            │
│                                                      │
│ ┌──────────────────┬──────────────────┐            │
│ │ Meta 3,73%  [3.73%]                 │            │
│ │ Valor a Ganhar: R$ 37,30            │            │
│ │ Total a Atingir: R$ 1.037,30        │            │
│ └──────────────────┴──────────────────┘            │
│                                                      │
│ ┌──────────────────┬──────────────────┐            │
│ │ Meta 7,73%  [7.73%]                 │            │
│ │ Valor a Ganhar: R$ 77,30            │            │
│ │ Total a Atingir: R$ 1.077,30        │            │
│ └──────────────────┴──────────────────┘            │
│                                                      │
│ ┌──────────────────┬──────────────────┐            │
│ │ Meta 10,00% [10.00%]                │            │
│ │ Valor a Ganhar: R$ 100,00           │            │
│ │ Total a Atingir: R$ 1.100,00        │            │
│ └──────────────────┴──────────────────┘            │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Estilos e Cores

### Indicador de Posição Atual
- **Vermelho**: `border-4 border-red-600` (quando aposta é vermelha)
- **Preto**: `border-4 border-gray-800` (quando aposta é preta)
- **Neutro**: `border-4 border-yellow-400` (sem cor definida)
- **Fundo**: `bg-yellow-200` (destaque da posição atual)

### Números Selecionados
- **Vermelho**: `bg-red-600`
- **Preto**: `bg-gray-800`
- **Verde (zero)**: `bg-green-600`

### Cards de Metas
- **Fundo**: Gradiente verde (`from-green-50 to-green-100`)
- **Borda**: `border-2 border-green-200`
- **Badge percentual**: `bg-green-600 text-white`

---

## 🔧 Funcionalidades Especiais

### 1. Limpar Tudo
- Reseta todos os contadores
- Limpa números selecionados
- Volta para posição inicial (nível 1)
- Zera saldo da operação

### 2. Desfazer Último
- Remove último número processado
- Reverte cálculo de win/loss
- Retorna à posição anterior na progressão
- Atualiza saldo da operação

### 3. Valor de Entrada Configurável
- Aceita valores decimais (vírgula ou ponto)
- Recalcula toda a progressão automaticamente
- Reseta posição para nível 1 ao alterar

---

## 📊 Estatísticas Exibidas

### Distribuição de Cores
- **Total Preto**: Quantidade e percentual
- **Total Vermelho**: Quantidade e percentual
- **Cálculo**: `(quantidade / total) * 100`

### Resultados
- **Total Win**: Quantidade, percentual e valor ganho
- **Total Loss**: Quantidade, percentual e valor perdido
- **Percentuais**: `(wins ou losses / total_apostas) * 100`

---

## 🚀 Integração com Sistema Principal

### Ativação
O componente é ativado através do botão "🎨" na barra de ferramentas principal:

```typescript
<button
  onClick={() => setShowColorProgressionDesktop(v => !v)}
  className="bg-teal-600 hover:bg-teal-700 text-white text-xs rounded"
  title="Progressão de Cores"
>
  🎨
</button>
```

### Sincronização com lastNumbers
```typescript
{showColorProgressionDesktop && (
  <ColorProgressionDesktop 
    isOpen={showColorProgressionDesktop} 
    onClose={() => setShowColorProgressionDesktop(false)} 
    lastNumbers={lastNumbers}
  />
)}
```

---

## 📐 Ajustes de Layout

### Margem Superior
- **Valor**: `marginBottom: '5px'`
- **Redução**: 15px em relação ao valor anterior (20px)
- **Objetivo**: Melhor aproveitamento do espaço vertical

### Responsividade
- **Desktop**: Grid 2 colunas (`lg:grid-cols-2`)
- **Mobile**: 1 coluna (`grid-cols-1`)
- **Gap**: `gap-4` entre elementos

---

## 🎯 Casos de Uso

### Exemplo 1: Sequência de Vitórias
```
Números sorteados: 21 (vermelho), 34 (vermelho), 15 (preto)
Valor de entrada: R$ 1,00

1. Número 21 (vermelho) - Primeira aposta
   - Posição: Nível 1 (R$ 1,00)
   - Cor da aposta: Vermelho

2. Número 34 (vermelho) - WIN!
   - Mesma cor consecutiva
   - Saldo: +R$ 1,00
   - Nova posição: Nível 1 (mantém)
   - Wins: 1

3. Número 15 (preto) - LOSS
   - Cor diferente
   - Saldo: -R$ 1,00
   - Nova posição: Nível 2 (R$ 2,00)
   - Losses: 1

Resultado final: R$ 0,00 (1 win, 1 loss)
```

### Exemplo 2: Progressão com Zero
```
Números sorteados: 21 (vermelho), 0 (verde)
Valor de entrada: R$ 1,00

1. Número 21 (vermelho)
   - Posição: Nível 1 (R$ 1,00)
   - Cor da aposta: Vermelho

2. Número 0 (verde) - LOSS automático
   - Zero sempre é loss
   - Saldo: -R$ 1,00
   - Nova posição: Nível 2 (R$ 2,00)
   - Losses: 1

Resultado final: -R$ 1,00 (0 wins, 1 loss)
```

---

## ✅ Checklist de Implementação

- [x] Componente ColorProgressionDesktop criado
- [x] Integração com lastNumbers
- [x] Cálculo de progressão Fibonacci
- [x] Detecção automática de win/loss
- [x] Sistema de cores (vermelho/preto/verde)
- [x] Estatísticas em tempo real
- [x] Botão "Limpar Tudo"
- [x] Botão "Desfazer Último"
- [x] Valor de entrada configurável
- [x] Ícone de Projeções de Metas
- [x] Popup de metas com 4 percentuais
- [x] Cálculo automático baseado no saldo
- [x] Margem superior reduzida (15px)
- [x] Layout responsivo
- [x] Integração com BalanceContext

---

## 🔄 Atualizações Recentes

### Versão 1.1.0 (15/01/2026)
- ✅ Adicionado ícone Target para Projeções de Metas
- ✅ Implementado popup com 4 metas percentuais (2,34%, 3,73%, 7,73%, 10,00%)
- ✅ Cálculo automático baseado no saldo atual
- ✅ Redução da margem superior em 15px
- ✅ Interface visual aprimorada com gradientes verdes
- ✅ Exibição de valor a ganhar e total a atingir por meta

---

*Esta documentação técnica garante a compreensão completa do sistema de Progressão de Cores, incluindo todas as funcionalidades, algoritmos e integrações implementadas.*
