import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://roleta171.vercel.app',
    'https://roleta171-*.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { nome, senha } = req.body;

    if (!senha) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    // Se nome foi fornecido, buscar por nome e senha
    // Se não, buscar apenas por senha (compatibilidade com sistema antigo)
    let query, params;
    if (nome) {
      query = 'SELECT * FROM r171_senha WHERE nome = ? AND senha = ?';
      params = [nome, senha];
    } else {
      query = 'SELECT * FROM r171_senha WHERE senha = ?';
      params = [senha];
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Criar novo usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
      return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
    }

    // Verificar se usuário já existe
    const [existing] = await pool.query(
      'SELECT id FROM r171_senha WHERE nome = ?',
      [nome]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    const [result] = await pool.query(
      'INSERT INTO r171_senha (nome, senha) VALUES (?, ?)',
      [nome, senha]
    );

    const [newUser] = await pool.query(
      'SELECT * FROM r171_senha WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ user: newUser[0] });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// ============================================
// ROTAS DE SALDO
// ============================================

// Buscar último saldo do usuário
app.get('/api/saldo/last/:id_senha', async (req, res) => {
  try {
    const { id_senha } = req.params;

    const [rows] = await pool.query(
      `SELECT id, created_at, id_senha, DATE_FORMAT(data, "%Y-%m-%d") as data, 
              saldo_inicial, saldo_atual, vlr_lucro, per_lucro 
       FROM r171_saldo 
       WHERE id_senha = ? 
       ORDER BY created_at DESC, id DESC 
       LIMIT 1`,
      [id_senha]
    );

    if (rows.length === 0) {
      return res.json({ saldo: null });
    }

    res.json({ saldo: rows[0] });
  } catch (error) {
    console.error('Erro ao buscar último saldo:', error);
    res.status(500).json({ error: 'Erro ao buscar saldo' });
  }
});

// Buscar histórico de saldos
app.get('/api/saldo/history/:id_senha', async (req, res) => {
  try {
    const { id_senha } = req.params;
    const { dataInicial, dataFinal } = req.query;

    let query = 'SELECT id, created_at, id_senha, DATE_FORMAT(data, "%Y-%m-%d") as data, saldo_inicial, saldo_atual, vlr_lucro, per_lucro FROM r171_saldo WHERE id_senha = ?';
    const params = [id_senha];

    if (dataInicial) {
      query += ' AND data >= ?';
      params.push(dataInicial);
    }

    if (dataFinal) {
      query += ' AND data <= ?';
      params.push(dataFinal);
    }

    query += ' ORDER BY data DESC';

    const [rows] = await pool.query(query, params);
    res.json({ saldos: rows });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Criar novo registro de saldo
app.post('/api/saldo', async (req, res) => {
  try {
    const { id_senha, data, saldo_inicial, saldo_atual, vlr_lucro, per_lucro } = req.body;

    if (!id_senha) {
      return res.status(400).json({ error: 'id_senha é obrigatório' });
    }

    const [result] = await pool.query(
      `INSERT INTO r171_saldo (id_senha, data, saldo_inicial, saldo_atual, vlr_lucro, per_lucro) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_senha, data, saldo_inicial, saldo_atual, vlr_lucro, per_lucro]
    );

    const [newSaldo] = await pool.query(
      'SELECT * FROM r171_saldo WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ saldo: newSaldo[0] });
  } catch (error) {
    console.error('Erro ao criar saldo:', error);
    res.status(500).json({ error: 'Erro ao criar saldo' });
  }
});

// Atualizar saldo existente
app.put('/api/saldo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { saldo_inicial, saldo_atual, vlr_lucro, per_lucro } = req.body;

    const updates = [];
    const params = [];

    if (saldo_inicial !== undefined) {
      updates.push('saldo_inicial = ?');
      params.push(saldo_inicial);
    }
    if (saldo_atual !== undefined) {
      updates.push('saldo_atual = ?');
      params.push(saldo_atual);
    }
    if (vlr_lucro !== undefined) {
      updates.push('vlr_lucro = ?');
      params.push(vlr_lucro);
    }
    if (per_lucro !== undefined) {
      updates.push('per_lucro = ?');
      params.push(per_lucro);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(id);

    await pool.query(
      `UPDATE r171_saldo SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [updated] = await pool.query(
      'SELECT * FROM r171_saldo WHERE id = ?',
      [id]
    );

    res.json({ saldo: updated[0] });
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error);
    res.status(500).json({ error: 'Erro ao atualizar saldo' });
  }
});

// Deletar saldo
app.delete('/api/saldo/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM r171_saldo WHERE id = ?', [id]);

    res.json({ message: 'Saldo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar saldo:', error);
    res.status(500).json({ error: 'Erro ao deletar saldo' });
  }
});

// ============================================
// ROTA DE HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'Disconnected' });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Banco de dados: ${process.env.DB_NAME}`);
});
