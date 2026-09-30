const cookieName = 'adoracao_refresh';

function refreshCookieDays() {
  const configured = Number(process.env.REFRESH_TOKEN_DAYS);
  return Number.isFinite(configured) && configured > 0 ? configured : 30;
}

export function allowedOrigins() {
  return (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',').map(origin => origin.trim()).filter(Boolean);
}

function cookieOptions(persistent = false) {
  const sameSite = process.env.REFRESH_COOKIE_SAMESITE || 'lax';
  const secure = process.env.REFRESH_COOKIE_SECURE === 'true' || sameSite.toLowerCase() === 'none';
  const options = { httpOnly: true, secure, sameSite, path: '/auth' };
  if (persistent) options.maxAge = refreshCookieDays() * 24 * 60 * 60 * 1000;
  return options;
}

export function setRefreshCookie(res, token, persistent) { res.cookie(cookieName, token, cookieOptions(persistent)); }
export function clearRefreshCookie(res) { res.clearCookie(cookieName, cookieOptions()); }
export function getRefreshCookie(req) {
  const cookie = req.get('Cookie') || '';
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`));
  if (!value) return null;
  try { return decodeURIComponent(value.slice(cookieName.length + 1)); }
  catch { return null; }
}

export function requireTrustedOrigin(req, res, next) {
  if (getRefreshCookie(req) && !allowedOrigins().includes(req.get('Origin'))) {
    return res.status(403).json({ message: 'Origem não permitida.' });
  }
  return next();
}
