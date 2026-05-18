import db from '../repository/connection.js';

const runMigration = async () => {
  const conn = await db.connect();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        descricao VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
      )
    `);
    console.log('✓ Tabela playlists criada');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS playlist_hinos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        playlist_id INT NOT NULL,
        hino_id VARCHAR(24) NOT NULL,
        tipo_hino ENUM('HARPA','CCB','CANTOR','GERAL') NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        UNIQUE KEY unique_hino_in_playlist (playlist_id, hino_id, tipo_hino)
      )
    `);
    console.log('✓ Tabela playlist_hinos criada');

    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro na migração:', err.message);
  } finally {
    conn.end();
  }
};

runMigration();
