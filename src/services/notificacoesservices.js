import db from '../repository/connection.js';

/**
 * 📢 Notificação global
 */
async function criarNotificacaoGlobal(titulo, mensagem) {
  const conn = await db.connect();

  try {
    const sql = `
      INSERT INTO notificacoes (titulo, mensagem, tipo)
      VALUES (?, ?, 'GLOBAL')
    `;
    await conn.query(sql, [titulo, mensagem]);
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

/**
 * 🤝 Convite para grupo
 */
async function criarConviteGrupo(id_usuario, id_grupo) {
  const conn = await db.connect();

  try {
    const sql = `
      INSERT INTO notificacoes (id_usuario, id_grupo, tipo, titulo, mensagem)
      VALUES (?, ?, 'CONVITE', 'Convite para grupo', 'Você foi convidado para participar de um grupo.')
    `;
    await conn.query(sql, [id_usuario, id_grupo]);
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

/**
 * 📅 Notificação para grupo (evento / ensaio)
 */
async function criarNotificacaoGrupo(id_grupo, tipo, titulo, mensagem, referencia_id = null) {
  const conn = await db.connect();

  try {
    const [usuarios] = await conn.query(
      "SELECT id_usuario FROM usuarios WHERE id_grupo = ?",
      [id_grupo]
    );

    for (const user of usuarios) {
      const sql = `
        INSERT INTO notificacoes 
        (id_usuario, id_grupo, tipo, titulo, mensagem, referencia_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await conn.query(sql, [
        user.id_usuario,
        id_grupo,
        tipo,
        titulo,
        mensagem,
        referencia_id
      ]);
    }
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

/**
 * 🔔 Listar notificações do usuário
 */
async function listarNotificacoesUsuario(id_user) {
  const conn = await db.connect();

  try {
    const sql = `
      SELECT *
      FROM notificacoes
      WHERE id_usuario = ?
         OR tipo = 'GLOBAL'
      ORDER BY criada_em DESC
    `;

    const [rows] = await conn.query(sql, [id_user]);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

/**
 * ✅ Marcar como lida
 */
async function marcarComoLida(id_notificacao) {
  const conn = await db.connect();

  try {
    const sql = "UPDATE notificacoes SET lida = 1 WHERE id_notificacao = ?";
    await conn.query(sql, [id_notificacao]);
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

/**
 * 🔢 Contar não lidas
 */
async function contarNaoLidas(id_user) {
  const conn = await db.connect();

  try {
    const sql = `
      SELECT COUNT(*) AS total
      FROM notificacoes
      WHERE lida = 0
        AND (id_usuario = ? OR tipo = 'GLOBAL')
    `;
    const [rows] = await conn.query(sql, [id_user]);
    return rows[0].total;
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

export default {
  criarNotificacaoGlobal,
  criarConviteGrupo,
  criarNotificacaoGrupo,
  listarNotificacoesUsuario,
  marcarComoLida,
  contarNaoLidas
};