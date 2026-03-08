class DecimalLike {
  private readonly value: number;

  constructor(value: string | number) {
    this.value = typeof value === 'number' ? value : Number(value);
  }

  toFixed(dp: number) {
    return this.value.toFixed(dp);
  }

  toString() {
    return this.value.toString();
  }
}

export class PrismaClient {
  private accountBalanceData = new Map<string, any>();
  private accountBalanceId = 1;
  private balanceTransactionData: any[] = [];
  private balanceSnapshotData: any[] = [];
  private balanceSnapshotId = 1;

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
    create: (args: any) => {
      const data = args?.data ?? args ?? {};
      const record = {
        ...data,
        amount: new DecimalLike(data.amount ?? 0),
        beforeBalance: new DecimalLike(data.beforeBalance ?? 0),
        afterBalance: new DecimalLike(data.afterBalance ?? 0),
        transactionTime: data.transactionTime ?? new Date(),
        accountingDate: data.accountingDate ?? new Date(),
      };
      this.balanceTransactionData.push(record);
      return Promise.resolve(record);
    },
    findMany: (args?: any) => {
      const where = args?.where ?? {};
      let results = this.balanceTransactionData.slice();

      if (where.accountId) {
        results = results.filter((tx) => tx.accountId === where.accountId);
      }

      if (where.accountType) {
        results = results.filter((tx) => tx.accountType === where.accountType);
      }

      if (where.currency) {
        results = results.filter((tx) => tx.currency === where.currency);
      }

      if (where.businessRefNo) {
        results = results.filter(
          (tx) => tx.businessRefNo === where.businessRefNo,
        );
      }

      if (where.transactionTime) {
        const range = where.transactionTime as {
          gte?: Date;
          lte?: Date;
        };
        if (range.gte) {
          results = results.filter(
            (tx) => tx.transactionTime >= Number(range.gte),
          );
        }
        if (range.lte) {
          results = results.filter(
            (tx) => tx.transactionTime <= Number(range.lte),
          );
        }
      }

      return Promise.resolve(results);
    },
  };

  balanceSnapshot = {
    create: (args: any) => {
      const data = args?.data ?? args ?? {};
      const record = {
        id: this.balanceSnapshotId++,
        accountId: data.accountId,
        accountType: data.accountType,
        currency: data.currency,
        requestId: data.requestId,
        beforeBalance: new DecimalLike(data.beforeBalance ?? 0),
        afterBalance: new DecimalLike(data.afterBalance ?? 0),
        status: data.status ?? 'SUCCESS',
        accountingDate: data.accountingDate ?? new Date(),
        createdAt: data.createdAt ?? new Date(),
        metadata: data.metadata ?? null,
      };
      this.balanceSnapshotData.push(record);
      return Promise.resolve(record);
    },
    findMany: (args?: any) => {
      const where = args?.where ?? {};
      let results = this.balanceSnapshotData.slice();

      if (where.requestId) {
        results = results.filter(
          (snapshot) => snapshot.requestId === where.requestId,
        );
      }

      if (where.accountId) {
        results = results.filter(
          (snapshot) => snapshot.accountId === where.accountId,
        );
      }

      if (where.accountType) {
        results = results.filter(
          (snapshot) => snapshot.accountType === where.accountType,
        );
      }

      if (where.currency) {
        results = results.filter(
          (snapshot) => snapshot.currency === where.currency,
        );
      }

      if (where.accountingDate) {
        const range = where.accountingDate as {
          gte?: Date;
          lte?: Date;
        };
        if (range.gte) {
          results = results.filter(
            (snapshot) => snapshot.accountingDate >= Number(range.gte),
          );
        }
        if (range.lte) {
          results = results.filter(
            (snapshot) => snapshot.accountingDate <= Number(range.lte),
          );
        }
      }

      return Promise.resolve(results);
    },
  };

  idempotencyRecord = {
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve(null),
    update: () => Promise.resolve(null),
  };
}
