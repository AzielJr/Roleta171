# Padrão Forçado 171 - Documentação Técnica

## Visão Geral
O **Padrão Forçado 171** é uma funcionalidade que permite ao usuário forçar manualmente a aplicação da estratégia 171 baseada no último número sorteado, independentemente de ter sido detectado automaticamente pelo sistema.

## Como Funciona

### 1. Ativação
- O usuário clica no botão **"Forçar padrão 171"**
- O sistema utiliza o último número da lista de números sorteados como base para os cálculos

### 2. Cálculo dos 7 Números Expostos
```javascript
// Lógica implementada:
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

### 4. Cálculo dos 2 Números Base
O sistema encontra automaticamente os 2 números que melhor cobrem os 30 números restantes:

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

## Visualização das Cores

### 7 Números Expostos (Risco)
- **Cor**: Mantêm sua cor original (vermelho, preto ou verde)
- **Borda especial**: Apenas o **primeiro** e **último** da sequência recebem borda branca oscilante (`ring-2 ring-white animate-pulse`)
- **Efeitos especiais**: Primeiro e último também recebem `scale-110 shadow-lg`
- **Função**: Representam os números de risco que não devem ser apostados

### 30 Números para Apostar
- **Cor de fundo**: Amarelo (`bg-yellow-400`)
- **Cor do texto**: Preto (`text-black`)
- **Borda**: Nenhuma (apenas fundo amarelo)
- **Efeitos**: Nenhum (sem bordas, sombras ou escalas)
- **Função**: Números recomendados para aposta

### 2 Números Base
- **Cor de fundo**: Azul (`bg-blue-500`)
- **Cor do texto**: Branco (`text-white`)
- **Borda**: Borda branca oscilante (`ring-2 ring-white animate-pulse`)
- **Efeitos especiais**: `scale-110 shadow-lg` para destaque visual
- **Função**: Números centrais que geram a cobertura dos 30 números

## Diferenças do Padrão Detectado

| Aspecto | Padrão Forçado | Padrão Detectado |
|---------|----------------|------------------|
| **Ativação** | Manual (botão) | Automática (algoritmo) |
| **Cor dos números de aposta** | Amarelo | Azul |
| **Container "Padrão Detectado"** | Não aparece | Aparece |
| **Cálculo dos expostos** | Baseado no último número | Baseado na detecção automática |
| **Flexibilidade** | Funciona com qualquer número | Só quando padrão é detectado |

## Sequência da Roleta Utilizada
```javascript
const ROULETTE_SEQUENCE = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
```

## Estados do Sistema
- **forcedPattern**: Objeto contendo todas as informações do padrão forçado
- **patternAlert**: Permanece `null` para não mostrar o container de padrão detectado
- **highlightedBetNumbers**: Array com os 30 números para apostar
- **highlightedRiskNumbers**: Array com os 7 números expostos

## Exemplo Completo
**Cenário**: Último número sorteado = 20

1. **7 números expostos**: 16, 33, 1, 20, 14, 31, 9
   - Primeiro (16) e último (9) com borda branca oscilante
   - Demais mantêm cor original

2. **30 números para apostar**: Todos os outros números em amarelo
   - 0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 22, 18, 29, 7, 28, 12, 35, 3, 26

3. **2 números base**: Calculados automaticamente (ex: 3, 36)
   - Aparecem em azul com borda branca oscilante
   - Cobrem a maioria dos 30 números com seus vizinhos

Esta implementação garante que o usuário tenha controle total sobre quando aplicar a estratégia 171, mantendo a consistência visual com o padrão detectado automaticamente.