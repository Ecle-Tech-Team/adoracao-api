-- Schema inicial do banco adoracao_db (ambiente local).
-- Derivado de src/repository/adoracao.sql, tornado idempotente para o init do MySQL 8
-- (montado em /docker-entrypoint-initdb.d). Inclui as tabelas de grupo_playlists
-- (migração de src/scripts/migrate_grupo_playlists.cjs).

CREATE DATABASE IF NOT EXISTS adoracao_db;
USE adoracao_db;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(16) NOT NULL,
    data_nasc DATE,
    tipo_usuario ENUM('Adorador', 'Regente', 'Cantor', 'Musico', 'Componente', 'Professor') NOT NULL
);

CREATE TABLE IF NOT EXISTS grupo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    local VARCHAR(255) NOT NULL,
    tipo_grupo ENUM('Musical', 'Louvor') NOT NULL,
    regente_id INT UNIQUE NOT NULL,
    FOREIGN KEY (regente_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS hinario_grupo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    grupo_id INT NOT NULL,
    hino_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (grupo_id) REFERENCES grupo(id)
);

CREATE TABLE IF NOT EXISTS ensaios_grupo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    grupo_id INT NOT NULL,
    hino_id INT,
    data DATETIME NOT NULL,
    descricao VARCHAR(255),
    local VARCHAR(255),
    FOREIGN KEY (grupo_id) REFERENCES grupo(id),
    FOREIGN KEY (hino_id) REFERENCES hinario_grupo(id)
);

CREATE TABLE IF NOT EXISTS eventos_grupo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    grupo_id INT NOT NULL,
    data DATETIME NOT NULL,
    descricao TEXT,
    local VARCHAR(255),
    FOREIGN KEY (grupo_id) REFERENCES grupo(id)
);

CREATE TABLE IF NOT EXISTS musicos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    partituras TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS cantores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    classificacao INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS regentes (
    regente_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    classificacao_hinos TEXT,
    classificacao_componentes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS componentes (
    componente_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    classificacao INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    hino_id VARCHAR(50) NOT NULL,
    tipo_hino ENUM('HARPA', 'CCB', 'CANTOR', 'GERAL') NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

ALTER TABLE usuarios
ADD COLUMN id_grupo INT DEFAULT NULL,
ADD FOREIGN KEY (id_grupo) REFERENCES grupo(id);

CREATE TABLE IF NOT EXISTS notificacoes (
    id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('GLOBAL', 'CONVITE_GRUPO', 'EVENTO', 'ENSAIO') NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    id_grupo INT NULL,
    id_referencia INT NULL,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grupo) REFERENCES grupo(id)
);

CREATE TABLE IF NOT EXISTS notificacoes_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_notificacao INT NOT NULL,
    id_usuario INT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    lida_em TIMESTAMP NULL,

    UNIQUE KEY unique_notificacao_usuario (id_notificacao, id_usuario),

    FOREIGN KEY (id_notificacao) REFERENCES notificacoes(id_notificacao)
      ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlist_hinos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playlist_id INT NOT NULL,
  hino_id VARCHAR(24) NOT NULL,
  tipo_hino ENUM('HARPA','CCB','CANTOR','GERAL') NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  UNIQUE KEY unique_hino_in_playlist (playlist_id, hino_id, tipo_hino)
);

CREATE TABLE IF NOT EXISTS push_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    expo_push_token VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_usuario_token (id_usuario),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

ALTER TABLE usuarios
    ADD COLUMN hinario VARCHAR(50) DEFAULT 'HARPA',
    ADD COLUMN igreja VARCHAR(255) DEFAULT '';

CREATE TABLE IF NOT EXISTS grupo_playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_grupo INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_grupo) REFERENCES grupo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grupo_playlist_hinos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playlist_id INT NOT NULL,
  hino_id VARCHAR(255) NOT NULL,
  tipo_hino VARCHAR(50) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playlist_id) REFERENCES grupo_playlists(id) ON DELETE CASCADE
);

INSERT INTO usuarios (nome, email, senha, data_nasc, tipo_usuario, id_grupo) VALUES
('Lucas', 'lucas@gmail.com', '123', '2004-10-23', 'Adorador', null),
('Pedro', 'musico@gmail.com', '123', '2004-07-23', 'Musico', null),
('Neusa', 'cantor@gmail.com', '123', '1980-10-23', 'Cantor', null),
('Angelita', 'regente@gmail.com', '123', '1980-02-05', 'Regente', null),
('Levi', 'comp@gmail.com', '123', '2014-10-23', 'Adorador', null),
('Convidado', 'convidado@gmail.com', '123', '2014-10-23', 'Adorador', null);
