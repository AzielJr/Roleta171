import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Verificar se as variáveis de ambiente estão disponíveis
    const envCheck = {
      hasDbHost: !!process.env.DB_HOST,
      hasDbPort: !!process.env.DB_PORT,
      hasDbUser: !!process.env.DB_USER,
      hasDbPassword: !!process.env.DB_PASSWORD,
      hasDbName: !!process.env.DB_NAME,
      dbHost: process.env.DB_HOST ? process.env.DB_HOST.substring(0, 5) + '...' : 'undefined',
      dbName: process.env.DB_NAME || 'undefined'
    };

    // Tentar conectar ao MySQL
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });

    const [rows] = await pool.query('SELECT 1 as test');
    
    await pool.end();

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Conexão MySQL funcionando!',
      env: envCheck,
      mysqlTest: rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message,
      stack: error.stack,
      env: {
        hasDbHost: !!process.env.DB_HOST,
        hasDbPort: !!process.env.DB_PORT,
        hasDbUser: !!process.env.DB_USER,
        hasDbPassword: !!process.env.DB_PASSWORD,
        hasDbName: !!process.env.DB_NAME
      }
    });
  }
}
