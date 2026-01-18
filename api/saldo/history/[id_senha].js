import { getPool } from '../../_db.js';

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
    const { dataInicial, dataFinal } = req.query;

    let query = `
      SELECT 
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
    `;

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

    const pool = getPool();
    const [rows] = await pool.query(query, params);

    return res.status(200).json({ saldos: rows });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar histórico',
      message: error.message,
      stack: error.stack,
      code: error.code
    });
  }
}
