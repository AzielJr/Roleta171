# 🔧 Configurar Supabase para Desenvolvimento Local

## ❌ Problema Atual
```
Erro na consulta: TypeError: Failed to fetch
```

O Supabase está configurado apenas para funcionar no Vercel. Para testar localmente, você precisa configurar as credenciais.

---

## ✅ Solução - Passo a Passo

### 1️⃣ **Obter as Credenciais do Supabase**

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie as seguintes informações:
   - **Project URL** (exemplo: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (chave longa que começa com `eyJ...`)

### 2️⃣ **Criar Arquivo de Configuração Local**

Crie o arquivo: `d:\Programas\React\171\frontend\.env.local`

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldXByb2pldG8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjM0NTY3OCwiZXhwIjoxOTI3OTIxNjc4fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:**
- Substitua os valores acima pelas suas credenciais reais
- Este arquivo NÃO será commitado no Git (está no .gitignore)

### 3️⃣ **Alternativa: Usar Script PowerShell**

Execute o script abaixo para criar o arquivo automaticamente:

```powershell
# Salve este script como: configure-supabase.ps1

$envFile = "d:\Programas\React\171\frontend\.env.local"

Write-Host "=== Configuração do Supabase para Desenvolvimento Local ===" -ForegroundColor Cyan
Write-Host ""

# Solicitar URL do Supabase
Write-Host "1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/settings/api" -ForegroundColor Yellow
Write-Host ""
$supabaseUrl = Read-Host "Digite a Project URL (ex: https://xxxxx.supabase.co)"

Write-Host ""
$supabaseKey = Read-Host "Digite a anon public key (chave longa que começa com eyJ...)"

# Criar conteúdo do arquivo
$content = @"
# Configuração do Supabase para desenvolvimento local
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
"@

# Salvar arquivo
$content | Out-File -FilePath $envFile -Encoding UTF8

Write-Host ""
Write-Host "✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host "📁 Local: $envFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 Agora reinicie o servidor de desenvolvimento:" -ForegroundColor Yellow
Write-Host "   1. Pare o servidor atual (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Execute: npm run dev" -ForegroundColor White
```

**Para executar:**
```powershell
cd d:\Programas\React\171
.\configure-supabase.ps1
```

### 4️⃣ **Reiniciar o Servidor**

Após criar o arquivo `.env.local`:

1. **Pare o servidor atual** (pressione Ctrl+C no terminal)
2. **Inicie novamente:**
   ```powershell
   cd d:\Programas\React\171\frontend
   npm run dev
   ```

---

## 🔍 Verificar se Funcionou

1. Abra o navegador em `http://localhost:5174`
2. Tente fazer login
3. Se funcionar, você verá a tela principal da roleta
4. Se ainda der erro, verifique:
   - As credenciais estão corretas?
   - O arquivo `.env.local` está na pasta `frontend`?
   - O servidor foi reiniciado após criar o arquivo?

---

## 📋 Estrutura de Arquivos

```
d:\Programas\React\171\
├── frontend/
│   ├── .env.local          ← CRIAR ESTE ARQUIVO (não commitado)
│   ├── .env.development    ← Template criado (exemplo)
│   ├── src/
│   │   └── lib/
│   │       └── supabase.ts ← Lê as variáveis de ambiente
│   └── package.json
└── vercel.json
```

---

## 🔐 Segurança

- ✅ O arquivo `.env.local` está no `.gitignore`
- ✅ Suas credenciais NÃO serão enviadas para o Git
- ✅ Cada desenvolvedor deve ter seu próprio `.env.local`
- ⚠️ NUNCA commite credenciais no código

---

## 🚀 Após Configurar

Você poderá:
- ✅ Testar localmente sem fazer deploy
- ✅ Fazer login e usar todas as funcionalidades
- ✅ Testar a nova funcionalidade de OCR
- ✅ Fazer alterações e ver resultados instantaneamente
- ✅ Fazer deploy no Vercel apenas quando tudo estiver funcionando

---

## 📞 Onde Encontrar as Credenciais

**Dashboard do Supabase:**
```
https://supabase.com/dashboard
→ Selecione seu projeto
→ Settings (⚙️)
→ API
→ Copie: Project URL e anon public key
```

**Ou no Vercel (se já configurado):**
```
https://vercel.com/dashboard
→ Seu projeto
→ Settings
→ Environment Variables
→ Procure por: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

---

## ❓ Problemas Comuns

### Erro: "Failed to fetch"
- **Causa**: Credenciais não configuradas ou incorretas
- **Solução**: Verifique se o arquivo `.env.local` existe e tem as credenciais corretas

### Erro: "Invalid API key"
- **Causa**: Chave anon incorreta
- **Solução**: Copie novamente a chave do dashboard do Supabase

### Erro: "Network error"
- **Causa**: URL do Supabase incorreta
- **Solução**: Verifique se a URL está correta (deve começar com https://)

---

**Após configurar, me avise e continuaremos com os testes da funcionalidade de OCR!** 🎯
