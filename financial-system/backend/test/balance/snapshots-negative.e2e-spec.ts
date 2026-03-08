import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('GET /balances/snapshots negative cases (e2e)', () => {
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

  it('should return 400 when missing both requestId and account triple', async () => {
    const res = await request(http).get('/balances/snapshots');
    expect(res.status).toBe(400);
  });

  it('should return 400 when only part of account triple is provided', async () => {
    const res1 = await request(http)
      .get('/balances/snapshots')
      .query({ accountId: 'ACC-X', accountType: 'CASH' });
    expect(res1.status).toBe(400);

    const res2 = await request(http)
      .get('/balances/snapshots')
      .query({ accountId: 'ACC-X', currency: 'CNY' });
    expect(res2.status).toBe(400);

    const res3 = await request(http)
      .get('/balances/snapshots')
      .query({ accountType: 'CASH', currency: 'CNY' });
    expect(res3.status).toBe(400);
  });
});
