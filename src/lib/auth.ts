import { cookies } from 'next/headers';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getDb } from '@/lib/db';

const SESSION_COOKIE_NAME = 'honghong_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface AuthUser {
  id: number;
  email: string;
}

interface SessionPayload {
  userId: number;
  email: string;
  exp: number;
}

export async function ensureUsersTable() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHash] = storedHash.split(':');

  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
}

export async function createUser(email: string, password: string) {
  await ensureUsersTable();

  const db = getDb();
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = hashPassword(password);

  const result = await db.query<{ id: number; email: string }>(
    `
      INSERT INTO app_users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email
    `,
    [normalizedEmail, passwordHash]
  );

  return result.rows[0];
}

export async function findUserByEmail(email: string) {
  await ensureUsersTable();

  const db = getDb();
  const result = await db.query<{
    id: number;
    email: string;
    password_hash: string;
  }>(
    `
      SELECT id, email, password_hash
      FROM app_users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)]
  );

  return result.rows[0] ?? null;
}

export async function getCurrentUser() {
  const payload = await readSession();

  if (!payload) {
    return null;
  }

  return {
    id: payload.userId,
    email: payload.email,
  } satisfies AuthUser;
}

export async function createSession(user: AuthUser) {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signSession(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  return verifySession(raw);
}

function signSession(payload: SessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

function verifySession(value: string) {
  const [encodedPayload, signature] = value.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as SessionPayload;

    if (!payload.userId || !payload.email || payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getSessionSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.ARK_API_KEY ||
    process.env.DATABASE_URL ||
    'honghong-dev-session-secret'
  );
}
