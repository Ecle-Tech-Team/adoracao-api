import db from '../repository/connection.js';

/**
 * 📢 Notificação global
 */
async function criarNotificacaoGlobal(titulo, mensagem) {
  const conn = await db.connect();

  try {
    const [result] = await conn.query(
      `INSERT INTO notificacoes (tipo, titulo, mensagem)
       VALUES ('GLOBAL', ?, ?)`,
      [titulo, mensagem]
    );

    const idNotificacao = result.insertId;

    const [usuarios] = await conn.query(
      `SELECT id_usuario FROM usuarios`
    );

    for (const u of usuarios) {
      await conn.query(
        `INSERT INTO notificacoes_usuarios (id_notificacao, id_usuario)
         VALUES (?, ?)`,
        [idNotificacao, u.id_usuario]
      );
    }
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
async function listarNotificacoesUsuario(id_usuario) {
  const conn = await db.connect();

  try {
    const sql = `
      SELECT 
        n.id_notificacao,
        n.tipo,
        n.titulo,
        n.mensagem,
        n.criada_em,
        nu.lida
      FROM notificacoes n
      JOIN notificacoes_usuarios nu
        ON nu.id_notificacao = n.id_notificacao
      WHERE nu.id_usuario = ?
      ORDER BY n.criada_em DESC
    `;

    const [rows] = await conn.query(sql, [id_usuario]);
    return rows;
  } finally {
    conn.end();
  }
}

/**
 * ✅ Marcar como lida
 */
async function marcarComoLida(id_notificacao, id_usuario) {
  const conn = await db.connect();

  try {
    await conn.query(
      `UPDATE notificacoes_usuarios
       SET lida = 1, lida_em = NOW()
       WHERE id_notificacao = ? AND id_usuario = ?`,
      [id_notificacao, id_usuario]
    );
  } finally {
    conn.end();
  }
}

/**
 * 🔢 Contar não lidas
 */
async function contarNaoLidas(id_usuario) {
  const conn = await db.connect();

  try {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS total
       FROM notificacoes_usuarios
       WHERE id_usuario = ? AND lida = 0`,
      [id_usuario]
    );
    return rows[0].total;
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