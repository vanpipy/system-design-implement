declare module '../../generated/prisma/client' {
  export namespace Prisma {
    export type TransactionClient = any;
    export type BatchPayload = { count: number };
    export type IdempotencyRecordDeleteManyArgs = any;
  }
  export class PrismaClient {
    accountBalance: any;
    balanceTransaction: any;
    balanceSnapshot: any;
    idempotencyRecord: any;
    $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
  }
  export { PrismaClient as PrismaClientDefault, Prisma as PrismaDefault };
}

declare module '../../generated/prisma-sqlite/client' {
  export namespace Prisma {
    export type TransactionClient = any;
    export type BatchPayload = { count: number };
    export type IdempotencyRecordDeleteManyArgs = any;
  }
  export class PrismaClient {
    accountBalance: any;
    balanceTransaction: any;
    balanceSnapshot: any;
    idempotencyRecord: any;
    $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
  }
  export { PrismaClient as PrismaClientDefault, Prisma as PrismaDefault };
}
