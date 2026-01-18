# 🚀 Guia Simplificado de Deploy - Roleta 171

Este guia explica de forma descomplicada como fazer deploy do sistema Roleta 171 em produção.

---

## 📋 Arquitetura do Sistema

- **Frontend:** Vercel (React + TypeScript)
- **Backend:** Render.com (Node.js + Express)
- **Banco de Dados:** MySQL (Hostinger)

---

## 🔧 1. Deploy do Backend no Render.com

### **Passo 1: Acessar o Render.com**
1. Acesse: https://render.com
2. Faça login com sua conta
3. Vá para o Dashboard

### **Passo 2: Criar/Atualizar o Web Service**

**Se é o PRIMEIRO deploy:**
1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório do GitHub: `AzielJr/Roleta171`
3. Configure:
   - **Name:** `roleta171`
   - **Region:** `Oregon (US West)`
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** `Free`

**Se já existe o serviço (REDEPLOY):**
1. Acesse: https://dashboard.render.com/
2. Clique no serviço `roleta171`
3. Clique em **"Manual Deploy"** → **"Deploy latest commit"**

### **Passo 3: Configurar Variáveis de Ambiente**
1. No serviço `roleta171`, vá em **"Environment"**
2. Adicione as seguintes variáveis:

```
DB_HOST=92.113.38.158
DB_PORT=3306
DB_USER=u687609827_r171
DB_PASSWORD=Roleta@171
DB_NAME=u687609827_r171
PORT=3001
```

3. Clique em **"Save Changes"**

### **Passo 4: Aguardar o Deploy**
- O Render vai fazer o build automaticamente
- Aguarde até aparecer **"Live"** (verde)
- Anote a URL gerada (ex: `https://roleta171.onrender.com`)

### **⚠️ IMPORTANTE:**
- O plano Free hiberna após 15 minutos de inatividade
- A primeira requisição pode demorar 30-60 segundos para "acordar"
- Depois funciona normalmente

---

## 🌐 2. Deploy do Frontend no Vercel

### **Passo 1: Configurar a URL do Backend**
1. Abra o arquivo: `frontend/.env.production`
2. Atualize com a URL do Render:
```
VITE_API_URL=https://roleta171.onrender.com/api
```
3. Salve o arquivo

### **Passo 2: Fazer Commit das Alterações**
```bash
cd d:\Programas\React\171
git add -A
git commit -m "chore: Atualizar URL do backend para produção"
git push origin main
```

### **Passo 3: Deploy no Vercel**

**Opção A: Via CLI (Recomendado)**
```bash
cd d:\Programas\React\171
vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk
```

**Opção B: Via Dashboard**
1. Acesse: https://vercel.com/aziel-rodrigues-pereira-jrs-projects/roleta171
2. Clique em **"Deployments"**
3. Clique em **"Redeploy"** no deployment mais recente
4. **Desmarque** "Use existing Build Cache"
5. Clique em **"Redeploy"**

### **Passo 4: Aguardar o Deploy**
- O Vercel vai fazer o build automaticamente
- Aguarde até aparecer **"Ready"** (verde)
- Acesse: https://roleta171.vercel.app

### **Passo 5: Limpar Cache do Navegador**
Se o site não atualizar:
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Imagens e arquivos em cache"
3. Clique em "Limpar dados"
4. OU abra em modo anônimo: `Ctrl + Shift + N`

---

## 🔄 3. Redeploy Rápido (Após Alterações no Código)

### **Se alterou APENAS o Frontend:**
```bash
cd d:\Programas\React\171
git add -A
git commit -m "feat: Descrição da alteração"
git push origin main
vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk
```

### **Se alterou APENAS o Backend:**
```bash
cd d:\Programas\React\171
git add -A
git commit -m "feat: Descrição da alteração"
git push origin main
```
Depois:
1. Acesse: https://dashboard.render.com/
2. Clique no serviço `roleta171`
3. Clique em **"Manual Deploy"** → **"Deploy latest commit"**

### **Se alterou AMBOS (Frontend + Backend):**
```bash
cd d:\Programas\React\171
git add -A
git commit -m "feat: Descrição da alteração"
git push origin main
```
Depois:
1. **Backend:** Manual Deploy no Render (aguarde ficar "Live")
2. **Frontend:** `vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk`

---

## 🐛 4. Troubleshooting (Resolução de Problemas)

### **Problema: Backend não conecta ao MySQL**
**Solução:**
1. Verifique as variáveis de ambiente no Render
2. Teste a conexão do MySQL no Hostinger
3. Verifique se o IP do Render está liberado no MySQL

### **Problema: Frontend mostra erro 500 ou CORS**
**Solução:**
1. Verifique se a URL do backend está correta em `frontend/.env.production`
2. Aguarde o backend "acordar" (plano Free hiberna)
3. Verifique os logs do backend no Render

### **Problema: Cache do navegador não atualiza**
**Solução:**
1. Limpe o cache: `Ctrl + Shift + Delete`
2. Ou abra em modo anônimo: `Ctrl + Shift + N`
3. Ou aguarde 5-10 minutos para o CDN do Vercel atualizar

### **Problema: Build falha no Vercel**
**Solução:**
1. Verifique erros de TypeScript no código
2. Teste o build localmente: `cd frontend && npm run build`
3. Corrija os erros e faça novo deploy

### **Problema: Backend demora muito para responder**
**Solução:**
- É normal no plano Free do Render (hiberna após 15 min)
- A primeira requisição demora 30-60 segundos
- Considere upgrade para plano pago se necessário

---

## 📊 5. Verificação Pós-Deploy

### **Checklist de Verificação:**
- [ ] Backend está "Live" no Render
- [ ] Frontend está "Ready" no Vercel
- [ ] Login funciona (senha: 5751)
- [ ] Saldo carrega corretamente
- [ ] Cadastrar Saldo funciona
- [ ] Histórico de Saldos aparece
- [ ] Progressão de Cores funciona
- [ ] Datas estão formatadas corretamente (dd/MM/yyyy)

### **URLs de Produção:**
- **Frontend:** https://roleta171.vercel.app
- **Backend:** https://roleta171.onrender.com
- **API Health Check:** https://roleta171.onrender.com/api/test

---

## 🔐 6. Informações Importantes

### **Credenciais de Acesso:**
- **Senha do Sistema:** 5751
- **Vercel Token:** `LwQMGnZpwxcE3s749poZtuWk`

### **Banco de Dados MySQL:**
```
Host: 92.113.38.158
Port: 3306
User: u687609827_r171
Password: Roleta@171
Database: u687609827_r171
```

### **Repositório GitHub:**
- **URL:** https://github.com/AzielJr/Roleta171
- **Branch Principal:** `main`

---

## 💡 7. Dicas Importantes

1. **Sempre faça commit antes de fazer deploy**
2. **Teste no localhost antes de fazer deploy em produção**
3. **Aguarde o backend ficar "Live" antes de testar o frontend**
4. **Limpe o cache do navegador após cada deploy**
5. **Monitore os logs do Render para identificar erros**
6. **O plano Free do Render hiberna - considere upgrade se necessário**

---

## 📞 8. Suporte

Se encontrar problemas:
1. Verifique os logs no Render: https://dashboard.render.com/
2. Verifique os logs no Vercel: https://vercel.com/aziel-rodrigues-pereira-jrs-projects/roleta171
3. Teste no localhost para isolar o problema
4. Verifique se as variáveis de ambiente estão corretas

---

**Sistema 100% funcional em produção! 🚀**

**Última atualização:** 18/01/2026
