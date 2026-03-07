export class PrismaClient {
  private accountBalanceData = new Map<string, any>();
  private accountBalanceId = 1;

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
    findUnique: (args?: any) => {
      if (!args || !args.where || !args.where.uk_account_balance_account) {
        return Promise.resolve(null);
      }
      const keyObj = args.where.uk_account_balance_account;
      const key = `${keyObj.accountId}|${keyObj.accountType}|${keyObj.currency}`;
      return Promise.resolve(this.accountBalanceData.get(key) ?? null);
    },
    update: (args: any) => {
      const id = args?.where?.id;
      if (typeof id !== 'number') {
        return Promise.resolve(null);
      }
      let targetKey: string | null = null;
      for (const [key, value] of this.accountBalanceData.entries()) {
        if (value.id === id) {
          targetKey = key;
          break;
        }
      }
      if (!targetKey) {
        return Promise.resolve(null);
      }
      const existing = this.accountBalanceData.get(targetKey);
      const data = args.data ?? {};
      const updated = {
        ...existing,
        ...data,
        updatedAt: data.updatedAt ?? existing.updatedAt ?? new Date(),
      };
      this.accountBalanceData.set(targetKey, updated);
      return Promise.resolve(updated);
    },
    create: (args: any) => {
      const data = args?.data ?? args ?? {};
      const key = `${data.accountId}|${data.accountType}|${data.currency}`;
      const record = {
        id: this.accountBalanceId++,
        accountId: data.accountId,
        accountType: data.accountType,
        currency: data.currency,
        balance: data.balance ?? '0.00',
        frozenBalance: data.frozenBalance ?? '0.00',
        totalBalance: data.totalBalance ?? data.balance ?? '0.00',
        minBalance: data.minBalance ?? '0.00',
        status: data.status ?? 'ACTIVE',
        allowNegative: data.allowNegative ?? false,
        version: data.version ?? 0,
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
      };
      this.accountBalanceData.set(key, record);
      return Promise.resolve(record);
    },
  };

  balanceTransaction = {
    create: () => Promise.resolve(null),
  };

  balanceSnapshot = {
    create: () => Promise.resolve(null),
  };

  idempotencyRecord = {
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve(null),
    update: () => Promise.resolve(null),
  };
}
