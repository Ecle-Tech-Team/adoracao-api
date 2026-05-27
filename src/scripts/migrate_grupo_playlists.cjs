const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.SQL_HOST || 'localhost',
    user: process.env.SQL_USER || 'root',
    password: process.env.SQL_PASSWORD || 'root_senha',
    database: process.env.SQL_DB || 'adoracao_db',
  });

  console.log('Conectado ao banco. Criando tabelas grupo_playlists...');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS grupo_playlists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_grupo INT NOT NULL,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (id_grupo) REFERENCES grupo(id) ON DELETE CASCADE
    )
  `);

  console.log('Tabela grupo_playlists criada.');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS grupo_playlist_hinos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      playlist_id INT NOT NULL,
      hino_id VARCHAR(255) NOT NULL,
      tipo_hino VARCHAR(50) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playlist_id) REFERENCES grupo_playlists(id) ON DELETE CASCADE
    )
  `);

  console.log('Tabela grupo_playlist_hinos criada.');

  await connection.end();
  console.log('Migration concluída com sucesso!');
}

migrate().catch((err) => {
  console.error('Erro na migration:', err);
  process.exit(1);
});
