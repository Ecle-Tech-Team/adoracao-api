import db from '../repository/connection.js'

async function createUser(name, email, password, typeUser, birthDate){
  const sql = "INSERT INTO usuarios(nome, email, senha, tipo_usuario, data_nasc) VALUES(?,?,?,?,?)"
  
  const values = [name, email, password, typeUser, birthDate ];
  const conn = await db.connect();
  await conn.query(sql, values)
  conn.end();
}

async function updateUser(name, email, password, typeUser, idUser){
  const sql = "UPDATE usuarios SET nome = ?, email = ?, senha = ?, tipo_usuario = ? WHERE id_usuario = ?"
  const values = [name, email, password, typeUser, idUser]

  const conn = await db.connect()
  await conn.query(sql, values)
  conn.end();
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
          WHERE tipo_usuario IN ('Adorador', 'Cantor', 'Músico')
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
    const sql = "UPDATE usuarios SET id_grupo = ?, tipo_usuario = 'Componente' WHERE id_usuario = ? AND (tipo_usuario = 'Adorador' OR tipo_usuario = 'Cantor' OR tipo_usuario = 'Músico')";
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
    const sql = "UPDATE usuarios SET tipo_usuario = 'Adorador', id_grupo = ? WHERE id_usuario = ? AND tipo_usuario = 'Componente'";
    const values = [id_grupo, idUser];
    await conn.query(sql, values);
    conn.end();
  } catch (error) {
    console.error('Erro ao remover componente:', error);
    throw error; 
  }
};


export default {createUser, updateUser, deleteUser};
