-- Migration: Adicionar colunas hinario e igreja na tabela usuarios
-- Execute no MySQL do servidor

ALTER TABLE usuarios
ADD COLUMN hinario VARCHAR(50) DEFAULT 'HARPA',
ADD COLUMN igreja VARCHAR(255) DEFAULT '';
