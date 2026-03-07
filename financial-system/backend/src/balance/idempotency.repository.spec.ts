import { IdempotencyRepository } from './idempotency.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('IdempotencyRepository', () => {
  let repository: IdempotencyRepository;
  let prisma: PrismaService;
  let findUnique: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;

  beforeEach(() => {
    findUnique = jest.fn();
    create = jest.fn();
    update = jest.fn();

    prisma = {
      idempotencyRecord: {
        findUnique,
        create,
        update,
      },
    } as unknown as PrismaService;

    repository = new IdempotencyRepository(prisma);
  });

  it('should query IdempotencyRecord by composite key', async () => {
    const params = {
      idempotencyKey: 'key',
      requestHash: 'hash',
    };
    const expected = { id: 1 };

    findUnique.mockResolvedValue(expected);

    const result = await repository.findByKeyAndHash(params);

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        uk_idempotency_key_hash: params,
      },
    });
    expect(result).toBe(expected);
  });

  it('should create IdempotencyRecord', async () => {
    const data = { idempotencyKey: 'key', requestHash: 'hash' };

    await repository.create(data as never);

    expect(create).toHaveBeenCalledWith({
      data,
    });
  });

  it('should update IdempotencyRecord by id', async () => {
    const data = { status: 'SUCCESS' };

    await repository.updateById(1, data as never);

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data,
    });
  });
});
