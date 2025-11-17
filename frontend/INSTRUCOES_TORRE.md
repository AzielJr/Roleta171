# INSTRUÇÕES PARA CORRIGIR O PROBLEMA DA TORRE

## PASSO 1: Adicionar Import
No arquivo `RouletteBoard.tsx`, procure pela linha que tem outros imports (no topo do arquivo) e adicione esta linha:

```javascript
import { evaluateTorreNumber } from '../utils/torreEvaluator';
```

## PASSO 2: Localizar a função addToLastNumbers
Procure pela linha que contém:
```javascript
evaluateTorre(num, prev);
```

## PASSO 3: Adicionar a nova linha
Logo APÓS a linha `evaluateTorre(num, prev);`, adicione esta linha:

```javascript
evaluateTorreNumber(num, torrePendingEntrada, setTorrePendingEntrada, setAnimatingTorre, setTorreWinCount, setTorreLossCount, clearTorreVisuals);
```

## RESULTADO ESPERADO:
Depois da alteração, você deve ver logs como:
```
[DEBUG TORRE] Avaliando número: 13 Pending: false
[DEBUG TORRE] Entrada detectada - ativando borda amarela
[DEBUG TORRE] WIN detectado - REMOVENDO BORDA
[DEBUG TORRE] Borda removida após WIN
```

## LOCALIZAÇÃO EXATA:
A alteração deve ser feita na linha aproximadamente 2028 do arquivo RouletteBoard.tsx, dentro da função `setLastNumbers`.

Procure por:
```javascript
// Avaliar P2, TORRE e BET Terminais antes de atualizar demais lógicas
evaluateTorre(num, prev);
// ADICIONE A NOVA LINHA AQUI
```
