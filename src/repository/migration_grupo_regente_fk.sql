-- Production migration for the legacy grupo.regente_id foreign key.
--
-- Runtime authorization and group creation treat grupo.regente_id as
-- regentes.regente_id. Some legacy databases instead constrain it to
-- usuarios.id_usuario. Do NOT run the ALTER statements below until the
-- preflight query returns zero rows and the existing constraint name has been
-- reviewed. This migration intentionally never guesses or rewrites IDs.

-- Abort the migration and reconcile data manually if this returns any row.
SELECT g.id AS grupo_id, g.regente_id AS legacy_regente_id
FROM grupo AS g
LEFT JOIN regentes AS r ON r.regente_id = g.regente_id
WHERE r.regente_id IS NULL;

-- Record the current foreign-key name before making the reviewed change.
SELECT kcu.CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE AS kcu
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.TABLE_NAME = 'grupo'
  AND kcu.COLUMN_NAME = 'regente_id'
  AND kcu.REFERENCED_TABLE_NAME IS NOT NULL;

-- After the preflight is clean, replace <legacy_fk_name> with the name above
-- and execute these two statements in a maintenance window. The DROP is not
-- automatic so an unexpected production constraint cannot be removed silently.
-- ALTER TABLE grupo DROP FOREIGN KEY <legacy_fk_name>;
-- ALTER TABLE grupo
--   ADD CONSTRAINT fk_grupo_regente
--   FOREIGN KEY (regente_id) REFERENCES regentes(regente_id);
