# Instruções de Deploy para Vercel - Roleta 171

## ⚠️ IMPORTANTE: Diretório Correto para Deploy

**SEMPRE** fazer deploy do diretório **RAIZ** do projeto (`d:\Programas\React\171`), **NÃO** do diretório `frontend`.

## Por quê?

O Vercel está configurado para fazer deploy do projeto raiz que contém o frontend como subdiretório. O arquivo `vercel.json` na raiz define que o build deve ser executado dentro da pasta `frontend`.

## Estrutura do Projeto

```
d:\Programas\React\171/          ← DEPLOY DAQUI (RAIZ)
├── .vercel/
│   ├── project.json
│   └── token.txt
├── frontend/                     ← NÃO DEPLOY DAQUI
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
├── vercel.json                   ← Configuração principal
└── DEPLOY_VERCEL.md             ← Este arquivo
```

## Como Fazer Deploy

### Método 1: Via Vercel CLI (Recomendado)

```powershell
# 1. Navegar para o diretório RAIZ do projeto
cd d:\Programas\React\171

# 2. Fazer commit das alterações
git add .
git commit -m "Descrição das alterações"
git push

# 3. Deploy para produção
vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk
```

### Método 2: Via Script Batch

```powershell
# Execute o script na raiz do projeto
cd d:\Programas\React\171
.\deploy-vercel-prod.bat
```

## Verificação do Deploy

Após o deploy, verifique se o arquivo JavaScript gerado tem um hash novo:

1. Acesse: https://roleta171.vercel.app
2. Visualize o código-fonte da página (Ctrl+U)
3. Procure por: `<script type="module" crossorigin src="/assets/index-XXXXXXXX.js">`
4. O hash `XXXXXXXX` deve ser diferente do deploy anterior

## Troubleshooting

### Problema: Site não atualiza após deploy

**Causa**: Deploy feito do diretório `frontend` em vez da raiz

**Solução**:
```powershell
cd d:\Programas\React\171  # Voltar para a RAIZ
vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk
```

### Problema: Cache do navegador

**Solução**: Limpar cache com `Ctrl + Shift + R` ou abrir em modo anônimo

### Problema: Vercel usando cache antigo

**Solução**: Usar flag `--force` para desabilitar cache
```powershell
vercel --prod --yes --force --token LwQMGnZpwxcE3s749poZtuWk
```

## Configuração do Vercel

O arquivo `vercel.json` na raiz define:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install",
  "framework": "vite"
}
```

Isso garante que o Vercel:
1. Entre na pasta `frontend`
2. Instale as dependências
3. Execute o build
4. Use o diretório `frontend/dist` como output

## Token do Vercel

O token está armazenado em: `d:\Programas\React\171\.vercel\token.txt`

**Valor atual**: `LwQMGnZpwxcE3s749poZtuWk`

## URLs do Projeto

- **Produção**: https://roleta171.vercel.app
- **Dashboard**: https://vercel.com/aziel-rodrigues-pereira-jrs-projects/roleta171

## Histórico de Deploys Bem-Sucedidos

- ✅ Deploy do diretório raiz gera hash novo (ex: `index-BtK19_rG.js`)
- ❌ Deploy do diretório frontend gera hash antigo (ex: `index-D_evg0La.js`)

## Checklist Antes do Deploy

- [ ] Commit e push das alterações para o GitHub
- [ ] Navegado para o diretório RAIZ (`d:\Programas\React\171`)
- [ ] Executado comando `vercel --prod` da raiz
- [ ] Verificado hash do arquivo JS no site após deploy

---

**Última atualização**: 14/01/2026
**Versão**: 1.0.0
