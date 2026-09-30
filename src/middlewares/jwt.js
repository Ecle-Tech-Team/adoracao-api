import { verifyAccessToken } from '../helpers/userFeatures.js';
import { getActiveSession } from '../services/authservices.js';

export async function readAccessAuth(req) {
  const header = req.get('Authorization');
  const match = /^Bearer ([^\s]+)$/.exec(header || '');
  if (!match) return null;
  let claims;
  try {
    claims = verifyAccessToken(match[1]);
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name) || error.message === 'Invalid access token') return null;
    throw error;
  }
  const session = await getActiveSession(claims.sid, claims.sub);
  if (!session) return null;
  return { userId: Number(claims.sub), sessionId: claims.sid };
}

export async function verifyJWT(req, res, next) {
  try {
    const auth = await readAccessAuth(req);
    if (!auth) return res.status(401).json({ message: 'Token não informado, inválido ou sessão expirada.' });
    req.auth = auth;
    return next();
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name) || error.message === 'Invalid access token') {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
    return next(error);
  }
}
