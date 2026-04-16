import { Pool } from 'pg';

declare global {
  var __honghongPool: Pool | undefined;
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!global.__honghongPool) {
    global.__honghongPool = new Pool({
      connectionString,
      max: 10,
      ssl: connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return global.__honghongPool;
}
