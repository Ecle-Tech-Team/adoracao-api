import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import db from '../repository/connection.js';

function refreshDays() {
  const configured = Number(process.env.REFRESH_TOKEN_DAYS);
  return Number.isFinite(configured) && configured > 0 ? configured : 30;
}

function replayGraceSeconds() {
  const configured = Number(process.env.REFRESH_REPLAY_GRACE_SECONDS);
  return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 30) : 10;
}
const digest = token => createHash('sha256').update(token).digest('hex');
const newRefresh = sessionId => `${sessionId}.${randomBytes(32).toString('base64url')}`;

export async function getUserById(id) {
  const conn = await db.connect();
  try {
    const [rows] = await conn.query('SELECT id_usuario, nome, email, tipo_usuario, id_grupo, id_igreja FROM usuarios WHERE id_usuario = ?', [id]);
    return rows[0] || null;
  } finally { await conn.end(); }
}

export async function getActiveSession(sessionId, userId) {
  const conn = await db.connect();
  try {
    const [rows] = await conn.query(
      'SELECT id FROM auth_sessions WHERE id = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > NOW()',
      [sessionId, userId]
    );
    return rows[0] || null;
  } finally { await conn.end(); }
}

export async function createSession(userId, { persistent = true } = {}) {
  const id = randomUUID();
  const refreshToken = newRefresh(id);
  const conn = await db.connect();
  try {
    await conn.query(
      'INSERT INTO auth_sessions (id, user_id, refresh_hash, persistent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))',
      [id, userId, digest(refreshToken), persistent ? 1 : 0, refreshDays()]
    );
    return { id, refreshToken, persistent: Boolean(persistent) };
  } finally { await conn.end(); }
}

export async function rotateRefresh(refreshToken) {
  if (typeof refreshToken !== 'string' || !/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/.test(refreshToken)) return null;
  const id = refreshToken.slice(0, 36);
  const conn = await db.connect();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT user_id, refresh_hash, previous_refresh_hash, previous_refresh_valid_until, persistent, expires_at, revoked_at FROM auth_sessions WHERE id = ? FOR UPDATE',
      [id]
    );
    const session = rows[0];
    if (!session || session.revoked_at || new Date(session.expires_at) <= new Date()) {
      await conn.rollback();
      return null;
    }
    const supplied = Buffer.from(digest(refreshToken), 'hex');
    const expected = Buffer.from(session.refresh_hash, 'hex');
    const previous = session.previous_refresh_hash && Buffer.from(session.previous_refresh_hash, 'hex');
    const isCurrent = expected.length === supplied.length && timingSafeEqual(expected, supplied);
    const isImmediateReplay = previous
      && previous.length === supplied.length
      && new Date(session.previous_refresh_valid_until) > new Date()
      && timingSafeEqual(previous, supplied);
    // One adjacent request may still present the token that just rotated (for example, two tabs).
    // It receives only a new access token; any older token, or this token after the short grace period, revokes the session.
    if (!isCurrent && !isImmediateReplay) {
      await conn.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE id = ?', [id]);
      await conn.commit();
      return null;
    }
    if (isImmediateReplay) {
      await conn.commit();
      return { id, userId: session.user_id, persistent: Boolean(session.persistent) };
    }
    const nextToken = newRefresh(id);
    await conn.query(
      'UPDATE auth_sessions SET refresh_hash = ?, previous_refresh_hash = ?, previous_refresh_valid_until = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE id = ?',
      [digest(nextToken), session.refresh_hash, replayGraceSeconds(), id]
    );
    await conn.commit();
    return { id, userId: session.user_id, refreshToken: nextToken, persistent: Boolean(session.persistent) };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { await conn.end(); }
}

export async function revokeRefreshToken(refreshToken) {
  if (typeof refreshToken !== 'string' || !/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/.test(refreshToken)) return false;
  const id = refreshToken.slice(0, 36);
  const supplied = Buffer.from(digest(refreshToken), 'hex');
  const conn = await db.connect();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT refresh_hash, previous_refresh_hash, previous_refresh_valid_until FROM auth_sessions WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW() FOR UPDATE',
      [id]
    );
    const session = rows[0];
    const expected = session && Buffer.from(session.refresh_hash, 'hex');
    const previous = session?.previous_refresh_hash && Buffer.from(session.previous_refresh_hash, 'hex');
    const matchesCurrent = expected && expected.length === supplied.length && timingSafeEqual(expected, supplied);
    const matchesImmediateReplay = previous
      && previous.length === supplied.length
      && new Date(session.previous_refresh_valid_until) > new Date()
      && timingSafeEqual(previous, supplied);
    if (!matchesCurrent && !matchesImmediateReplay) {
      await conn.rollback();
      return false;
    }
    await conn.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE id = ?', [id]);
    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { await conn.end(); }
}

export async function revokeSession(sessionId, userId) {
  const conn = await db.connect();
  try { await conn.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE id = ? AND user_id = ?', [sessionId, userId]); }
  finally { await conn.end(); }
}

export async function revokeAllSessions(userId) {
  const conn = await db.connect();
  try { await conn.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [userId]); }
  finally { await conn.end(); }
}
