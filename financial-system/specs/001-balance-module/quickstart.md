# Balance Module Quickstart

## 环境准备

- 在 backend 目录创建 `.env`，配置数据库连接：

```bash
DATABASE_URL="file:./dev.db"
```

- 执行 Prisma 迁移与生成：

```bash
cd backend
npx prisma migrate dev --name init_balance_models
npx prisma generate
```

## 启动服务

```bash
cd backend
npm install
npm run start:dev
```

服务默认监听 `http://localhost:3000`。

## 提交交易（加款/扣款）

```bash
curl -X POST http://localhost:3000/balances/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ-QUICKSTART-1",
    "idempotencyKey": "IDEMP-QUICKSTART-1",
    "account": { "accountId": "ACC-QS-1", "accountType": "CASH", "currency": "CNY" },
    "transactions": [
      { "transactionType": "DEPOSIT", "direction": "CREDIT", "amount": "100.00" }
    ]
  }'
```

## 批量查询余额（POST /balances）

```bash
curl -X POST http://localhost:3000/balances \
  -H "Content-Type: application/json" \
  -d '{
    "accounts": [
      { "accountId": "ACC-QS-1", "accountType": "CASH", "currency": "CNY" },
      { "accountId": "ACC-NOT-EXIST", "accountType": "CASH", "currency": "CNY" }
    ]
  }'
```

响应示例：

```json
{
  "items": [
    {
      "accountId": "ACC-QS-1",
      "accountType": "CASH",
      "currency": "CNY",
      "balance": "100.00",
      "frozenBalance": "0.00",
      "totalBalance": "100.00",
      "status": "ACTIVE",
      "allowNegative": false
    },
    {
      "accountId": "ACC-NOT-EXIST",
      "accountType": "CASH",
      "currency": "CNY",
      "status": "NOT_FOUND"
    }
  ]
}
```

## 查询交易快照/流水

- 快照：

```bash
curl "http://localhost:3000/balances/snapshots?requestId=REQ-QUICKSTART-1"
```

- 流水：

```bash
curl "http://localhost:3000/balances/transactions?accountId=ACC-QS-1&accountType=CASH&currency=CNY"
```

