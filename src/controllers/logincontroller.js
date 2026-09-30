import express from 'express';
import { loginUser } from '../services/loginservices.js';
import { createSession } from '../services/authservices.js';
import { generateToken, ACCESS_SECONDS } from '../helpers/userFeatures.js';
import { setRefreshCookie } from '../helpers/authCookies.js';

const route = express.Router();

route.post('/', async (req, res, next) => {
  try {
    const user = await loginUser(req.body?.email, req.body?.password);
    if (!user) return res.status(401).json({ message: 'Login incorreto' });
    const clientType = req.body?.clientType === 'mobile' ? 'mobile' : 'web';
    const persistent = clientType === 'mobile' || req.body?.rememberMe === true;
    const session = await createSession(user.id_usuario, { persistent });
    const token = generateToken(user.id_usuario, session.id);
    if (clientType === 'web') setRefreshCookie(res, session.refreshToken, session.persistent);
    return res.status(200).json({
      message: 'Login efeito efeituado com sucesso', token,
      accessToken: token, expiresIn: ACCESS_SECONDS,
      id_user: user.id_usuario, userType: user.tipo_usuario,
      id_grupo: user.id_grupo ?? null,
      id_igreja: user.id_igreja ?? null,
      user,
      ...(clientType === 'mobile' ? { refreshToken: session.refreshToken } : {}),
    });
  } catch (error) { return next(error); }
});

export default route;
