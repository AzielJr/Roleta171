# Deploy do Backend no Render.com

## 🚀 Passo a Passo para Deploy

### 1. Criar Conta no Render.com

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Faça login com GitHub

### 2. Conectar Repositório

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte seu repositório GitHub: `AzielJr/Roleta171`
4. Clique em **"Connect"**

### 3. Configurar o Web Service

**Name:** `roleta171-backend`

**Root Directory:** `backend`

**Environment:** `Node`

**Build Command:** `npm install`

**Start Command:** `node index.js`

**Instance Type:** `Free`

### 4. Adicionar Variáveis de Ambiente

Clique em **"Advanced"** e adicione as seguintes variáveis:

```
DB_HOST = 92.113.38.158
DB_PORT = 3306
DB_USER = novo_usuario
DB_PASSWORD = sua_senha
DB_NAME = roleta171
VITE_SUPABASE_URL = https://ykqpqhvjqgbmvtqgpvwt.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcXBxaHZqcWdibXZ0cWdwdnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzMDI1MjksImV4cCI6MjA0MDg3ODUyOX0.Uh_bP-3ZjZZGGwUvGiVKPDOAOmYSPcXKKIUEYTcRpLU
PORT = 3001
```

### 5. Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o deploy concluir (2-5 minutos)
3. Copie a URL do backend (ex: `https://roleta171-backend.onrender.com`)

### 6. Atualizar Frontend

Após o deploy do backend, atualize o frontend para usar a URL do Render:

1. Edite `frontend/.env.production`:
   ```
   VITE_API_URL=https://roleta171-backend.onrender.com/api
   ```

2. Faça commit e push:
   ```bash
   git add .
   git commit -m "feat: Atualizar URL da API para backend do Render.com"
   git push origin main
   ```

3. Deploy do frontend no Vercel:
   ```bash
   cd d:\Programas\React\171
   vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk
   ```

### 7. Testar

Acesse: https://roleta171.vercel.app

Digite a senha: **5751**

---

## ✅ Vantagens do Render.com

- ✅ **Gratuito** (plano Free)
- ✅ **Funciona perfeitamente com MySQL**
- ✅ **Deploy automático** do GitHub
- ✅ **SSL gratuito**
- ✅ **Logs em tempo real**
- ✅ **Sem limitações de conexão MySQL**

---

## 📊 Arquitetura Final

```
Frontend (Vercel)
    ↓
Backend (Render.com)
    ↓
MySQL (Hostinger)
```

---

## 🔧 Troubleshooting

**Se o backend não iniciar:**
- Verifique os logs no Render dashboard
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique se o MySQL do Hostinger aceita conexões externas

**Se o frontend não conectar:**
- Verifique se a URL do backend está correta no `.env.production`
- Limpe o cache do navegador (Ctrl + Shift + R)
- Verifique se o backend está rodando no Render

---

## 📝 Notas

- O plano Free do Render hiberna após 15 minutos de inatividade
- A primeira requisição após hibernar pode demorar 30-60 segundos
- Para evitar hibernação, considere upgrade para plano pago ($7/mês)
