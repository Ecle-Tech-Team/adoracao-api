import db from '../repository/connection.js'
import { hashPassword } from './passwords.js';
import { revokeAllSessions } from './authservices.js';

async function createUser(name, email, password, typeUser, birthDate, hinario, igreja){
  if (typeof password !== 'string' || password.length < 8) throw new Error('Senha deve ter pelo menos 8 caracteres.');
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    throw new Error('Nome e e-mail são obrigatórios.');
  }
  const passwordHash = await hashPassword(password);
  const sql = "INSERT INTO usuarios(nome, email, senha, tipo_usuario, data_nasc, hinario, igreja) VALUES(?,?,?,?,?,?,?)"

  const values = [name, email, passwordHash, 'Adorador', birthDate, hinario || 'HARPA', igreja || '' ];
  const conn = await db.connect();
  try {
    await conn.query(sql, values);
  } finally { await conn.end(); }
}

async function updateUser(name, email, password, typeUser, idUser){
  const changingPassword = typeof password === 'string' && password.length > 0;
  if (changingPassword && password.length < 8) throw new Error('Senha deve ter pelo menos 8 caracteres.');
  const sql = changingPassword
    ? "UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id_usuario = ?"
    : "UPDATE usuarios SET nome = ?, email = ? WHERE id_usuario = ?";
  const values = changingPassword
    ? [name, email, await hashPassword(password), idUser]
    : [name, email, idUser];

  const conn = await db.connect()
  try {
    await conn.query(sql, values);
  } finally { await conn.end(); }
  if (changingPassword) await revokeAllSessions(idUser);
}

async function deleteUser(idUser){
  const sql = "DELETE FROM usuarios WHERE id_usuario = ?"
  const conn = await db.connect()
  await conn.query(sql, idUser)
  conn.end();
}

export async function getCandidatosComponente() {
  const conn = await db.connect();
  try {
      const sql = `
          SELECT id_usuario, nome, tipo_usuario 
          FROM usuarios 
          WHERE tipo_usuario IN ('Adorador', 'Cantor', 'Musico')
      `;
      const [rows] = await conn.query(sql);
      return rows;
  } catch (error) {
      console.error('Erro ao buscar candidatos a componentes:', error);
      throw error;
  } finally {
      conn.end();
  }
}

export const listarComponentesDoGrupo = async (id_grupo) => {
  const conn = await db.connect();
  try {
    const sql = "SELECT id_usuario, nome, email, data_nasc, tipo_usuario FROM usuarios WHERE id_grupo = ? AND tipo_usuario = 'Componente'";
    const [rows] = await conn.query(sql, [id_grupo]);

    return rows; 
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
};

export async function adicionarComponenteAoGrupo(idUser, id_grupo) {
  const conn = await db.connect();
  try {      
    const sql = "UPDATE usuarios SET id_grupo = ?, tipo_usuario = 'Componente' WHERE id_usuario = ? AND (tipo_usuario = 'Adorador' OR tipo_usuario = 'Cantor' OR tipo_usuario = 'Musico')";
    const [result] = await conn.query(sql, [id_grupo, idUser]);
    return { message: 'Componente adicionado ao grupo com sucesso!' };
  } catch (error) {
      console.error('Erro ao adicionar componente ao grupo:', error);
    throw error;
  } finally {
      conn.end();
  }
}

export const removerComponente = async (idUser, id_grupo) => {
  const conn = await db.connect();
  try {
    const sql = "UPDATE usuarios SET tipo_usuario = 'Adorador', id_grupo = NULL WHERE id_usuario = ? AND id_grupo = ? AND tipo_usuario = 'Componente'";
    const values = [idUser, id_grupo];
    await conn.query(sql, values);
  } catch (error) {
    console.error('Erro ao remover componente:', error);
    throw error;
  } finally { conn.end(); }
};

export async function checkEmailExists(email) {
  const conn = await db.connect();
  try {
    const sql = "SELECT COUNT(*) AS total FROM usuarios WHERE email = ?";
    const [rows] = await conn.query(sql, [email]);
    return rows[0].total > 0;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    throw error;
  } finally {
    conn.end();
  }
}

export async function listarIgrejas() {
  const conn = await db.connect();
  try {
    const sql = "SELECT DISTINCT igreja FROM usuarios WHERE igreja IS NOT NULL AND igreja != '' ORDER BY igreja ASC";
    const [rows] = await conn.query(sql, []);
    return rows.map(r => r.igreja);
  } catch (error) {
    console.error('Erro ao listar igrejas:', error);
    throw error;
  } finally {
    conn.end();
  }
}

export async function updateUserGrupo(idUser, id_grupo) {
  const conn = await db.connect();
  try {
    const sql = "UPDATE usuarios SET id_grupo = ? WHERE id_usuario = ?";
    await conn.query(sql, [id_grupo, idUser]);
  } catch (error) {
    console.error('Erro ao atualizar grupo do usuário:', error);
    throw error;
  } finally {
    conn.end();
  }
}


export default {createUser, updateUser, deleteUser};
