# 📊 Documentação dos Cards de Estatísticas - Roleta 171

## Visão Geral

O container de estatísticas é composto por **6 cards principais** que monitoram e exibem dados em tempo real dos números sorteados na roleta. Cada card possui funcionalidades específicas de análise e alertas visuais.

---

## 🎨 Card 1: Cores

### Funcionalidades
- **Monitora**: Distribuição de cores dos números sorteados
- **Categorias**:
  - **Vermelho**: Números vermelhos (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36)
  - **Preto**: Números pretos (2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35)
  - **Verde (0)**: Apenas o número 0

### Alertas Visuais
- **Animação pulsante**: Ativada quando 3 ou mais números consecutivos da mesma cor são sorteados
- **Cores dos indicadores**:
  - 🔴 Vermelho: `bg-red-500`
  - ⚫ Preto: `bg-gray-800`
  - 🟢 Verde: `bg-green-500`

### Dados Exibidos
- Quantidade absoluta de cada cor
- Percentual de distribuição em tempo real

---

## ⚡ Card 2: Par / Ímpar

### Funcionalidades
- **Monitora**: Distribuição entre números pares e ímpares
- **Categorias**:
  - **Par**: Números pares (exceto 0)
  - **Ímpar**: Números ímpares
  - **Nota**: O zero (0) não é contabilizado nesta categoria

### Alertas Visuais
- **Animação pulsante**: Ativada quando 3 ou mais números consecutivos da mesma paridade são sorteados
- **Cores dos indicadores**:
  - 🔵 Par: `bg-blue-500`
  - 🟣 Ímpar: `bg-purple-500`

### Dados Exibidos
- Quantidade de números pares e ímpares
- Percentual de distribuição

---

## 📊 Card 3: Alto / Baixo

### Funcionalidades
- **Monitora**: Distribuição entre números baixos e altos
- **Categorias**:
  - **Baixo (1-18)**: Números de 1 a 18
  - **Alto (19-36)**: Números de 19 a 36
  - **Nota**: O zero (0) não é contabilizado nesta categoria

### Alertas Visuais
- **Animação pulsante**: Ativada quando 3 ou mais números consecutivos da mesma faixa são sorteados
- **Cores dos indicadores**:
  - 🟡 Baixo: `bg-yellow-500`
  - 🟠 Alto: `bg-orange-500`

### Dados Exibidos
- Quantidade de números baixos e altos
- Percentual de distribuição

---

## 🎯 Card 4: Dúzias

### Funcionalidades
- **Monitora**: Distribuição entre as três dúzias da roleta
- **Categorias**:
  - **1ª Dúzia (1-12)**: Números de 1 a 12
  - **2ª Dúzia (13-24)**: Números de 13 a 24
  - **3ª Dúzia (25-36)**: Números de 25 a 36
  - **Nota**: O zero (0) não é contabilizado nesta categoria

### Alertas Visuais
- **Animação pulsante**: Ativada quando 3 ou mais números consecutivos da mesma dúzia são sorteados
- **Cores dos indicadores**:
  - 🔵 1ª Dúzia: `bg-cyan-500`
  - 🟦 2ª Dúzia: `bg-indigo-500`
  - 🩷 3ª Dúzia: `bg-pink-500`

### Dados Exibidos
- Quantidade de números por dúzia
- Percentual de distribuição

---

## 📋 Card 5: Colunas

### Funcionalidades
- **Monitora**: Distribuição entre as três colunas da roleta
- **Categorias**:
  - **1ª Coluna**: Números 1,4,7,10,13,16,19,22,25,28,31,34
  - **2ª Coluna**: Números 2,5,8,11,14,17,20,23,26,29,32,35
  - **3ª Coluna**: Números 3,6,9,12,15,18,21,24,27,30,33,36
  - **Nota**: O zero (0) não é contabilizado nesta categoria

### Alertas Visuais
- **Animação pulsante**: Ativada quando 3 ou mais números consecutivos da mesma coluna são sorteados
- **Cores dos indicadores**:
  - 🟢 1ª Coluna: `bg-emerald-500`
  - 🔷 2ª Coluna: `bg-teal-500`
  - 🟢 3ª Coluna: `bg-lime-500`

### Dados Exibidos
- Quantidade de números por coluna
- Percentual de distribuição

---

## 🎰 Card 6: Estratégia 171

### Funcionalidades Principais
- **Monitora**: Performance da estratégia específica "171"
- **Título Dinâmico**: Exibe informações em tempo real no cabeçalho
- **Métricas Avançadas**: Análise de entradas, vitórias e derrotas

### Dados do Cabeçalho
- **📊 171**: Identificação da estratégia
- **Qtd**: Quantidade atual de números sem padrão detectado
- **Méd**: Média de números por entrada (calculada dinamicamente)

### Categorias de Dados
1. **Entradas**: 
   - Total de vezes que a estratégia foi acionada
   - Percentual em relação ao total de números sorteados

2. **WIN**: 
   - Quantidade de vitórias da estratégia
   - Percentual de sucesso em relação às entradas

3. **LOSS**: 
   - Quantidade de derrotas da estratégia
   - Percentual de falhas em relação às entradas

### Cores dos Indicadores
- 🔘 Entradas: `bg-gray-500`
- 🟢 WIN: `bg-green-500`
- 🔴 LOSS: `bg-red-500`

### Cálculos Especiais
- **Taxa de Sucesso**: WIN / Entradas × 100
- **Média por Entrada**: Total de números / Entradas
- **Eficiência**: Monitoramento contínuo da performance

---

## 🔄 Sistema de Alertas Visuais

### Detecção de Padrões
Todos os cards (exceto o 171) possuem um sistema inteligente de detecção de padrões:

1. **Condição de Ativação**: 3 ou mais números consecutivos da mesma categoria
2. **Animação**: `animate-pulse-color-size` aplicada aos valores
3. **Monitoramento Contínuo**: Atualização em tempo real conforme novos números são sorteados
4. **Reset Automático**: Alertas são removidos quando o padrão é quebrado

### Algoritmo de Detecção
```javascript
// Verifica sequências contínuas a partir dos números mais recentes
// Expande a verificação até encontrar a maior sequência possível
// Mantém alertas ativos apenas para padrões contínuos de 3+ números
```

---

## 🎨 Responsividade e Design

### Layout Adaptativo
- **Desktop (lg+)**: 6 cards em linha horizontal
- **Tablet (md)**: 3 cards por linha (2 linhas)
- **Mobile**: 2 cards por linha (3 linhas)

### Tema Escuro Integrado
- Fundo dos cards: `bg-gray-700` (tema escuro)
- Texto principal: Branco
- Texto secundário: Tons de cinza claro
- Sombras adaptadas para contraste

### Espaçamento Responsivo
- **Desktop**: Padding `p-3`, gaps `gap-2`
- **Mobile**: Padding `p-2`, gaps `gap-1`
- **Texto**: Tamanhos adaptativos (`text-xs lg:text-sm`)

---

## 📈 Integração com Sistema Principal

### Fonte de Dados
- **Hook**: `useStatistics(statisticsData)`
- **Dados Base**: Array `lastNumbers` (últimos números sorteados)
- **Cálculos**: Processamento em tempo real via `calculateStatistics`

### Props Recebidas
```typescript
interface StatisticsCardsProps {
  statistics: Statistics;
  patternDetectedCount?: number;
  winCount?: number;
  lossCount?: number;
  numbersWithoutPattern?: number;
  totalNumbersWithoutPattern?: number;
  lastNumbers?: number[];
  pattern171Stats?: {
    entradas: number;
    wins: number;
    losses: number;
  };
}
```

### Atualização Automática
- **Trigger**: Mudanças no array `lastNumbers`
- **Frequência**: Tempo real (a cada novo número sorteado)
- **Performance**: Otimizado com `useMemo` e `useEffect`

---

## 🔧 Funcionalidades Técnicas

### Estados Internos
- `animatingColumns`: Set de colunas com padrão ativo
- `animatingDozens`: Set de dúzias com padrão ativo
- `animatingHighLow`: Set de faixas com padrão ativo
- `animatingEvenOdd`: Set de paridades com padrão ativo
- `animatingColors`: Set de cores com padrão ativo

### Componente StatCard
- **Reutilizável**: Base para todos os 6 cards
- **Configurável**: Aceita título, dados, cores e tipo
- **Inteligente**: Aplica animações baseadas no tipo de card

### Performance
- **Memoização**: Cálculos otimizados
- **Debounce**: Evita re-renderizações excessivas
- **Cleanup**: Limpeza automática de estados obsoletos

---

## 📋 Resumo das Funcionalidades

| Card | Monitora | Alertas | Cores | Categorias |
|------|----------|---------|-------|------------|
| **Cores** | Vermelho/Preto/Verde | ✅ 3+ consecutivos | 🔴⚫🟢 | 3 |
| **Par/Ímpar** | Paridade dos números | ✅ 3+ consecutivos | 🔵🟣 | 2 |
| **Alto/Baixo** | Faixas 1-18 / 19-36 | ✅ 3+ consecutivos | 🟡🟠 | 2 |
| **Dúzias** | 1ª/2ª/3ª dúzia | ✅ 3+ consecutivos | 🔵🟦🩷 | 3 |
| **Colunas** | 1ª/2ª/3ª coluna | ✅ 3+ consecutivos | 🟢🔷🟢 | 3 |
| **171** | Estratégia específica | ❌ Sem alertas | 🔘🟢🔴 | 3 |

---

*Documentação atualizada para refletir todas as funcionalidades implementadas no sistema de estatísticas da Roleta 171.*