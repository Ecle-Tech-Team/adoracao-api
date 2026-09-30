-- Apply once after the existing usuarios, grupo and legacy igreja migrations.
-- Existing rows remain unassociated until an explicit onboarding/backfill.
CREATE TABLE igrejas (
  id_igreja INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  nome_normalizado VARCHAR(150) NOT NULL,
  cidade VARCHAR(100) NULL,
  estado VARCHAR(2) NULL,
  endereco VARCHAR(255) NULL,
  cep VARCHAR(10) NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_igreja_nome_normalizado (nome_normalizado)
);

ALTER TABLE usuarios
  ADD COLUMN id_igreja INT NULL,
  ADD INDEX idx_usuario_id_igreja (id_igreja),
  ADD CONSTRAINT fk_usuarios_igreja FOREIGN KEY (id_igreja) REFERENCES igrejas(id_igreja);

ALTER TABLE grupo
  ADD COLUMN id_igreja INT NULL,
  ADD INDEX idx_grupo_id_igreja (id_igreja),
  ADD CONSTRAINT fk_grupo_igreja FOREIGN KEY (id_igreja) REFERENCES igrejas(id_igreja);
