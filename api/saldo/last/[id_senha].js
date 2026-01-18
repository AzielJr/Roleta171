import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id_senha } = req.query;

    const [rows] = await pool.query(
      `SELECT 
        id, 
        id_senha, 
        DATE_FORMAT(data, '%Y-%m-%d') as data,
        saldo_inicial, 
        saldo_atual, 
        vlr_lucro, 
        per_lucro,
        created_at,
        updated_at
      FROM r171_saldo 
      WHERE id_senha = ? 
      ORDER BY data DESC 
      LIMIT 1`,
      [id_senha]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum saldo encontrado' });
    }

    return res.status(200).json({ saldo: rows[0] });
  } catch (error) {
    console.error('Erro ao buscar último saldo:', error);
    return res.status(500).json({ error: 'Erro ao buscar saldo' });
  }
}
