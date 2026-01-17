# Backend API - Roleta171

Backend API em Node.js/Express com MySQL para o sistema Roleta171.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Acesso ao banco MySQL (Hostinger)
- Dados do Supabase (para migração inicial)

## 🚀 Instalação

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
DB_HOST=92.113.38.158
DB_PORT=3306
DB_USER=novo_usuario
DB_PASSWORD=sua_senha
DB_NAME=roleta171

PORT=3001
NODE_ENV=production
```

### 3. Criar banco de dados e tabelas

Execute o script SQL no seu MySQL:

```bash
mysql -h 92.113.38.158 -u novo_usuario -p < ../database/setup.sql
```

Ou copie e execute o conteúdo do arquivo `database/setup.sql` no phpMyAdmin do Hostinger.

### 4. Migrar dados do Supabase (opcional)

Se você tem dados no Supabase que precisa migrar:

1. Adicione as variáveis do Supabase no `.env`:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase
```

2. Instale a dependência do Supabase:
```bash
npm install @supabase/supabase-js
```

3. Execute o script de migração:
```bash
node scripts/migrate-from-supabase.js
```

## 🏃 Executar

### Desenvolvimento (com auto-reload)
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor estará rodando em `http://localhost:3001`

## 📡 Endpoints da API

### Autenticação

**POST** `/api/auth/login`
- Body: `{ "nome": "admin", "senha": "admin123" }`
- Response: `{ "user": { ... } }`

**POST** `/api/auth/register`
- Body: `{ "nome": "novo_usuario", "senha": "senha123" }`
- Response: `{ "user": { ... } }`

### Saldo

**GET** `/api/saldo/last/:id_senha`
- Response: `{ "saldo": { ... } }`

**GET** `/api/saldo/history/:id_senha?dataInicial=2024-01-01&dataFinal=2024-12-31`
- Response: `{ "saldos": [ ... ] }`

**POST** `/api/saldo`
- Body: `{ "id_senha": 1, "data": "2024-01-17", "saldo_inicial": 100, "saldo_atual": 150, "vlr_lucro": 50, "per_lucro": 50 }`
- Response: `{ "saldo": { ... } }`

**PUT** `/api/saldo/:id`
- Body: `{ "saldo_atual": 200, "vlr_lucro": 100, "per_lucro": 100 }`
- Response: `{ "saldo": { ... } }`

**DELETE** `/api/saldo/:id`
- Response: `{ "message": "Saldo deletado com sucesso" }`

### Health Check

**GET** `/api/health`
- Response: `{ "status": "OK", "database": "Connected" }`

## 🔧 Estrutura do Projeto

```
backend/
├── config/
│   └── database.js          # Configuração do pool MySQL
├── scripts/
│   └── migrate-from-supabase.js  # Script de migração
├── index.js                 # Servidor Express principal
├── package.json
├── .env.example
└── README.md
```

## 🐛 Troubleshooting

### Erro de conexão MySQL

Verifique se:
- O IP do servidor está liberado no firewall do Hostinger
- As credenciais estão corretas no `.env`
- O banco de dados `roleta171` foi criado

### Porta já em uso

Altere a porta no `.env`:
```env
PORT=3002
```

## 📝 Notas

- O backend usa pool de conexões MySQL para melhor performance
- CORS está habilitado para permitir requisições do frontend
- Todas as senhas são armazenadas em texto plano (considere adicionar hash em produção)
