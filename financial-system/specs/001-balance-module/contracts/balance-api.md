# Balance Module API Contracts

## Base

- Base URL（本地开发，Nest 默认端口）: `http://localhost:3000`  
- 所有接口返回 JSON，使用 HTTP 状态码表达基础成功/失败语义。  

## 1. 提交余额变更请求

- **Endpoint**: `POST /balances/transactions`
- **用途**: 在单个请求中提交多笔交易（加款/扣款），并根据业务规则更新账户余额、生成流水与快照。  

### Request

```json
{
  "requestId": "string",
  "idempotencyKey": "string",
  "account": {
    "accountId": "string",
    "accountType": "CASH",
    "currency": "CNY"
  },
  "transactions": [
    {
      "transactionType": "PAYMENT",
      "direction": "DEBIT",
      "amount": "100.00",
      "businessRefNo": "ORDER_123",
      "oppositeAccount": "MERCHANT_001",
      "oppositeAccountType": "MERCHANT"
    }
  ]
}
```

关键字段说明:

- `requestId`: 上游生成的请求标识，用于全链路追踪。  
- `idempotencyKey`: 幂等键，在账户维度内唯一，重复请求需返回相同结果。  
- `account`: 指定被操作账户。  
- `transactions`: 单请求内的交易列表，按数组顺序依次处理。  

### Response

成功示例:

```json
{
  "requestId": "string",
  "status": "SUCCESS",
  "account": {
    "accountId": "string",
    "accountType": "CASH",
    "currency": "CNY",
    "beforeBalance": "1000.00",
    "afterBalance": "900.00"
  },
  "transactions": [
    {
      "transactionNo": "TX20260307-0001",
      "transactionType": "PAYMENT",
      "direction": "DEBIT",
      "amount": "100.00",
      "beforeBalance": "1000.00",
      "afterBalance": "900.00",
      "businessRefNo": "ORDER_123",
      "status": "SUCCESS"
    }
  ]
}
```

失败示例（超扣）:

```json
{
  "requestId": "string",
  "status": "REJECTED",
  "errorCode": "INSUFFICIENT_FUNDS",
  "errorMessage": "Balance would drop below allowed minimum",
  "account": {
    "accountId": "string",
    "accountType": "CASH",
    "currency": "CNY",
    "beforeBalance": "50.00",
    "afterBalance": "50.00"
  }
}
```

## 2. 查询余额

- **Endpoint**: `GET /balances`
- **用途**: 查询单个账户当前余额信息。  

### Request (query)

- `accountId` (required)  
- `accountType` (required)  
- `currency` (required)  

### Response

```json
{
  "accountId": "string",
  "accountType": "CASH",
  "currency": "CNY",
  "balance": "900.00",
  "frozenBalance": "0.00",
  "totalBalance": "900.00",
  "status": "ACTIVE",
  "allowNegative": false
}
```

## 3. 查询交易快照

- **Endpoint**: `GET /balances/snapshots`
- **用途**: 按请求标识或账户+时间范围查询余额快照，用于审计与问题排查。  

### Request (query)

任选其一或组合:

- `requestId`  
- `accountId`, `accountType`, `currency`, `from`, `to`（时间范围，ISO8601 字符串）  

### Response

```json
{
  "items": [
    {
      "snapshotId": 1,
      "requestId": "string",
      "accountId": "string",
      "accountType": "CASH",
      "currency": "CNY",
      "beforeBalance": "1000.00",
      "afterBalance": "900.00",
      "status": "SUCCESS",
      "accountingDate": "2026-03-07",
      "createdAt": "2026-03-07T10:00:00Z"
    }
  ]
}
```

## 4. 查询交易流水

- **Endpoint**: `GET /balances/transactions`
- **用途**: 按账户和时间范围查询交易流水明细。  

### Request (query)

- `accountId` (required)  
- `accountType` (required)  
- `currency` (required)  
- `from` (optional)  
- `to` (optional)  
- `businessRefNo` (optional)  

### Response

```json
{
  "items": [
    {
      "transactionNo": "TX20260307-0001",
      "requestId": "string",
      "batchId": "BATCH_001",
      "transactionType": "PAYMENT",
      "direction": "DEBIT",
      "amount": "100.00",
      "beforeBalance": "1000.00",
      "afterBalance": "900.00",
      "status": "SUCCESS",
      "businessRefNo": "ORDER_123",
      "transactionTime": "2026-03-07T10:00:00Z",
      "accountingDate": "2026-03-07"
    }
  ]
}
```

