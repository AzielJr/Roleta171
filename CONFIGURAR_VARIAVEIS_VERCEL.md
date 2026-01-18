# 🔧 Como Configurar Variáveis de Ambiente no Vercel

## Passo 1: Acessar o Dashboard do Backend

1. Abra seu navegador
2. Acesse este link: https://vercel.com/aziel-rodrigues-pereira-jrs-projects/backend
3. Faça login se necessário

---

## Passo 2: Ir para Configurações

1. Na página do projeto **backend**, procure o menu superior
2. Clique em **"Settings"** (Configurações)

---

## Passo 3: Acessar Environment Variables

1. No menu lateral esquerdo, procure por **"Environment Variables"**
2. Clique nessa opção

---

## Passo 4: Adicionar Cada Variável

Você verá um botão **"Add New"** ou **"Add Variable"**. Clique nele.

### **Variável 1: DB_HOST**

```
Name (Nome): DB_HOST
Value (Valor): 92.113.38.158
```

**Ambientes:** Marque as 3 caixinhas:
- ✅ Production
- ✅ Preview  
- ✅ Development

Clique em **"Save"**

---

### **Variável 2: DB_PORT**

Clique em **"Add New"** novamente

```
Name: DB_PORT
Value: 3306
```

**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

Clique em **"Save"**

---

### **Variável 3: DB_USER**

Clique em **"Add New"** novamente

```
Name: DB_USER
Value: novo_usuario
```

**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

Clique em **"Save"**

---

### **Variável 4: DB_PASSWORD**

Clique em **"Add New"** novamente

```
Name: DB_PASSWORD
Value: sua_senha
```

**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

Clique em **"Save"**

---

### **Variável 5: DB_NAME**

Clique em **"Add New"** novamente

```
Name: DB_NAME
Value: roleta171
```

**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

Clique em **"Save"**

---

### **Variável 6: VITE_SUPABASE_URL**

Clique em **"Add New"** novamente

```
Name: VITE_SUPABASE_URL
Value: https://ykqpqhvjqgbmvtqgpvwt.supabase.co
```

**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

Clique em **"Save"**

---

### **Variável 7: VITE_SUPABASE_ANON_KEY**

Clique em **"Add New"** novamente

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcXBxaHZqcWdibXZ0cWdwdnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzMDI1MjksImV4cCI6MjA0MDg3ODUyOX0.Uh_bP-3ZjZZGGwUvGiVKPDOAOmYSPcXKKIUEYTcRpLU
```

**Ambientes:** ✅ Production, ✅ Preview, ✅ Development

Clique em **"Save"**

---

## ✅ Verificação

Após adicionar todas as 7 variáveis, você deve ver uma lista com:

1. DB_HOST
2. DB_PORT
3. DB_USER
4. DB_PASSWORD
5. DB_NAME
6. VITE_SUPABASE_URL
7. VITE_SUPABASE_ANON_KEY

---

## Passo 5: Redeploy do Backend

Agora que as variáveis estão configuradas, você precisa fazer um novo deploy do backend.

**Abra o PowerShell** e execute:

```powershell
cd d:\Programas\React\171\backend
vercel --prod --yes --token LwQMGnZpwxcE3s749poZtuWk
```

Aguarde o deploy concluir (cerca de 10-20 segundos).

---

## 🎉 Pronto!

Após o redeploy, seu site estará funcionando com MySQL!

Acesse: https://roleta171.vercel.app

Teste o login com a senha: **5751**

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas em qualquer passo, me avise e eu te ajudo!

**Link direto para configurar:** https://vercel.com/aziel-rodrigues-pereira-jrs-projects/backend/settings/environment-variables
