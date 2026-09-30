import express from 'express';
import { ACCESS_SECONDS, generateToken } from '../helpers/userFeatures.js';
import { clearRefreshCookie, getRefreshCookie, requireTrustedOrigin, setRefreshCookie } from '../helpers/authCookies.js';
import { readAccessAuth, verifyJWT } from '../middlewares/jwt.js';
import { getUserById, revokeAllSessions, revokeRefreshToken, revokeSession, rotateRefresh } from '../services/authservices.js';

const route = express.Router();

route.post('/refresh', requireTrustedOrigin, async (req, res, next) => {
  try {
    const fromCookie = getRefreshCookie(req);
    const refreshToken = fromCookie || req.body?.refreshToken;
    const session = await rotateRefresh(refreshToken);
    if (!session) { clearRefreshCookie(res); return res.status(401).json({ message: 'Sessão inválida.' }); }
    const user = await getUserById(session.userId);
    if (!user) { clearRefreshCookie(res); return res.status(401).json({ message: 'Usuário não encontrado.' }); }
    const token = generateToken(user.id_usuario, session.id);
    if (fromCookie && session.refreshToken) setRefreshCookie(res, session.refreshToken, session.persistent);
    return res.json({ token, accessToken: token, expiresIn: ACCESS_SECONDS, user,
      ...(!fromCookie && session.refreshToken ? { refreshToken: session.refreshToken } : {}) });
  } catch (error) { return next(error); }
});

route.post('/logout', requireTrustedOrigin, async (req, res, next) => {
  try {
    const refreshToken = getRefreshCookie(req) || req.body?.refreshToken;
    let revoked = await revokeRefreshToken(refreshToken);
    if (!revoked) {
      const auth = await readAccessAuth(req);
      if (!auth) return res.status(401).json({ message: 'Sessão inválida.' });
      await revokeSession(auth.sessionId, auth.userId);
      revoked = true;
    }
    clearRefreshCookie(res);
    return res.json({ message: 'Sessão encerrada.' });
  } catch (error) { return next(error); }
});

route.post('/logout-all', verifyJWT, requireTrustedOrigin, async (req, res, next) => {
  try {
    await revokeAllSessions(req.auth.userId);
    clearRefreshCookie(res);
    return res.json({ message: 'Todas as sessões foram encerradas.' });
  } catch (error) { return next(error); }
});

route.get('/me', verifyJWT, async (req, res, next) => {
  try {
    const user = await getUserById(req.auth.userId);
    if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });
    return res.json({ user });
  } catch (error) { return next(error); }
});

export default route;
