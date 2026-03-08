<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
npm install
```

## Local development

### Environment variables

Create a `.env` file in the `backend` 目录，最少包含数据库连接配置:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/financial_system"
```

本地开发可在 PostgreSQL 与 SQLite 间切换，运行时由 `DATABASE_URL` 决定:

- 当 `DATABASE_URL` 以 `file:` 开头时，服务自动使用 SQLite 客户端
- 其它情况使用 PostgreSQL 客户端
- 不需要改业务代码即可切换

修改 provider 后需重新生成 Prisma Client。

### 快速启动（SQLite）

```bash
# 迁移与生成（自动创建 dev.db 并生成 sqlite 客户端）
npm run dev:sqlite:prepare

# 启动（已为你设置 DATABASE_URL=file:./dev.db）
npm run dev:sqlite

# 一键调用验证（任选其一）
npm run verify:quickstart          # PowerShell
npm run verify:quickstart:bat      # CMD
npm run verify:quickstart:sh       # Bash（Linux/macOS）
```

### 快速启动（PostgreSQL）

准备数据库并设置连接串，例如：

```bash
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/financial_system?schema=public"
```

然后执行迁移与启动：

```bash
# 同步数据库结构并生成 pg 客户端
npm run dev:pg:prepare

# 启动（确保环境中 DATABASE_URL 指向你的 PostgreSQL 实例）
npm run start:dev
```

你也可以直接：

```bash
# 仅迁移与生成
npm run prisma:migrate:dev:pg
npm run prisma:generate
```

### 手动接口验证示例

提交交易：

```bash
curl -X POST http://localhost:3000/balances/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ-README-1",
    "idempotencyKey": "IDEMP-README-1",
    "account": { "accountId": "ACC-README", "accountType": "CASH", "currency": "CNY" },
    "transactions": [
      { "transactionType": "DEPOSIT", "direction": "CREDIT", "amount": "10.00" }
    ]
  }'
```

批量查询余额（POST /balances）：

```bash
curl -X POST http://localhost:3000/balances \
  -H "Content-Type: application/json" \
  -d '{
    "accounts": [
      { "accountId": "ACC-README", "accountType": "CASH", "currency": "CNY" }
    ]
  }'
```

### Error Codes（Balance）

- INVALID_PARAMS：请求缺少必填参数或参数格式不合法
- NOT_FOUND：资源不存在
- INSUFFICIENT_FUNDS：超扣策略触发导致请求被拒绝
- INTERNAL_ERROR：服务内部错误

### Prisma migrations

每次调整数据模型后，使用 Prisma 迁移同步数据库结构:

```bash
# PostgreSQL
npm run prisma:migrate:dev:pg
npm run prisma:generate

# SQLite（已拆分独立 schema 与 migrations）
DATABASE_URL="file:./dev.db" npx prisma migrate dev --schema prisma/sqlite/schema.prisma
DATABASE_URL="file:./dev.db" npx prisma generate --schema prisma/sqlite/schema.prisma
```

### 安全建议（数据库连接）

- 避免将包含用户名和密码的完整 `DATABASE_URL` 提交到代码库
- 推荐在本地使用 `.env`（确保 `.env` 已在 `.gitignore`），在 CI/生产使用环境变量注入或机密管理器（Kubernetes Secret、GitHub Actions Secrets、Azure Key Vault 等）
- 支持使用分散变量而不是 URL：
  - `PGHOST`、`PGPORT`、`PGDATABASE`、`PGUSER`、`PGPASSWORD`、`PGSCHEMA`
  - 当未提供 `DATABASE_URL` 时，服务会在启动时根据上述变量自动拼接连接串，无需在磁盘上保存明文 URL
- 日志与错误返回已做敏感信息脱敏，避免泄露凭据

### Start application

```bash
# development
npm run start

# watch mode
npm run start:dev

# production build and start
npm run build
npm run start:prod
```

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Docker

本项目提供 Docker 化运行方式，方便在本地或服务器上以一致环境运行:

```bash
# 在 financial-system 根目录执行
docker compose up -d
```

该命令会启动:

- PostgreSQL 数据库
- Nest.js 应用容器

启动后，默认应用会监听在 `http://localhost:3000`。

如需更新镜像，先重新构建:

```bash
docker compose build
docker compose up -d
```

停止服务:

```bash
docker compose down
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
