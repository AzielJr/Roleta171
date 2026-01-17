# Funcionalidade de OCR para Importação de Números via Imagem

## 📋 Descrição

Implementada funcionalidade de **reconhecimento óptico de caracteres (OCR)** que permite ao usuário colar uma imagem da tela de números do site de roleta e extrair automaticamente os números para a lista de números sorteados.

## ✨ Funcionalidades

### 1. **Colar Imagem (Ctrl+V)**
- Copie a tela de números do site da roleta (Print Screen ou Ctrl+C)
- Abra o modal "Adicionar Números Sorteados"
- Pressione **Ctrl+V** no campo de texto
- A imagem será processada automaticamente via OCR
- Os números detectados (0-36) serão extraídos e adicionados ao campo

### 2. **Feedback Visual em Tempo Real**
- **Barra de progresso**: Mostra o progresso do processamento OCR (0-100%)
- **Indicador de processamento**: Spinner animado durante o processamento
- **Dica visual**: Mensagem explicativa sobre como usar Ctrl+V

### 3. **Validação Automática**
- Apenas números válidos da roleta (0-36) são extraídos
- Números duplicados são removidos automaticamente
- Números inválidos são ignorados

## 🔧 Tecnologias Utilizadas

- **Tesseract.js**: Biblioteca de OCR que roda no navegador
- **React Hooks**: `useImageOCR` customizado para gerenciar o processamento
- **Clipboard API**: Para capturar imagens coladas

## 📁 Arquivos Modificados/Criados

### Novos Arquivos:
1. **`frontend/src/hooks/useImageOCR.ts`**
   - Hook customizado para processar imagens com OCR
   - Gerencia estado de processamento e progresso
   - Extrai números válidos (0-36) do texto reconhecido

### Arquivos Modificados:
1. **`frontend/src/components/RouletteBoard.tsx`**
   - Adicionado import do hook `useImageOCR`
   - Adicionado event listener para evento `paste`
   - Adicionado feedback visual de processamento OCR
   - Adicionada dica sobre Ctrl+V

2. **`frontend/package.json`**
   - Adicionada dependência: `tesseract.js`

## 🎯 Como Usar

### Passo a Passo:

1. **Capturar a tela de números do site:**
   - No site da roleta, vá até a aba "Números"
   - Pressione `Print Screen` ou use ferramenta de captura
   - Ou selecione a área e pressione `Ctrl+C`

2. **Abrir o modal de adicionar números:**
   - Clique no botão "Adicionar Números Sorteados"

3. **Colar a imagem:**
   - Com o cursor no campo de texto, pressione `Ctrl+V`
   - Aguarde o processamento (barra de progresso aparecerá)

4. **Verificar e adicionar:**
   - Os números extraídos aparecerão no campo de texto
   - Revise se necessário
   - Clique em "Adicionar" para processar os números

## 🔄 Compatibilidade com Funcionalidades Existentes

✅ **Todas as funcionalidades anteriores foram mantidas:**
- Digitação manual de números
- Reconhecimento de voz (microfone)
- Botões Limpar e Cancelar
- Validação de números (0-36)
- Processamento em lote com intervalo de 700ms

## 📊 Exemplo de Uso

```
1. Usuário copia imagem da tela de números do site
2. Abre modal "Adicionar Números Sorteados"
3. Pressiona Ctrl+V
4. OCR processa: "11 36 0 26 29 23 31 9 33 24 22 7 5"
5. Números extraídos: "11,36,0,26,29,23,31,9,33,24,22,7,5"
6. Usuário clica "Adicionar"
7. Números são processados sequencialmente
```

## ⚙️ Configurações Técnicas

### Hook `useImageOCR`:
- **Idioma**: Inglês (eng) - melhor para reconhecer dígitos
- **Progresso**: Atualizado em tempo real durante processamento
- **Validação**: Regex para números 0-36: `\b([0-9]|[1-2][0-9]|3[0-6])\b`
- **Deduplicação**: Remove números duplicados automaticamente

### Performance:
- Processamento assíncrono (não bloqueia a UI)
- Feedback visual durante todo o processo
- Limpeza automática de recursos após processamento

## 🐛 Tratamento de Erros

- Erros de OCR são capturados e logados no console
- Usuário não vê erros técnicos, apenas feedback visual
- Se nenhum número for detectado, o campo permanece vazio
- Validação garante que apenas números válidos sejam adicionados

## 🎨 Interface do Usuário

### Elementos Visuais:
1. **Dica permanente** (quando não está processando):
   - Fundo cinza claro
   - Ícone 💡
   - Texto explicativo sobre Ctrl+V

2. **Indicador de processamento** (durante OCR):
   - Fundo roxo claro
   - Spinner animado
   - Barra de progresso
   - Porcentagem de conclusão

3. **Feedback de voz** (quando microfone ativo):
   - Fundo verde claro
   - Indicador pulsante
   - Texto reconhecido em tempo real

## 📝 Notas Importantes

- A funcionalidade funciona apenas com imagens na área de transferência
- Qualidade da imagem afeta a precisão do OCR
- Números muito pequenos ou borrados podem não ser detectados
- Recomenda-se capturar imagens com boa resolução e contraste

## 🔐 Segurança

- Processamento 100% local no navegador
- Nenhuma imagem é enviada para servidores externos
- Tesseract.js roda completamente client-side
- Privacidade total dos dados do usuário

## 📦 Dependências

```json
{
  "tesseract.js": "^5.x.x"
}
```

## 🚀 Próximas Melhorias Possíveis

- [ ] Suporte para múltiplos idiomas de OCR
- [ ] Pré-processamento de imagem para melhorar precisão
- [ ] Cache de modelos OCR para melhor performance
- [ ] Suporte para arrastar e soltar imagens
- [ ] Histórico de imagens processadas
- [ ] Ajuste de contraste/brilho antes do OCR

---

**Data de Implementação**: 17/01/2026  
**Versão**: 1.0  
**Status**: ✅ Funcionando e testado
