# Padrão Forçado 171 - Documentação Técnica

## ⚠️ PROBLEMAS NÃO RESOLVIDOS - PARA PRÓXIMA IA

### 🚨 PROBLEMA PRINCIPAL: SELEÇÃO DE NÚMEROS COM PADRÃO ATIVO
**Status**: ❌ NÃO FUNCIONA

**Descrição do Problema**:
- Quando o padrão 171 está ativo (forçado ou detectado), o usuário NÃO CONSEGUE selecionar números para apostar
- Os números são adicionados ao estado `selected.numbers` corretamente, mas NÃO APARECEM VISUALMENTE selecionados
- O feedback visual (borda verde) não funciona porque os estilos do padrão sobrescrevem a seleção

**O que deveria acontecer**:
1. Usuário ativa padrão 171
2. Usuário clica em números para selecionar para apostas
3. Números selecionados aparecem com **borda verde** mantendo o padrão visual
4. Estado `selected.numbers` é atualizado corretamente

**O que realmente acontece**:
1. ✅ Usuário ativa padrão 171
2. ✅ Usuário clica em números 
3. ❌ Números NÃO aparecem selecionados visualmente
4. ✅ Estado `selected.numbers` é atualizado (mas invisível)

### 🔧 TENTATIVAS DE CORREÇÃO QUE FALHARAM

#### Tentativa 1: Prioridade de CSS
- **O que foi feito**: Tentou criar hierarquia de estilos (seleção > padrão)
- **Resultado**: ❌ Falhou - estilos do padrão ainda sobrescrevem

#### Tentativa 2: Condicionais nos Estilos
- **O que foi feito**: Adicionou `!isSelectedForBet` nas condições do padrão
- **Resultado**: ❌ Falhou - lógica complexa demais, conflitos

#### Tentativa 3: Logs de Debug
- **O que foi feito**: Adicionou logs para rastrear `isSelectedForBet`
- **Resultado**: ✅ Confirmou que lógica funciona, problema é visual

#### Tentativa 4: Melhor Feedback Visual
- **O que foi feito**: Borda verde mais forte, ring, scale
- **Resultado**: ❌ Falhou - ainda não aparece

### 📋 SOLUÇÃO NECESSÁRIA

**Para a próxima IA implementar**:

1. **Identificar exatamente onde os estilos conflitam**:
   - Race sequence superior: `[5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3]`
   - Race sequence inferior: `[23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32, 0]`
   - Grade principal de números
   - Números do meio (10 e 26)

2. **Implementar hierarquia correta de estilos**:
   ```javascript
   // PRIORIDADE (do maior para menor):
   // 1. isLastSelected (amarelo) - último número clicado
   // 2. isSelectedForBet (verde) - números selecionados para aposta  
   // 3. Cores do padrão (azul/amarelo) - padrão visual
   // 4. Cores padrão (cinza) - estado normal
   ```

3. **Testar em todas as áreas**:
   - ✅ Grade principal
   - ❌ Race sequence superior 
   - ❌ Race sequence inferior
   - ❌ Números do meio (10 e 26)

4. **Código de referência para seleção**:
   ```javascript
   const isSelectedForBet = selected.numbers.includes(num);
   
   // No className, PRIMEIRA prioridade:
   isSelectedForBet ? 'border-green-400 border-4 ring-2 ring-green-300 scale-105' : 
   // Depois outras condições...
   ```

### 🎯 TESTE PARA VALIDAR CORREÇÃO

1. Abrir aplicação
2. Clicar em "Forçar padrão 171"
3. Clicar em alguns números (ex: 5, 10, 15)
4. **DEVE APARECER**: Números com borda verde brilhante
5. **DEVE MANTER**: Padrão visual (amarelo/azul) nos outros números
6. Console deve mostrar: `selected.numbers: [5, 10, 15]`

---

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

---

## 🔍 OUTROS PROBLEMAS MENORES IDENTIFICADOS

### 1. **Números do Meio (10 e 26) - Race Sequence**
- **Status**: ❌ Não testado completamente
- **Localização**: Linha do meio da race sequence
- **Problema**: Podem não estar recebendo o feedback de seleção
- **Solução**: Aplicar mesma lógica das outras áreas

### 2. **Performance dos Logs**
- **Status**: ⚠️ Spam no console
- **Problema**: Muitos logs desnecessários durante renderização
- **Solução**: Manter apenas logs de números selecionados

### 3. **Consistência Visual**
- **Status**: ⚠️ Parcial
- **Problema**: Diferentes áreas podem ter estilos ligeiramente diferentes
- **Solução**: Padronizar classes CSS em todas as áreas

### 4. **Estados Conflitantes**
- **Status**: ⚠️ Possível problema
- **Problema**: `isLastSelected` vs `isSelectedForBet` podem conflitar
- **Solução**: Definir prioridade clara (último selecionado > selecionados para aposta)

---

## 📝 NOTAS PARA PRÓXIMA IA

1. **Arquivo principal**: `src/components/RouletteBoard.tsx`
2. **Função principal**: `toggleNumber()` - funciona corretamente
3. **Função de renderização**: `renderNumber()` - problema nos estilos
4. **Estado**: `selected.numbers` - funciona corretamente
5. **Problema**: Apenas visual, lógica está correta

**Dica importante**: O problema NÃO é na lógica de seleção, é puramente visual. Os números estão sendo selecionados corretamente no estado, mas os estilos CSS do padrão estão sobrescrevendo o feedback visual da seleção.

**Teste rápido**: Adicione um `console.log(selected.numbers)` e verá que os números são adicionados corretamente, mas visualmente não aparecem selecionados.