# 🚀 Quick Start - Configurar Ambiente Local

## ⚡ Método Rápido (Recomendado)

### Opção 1: Script Automático

```powershell
cd d:\Programas\React\171
.\configure-supabase.ps1
```

O script vai pedir:
1. **Project URL** do Supabase
2. **Anon Key** do Supabase

### Opção 2: Manual

Crie o arquivo: `d:\Programas\React\171\frontend\.env.local`

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

---

## 📍 Onde Pegar as Credenciais

### No Dashboard do Supabase:
1. https://supabase.com/dashboard
2. Clique no seu projeto
3. **Settings** (⚙️) → **API**
4. Copie:
   - **Project URL**
   - **anon public** key

### Ou no Vercel:
1. https://vercel.com/dashboard
2. Seu projeto → **Settings** → **Environment Variables**
3. Copie os valores de:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 🔄 Reiniciar o Servidor

Após criar o `.env.local`:

```powershell
# Pare o servidor atual (Ctrl+C)
cd d:\Programas\React\171\frontend
npm run dev
```

---

## ✅ Testar

1. Abra: http://localhost:5174
2. Faça login
3. Se funcionar = **Sucesso!** ✨

---

## 📞 Precisa de Ajuda?

Se ainda der erro "Failed to fetch":
- Verifique se o arquivo `.env.local` está em `frontend/`
- Confirme que as credenciais estão corretas
- Reinicie o servidor após criar o arquivo
