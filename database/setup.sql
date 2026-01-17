-- ============================================
-- Script de Criação do Banco de Dados Roleta171
-- Migração do Supabase para MySQL
-- ============================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS roleta171 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE roleta171;

-- ============================================
-- Tabela: r171_senha (Autenticação de Usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS r171_senha (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nome VARCHAR(255) DEFAULT NULL,
  senha VARCHAR(255) DEFAULT NULL,
  INDEX idx_nome (nome),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: r171_saldo (Controle de Saldo/Balanço)
-- ============================================
CREATE TABLE IF NOT EXISTS r171_saldo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_senha INT DEFAULT NULL,
  data DATE DEFAULT NULL,
  saldo_inicial DECIMAL(10,2) DEFAULT NULL,
  saldo_atual DECIMAL(10,2) DEFAULT NULL,
  vlr_lucro DECIMAL(10,2) DEFAULT NULL,
  per_lucro DECIMAL(10,2) DEFAULT NULL,
  FOREIGN KEY (id_senha) REFERENCES r171_senha(id) ON DELETE CASCADE,
  INDEX idx_id_senha (id_senha),
  INDEX idx_data (data),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: r171_duzcol (Histórico de Apostas - Dúzia/Coluna)
-- ============================================
CREATE TABLE IF NOT EXISTS r171_duzcol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tipo ENUM('D', 'C') NOT NULL,
  n1 BOOLEAN DEFAULT FALSE,
  n2 BOOLEAN DEFAULT FALSE,
  n3 BOOLEAN DEFAULT FALSE,
  valor DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  retorno DECIMAL(10,2) NOT NULL,
  status BOOLEAN NOT NULL COMMENT 'true = WIN, false = LOSS',
  id_senha INT DEFAULT NULL,
  FOREIGN KEY (id_senha) REFERENCES r171_senha(id) ON DELETE CASCADE,
  INDEX idx_id_senha (id_senha),
  INDEX idx_tipo (tipo),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Dados Iniciais (Opcional)
-- ============================================
-- Inserir usuário padrão (senha: admin123)
INSERT INTO r171_senha (nome, senha) 
VALUES ('admin', 'admin123')
ON DUPLICATE KEY UPDATE nome = nome;

-- ============================================
-- Verificação
-- ============================================
SELECT 'Banco de dados e tabelas criados com sucesso!' AS status;
SHOW TABLES;
