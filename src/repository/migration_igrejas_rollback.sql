-- Only run after confirming no application data needs the new association.
ALTER TABLE grupo DROP FOREIGN KEY fk_grupo_igreja, DROP INDEX idx_grupo_id_igreja, DROP COLUMN id_igreja;
ALTER TABLE usuarios DROP FOREIGN KEY fk_usuarios_igreja, DROP INDEX idx_usuario_id_igreja, DROP COLUMN id_igreja;
DROP TABLE igrejas;
