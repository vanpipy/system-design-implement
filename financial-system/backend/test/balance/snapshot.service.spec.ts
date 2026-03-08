import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotService } from '../../src/balance/snapshot.service';

describe('SnapshotService', () => {
  let service: SnapshotService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapshotService,
        {
          provide: 'PrismaService',
          useValue: {
            balanceSnapshot: {
              findMany,
            },
          },
        },
      ],
    })
      .useMocker((token) => {
        if (typeof token === 'function' && token.name === 'PrismaService') {
          return {
            balanceSnapshot: {
              findMany,
            },
          };
        }
        return undefined;
      })
      .compile();

    service = module.get<SnapshotService>(SnapshotService);
  });

  it('should return empty array when no filters provided', async () => {
    const res = await service.querySnapshots({});
    expect(res).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('should map fields when querying by requestId', async () => {
    const createdAt = new Date('2026-03-07T10:00:00Z');
    const accountingDate = new Date('2026-03-07T00:00:00Z');
    findMany.mockResolvedValue([
      {
        id: 1,
        requestId: 'REQ-X',
        accountId: 'ACC-1',
        accountType: 'CASH',
        currency: 'CNY',
        beforeBalance: { toFixed: () => '100.00' },
        afterBalance: { toFixed: () => '120.00' },
        status: 'SUCCESS',
        accountingDate,
        createdAt,
      },
    ]);

    const res = await service.querySnapshots({ requestId: 'REQ-X' });
    expect(findMany).toHaveBeenCalled();
    expect(res).toEqual([
      {
        snapshotId: 1,
        requestId: 'REQ-X',
        accountId: 'ACC-1',
        accountType: 'CASH',
        currency: 'CNY',
        beforeBalance: '100.00',
        afterBalance: '120.00',
        status: 'SUCCESS',
        accountingDate: '2026-03-07',
        createdAt: createdAt.toISOString(),
      },
    ]);
  });
});
