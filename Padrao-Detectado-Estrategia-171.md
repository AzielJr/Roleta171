# Padrão Detectado - Estratégia 171 - Documentação Técnica

## Visão Geral
O **Padrão Detectado - Estratégia 171** é um sistema automático de detecção de oportunidades de aposta baseado na condição de "race" na roleta. O sistema monitora continuamente os números sorteados e identifica automaticamente quando dois números consecutivos atendem aos critérios específicos da estratégia.

## Condição de Ativação (Race)

### Critério Principal
O padrão é detectado automaticamente quando **2 números consecutivos** (os dois últimos sorteados) estão **dentro de 5 posições consecutivas** na sequência física da roleta.

### Lógica de Detecção
```javascript
function areWithinFivePositions(num1: number, num2: number): boolean {
  // Se são o mesmo número, não é race
  if (num1 === num2) return false;
  
  const index1 = WHEEL_ORDER.indexOf(num1);
  const index2 = WHEEL_ORDER.indexOf(num2);
  
  // Calcula a distância direta
  const directDistance = Math.abs(index1 - index2);
  // Calcula a distância circular (volta completa)
  const circularDistance = WHEEL_ORDER.length - directDistance;
  
  // A menor distância entre as duas
  const minDistance = Math.min(directDistance, circularDistance);
  
  // Considera próximos se estão a até 5 posições de distância
  return minDistance <= 5;
}
```

**Exemplo prático:**
- Últimos números sorteados: **21** e **34**
- Posição do 21 na sequência: índice 5
- Posição do 34 na sequência: índice 9
- Distância: 4 posições (≤ 5) → **Race detectada!**

## Cálculo dos 7 Números Expostos (Risco) - LÓGICA CORRIGIDA

### Conceito Fundamental: Roleta Circular
A sequência da roleta deve ser vista como um **círculo**:
- Após o índice 36 (número 26), vem o índice 0 (número 0)
- Após o número 26, o próximo é o 0
- A sequência é **circular e contínua**

### Algoritmo de Cálculo Corrigido
```javascript
function calculateExposedNumbers(raceNum1: number, raceNum2: number): number[] {
  // 1. Encontra o primeiro índice onde qualquer um dos números aparece
  let firstFoundIndex = -1;
  let firstFoundNumber = null;
  
  for (let i = 0; i < WHEEL_ORDER.length; i++) {
    if (WHEEL_ORDER[i] === raceNum1 || WHEEL_ORDER[i] === raceNum2) {
      firstFoundIndex = i;
      firstFoundNumber = WHEEL_ORDER[i];
      break;
    }
  }
  
  if (firstFoundIndex === -1) return [];
  
  // 2. Determina qual é o segundo número
  const secondNumber = firstFoundNumber === raceNum1 ? raceNum2 : raceNum1;
  
  // 3. Varre os próximos 5 índices para ver se existe o segundo número
  let secondFoundInRange = false;
  for (let i = 1; i <= 5; i++) {
    const checkIndex = (firstFoundIndex + i) % WHEEL_ORDER.length;
    if (WHEEL_ORDER[checkIndex] === secondNumber) {
      secondFoundInRange = true;
      break;
    }
  }
  
  let startIndex;
  if (secondFoundInRange) {
    // Se encontrou o segundo número nos próximos 5 índices
    // Usa primeiro índice - 1 como ponto de partida
    startIndex = (firstFoundIndex - 1 + WHEEL_ORDER.length) % WHEEL_ORDER.length;
  } else {
    // Se não encontrou nos próximos 5 índices
    // Usa índice do segundo número - 1 como ponto de partida
    const secondNumberIndex = WHEEL_ORDER.indexOf(secondNumber);
    startIndex = (secondNumberIndex - 1 + WHEEL_ORDER.length) % WHEEL_ORDER.length;
  }
  
  // 4. Captura os próximos 7 números (sequência normal circular)
  const exposedNumbers = [];
  for (let i = 0; i < 7; i++) {
    const currentIndex = (startIndex + i) % WHEEL_ORDER.length;
    exposedNumbers.push(WHEEL_ORDER[currentIndex]);
  }
  
  return exposedNumbers;
}
```

### Exemplos Práticos

#### Exemplo 1: Números Próximos (21 e 34)
1. **Primeiro número encontrado**: 21 (índice 5)
2. **Varrer próximos 5 índices**: 6, 7, 8, 9, 10
   - Índice 9 = número 34 ✅ **Encontrado!**
3. **Ponto de partida**: índice 4 (5-1)
4. **7 números expostos**: [4, 21, 2, 25, 17, 34, 6]

#### Exemplo 2: Números Distantes (15 e 3)
1. **Primeiro número encontrado**: 15 (índice 2)
2. **Varrer próximos 5 índices**: 3, 4, 5, 6, 7
   - Números: 19, 4, 21, 2, 25 ❌ **Não encontrou o 3**
3. **Encontrar índice do segundo número**: 3 está no índice 35
4. **Ponto de partida**: índice 34 (35-1)
5. **7 números expostos (circular)**: [35, 3, 26, 0, 32, 15, 19]
   - Índice 34 → 35
   - Índice 35 → 3
   - Índice 36 → 26
   - Índice 0 → 0 (volta ao início!)
   - Índice 1 → 32
   - Índice 2 → 15
   - Índice 3 → 19

## Cálculo dos 2 Números para Apostar

### Algoritmo de Otimização
O sistema encontra automaticamente os 2 números que melhor cobrem os 30 números restantes (que não estão expostos):

```javascript
function findOptimalBettingNumbers(exposedNumbers: number[]): number[] {
  const remainingNumbers = WHEEL_ORDER.filter(num => !exposedNumbers.includes(num));
  let bestCoverage = 0;
  let bestNumbers = [];
  
  // Testa todas as combinações possíveis de 2 números
  for (let i = 0; i < WHEEL_ORDER.length; i++) {
    for (let j = i + 1; j < WHEEL_ORDER.length; j++) {
      const num1 = WHEEL_ORDER[i];
      const num2 = WHEEL_ORDER[j];
      
      // Cada número cobre 15 posições (ele mesmo + 7 vizinhos de cada lado)
      const coverage1 = getNumberNeighbors(num1);
      const coverage2 = getNumberNeighbors(num2);
      
      // União das duas coberturas
      const totalCoverage = [...new Set([...coverage1, ...coverage2])];
      
      // Conta quantos dos 30 números restantes são cobertos
      const coveredRemaining = remainingNumbers.filter(num => totalCoverage.includes(num));
      
      if (coveredRemaining.length > bestCoverage) {
        bestCoverage = coveredRemaining.length;
        bestNumbers = [num1, num2];
      }
    }
  }
  
  return bestNumbers;
}
```

## Visualização e Interface

### Container "Padrão Detectado"
Quando o padrão é detectado automaticamente, aparece um container especial com:
- **Título**: "🎯 Padrão Detectado - Estratégia 171"
- **3 Cards informativos**:
  1. **APOSTAR** (verde): Mostra os 2 números recomendados
  2. **RISCO** (vermelho): Mostra os 7 números expostos
  3. **COBERTURA** (azul): Estatísticas da cobertura

### Cores dos Números

#### 2 Números para Apostar
- **Cor de fundo**: Azul (`#3b82f6`)
- **Cor do texto**: Branco
- **Borda**: Azul (`#3b82f6`) + borda branca oscilante
- **Função**: Números recomendados para aposta (cobrem ~30 números)

#### 7 Números Expostos (Risco)
- **Cor**: Mantêm sua cor original (vermelho, preto ou verde)
- **Borda especial**: Apenas o **primeiro** e **último** da sequência recebem borda branca oscilante
- **Função**: Números de risco que devem ser evitados

#### 30 Números Cobertos
- **Cor de fundo**: Azul claro (cobertura visual)
- **Função**: Todos os números cobertos pelos 2 números de aposta

## Monitoramento Automático

### useEffect de Detecção
```javascript
useEffect(() => {
  if (lastNumbers.length >= 2) {
    // Converter para formato esperado
    const history = lastNumbers.map((number, index) => ({
      id: `${Date.now()}-${index}`,
      number,
      color: getNumberColor(number),
      createdAt: new Date(Date.now() - index * 1000)
    }));

    const raceData = checkForRaceCondition(history);
    
    if (raceData.hasRace) {
      setPatternAlert({
        type: 'race',
        message: `Race detectada! Aposte nos números ${raceData.raceNumbers.join(' e ')} e seus vizinhos.`,
        numbers: raceData.raceNumbers,
        positions: raceData.raceNumbers.map(num => ROULETTE_SEQUENCE.indexOf(num)),
        betNumbers: raceData.raceNumbers,
        riskNumbers: raceData.riskNumbers
      });
      setHighlightedBetNumbers(raceData.coveredNumbers);
      setHighlightedRiskNumbers(raceData.riskNumbers);
    } else {
      // Limpar alerta se não há mais race
      if (patternAlert?.type === 'race') {
        setPatternAlert(null);
        setHighlightedBetNumbers([]);
        setHighlightedRiskNumbers([]);
      }
    }
  }
}, [lastNumbers]);
```

## Diferenças do Padrão Forçado

| Aspecto | Padrão Detectado | Padrão Forçado |
|---------|------------------|----------------|
| **Ativação** | Automática (algoritmo) | Manual (botão) |
| **Condição** | 2 números em 5 posições consecutivas | Qualquer último número |
| **Cor dos números de aposta** | Azul | Amarelo |
| **Container visual** | Aparece automaticamente | Não aparece |
| **Cálculo dos expostos** | Baseado nos 2 números da race | Baseado no último número |
| **Flexibilidade** | Só quando condição é atendida | Funciona sempre |
| **Lógica circular** | Implementada corretamente | Implementada corretamente |

## Sequência da Roleta (WHEEL_ORDER) - Circular
```javascript
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
```

**Importante**: A sequência é **circular**:
- Após índice 36 (número 26) → índice 0 (número 0)
- Após índice 0 (número 0) → índice 1 (número 32)
- E assim por diante...

## Estados do Sistema
- **patternAlert**: Objeto contendo informações do padrão detectado
- **forcedPattern**: Permanece `null` para não conflitar
- **highlightedBetNumbers**: Array com os números cobertos pelos 2 números de aposta
- **highlightedRiskNumbers**: Array com os 7 números expostos

## Exemplo Completo - Números Distantes
**Cenário**: Últimos números sorteados = 15, 3

1. **Verificação de race**: 
   - Distância entre 15 e 3: 28 posições (> 5) ❌
   - **Race NÃO detectada** (números muito distantes)

**Cenário**: Últimos números sorteados = 21, 34

1. **Verificação de race**: 
   - Distância entre 21 e 34: 4 posições (≤ 5) ✅
   - **Race detectada!**

2. **7 números expostos**: [4, 21, 2, 25, 17, 34, 6]
   - Primeiro (4) e último (6) com borda branca oscilante
   - Demais mantêm cor original

3. **2 números para apostar**: Calculados automaticamente
   - Aparecem em azul com borda branca oscilante
   - Cobrem a maioria dos 30 números restantes

4. **Container "Padrão Detectado"**: Aparece automaticamente
   - Card APOSTAR: mostra os 2 números otimizados
   - Card RISCO: mostra os 7 números expostos
   - Card COBERTURA: estatísticas (30 números cobertos, 7 em risco)

## Vantagens da Detecção Automática
- **Precisão**: Detecta apenas quando as condições ideais são atendidas
- **Velocidade**: Identificação instantânea de oportunidades
- **Consistência**: Sempre aplica os mesmos critérios rigorosos
- **Lógica circular correta**: Considera a natureza circular da roleta
- **Informação completa**: Fornece todos os dados necessários para a decisão
- **Interface intuitiva**: Apresentação clara e organizada das informações

## Correções Implementadas
1. **Conceito circular**: A roleta é tratada como um círculo contínuo
2. **Lógica de busca**: Primeiro encontra qualquer um dos números, depois procura o outro
3. **Cálculo do ponto de partida**: 
   - Se encontrar nos próximos 5: `primeiro_índice - 1`
   - Se não encontrar: `índice_do_segundo_número - 1`
4. **Sequência normal**: Sempre captura 7 números em sequência normal (não reversa)
5. **Modulo circular**: Uso correto do operador `%` para navegação circular

Esta implementação garante que o usuário seja alertado automaticamente apenas quando as condições estatisticamente favoráveis da estratégia 171 são detectadas, com a lógica circular correta da roleta, maximizando as chances de sucesso.