import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('GET /balances negative cases (e2e)', () => {
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

  it('should return 400 when all query params are missing', async () => {
    const res = await request(http).get('/balances');
    expect(res.status).toBe(400);
  });

  it('should return 400 when only accountId is provided', async () => {
    const res = await request(http)
      .get('/balances')
      .query({ accountId: 'ACC-X' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when accountId and accountType are provided without currency', async () => {
    const res = await request(http)
      .get('/balances')
      .query({ accountId: 'ACC-X', accountType: 'CASH' });
    expect(res.status).toBe(400);
  });

  it('should return 404 when account triple is provided but account does not exist', async () => {
    const res = await request(http)
      .get('/balances')
      .query({ accountId: 'NON-EXIST', accountType: 'CASH', currency: 'CNY' });
    expect(res.status).toBe(404);
  });
});
