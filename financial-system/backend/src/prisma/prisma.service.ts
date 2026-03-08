import { Injectable } from '@nestjs/common';
import type { PrismaClient as PgPrismaClient } from 'root/generated/prisma/client';
import { createRequire } from 'module';

@Injectable()
export class PrismaService {
  private readonly client: PgPrismaClient;

  constructor() {
    const req = createRequire(__filename);
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
      const { PrismaClient } = req('root/generated/prisma-sqlite/client');
      this.client = new (PrismaClient as unknown as {
        new (): PgPrismaClient;
      })();
    } else {
      const { PrismaClient } = req('root/generated/prisma/client');
      this.client = new (PrismaClient as unknown as {
        new (): PgPrismaClient;
      })();
    }
  }

  get accountBalance(): PgPrismaClient['accountBalance'] {
    return this.client.accountBalance;
  }
  get balanceTransaction(): PgPrismaClient['balanceTransaction'] {
    return this.client.balanceTransaction;
  }
  get balanceSnapshot(): PgPrismaClient['balanceSnapshot'] {
    return this.client.balanceSnapshot;
  }
  get idempotencyRecord(): PgPrismaClient['idempotencyRecord'] {
    return this.client.idempotencyRecord;
  }

  $transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return (
      this.client as unknown as {
        $transaction: (cb: (tx: unknown) => Promise<T>) => Promise<T>;
      }
    ).$transaction(fn);
  }
}
