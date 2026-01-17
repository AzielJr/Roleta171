# 📊 Padrão 5x3 - Explicação Detalhada

## 🎯 **Visão Geral**

O **Padrão 5x3** é um sistema de análise da roleta que substitui o antigo Padrão 7x7. Ele funciona com base na análise de **3 números sugeridos** e **4 números expostos** para cada número selecionado.

---

## 🔢 **Como Funciona**

### **1. Números Sugeridos (3 números)**
Para cada número selecionado, o sistema calcula **3 números sugeridos** usando a fórmula:
- **Primeiro**: `(número + 6) % 37`
- **Segundo**: `(número + 18) % 37` 
- **Terceiro**: `(número + 30) % 37`

**Exemplo:** Se o número selecionado for **12**:
- Primeiro: `(12 + 6) % 37 = 18`
- Segundo: `(12 + 18) % 37 = 30`
- Terceiro: `(12 + 30) % 37 = 5`

### **2. Números Expostos (4 números)**
Os números expostos são calculados com base na posição do número na sequência da roleta:
- **0, 12, 24, 36** (posições fixas)

### **3. Lógica WIN/LOSS**
- **WIN**: O próximo número que sai **NÃO** está entre os números expostos
- **LOSS**: O próximo número que sai **ESTÁ** entre os números expostos

---

## 🎨 **Visualização na Interface**

### **Card de Estatísticas**
```
5x3
[21] [23] [18]  ← 3 bolas dos números sugeridos
Entradas: 4 (100%)
WIN: 3 (100%)
LOSS: 0 (0%)
Seq Positiva: 3/3  ← atual/máxima
```

### **Visualização na Race**
- **Números Sugeridos**: Borda **amarela** (`border-yellow-500`)
- **Números Expostos**: Borda **branca** (`border-white`)

---

## 📈 **Estatísticas Calculadas**

### **1. Entradas**
- Cada número selecionado conta como uma **entrada**
- Representa o total de análises realizadas

### **2. WIN/LOSS**
- **WIN**: Quando o próximo número não está nos expostos
- **LOSS**: Quando o próximo número está nos expostos
- **Percentual**: Calculado sobre o total de entradas

### **3. Sequência Positiva**
- **Atual**: Sequência consecutiva de WINs atual
- **Máxima**: Maior sequência consecutiva de WINs já atingida
- **Formato**: `atual/máxima` (ex: `3/5`)
- **Reset**: A sequência atual zera quando há um LOSS

---

## 🔧 **Implementação Técnica**

### **Função Principal**
```typescript
const calculatepadrao5x3Stats = (lastNumbers: number[]): {
  entradas: number;
  wins: number;
  losses: number;
  maxPositiveSequence: number;
  currentPositiveSequence: number;
  suggestedNumbers: { first: number; second: number; third: number };
}
```

### **Cálculo dos Números Sugeridos**
```typescript
const calculatepadrao5x3Numbers = (number: number) => {
  return {
    first: (number + 6) % 37,
    second: (number + 18) % 37,
    third: (number + 30) % 37
  };
};
```

### **Cálculo dos Números Expostos**
```typescript
const calculatepadrao5x3LossNumbers = (number: number): number[] => {
  return [0, 12, 24, 36];
};
```

---

## 🎮 **Fluxo de Funcionamento**

### **1. Seleção de Número**
1. Usuário seleciona um número na roleta
2. Sistema calcula os 3 números sugeridos
3. Sistema identifica os 4 números expostos

### **2. Próximo Número**
1. Próximo número da roleta é registrado
2. Sistema verifica se está nos números expostos
3. Resultado é classificado como WIN ou LOSS

### **3. Atualização de Estatísticas**
1. **Entradas**: +1
2. **WIN/LOSS**: Incrementa contador correspondente
3. **Sequência Positiva**: 
   - WIN: Incrementa sequência atual
   - LOSS: Zera sequência atual
   - Atualiza máxima se necessário

### **4. Visualização**
1. Card atualiza com novas estatísticas
2. Race mostra bordas coloridas nos números
3. Percentuais são recalculados

---

## 📊 **Exemplo Prático**

### **Cenário:**
- Números selecionados: `[12, 5, 30]`
- Próximos números: `[18, 7, 15]`

### **Análise:**

#### **Número 12 → 18**
- Sugeridos: `[18, 30, 5]`
- Expostos: `[0, 12, 24, 36]`
- Resultado: **WIN** (18 não está nos expostos)
- Sequência: `1`

#### **Número 5 → 7**
- Sugeridos: `[11, 23, 35]`
- Expostos: `[0, 12, 24, 36]`
- Resultado: **WIN** (7 não está nos expostos)
- Sequência: `2`

#### **Número 30 → 15**
- Sugeridos: `[36, 11, 23]`
- Expostos: `[0, 12, 24, 36]`
- Resultado: **WIN** (15 não está nos expostos)
- Sequência: `3`

### **Resultado Final:**
```
Entradas: 3 (100%)
WIN: 3 (100%)
LOSS: 0 (0%)
Seq Positiva: 3/3
```

---

## 🎯 **Vantagens do Padrão 5x3**

1. **Simplicidade**: Lógica mais clara que o 7x7
2. **Eficiência**: Menos números para analisar
3. **Precisão**: Foco em números estratégicos
4. **Visualização**: Interface mais limpa e intuitiva
5. **Estatísticas**: Métricas mais relevantes

---

## 🔄 **Diferenças do Padrão 7x7**

| Aspecto | Padrão 7x7 | Padrão 5x3 |
|---------|------------|------------|
| **Números Sugeridos** | 7 | 3 |
| **Números Expostos** | Variável | 4 fixos |
| **Complexidade** | Alta | Média |
| **Visualização** | Confusa | Clara |
| **Performance** | Lenta | Rápida |

---

## 📝 **Configurações**

### **Ativação/Desativação**
- O Padrão 5x3 pode ser ativado/desativado nas configurações
- Quando ativo, substitui completamente o Padrão 7x7
- A visualização na race é controlada pela configuração

### **Integração**
- Funciona em conjunto com outros padrões (P2, 171 Forçado)
- Não interfere nas outras análises
- Mantém histórico independente

---

## 🚀 **Status Atual**

✅ **Implementado:**
- Cálculo de números sugeridos e expostos
- Lógica WIN/LOSS
- Estatísticas completas (entradas, win, loss, sequência)
- Visualização no card com 3 bolas
- Bordas coloridas na race
- Campo "Seq Positiva" formato atual/máxima

✅ **Funcionando:**
- Integração com configurações do sistema
- Atualização em tempo real
- Persistência de dados
- Interface responsiva

---

## 📞 **Suporte**

Para dúvidas ou melhorias no Padrão 5x3, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento.

---

*Última atualização: 04/10/2025*
