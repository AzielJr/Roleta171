import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração Supabase (valores do .env do frontend)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração MySQL
const mysqlConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function migrateData() {
  let connection;
  
  try {
    console.log('🔄 Iniciando migração do Supabase para MySQL...\n');

    // Conectar ao MySQL
    connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Conectado ao MySQL\n');

    // ============================================
    // Migrar tabela r171_senha
    // ============================================
    console.log('📋 Migrando tabela r171_senha...');
    const { data: senhas, error: senhasError } = await supabase
      .from('r171_senha')
      .select('*')
      .order('id');

    if (senhasError) {
      console.error('❌ Erro ao buscar senhas:', senhasError);
    } else if (senhas && senhas.length > 0) {
      for (const senha of senhas) {
        await connection.query(
          `INSERT INTO r171_senha (id, created_at, nome, senha) 
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha = VALUES(senha)`,
          [senha.id, senha.created_at, senha.nome, senha.senha]
        );
      }
      console.log(`✅ ${senhas.length} registros migrados de r171_senha\n`);
    } else {
      console.log('⚠️  Nenhum registro encontrado em r171_senha\n');
    }

    // ============================================
    // Migrar tabela r171_saldo
    // ============================================
    console.log('📋 Migrando tabela r171_saldo...');
    const { data: saldos, error: saldosError } = await supabase
      .from('r171_saldo')
      .select('*')
      .order('id');

    if (saldosError) {
      console.error('❌ Erro ao buscar saldos:', saldosError);
    } else if (saldos && saldos.length > 0) {
      for (const saldo of saldos) {
        await connection.query(
          `INSERT INTO r171_saldo (id, created_at, id_senha, data, saldo_inicial, saldo_atual, vlr_lucro, per_lucro) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             saldo_inicial = VALUES(saldo_inicial),
             saldo_atual = VALUES(saldo_atual),
             vlr_lucro = VALUES(vlr_lucro),
             per_lucro = VALUES(per_lucro)`,
          [
            saldo.id,
            saldo.created_at,
            saldo.id_senha,
            saldo.data,
            saldo.saldo_inicial,
            saldo.saldo_atual,
            saldo.vlr_lucro,
            saldo.per_lucro
          ]
        );
      }
      console.log(`✅ ${saldos.length} registros migrados de r171_saldo\n`);
    } else {
      console.log('⚠️  Nenhum registro encontrado em r171_saldo\n');
    }

    // ============================================
    // Migrar tabela r171_duzcol (se existir)
    // ============================================
    console.log('📋 Migrando tabela r171_duzcol...');
    const { data: duzcols, error: duzcolsError } = await supabase
      .from('r171_duzcol')
      .select('*')
      .order('id');

    if (duzcolsError) {
      console.log('⚠️  Tabela r171_duzcol não existe ou está vazia\n');
    } else if (duzcols && duzcols.length > 0) {
      for (const duzcol of duzcols) {
        await connection.query(
          `INSERT INTO r171_duzcol (id, created_at, tipo, n1, n2, n3, valor, total, retorno, status, id_senha) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             tipo = VALUES(tipo),
             n1 = VALUES(n1),
             n2 = VALUES(n2),
             n3 = VALUES(n3),
             valor = VALUES(valor),
             total = VALUES(total),
             retorno = VALUES(retorno),
             status = VALUES(status)`,
          [
            duzcol.id,
            duzcol.created_at,
            duzcol.tipo,
            duzcol.n1 || false,
            duzcol.n2 || false,
            duzcol.n3 || false,
            duzcol.valor,
            duzcol.total,
            duzcol.retorno,
            duzcol.status,
            duzcol.id_senha
          ]
        );
      }
      console.log(`✅ ${duzcols.length} registros migrados de r171_duzcol\n`);
    } else {
      console.log('⚠️  Nenhum registro encontrado em r171_duzcol\n');
    }

    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexão MySQL fechada');
    }
  }
}

// Executar migração
migrateData();
