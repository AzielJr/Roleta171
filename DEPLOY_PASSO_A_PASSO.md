# 🚀 Deploy Vercel - Passo a Passo

## ⚠️ IMPORTANTE: Configurar Variáveis de Ambiente Primeiro

Antes de fazer o deploy, você precisa configurar as variáveis de ambiente no Vercel Dashboard.

---

## 📋 PASSO 1: Configurar Variáveis de Ambiente do Backend

### 1.1 Acessar o Dashboard do Vercel
1. Acesse: https://vercel.com/aziel-rodrigues-pereira-jrs-projects/backend
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Environment Variables**

### 1.2 Adicionar as Variáveis (uma por vez)

Clique em **Add New** e adicione cada variável abaixo:

**Nome:** `DB_HOST`  
**Valor:** `92.113.38.158`  
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Nome:** `DB_PORT`  
**Valor:** `3306`  
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Nome:** `DB_USER`  
**Valor:** `novo_usuario`  
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Nome:** `DB_PASSWORD`  
**Valor:** `sua_senha`  
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Nome:** `DB_NAME`  
**Valor:** `roleta171`  
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Nome:** `VITE_SUPABASE_URL`  
**Valor:** `https://ykqpqhvjqgbmvtqgpvwt.supabase.co`  
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Nome:** `VITE_SUPABASE_ANON_KEY`  
**Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcXBxaHZqcWdibXZ0cWdwdnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzMDI1MjksImV4cCI6MjA0MDg3ODUyOX0.Uh_bP-3ZjZZGGwUvGiVKPDOAOmYSPcXKKIUEYTcRpLU`  
**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

### 1.3 Salvar
Clique em **Save** após adicionar cada variável.

---

## 📋 PASSO 2: Deploy do Backend

Abra o PowerShell e execute:

```powershell
cd d:\Programas\React\171\backend
vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk
```

**Aguarde o deploy concluir** e copie a URL gerada (ex: `https://backend-xxxx.vercel.app`)

---

## 📋 PASSO 3: Atualizar URL da API no Frontend

### 3.1 Criar arquivo de ambiente de produção

Crie o arquivo `d:\Programas\React\171\frontend\.env.production` com o seguinte conteúdo:

```env
VITE_API_URL=https://SUA-URL-DO-BACKEND.vercel.app/api
```

**Substitua** `SUA-URL-DO-BACKEND` pela URL copiada no Passo 2.

### 3.2 Fazer commit
```powershell
cd d:\Programas\React\171
git add .
git commit -m "feat: Configurar URL da API para produção"
git push
```

---

## 📋 PASSO 4: Deploy do Frontend

```powershell
cd d:\Programas\React\171
vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk
```

---

## ✅ Verificação

Após o deploy:

1. Acesse: https://roleta171.vercel.app
2. Teste o login com a senha: **5751**
3. Verifique se o saldo carrega corretamente
4. Abra o Histórico de Saldos e verifique se as datas aparecem corretamente

---

## 🐛 Troubleshooting

### Erro: "Failed to fetch"
- Verifique se o backend foi deployado com sucesso
- Verifique se a URL da API no `.env.production` está correta
- Verifique se as variáveis de ambiente foram configuradas no Vercel

### Erro: "Environment Variable references Secret"
- Você esqueceu de configurar as variáveis de ambiente no Passo 1
- Volte ao Passo 1 e configure todas as variáveis

### Site não atualiza
- Limpe o cache do navegador: `Ctrl + Shift + R`
- Ou abra em modo anônimo

---

## 📊 Resumo da Migração

### Banco: roleta171
- ✅ 3 usuários migrados
- ✅ 29 registros de saldo migrados
- ✅ 1 registro de aposta migrado

### Banco: biblia
- ✅ 581 hinos do Cantor Cristão
- ✅ 66 livros da Bíblia
- ✅ 31.105 versículos

**Total:** 31.752 registros migrados do Supabase para MySQL (Hostinger)

---

**Data:** 17/01/2026  
**Versão:** 2.0.0 - Migração MySQL Completa
