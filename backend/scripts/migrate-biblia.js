import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração MySQL
const mysqlConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
};

async function migrateBiblia() {
  let connection;
  
  try {
    console.log('🔄 Iniciando migração das tabelas da Bíblia...\n');

    // Conectar ao MySQL
    connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Conectado ao MySQL\n');

    // ============================================
    // Criar banco de dados biblia
    // ============================================
    console.log('📋 Criando banco de dados biblia...');
    await connection.query('CREATE DATABASE IF NOT EXISTS biblia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('USE biblia');
    console.log('✅ Banco de dados biblia criado\n');

    // ============================================
    // Buscar estrutura das tabelas no Supabase
    // ============================================
    console.log('📋 Buscando estrutura das tabelas no Supabase...');
    
    // Buscar dados de biblia_cc
    const { data: ccData, error: ccError } = await supabase
      .from('biblia_cc')
      .select('*')
      .limit(1);

    // Buscar dados de biblia_livros
    const { data: livrosData, error: livrosError } = await supabase
      .from('biblia_livros')
      .select('*')
      .limit(1);

    // Buscar dados de biblia_versiculo
    const { data: versiculoData, error: versiculoError } = await supabase
      .from('biblia_versiculo')
      .select('*')
      .limit(1);

    // ============================================
    // Criar tabela biblia_cc
    // ============================================
    console.log('📋 Criando tabela biblia_cc...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biblia_cc (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        capitulo INT,
        versiculo INT,
        livro VARCHAR(255),
        INDEX idx_livro (livro),
        INDEX idx_capitulo (capitulo),
        INDEX idx_versiculo (versiculo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela biblia_cc criada\n');

    // ============================================
    // Criar tabela biblia_livros
    // ============================================
    console.log('📋 Criando tabela biblia_livros...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biblia_livros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        nome VARCHAR(255),
        abreviacao VARCHAR(50),
        testamento VARCHAR(50),
        INDEX idx_nome (nome),
        INDEX idx_testamento (testamento)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela biblia_livros criada\n');

    // ============================================
    // Criar tabela biblia_versiculo
    // ============================================
    console.log('📋 Criando tabela biblia_versiculo...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biblia_versiculo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        livro VARCHAR(255),
        capitulo INT,
        versiculo INT,
        texto TEXT,
        INDEX idx_livro (livro),
        INDEX idx_capitulo (capitulo),
        INDEX idx_versiculo (versiculo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela biblia_versiculo criada\n');

    // ============================================
    // Migrar dados de biblia_cc
    // ============================================
    console.log('📋 Migrando dados de biblia_cc...');
    const { data: allCc, error: allCcError } = await supabase
      .from('biblia_cc')
      .select('*')
      .order('id');

    if (allCcError) {
      console.error('❌ Erro ao buscar biblia_cc:', allCcError);
    } else if (allCc && allCc.length > 0) {
      for (const cc of allCc) {
        await connection.query(
          `INSERT INTO biblia_cc (id, created_at, capitulo, versiculo, livro) 
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             capitulo = VALUES(capitulo),
             versiculo = VALUES(versiculo),
             livro = VALUES(livro)`,
          [cc.id, cc.created_at, cc.capitulo, cc.versiculo, cc.livro]
        );
      }
      console.log(`✅ ${allCc.length} registros migrados de biblia_cc\n`);
    } else {
      console.log('⚠️  Nenhum registro encontrado em biblia_cc\n');
    }

    // ============================================
    // Migrar dados de biblia_livros
    // ============================================
    console.log('📋 Migrando dados de biblia_livros...');
    const { data: allLivros, error: allLivrosError } = await supabase
      .from('biblia_livros')
      .select('*')
      .order('id');

    if (allLivrosError) {
      console.error('❌ Erro ao buscar biblia_livros:', allLivrosError);
    } else if (allLivros && allLivros.length > 0) {
      for (const livro of allLivros) {
        await connection.query(
          `INSERT INTO biblia_livros (id, created_at, nome, abreviacao, testamento) 
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             nome = VALUES(nome),
             abreviacao = VALUES(abreviacao),
             testamento = VALUES(testamento)`,
          [livro.id, livro.created_at, livro.nome, livro.abreviacao, livro.testamento]
        );
      }
      console.log(`✅ ${allLivros.length} registros migrados de biblia_livros\n`);
    } else {
      console.log('⚠️  Nenhum registro encontrado em biblia_livros\n');
    }

    // ============================================
    // Migrar dados de biblia_versiculo (em lotes)
    // ============================================
    console.log('📋 Migrando dados de biblia_versiculo (pode demorar)...');
    
    // Contar total de versículos
    const { count } = await supabase
      .from('biblia_versiculo')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de versículos a migrar: ${count || 0}`);

    const batchSize = 1000;
    let offset = 0;
    let totalMigrated = 0;

    while (true) {
      const { data: versiculos, error: versiculosError } = await supabase
        .from('biblia_versiculo')
        .select('*')
        .order('id')
        .range(offset, offset + batchSize - 1);

      if (versiculosError) {
        console.error('❌ Erro ao buscar biblia_versiculo:', versiculosError);
        break;
      }

      if (!versiculos || versiculos.length === 0) {
        break;
      }

      for (const versiculo of versiculos) {
        await connection.query(
          `INSERT INTO biblia_versiculo (id, created_at, livro, capitulo, versiculo, texto) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             livro = VALUES(livro),
             capitulo = VALUES(capitulo),
             versiculo = VALUES(versiculo),
             texto = VALUES(texto)`,
          [versiculo.id, versiculo.created_at, versiculo.livro, versiculo.capitulo, versiculo.versiculo, versiculo.texto]
        );
      }

      totalMigrated += versiculos.length;
      console.log(`  ⏳ Migrados ${totalMigrated}/${count || '?'} versículos...`);

      offset += batchSize;

      if (versiculos.length < batchSize) {
        break;
      }
    }

    console.log(`✅ ${totalMigrated} registros migrados de biblia_versiculo\n`);

    console.log('🎉 Migração da Bíblia concluída com sucesso!');

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
migrateBiblia();
