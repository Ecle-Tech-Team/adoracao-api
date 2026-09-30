import jwt from 'jsonwebtoken';

export const ACCESS_SECONDS = 15 * 60;
const issuer = 'adoracao-api';
const audience = 'adoracao-clients';

function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  return process.env.JWT_SECRET;
}

export function generateToken(userId, sessionId) {
  return jwt.sign({ sid: sessionId, typ: 'access' }, secret(), {
    subject: String(userId), issuer, audience, expiresIn: ACCESS_SECONDS,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, secret(), { issuer, audience, algorithms: ['HS256'] });
  if (payload.typ !== 'access' || !payload.sub || !payload.sid) throw new Error('Invalid access token');
  return payload;
}

export function validateAuthConfig() { secret(); }
