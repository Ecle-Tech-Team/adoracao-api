import db from '../repository/connection.js';

async function salvarPushToken(id_usuario, token) {
  const conn = await db.connect();

  try {
    const sql = `
      INSERT INTO push_tokens (id_usuario, expo_push_token)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        expo_push_token = VALUES(expo_push_token)
    `;
    await conn.query(sql, [id_usuario, token]);
  } finally {
    conn.end();
  }
}

export default { salvarPushToken };
