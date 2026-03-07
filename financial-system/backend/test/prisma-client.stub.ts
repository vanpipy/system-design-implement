export class PrismaClient {
  $transaction<T>(
    fn: (tx: {
      $executeRawUnsafe: (...args: unknown[]) => Promise<void>;
    }) => Promise<T>,
  ): Promise<T> {
    const tx = {
      $executeRawUnsafe: () => Promise.resolve(),
    };
    return fn(tx);
  }

  accountBalance = {
    findUnique: () => Promise.resolve(null),
    update: () => Promise.resolve(null),
  };

  balanceTransaction = {
    create: () => Promise.resolve(null),
  };

  idempotencyRecord = {
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve(null),
    update: () => Promise.resolve(null),
  };
}
