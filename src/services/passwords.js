import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const parameters = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, parameters);
  return `scrypt$${parameters.N}$${parameters.r}$${parameters.p}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return { valid: false, legacy: false };
  if (!stored.startsWith('scrypt$')) {
    const supplied = Buffer.from(password);
    const saved = Buffer.from(stored);
    return { valid: supplied.length === saved.length && timingSafeEqual(supplied, saved), legacy: true };
  }
  const parts = stored.split('$');
  if (parts.length !== 6) return { valid: false, legacy: false };
  const [, n, r, p, saltText, hashText] = parts;
  if (n !== '16384' || r !== '8' || p !== '1') return { valid: false, legacy: false };
  const expected = Buffer.from(hashText, 'base64url');
  if (expected.length !== 64) return { valid: false, legacy: false };
  const salt = Buffer.from(saltText, 'base64url');
  if (salt.length !== 16) return { valid: false, legacy: false };
  const actual = await scrypt(password, salt, 64, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  return { valid: timingSafeEqual(expected, actual), legacy: false };
}
