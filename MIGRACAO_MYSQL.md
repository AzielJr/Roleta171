# 🔄 Migração Supabase → MySQL - Concluída

## ✅ O que foi feito

### 1. **Banco de Dados MySQL**
- ✅ Banco `roleta171` criado no servidor MySQL do Hostinger
- ✅ 3 tabelas criadas:
  - `r171_senha` - Autenticação de usuários
  - `r171_saldo` - Controle de saldo/balanço
  - `r171_duzcol` - Histórico de apostas
- ✅ **Dados migrados do Supabase:**
  - 3 usuários
  - 29 registros de saldo
  - 1 registro de aposta

### 2. **Backend API (Node.js/Express)**
- ✅ Servidor criado em `backend/`
- ✅ Rodando na porta 3001
- ✅ Endpoints implementados:
  - `POST /api/auth/login` - Login de usuário
  - `POST /api/auth/register` - Criar novo usuário
  - `GET /api/saldo/last/:id_senha` - Buscar último saldo
  - `GET /api/saldo/history/:id_senha` - Histórico de saldos
  - `POST /api/saldo` - Criar novo saldo
  - `PUT /api/saldo/:id` - Atualizar saldo
  - `DELETE /api/saldo/:id` - Deletar saldo
  - `GET /api/health` - Health check

### 3. **Frontend Atualizado**
- ✅ Nova biblioteca API criada: `frontend/src/lib/api.ts`
- ✅ Componentes atualizados:
  - `LoginForm.tsx` - usa authAPI
  - `AuthContext.tsx` - usa nova API
  - `BalanceContext.tsx` - usa useMySQLBalance
  - `HistoricoSaldos.tsx` - usa saldoAPI
- ✅ Novo hook criado: `useMySQLBalance.ts`

---

## 🚀 Como Usar

### **Iniciar o Backend (obrigatório)**

1. Abra um terminal na pasta `backend`:
```bash
cd backend
npm start
```

O servidor deve iniciar na porta 3001. Você verá:
```
🚀 Servidor rodando na porta 3001
📊 Banco de dados: roleta171
```

### **Iniciar o Frontend**

2. Abra outro terminal na pasta `frontend`:
```bash
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

---

## 🔐 Login

Use uma das senhas migradas do Supabase:
- As senhas dos usuários foram mantidas
- O sistema continua funcionando da mesma forma

---

## 📝 Notas Importantes

### **Backend deve estar rodando**
- O backend DEVE estar rodando para o frontend funcionar
- Se o backend parar, o frontend não conseguirá fazer login ou carregar dados

### **Dados Preservados**
- Todos os dados do Supabase foram migrados para o MySQL
- Nenhum dado foi perdido na migração

### **Backup Disponível**
- Branch de backup criado: `backup-supabase-stable`
- Tag de versão: `v1.0-supabase-stable`
- Para voltar ao Supabase se necessário:
  ```bash
  git checkout backup-supabase-stable
  ```

---

## 🐛 Troubleshooting

### **Erro de conexão no frontend**
- Verifique se o backend está rodando
- Verifique se a URL da API está correta em `frontend/.env.local`:
  ```
  VITE_API_URL=http://localhost:3001/api
  ```

### **Erro de conexão MySQL no backend**
- Verifique as credenciais em `backend/.env`:
  ```
  DB_HOST=92.113.38.158
  DB_PORT=3306
  DB_USER=novo_usuario
  DB_PASSWORD=sua_senha
  DB_NAME=roleta171
  ```

### **Backend não inicia**
- Certifique-se de que as dependências estão instaladas:
  ```bash
  cd backend
  npm install
  ```

---

## 📊 Estrutura do Projeto

```
171/
├── backend/                    # Backend API Node.js/Express
│   ├── config/
│   │   └── database.js        # Configuração MySQL
│   ├── scripts/
│   │   ├── setup-database.js  # Script para criar banco
│   │   └── migrate-from-supabase.js  # Script de migração
│   ├── index.js               # Servidor principal
│   ├── package.json
│   └── .env                   # Credenciais (não commitado)
│
├── database/
│   └── setup.sql              # Script SQL para criar tabelas
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts         # Nova biblioteca API MySQL
│   │   │   └── supabase.ts    # Antiga (não usado mais)
│   │   ├── hooks/
│   │   │   └── useMySQLBalance.ts  # Hook para saldo
│   │   └── components/
│   │       ├── LoginForm.tsx
│   │       └── HistoricoSaldos.tsx
│   └── .env.local             # Configuração API URL
│
└── MIGRACAO_MYSQL.md          # Este arquivo
```

---

## 🎯 Próximos Passos

1. ✅ Testar login no sistema
2. ✅ Testar funcionalidades de saldo
3. ✅ Testar histórico de saldos
4. ⏳ Deploy do backend (Vercel Serverless Functions)
5. ⏳ Deploy do frontend (Vercel)

---

## 💰 Economia

**Antes:** Supabase (plano pago)
**Depois:** MySQL no Hostinger (já incluído no plano)

**Economia mensal:** Custo do plano Supabase 💸
