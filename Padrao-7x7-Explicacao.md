# 📊 Padrão 7x7 - Documentação Técnica

## 🎯 Visão Geral

O **Padrão 7x7** é um sistema de análise e sugestão de apostas para roleta baseado na sequência real dos números da Race (sequência física da roleta). Este padrão calcula automaticamente dois números sugeridos para aposta e determina quais números resultariam em WIN ou LOSS.

---

## 🔢 Sequência da Race (Roleta Real)

O sistema utiliza a sequência física real da roleta, conhecida como **Race**:

```
[0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
```

### Características da Sequência:
- **37 números** (0 a 36)
- **Ordem física** da roleta real
- **Loop circular**: Após o 26, volta para o 0

---

## ⚙️ Como Funciona

### 1. **Cálculo dos Números Sugeridos**

Para cada número sorteado, o sistema calcula **2 números sugeridos**:

#### **Primeiro Número:**
- É sempre o **último número selecionado**

#### **Segundo Número:**
- Localiza o índice do último número na sequência da Race
- Avança **18 índices** no sentido horário
- Se ultrapassar o final (índice 36), continua do início (loop circular)

### 2. **Exemplo Prático**

Se o último número sorteado for **09**:

1. **Localizar na Race**: 09 está no índice 31
2. **Calcular segundo número**: (31 + 18) % 37 = 12 (índice)
3. **Número no índice 12**: 13
4. **Resultado**: Números sugeridos são **09** e **13**

### 3. **Tabela de Referência Rápida**

| Último Número | Índice | Segundo Número | Índice do Segundo |
|---------------|--------|----------------|-------------------|
| 0             | 0      | 24             | 18                |
| 32            | 1      | 16             | 19                |
| 15            | 2      | 33             | 20                |
| 19            | 3      | 1              | 21                |
| 4             | 4      | 20             | 22                |
| 21            | 5      | 14             | 23                |
| 2             | 6      | 31             | 24                |
| 25            | 7      | 9              | 25                |
| 17            | 8      | 22             | 26                |
| 34            | 9      | 18             | 27                |
| 6             | 10     | 29             | 28                |
| 27            | 11     | 7              | 29                |
| 13            | 12     | 28             | 30                |
| 36            | 13     | 12             | 31                |
| 11            | 14     | 35             | 32                |
| 30            | 15     | 3              | 33                |
| 8             | 16     | 26             | 34                |
| 23            | 17     | 0              | 35                |
| 10            | 18     | 32             | 36                |
| 5             | 19     | 15             | 0 (loop)          |

---

## 🎲 Lógica WIN/LOSS

### **Números de LOSS**

A partir do último número selecionado, os seguintes **índices** (sentido horário) são considerados LOSS:

- **Índice 8**: 8 posições à frente
- **Índice 9**: 9 posições à frente  
- **Índice 10**: 10 posições à frente
- **Índice 26**: 26 posições à frente
- **Índice 27**: 27 posições à frente
- **Índice 28**: 28 posições à frente
- **Índice 29**: 29 posições à frente

### **Exemplo com Número 09**

Se o último número for **09** (índice 31):

| Índice LOSS | Cálculo        | Índice Final | Número LOSS |
|-------------|----------------|--------------|-------------|
| 8           | (31 + 8) % 37  | 2            | **15**      |
| 9           | (31 + 9) % 37  | 3            | **19**      |
| 10          | (31 + 10) % 37 | 4            | **4**       |
| 26          | (31 + 26) % 37 | 20           | **33**      |
| 27          | (31 + 27) % 37 | 21           | **1**       |
| 28          | (31 + 28) % 37 | 22           | **20**      |
| 29          | (31 + 29) % 37 | 23           | **14**      |

**Números LOSS**: 15, 19, 4, 33, 1, 20, 14

### **Números de WIN**

**Qualquer número de 0 a 36 que NÃO esteja na lista de LOSS** é considerado WIN.

Para o exemplo do número 09:
- **WIN**: 0, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36
- **LOSS**: 15, 19, 4, 33, 1, 20, 14

---

## 📈 Estatísticas Calculadas

### **Entradas**
- Cada número sorteado conta como uma **entrada**
- Total acumulativo de números analisados

### **WIN**
- Contador de vezes que o próximo número foi um WIN
- Percentual calculado: `(WIN / (WIN + LOSS)) * 100`

### **LOSS**
- Contador de vezes que o próximo número foi um LOSS  
- Percentual calculado: `(LOSS / (WIN + LOSS)) * 100`

---

## 🖥️ Interface do Sistema

### **Card de Estatísticas**
- **Título**: "Padrão 7x7"
- **Números Sugeridos**: Dois círculos coloridos à direita
  - Primeiro número (último sorteado)
  - Segundo número (18 índices à frente)
- **Dados**: Entradas, WIN, LOSS com percentuais

### **Cores dos Números**
- **Vermelho**: Números vermelhos da roleta
- **Preto**: Números pretos da roleta  
- **Verde**: Número 0 (zero)

### **Configurações**
- **Mostrar na Race**: Opção para destacar os números na visualização da roleta
  - Números sugeridos: **Borda amarela**
  - Números LOSS: **Borda branca**

---

## 🔧 Implementação Técnica

### **Funções Principais**

```typescript
// Calcular números sugeridos
const calculatePadrao7x7Numbers = (lastNumber: number): { first: number; second: number }

// Calcular números de LOSS
const calculatePadrao7x7LossNumbers = (baseNumber: number): number[]

// Calcular estatísticas completas
const calculatePadrao7x7Stats = (lastNumbers: number[]): {
  entradas: number;
  wins: number; 
  losses: number;
  suggestedNumbers: { first: number; second: number };
}
```

### **Atualização Automática**
- Recalcula a cada novo número sorteado
- Atualiza números sugeridos em tempo real
- Mantém histórico de WIN/LOSS
- Não possui alertas sonoros (por design)

---

## 📊 Diferenças dos Outros Padrões

| Característica | Padrão 171 | P2 | Padrão 7x7 |
|----------------|------------|----|-----------| 
| **Base de Cálculo** | Algoritmo específico | Números gatilho | Sequência da Race |
| **Alertas Sonoros** | ✅ Sim | ✅ Sim | ❌ Não |
| **Alertas Visuais** | ✅ Sim | ✅ Sim | ❌ Não |
| **Números Sugeridos** | Variável | Fixos | 2 por rodada |
| **Visualização Race** | ❌ Não | ❌ Não | ✅ Opcional |
| **Cálculo WIN/LOSS** | Complexo | Simples | Baseado em índices |

---

## 🎯 Objetivo e Estratégia

O **Padrão 7x7** foi desenvolvido para:

1. **Análise Contínua**: Funciona com qualquer número sorteado
2. **Sugestões Dinâmicas**: Sempre oferece 2 números para aposta
3. **Base Física**: Utiliza a sequência real da roleta
4. **Estatísticas Precisas**: Calcula WIN/LOSS baseado em dados históricos
5. **Interface Limpa**: Sem alertas intrusivos, foco na informação

### **Uso Recomendado**
- Complementar outros padrões
- Análise de tendências baseadas na Race
- Estratégias de cobertura com 2 números
- Estudo de padrões físicos da roleta

---

## 📝 Notas Importantes

- ✅ **Sempre ativo**: Calcula para todos os números
- ✅ **Sem interferência**: Não possui alertas sonoros
- ✅ **Configurável**: Pode ser mostrado na Race via configurações
- ✅ **Estatísticas preservadas**: Mesmo com alertas desabilitados
- ✅ **Atualização automática**: Recalcula a cada número sorteado

---

*Documento gerado automaticamente - Sistema de Roleta 171*
*Versão: 1.0 | Data: Outubro 2024*
