import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('POST /balances negative cases (e2e)', () => {
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

  it('should return 400 when accounts is missing', async () => {
    const res = await request(http).post('/balances').send({});
    expect(res.status).toBe(400);
  });

  it('should return 400 when accounts is empty', async () => {
    const res = await request(http).post('/balances').send({ accounts: [] });
    expect(res.status).toBe(400);
  });

  it('should return 400 when any item missing required fields', async () => {
    const res = await request(http)
      .post('/balances')
      .send({ accounts: [{ accountId: 'ACC-X', accountType: 'CASH' }] });
    expect(res.status).toBe(400);
  });
});
