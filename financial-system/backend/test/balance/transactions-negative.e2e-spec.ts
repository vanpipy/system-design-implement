import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('GET /balances/transactions negative cases (e2e)', () => {
  let app: INestApplication;
  let http: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    http = app.getHttpServer() as unknown as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 when accountId is missing', async () => {
    const res = await request(http)
      .get('/balances/transactions')
      .query({ accountType: 'CASH', currency: 'CNY' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when accountType is missing', async () => {
    const res = await request(http)
      .get('/balances/transactions')
      .query({ accountId: 'ACC-X', currency: 'CNY' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when currency is missing', async () => {
    const res = await request(http)
      .get('/balances/transactions')
      .query({ accountId: 'ACC-X', accountType: 'CASH' });
    expect(res.status).toBe(400);
  });
});
