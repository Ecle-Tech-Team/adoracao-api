import db from '../repository/connection.js';
import { hashPassword, verifyPassword } from './passwords.js';

export async function loginUser(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) return null;
  const conn = await db.connect();
  try {
    const [rows] = await conn.query('SELECT id_usuario, nome, email, senha, tipo_usuario, id_grupo, id_igreja FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return null;
    const checked = await verifyPassword(password, user.senha);
    if (!checked.valid) return null;
    if (checked.legacy) {
      const hashed = await hashPassword(password);
      const [result] = await conn.query('UPDATE usuarios SET senha = ? WHERE id_usuario = ? AND senha = ?', [hashed, user.id_usuario, user.senha]);
      if (result.affectedRows !== 1) return null;
    }
    delete user.senha;
    return user;
  } finally { await conn.end(); }
}
