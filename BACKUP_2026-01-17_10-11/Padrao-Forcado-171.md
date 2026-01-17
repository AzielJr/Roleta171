# Padrão Forçado 171 - Documentação Técnica

## 📋 Visão Geral
O **Padrão Forçado 171** é uma funcionalidade que permite ao usuário forçar manualmente a aplicação da estratégia 171 baseada no último número sorteado, independentemente de ter sido detectado automaticamente pelo sistema.

Esta funcionalidade trabalha em conjunto com o **Padrão Detectado Automaticamente** (Race), mas com prioridades bem definidas para evitar conflitos.

---

## 🎯 Como Funciona

### 1. Ativação Manual
- O usuário clica no botão **"Forçar padrão 171"**
- O sistema utiliza o último número da lista de números sorteados como base para os cálculos
- O padrão forçado é **imediatamente desativado** se um padrão principal (race) for detectado

### 2. Cálculo dos 7 Números Expostos (Risco)
```javascript
// Lógica implementada em RouletteBoard.tsx
const lastNumber = lastNumbers[0]; // Último número sorteado
const position = ROULETTE_SEQUENCE.indexOf(lastNumber);

// Voltar 3 posições na sequência da roleta
const startIndex = (position - 3 + 37) % 37;

// Contar 7 números consecutivos a partir dessa posição
const exposedNumbers = [];
for (let i = 0; i < 7; i++) {
  const index = (startIndex + i) % 37;
  exposedNumbers.push(ROULETTE_SEQUENCE[index]);
}
```

**Exemplo prático:**
- Último número sorteado: **20**
- Posição do 20 na sequência: índice 24
- Voltar 3 posições: índice 21
- 7 números expostos: **16, 33, 1, 20, 14, 31, 9**

### 3. Cálculo dos 30 Números para Apostar
Os 30 números restantes são todos os números da roleta que **não estão** na lista dos 7 números expostos:
```javascript
const remainingNumbers = ROULETTE_SEQUENCE.filter(num => !exposedNumbers.includes(num));
```

### 4. Cálculo dos 2 Números Base (Cobertura Ótima)
O sistema encontra automaticamente os 2 números que melhor cobrem os 30 números restantes usando o algoritmo de cobertura:

```javascript
const findBestBaseNumbers = () => {
  // Testa todas as combinações possíveis de 2 números
  for (let i = 0; i < ROULETTE_SEQUENCE.length; i++) {
    for (let j = i + 1; j < ROULETTE_SEQUENCE.length; j++) {
      const num1 = ROULETTE_SEQUENCE[i];
      const num2 = ROULETTE_SEQUENCE[j];
      
      // Cada número base cobre 15 números (ele mesmo + 7 vizinhos de cada lado)
      const coverage1 = getCoverage(i, 7); // 7 vizinhos de cada lado
      const coverage2 = getCoverage(j, 7);
      
      // Combina as duas coberturas
      const totalCoverage = [...new Set([...coverage1, ...coverage2])];
      
      // Verifica quantos dos 30 números restantes são cobertos
      const coveredRemaining = remainingNumbers.filter(num => totalCoverage.includes(num));
    }
  }
  
  // Retorna a combinação que cobre mais números dos 30 restantes
  return bestCombination;
};
```

---

## 🎨 Sistema de Prioridades e Coloração

### ⚡ **PRIORIDADE MÁXIMA: Padrão Principal (Race Detectada)**
Quando uma race é detectada automaticamente, ela **sempre** tem precedência sobre o padrão forçado:

```javascript
// Lógica de prioridade implementada
const isHighlightedBet = patternAlert && patternAlert.type === 'race' 
  ? patternAlert.betNumbers?.includes(num) || false  // Dados da race
  : highlightedBetNumbers.includes(num);             // Dados do padrão forçado

const isHighlightedRisk = patternAlert && patternAlert.type === 'race'
  ? patternAlert.riskNumbers?.includes(num) || false
  : highlightedRiskNumbers.includes(num);

const isHighlightedBase = patternAlert && patternAlert.type === 'race'
  ? patternAlert.baseNumbers?.includes(num) || false
  : highlightedBaseNumbers.includes(num);
```

### 🔵 **Padrão Principal (Race) - Cores:**
- **30 números para apostar**: Amarelo (`bg-yellow-400 text-black`)
- **2 números base**: Azul (`bg-blue-500 text-white`) com efeitos especiais
- **7 números de risco**: Bordas brancas nos extremos (`ring-2 ring-white animate-pulse`)

### 🟡 **Padrão Forçado - Cores:**
- **30 números para apostar**: Amarelo (`bg-yellow-400 text-black`)
- **2 números base**: Azul (`bg-blue-500 text-white`) com efeitos especiais  
- **7 números de risco**: Bordas brancas nos extremos (`ring-2 ring-white animate-pulse`)

### 🎯 **Lógica de Renderização:**
```javascript
// PRIORIDADE MÁXIMA: Padrão Principal (Detectado) - SEMPRE tem precedência
patternAlert && patternAlert.type === 'race' && isHighlightedBase ? 
  'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse' : 
patternAlert && patternAlert.type === 'race' && isHighlightedBet && !isHighlightedBase ? 
  'bg-yellow-400 text-black ring-1 ring-yellow-500' : 
(patternAlert && patternAlert.type === 'race' && isHighlightedRisk && (isFirstRiskDetected || isLastRiskDetected)) ? 
  'ring-2 ring-white border-2 border-white animate-pulse shadow-white shadow-md' : '',

// Padrão Forçado 171 (APENAS quando NÃO há padrão principal ativo)
!patternAlert && isForcedPattern && isHighlightedBet ? 'bg-yellow-400 text-black' : '',
!patternAlert && isForcedPattern && isHighlightedRisk && (isFirstExposed || isLastExposed) ? 
  'ring-2 ring-white border-white scale-110 shadow-lg animate-pulse' : 
!patternAlert && isForcedPattern && isHighlightedRisk ? 'scale-110 shadow-lg' : '',
!patternAlert && isForcedPattern && isHighlightedBase ? 
  'bg-blue-500 text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse' : ''
```

---

## 🔧 Implementação Técnica

### Estados Principais
```javascript
// Estado do padrão forçado
const [forcedPattern, setForcedPattern] = useState(null);

// Arrays de números destacados (compartilhados entre padrões)
const [highlightedBetNumbers, setHighlightedBetNumbers] = useState([]);
const [highlightedRiskNumbers, setHighlightedRiskNumbers] = useState([]);
const [highlightedBaseNumbers, setHighlightedBaseNumbers] = useState([]);

// Alerta do padrão principal (race)
const [patternAlert, setPatternAlert] = useState(null);
```

### Estrutura do PatternAlert (Race)
```javascript
interface PatternAlert {
  numbers: number[];        // Os 2 últimos números que geraram o padrão
  positions: number[];      // Posições desses números na sequência
  message: string;          // Mensagem explicativa
  type: 'race';            // Tipo do padrão
  betNumbers: number[];     // 30 números para apostar (amarelo)
  riskNumbers: number[];    // 7 números de risco
  baseNumbers: number[];    // 2 números base (azul)
}
```

### Função de Ativação do Padrão Forçado
```javascript
const handleForcePattern = () => {
  if (lastNumbers.length === 0) return;
  
  const lastNumber = lastNumbers[0];
  const position = ROULETTE_SEQUENCE.indexOf(lastNumber);
  const startIndex = (position - 3 + 37) % 37;
  
  // Calcular números expostos
  const exposedNumbers = [];
  for (let i = 0; i < 7; i++) {
    const index = (startIndex + i) % 37;
    exposedNumbers.push(ROULETTE_SEQUENCE[index]);
  }
  
  // Calcular números restantes
  const remainingNumbers = ROULETTE_SEQUENCE.filter(num => !exposedNumbers.includes(num));
  
  // Encontrar melhor cobertura
  const bestCoverageNumbers = findBestCoverageNumbers(remainingNumbers);
  
  // Definir padrão forçado
  setForcedPattern({
    lastNumber,
    exposedNumbers,
    remainingNumbers,
    bestCoverageNumbers
  });
  
  // Atualizar arrays de destaque
  setHighlightedRiskNumbers(exposedNumbers);
  setHighlightedBetNumbers(remainingNumbers);
  setHighlightedBaseNumbers(bestCoverageNumbers);
};
```

### Limpeza Automática
```javascript
// Quando uma race é detectada, o padrão forçado é automaticamente limpo
if (raceResult.hasRace) {
  // ... configurar patternAlert ...
  
  // Limpar padrão forçado para dar prioridade ao padrão principal
  setForcedPattern(null);
}
```

---

## 📊 Diferenças Entre Padrões

| Aspecto | Padrão Forçado | Padrão Detectado (Race) |
|---------|----------------|-------------------------|
| **Ativação** | Manual (botão) | Automática (algoritmo) |
| **Prioridade** | Baixa | Alta (sempre prevalece) |
| **Container "Padrão Detectado"** | Não aparece | Aparece com informações |
| **Cálculo dos expostos** | Baseado no último número | Baseado na detecção de race |
| **Flexibilidade** | Funciona com qualquer número | Só quando race é detectada |
| **Persistência** | Até ser desativado manualmente | Até condições mudarem |
| **Cores** | Amarelo/Azul | Amarelo/Azul (idênticas) |

---

## 🎮 Sequência da Roleta Utilizada
```javascript
const ROULETTE_SEQUENCE = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
```

---

## 💡 Exemplo Completo de Funcionamento

### Cenário: Último número sorteado = 20

#### 1. **Ativação do Padrão Forçado**
- Usuário clica em "Forçar padrão 171"
- Sistema usa o número 20 como base

#### 2. **Cálculo dos 7 números expostos (risco)**
- Posição do 20: índice 24
- Voltar 3 posições: índice 21  
- 7 números: **16, 33, 1, 20, 14, 31, 9**
- Primeiro (16) e último (9) recebem bordas brancas oscilantes

#### 3. **Cálculo dos 30 números para apostar**
- Todos os números **exceto** os 7 expostos
- Aparecem em **amarelo**
- Total: 30 números (81% da roleta)

#### 4. **Cálculo dos 2 números base**
- Sistema encontra automaticamente (ex: 3, 36)
- Aparecem em **azul** com efeitos especiais
- Cobrem a maioria dos 30 números com seus vizinhos

#### 5. **Se uma Race for detectada**
- Padrão forçado é **automaticamente desativado**
- Race assume controle total da coloração
- Usuário vê apenas as cores da race detectada

---

## ⚠️ Considerações Importantes

### 🔄 **Conflitos Resolvidos**
- ✅ **Prioridade clara**: Race sempre prevalece sobre padrão forçado
- ✅ **Arrays compartilhados**: Mesmos arrays usados por ambos padrões, mas com lógica de prioridade
- ✅ **Limpeza automática**: Padrão forçado é limpo quando race é detectada
- ✅ **Coloração consistente**: Mesmas cores e efeitos em ambos padrões

### 🎯 **Casos de Uso**
1. **Treino/Teste**: Usuário pode forçar padrão para testar estratégias
2. **Análise Manual**: Aplicar estratégia 171 em qualquer momento
3. **Backup**: Quando algoritmo não detecta race, usuário pode forçar manualmente
4. **Educação**: Demonstrar como funciona a estratégia 171

### 🚀 **Performance**
- Cálculos são executados apenas quando necessário
- Estados são limpos automaticamente para evitar conflitos
- Renderização otimizada com condicionais bem estruturadas

---

## 🔍 Arquivos Relacionados

- **`src/components/RouletteBoard.tsx`**: Implementação principal
- **`src/utils/alertLogic.ts`**: Lógica de detecção de race
- **`src/utils/rouletteConfig.ts`**: Configurações da roleta
- **`Padrao-Detectado-Estrategia-171.md`**: Documentação do padrão automático

Esta implementação garante que o usuário tenha controle total sobre quando aplicar a estratégia 171, mantendo a consistência visual e funcional com o padrão detectado automaticamente, com prioridades bem definidas para evitar qualquer conflito entre os dois sistemas.