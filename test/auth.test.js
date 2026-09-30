import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters-long';

const { ACCESS_SECONDS, generateToken, verifyAccessToken } = await import('../src/helpers/userFeatures.js');
const { hashPassword, verifyPassword } = await import('../src/services/passwords.js');
const { setRefreshCookie } = await import('../src/helpers/authCookies.js');

test('access tokens have the required claims and a 15 minute lifetime', () => {
  const token = generateToken(42, '5d7bc4dc-7a85-4ea0-a9e8-15ae82ce8a7e');
  const claims = jwt.decode(token);

  assert.equal(claims.sub, '42');
  assert.equal(claims.sid, '5d7bc4dc-7a85-4ea0-a9e8-15ae82ce8a7e');
  assert.equal(claims.iss, 'adoracao-api');
  assert.equal(claims.aud, 'adoracao-clients');
  assert.equal(claims.typ, 'access');
  assert.equal(claims.exp - claims.iat, ACCESS_SECONDS);
  assert.equal(verifyAccessToken(token).sub, '42');
});

test('password verification accepts scrypt hashes and identifies legacy plaintext', async () => {
  const hashed = await hashPassword('correct horse battery staple');
  assert.match(hashed, /^scrypt\$/);
  assert.deepEqual(await verifyPassword('correct horse battery staple', hashed), { valid: true, legacy: false });
  assert.deepEqual(await verifyPassword('incorrect', hashed), { valid: false, legacy: false });
  assert.deepEqual(await verifyPassword('legacy-password', 'legacy-password'), { valid: true, legacy: true });
});

test('web refresh cookies are session-only unless remember-me is enabled', () => {
  const cookies = [];
  const response = { cookie: (...args) => cookies.push(args) };

  setRefreshCookie(response, 'session-token', false);
  setRefreshCookie(response, 'persistent-token', true);

  assert.equal(cookies[0][2].httpOnly, true);
  assert.equal(cookies[0][2].maxAge, undefined);
  assert.ok(cookies[1][2].maxAge > 0);
});
