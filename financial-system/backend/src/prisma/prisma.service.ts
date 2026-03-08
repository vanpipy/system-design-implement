import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService extends ((): any => {
  if (!process.env.DATABASE_URL) {
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || '5432';
    const db = process.env.PGDATABASE;
    const user = process.env.PGUSER;
    const pass = process.env.PGPASSWORD;
    const schema = process.env.PGSCHEMA || 'public';
    if (host && db && user && pass) {
      const u = encodeURIComponent(user);
      const p = encodeURIComponent(pass);
      process.env.DATABASE_URL = `postgresql://${u}:${p}@${host}:${port}/${db}?schema=${schema}`;
    }
  }
  const url = process.env.DATABASE_URL ?? '';
  const useSqlite = url.startsWith('file:');
  if (useSqlite) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('../../generated/prisma-sqlite/client');
    return PrismaClient;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('../../generated/prisma/client');
  return PrismaClient;
})() {}
