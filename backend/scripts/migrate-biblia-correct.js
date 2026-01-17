import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    console.log('🔄 Iniciando migração CORRETA das tabelas da Bíblia...\n');

    connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Conectado ao MySQL\n');

    // Criar/usar banco biblia
    await connection.query('CREATE DATABASE IF NOT EXISTS biblia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('USE biblia');
    console.log('✅ Usando banco de dados biblia\n');

    // ============================================
    // DROPAR TABELAS ANTIGAS (se existirem)
    // ============================================
    console.log('🗑️  Removendo tabelas antigas...');
    await connection.query('DROP TABLE IF EXISTS biblia_cc');
    await connection.query('DROP TABLE IF EXISTS biblia_livros');
    await connection.query('DROP TABLE IF EXISTS biblia_versiculo');
    console.log('✅ Tabelas antigas removidas\n');

    // ============================================
    // CRIAR TABELA biblia_cc (Cantor Cristão)
    // ============================================
    console.log('📋 Criando tabela biblia_cc...');
    await connection.query(`
      CREATE TABLE biblia_cc (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        numero INT,
        hino TEXT,
        titulo VARCHAR(500),
        rodape VARCHAR(500),
        INDEX idx_numero (numero)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela biblia_cc criada\n');

    // ============================================
    // CRIAR TABELA biblia_livros
    // ============================================
    console.log('📋 Criando tabela biblia_livros...');
    await connection.query(`
      CREATE TABLE biblia_livros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        nome VARCHAR(255),
        abbrev VARCHAR(50),
        testamento VARCHAR(10),
        autor VARCHAR(255),
        capitulos INT,
        grupo VARCHAR(255),
        id_livro INT,
        INDEX idx_nome (nome),
        INDEX idx_abbrev (abbrev),
        INDEX idx_id_livro (id_livro)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela biblia_livros criada\n');

    // ============================================
    // CRIAR TABELA biblia_versiculo
    // ============================================
    console.log('📋 Criando tabela biblia_versiculo...');
    await connection.query(`
      CREATE TABLE biblia_versiculo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        id_livro INT,
        capitulo INT,
        versiculo INT,
        texto TEXT,
        INDEX idx_id_livro (id_livro),
        INDEX idx_capitulo (capitulo),
        INDEX idx_versiculo (versiculo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela biblia_versiculo criada\n');

    // ============================================
    // MIGRAR biblia_cc
    // ============================================
    console.log('📋 Migrando dados de biblia_cc...');
    const { data: allCc, error: ccError } = await supabase
      .from('biblia_cc')
      .select('*')
      .order('id');

    if (ccError) {
      console.error('❌ Erro ao buscar biblia_cc:', ccError);
    } else if (allCc && allCc.length > 0) {
      for (const cc of allCc) {
        await connection.query(
          `INSERT INTO biblia_cc (id, created_at, numero, hino, titulo, rodape) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [cc.id, cc.created_at, cc.numero, cc.hino, cc.titulo, cc.rodape]
        );
      }
      console.log(`✅ ${allCc.length} hinos migrados de biblia_cc\n`);
    }

    // ============================================
    // MIGRAR biblia_livros
    // ============================================
    console.log('📋 Migrando dados de biblia_livros...');
    const { data: allLivros, error: livrosError } = await supabase
      .from('biblia_livros')
      .select('*')
      .order('id');

    if (livrosError) {
      console.error('❌ Erro ao buscar biblia_livros:', livrosError);
    } else if (allLivros && allLivros.length > 0) {
      for (const livro of allLivros) {
        await connection.query(
          `INSERT INTO biblia_livros (id, created_at, nome, abbrev, testamento, autor, capitulos, grupo, id_livro) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [livro.id, livro.created_at, livro.nome, livro.abbrev, livro.testamento, livro.autor, livro.capitulos, livro.grupo, livro.id_livro]
        );
      }
      console.log(`✅ ${allLivros.length} livros migrados de biblia_livros\n`);
    }

    // ============================================
    // MIGRAR biblia_versiculo (em lotes)
    // ============================================
    console.log('📋 Migrando dados de biblia_versiculo (pode demorar)...');
    
    const { count } = await supabase
      .from('biblia_versiculo')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de versículos: ${count || 0}`);

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

      for (const v of versiculos) {
        await connection.query(
          `INSERT INTO biblia_versiculo (id, created_at, id_livro, capitulo, versiculo, texto) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [v.id, v.created_at, v.id_livro, v.capitulo, v.versiculo, v.texto]
        );
      }

      totalMigrated += versiculos.length;
      console.log(`  ⏳ Migrados ${totalMigrated}/${count || '?'} versículos...`);

      offset += batchSize;

      if (versiculos.length < batchSize) {
        break;
      }
    }

    console.log(`✅ ${totalMigrated} versículos migrados\n`);
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

migrateBiblia();
