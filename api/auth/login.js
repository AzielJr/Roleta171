import { getPool } from '../_db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { senha } = req.body;

    if (!senha) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM r171_senha WHERE senha = ?',
      [senha]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    const user = rows[0];
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}
