import db from '../repository/connection.js';
import { getUserById } from '../services/authservices.js';

export function requireSelf(getId) {
  return (req, res, next) => {
    if (Number(getId(req)) !== req.auth?.userId) return res.status(403).json({ message: 'Acesso negado.' });
    return next();
  };
}

export async function requireRegente(req, res, next) {
  try {
    const user = await getUserById(req.auth.userId);
    if (user?.tipo_usuario !== 'Regente') return res.status(403).json({ message: 'Acesso negado.' });
    return next();
  } catch (error) { return next(error); }
}

export function requireGroupLeader(getGroupId) {
  return async (req, res, next) => {
    const conn = await db.connect();
    try {
      const [rows] = await conn.query(
        'SELECT g.id FROM grupo g JOIN regentes r ON r.regente_id = g.regente_id WHERE g.id = ? AND r.usuario_id = ?',
        [getGroupId(req), req.auth.userId]
      );
      if (!rows.length) return res.status(403).json({ message: 'Acesso negado.' });
      return next();
    } catch (error) { return next(error); }
    finally { await conn.end(); }
  };
}

export function requireGroupMember(getGroupId) {
  return async (req, res, next) => {
    const conn = await db.connect();
    try {
      const [rows] = await conn.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND id_grupo = ?', [req.auth.userId, getGroupId(req)]);
      if (rows.length) return next();
      const [leaders] = await conn.query(
        'SELECT g.id FROM grupo g JOIN regentes r ON r.regente_id = g.regente_id WHERE g.id = ? AND r.usuario_id = ?',
        [getGroupId(req), req.auth.userId]
      );
      if (!leaders.length) return res.status(403).json({ message: 'Acesso negado.' });
      return next();
    } catch (error) { return next(error); }
    finally { await conn.end(); }
  };
}

export async function authorizeComponentRemoval(req, res, next) {
  const targetUserId = Number(req.params.idUser);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) return res.status(400).json({ message: 'Usuário inválido.' });
  const conn = await db.connect();
  try {
    const [users] = await conn.query("SELECT id_usuario, id_grupo, tipo_usuario FROM usuarios WHERE id_usuario = ?", [targetUserId]);
    const target = users[0];
    if (!target || target.tipo_usuario !== 'Componente' || target.id_grupo == null) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    if (targetUserId === req.auth.userId) {
      req.componentGroupId = target.id_grupo;
      return next();
    }
    const [leaders] = await conn.query(
      'SELECT g.id FROM grupo g JOIN regentes r ON r.regente_id = g.regente_id WHERE g.id = ? AND r.usuario_id = ?',
      [target.id_grupo, req.auth.userId]
    );
    if (!leaders.length) return res.status(403).json({ message: 'Acesso negado.' });
    req.componentGroupId = target.id_grupo;
    return next();
  } catch (error) { return next(error); }
  finally { await conn.end(); }
}

export function requireResourceLeader(table, getId) {
  if (!['ensaios_grupo', 'eventos_grupo'].includes(table)) throw new Error('Unsupported resource');
  return async (req, res, next) => {
    const conn = await db.connect();
    try {
      const [rows] = await conn.query(
        `SELECT resource.id FROM ${table} resource JOIN grupo g ON g.id = resource.grupo_id JOIN regentes r ON r.regente_id = g.regente_id WHERE resource.id = ? AND r.usuario_id = ?`,
        [getId(req), req.auth.userId]
      );
      if (!rows.length) return res.status(403).json({ message: 'Acesso negado.' });
      return next();
    } catch (error) { return next(error); }
    finally { await conn.end(); }
  };
}
