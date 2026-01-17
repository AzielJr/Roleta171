import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao MySQL...\n');

    // Conectar sem especificar o banco (para criar o banco)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✅ Conectado ao MySQL\n');

    // Ler arquivo SQL
    const sqlPath = join(__dirname, '../../database/setup.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('📋 Executando script SQL...\n');

    // Executar script
    await connection.query(sql);

    console.log('✅ Banco de dados e tabelas criados com sucesso!\n');

    // Verificar tabelas criadas
    await connection.query('USE roleta171');
    const [tables] = await connection.query('SHOW TABLES');
    
    console.log('📊 Tabelas criadas:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    console.log('\n🎉 Setup concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexão MySQL fechada');
    }
  }
}

setupDatabase();
