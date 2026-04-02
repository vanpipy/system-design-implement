# Data Model: Balance Module (001-balance-module)

## Overview

余额模块围绕四个核心实体展开：AccountBalance、BalanceTransaction、BalanceSnapshot 和 IdempotencyRecord。  
目标是在满足强一致性、防止超扣、并发安全和可审计性的前提下，为上游提供清晰的账户余额与交易服务。

## Entities

### AccountBalance

**表名**: `account_balance`  
**用途**: 记录账户当前余额状态，是余额查询和记账的基础表。  

**字段与约束**:

- `id` (Int, PK, autoincrement)  
- `accountId` (String, VarChar(64))  
- `accountType` (String, VarChar(20), 枚举：`CASH`/`MARGIN`/`FROZEN` 等)  
- `currency` (String, VarChar(3), 约定使用 ISO 4217 代码，如 `CNY`/`USD` 等)  
- `balance` (Decimal(20,4), default 0.0)  
- `frozenBalance` (Decimal(20,4), default 0.0)  
- `totalBalance` (Decimal(20,4), default 0.0)  
- `minBalance` (Decimal(20,4), default 0.0)  
- `status` (String, VarChar(20), default "ACTIVE", 枚举：`ACTIVE`/`FROZEN`/`CLOSED` 等)  
- `allowNegative` (Boolean, default false)  
- `version` (Int, default 0)  
- `createdAt` (DateTime, default now)  
- `updatedAt` (DateTime, updatedAt)  

**索引与唯一约束**:

- 唯一约束：`(accountId, accountType, currency)`  
- 索引：  
  - `(accountId, accountType, currency)`  
  - `(status)`  

**关键规则**:

- 同一账户维度只允许一条记录。  
- 所有余额变更必须通过 BalanceTransaction 间接完成，不允许直接手工修改 balance。  
- `minBalance` 与 `allowNegative` 用于实现防止超扣的业务约束。  
- `version` 提供乐观锁或审计计数能力，即便默认采用悲观锁，也保留该字段用于冲突检测和追踪。  

### BalanceTransaction

**表名**: `transaction_journal`  
**用途**: 记录每一次余额变更，是审计和重放的主数据来源。  

**字段与约束**:

- `id` (Int, PK, autoincrement)  
- `transactionNo` (String, VarChar(64))  
- `idempotencyKey` (String?, VarChar(128))  
- `requestId` (String, VarChar(64))  
- `batchId` (String, VarChar(64))  
- `accountId` (String, VarChar(64))  
- `accountType` (String, VarChar(20), 枚举：`CASH`/`MARGIN`/`FROZEN` 等)  
- `currency` (String, VarChar(3), 约定使用 ISO 4217 代码，如 `CNY`/`USD` 等)  
- `transactionType` (String, VarChar(30), 枚举：`DEPOSIT`/`WITHDRAW`/`TRANSFER`/`PAYMENT`/`REFUND` 等)  
- `direction` (String, VarChar(4), 枚举：`DEBIT`/`CREDIT`)  
- `amount` (Decimal(20,4))  
- `beforeBalance` (Decimal(20,4))  
- `afterBalance` (Decimal(20,4))  
- `oppositeAccount` (String?, VarChar(64))  
- `oppositeAccountType` (String?, VarChar(20))  
- `businessRefNo` (String?, VarChar(64))  
- `status` (String, VarChar(20), default "PENDING", 枚举：`PENDING`/`PROCESSING`/`SUCCESS`/`FAILED`)  
- `errorCode` (String?, VarChar(50))  
- `errorMessage` (String?, Text)  
- `lockType` (String, VarChar(20), 枚举：`PESSIMISTIC`/`OPTIMISTIC`)  
- `retryCount` (Int, default 0)  
- `conflictDetected` (Boolean, default false)  
- `transactionTime` (DateTime, default now)  
- `createdAt` (DateTime, default now)  
- `updatedAt` (DateTime, updatedAt)  
- `accountingDate` (DateTime, default CURRENT_DATE)  
- `metadata` (Json?)  
- `clientInfo` (Json?)  
- `reconciled` (Boolean, default false)  
- `reconciledAt` (DateTime?)  

**索引与唯一约束**:

- 唯一约束：  
  - `(transactionNo)`  
  - `(accountId, accountType, currency, idempotencyKey)`  
- 索引：  
  - `(accountId, accountingDate, createdAt)`  
  - `(idempotencyKey)`  
  - `(status, createdAt)`  
  - `(conflictDetected, createdAt)`  
  - `(reconciled, accountingDate)`  
  - `(businessRefNo)`  

**关键规则**:

- 每一条记录代表一次余额变动，包含变动前后余额，可用于重放与核对。  
- `(accountId, accountType, currency, idempotencyKey)` 唯一保证同一账户维度的同一幂等键不会重复执行。  
- `direction` 为枚举字段：`DEBIT` 表示扣款（余额减少），`CREDIT` 表示入账（余额增加），与接口契约保持一致。  
- 记录锁类型、重试次数与冲突标记，支持后续并发问题排查与指标统计。  
- 记录会计日期与对账标记，支撑后续对账与调账流程。  
- 记录为 append-only，不做物理删除或覆盖。  

### BalanceSnapshot

**表名**: `balance_snapshot`  
**用途**: 记录单次请求完成后的账户余额快照，用于高层审计和快速重放请求结果。  

**字段与约束**:

- `id` (Int, PK, autoincrement)  
- `accountId` (String, VarChar(64))  
- `accountType` (String, VarChar(20), 枚举：`CASH`/`MARGIN`/`FROZEN` 等)  
- `currency` (String, VarChar(3), 约定使用 ISO 4217 代码，如 `CNY`/`USD` 等)  
- `requestId` (String, VarChar(64))  
- `beforeBalance` (Decimal(20,4))  
- `afterBalance` (Decimal(20,4))  
- `status` (String, VarChar(20), 枚举：`SUCCESS`/`REJECTED` 等)  
- `accountingDate` (DateTime, default CURRENT_DATE)  
- `createdAt` (DateTime, default now)  
- `metadata` (Json?)  

**索引与唯一约束**:

- 唯一约束：`(accountId, accountType, currency, requestId)`  
- 索引：  
  - `(accountId, accountingDate, createdAt)`  
  - `(requestId)`  
  - `(status, createdAt)`  

**关键规则**:

- 每个账户 + 请求维度最多一条快照，代表一次请求完成时的状态。  
- metadata 可以存储该请求相关的交易编号列表或其他审计信息。  
- 快照为 append-only，不作为实时余额计算的唯一依据。  

### IdempotencyRecord

**表名**: `idempotency_record`  
**用途**: 管理幂等调用的生命周期，保存请求参数摘要和最终结果，支撑重放和清理。  

**字段与约束**:

- `id` (Int, PK, autoincrement)  
- `idempotencyKey` (String, VarChar(128))  
- `requestHash` (String, VarChar(64))  
- `status` (String, VarChar(20), 枚举：`PROCESSING`/`SUCCESS`/`FAILED`)  
- `responseData` (Json?)  
- `errorInfo` (Json?)  
- `metadata` (Json?)  
- `transactionNo` (String?, VarChar(64))  
- `expiredAt` (DateTime)  
- `createdAt` (DateTime, default now)  
- `updatedAt` (DateTime, updatedAt)  

**索引与唯一约束**:

- 唯一约束：`(idempotencyKey, requestHash)`  
- 索引：  
  - `(expiredAt)`  
  - `(createdAt)`  

**关键规则**:

- 将幂等键与请求哈希组合为唯一键，防止相同幂等键但参数不同的请求被误视为同一次调用。  
- 保存 SUCCESS / FAILED 等状态，以及成功响应或错误详情，用于重复请求的结果重放。  
- 通过 expiredAt 与 createdAt 支持后台清理任务，清理时不影响已经落账的交易和快照。  

## Invariants and Constraints

- 对于同一账户维度，在任意时刻只允许一个写入路径修改 AccountBalance 的余额和版本号，通过数据库事务与行级锁实现。  
- 任意余额变动必须对应至少一条 BalanceTransaction 记录，不允许绕过流水直接更新 AccountBalance。  
- BalanceTransaction 和 BalanceSnapshot 记录为 append-only，任何更正通过追加新记录完成。  
- 跨账户资金移动必须以成对或成组的 BalanceTransaction 记录表示，并共享同一 batchId。  
- IdempotencyRecord 在 `(idempotencyKey, requestHash)` 维度唯一，用于幂等控制与结果重放。  
- 在高并发账户和跨账户转账等高风险场景下，默认使用行级悲观锁，并按照固定顺序获取多个账户的锁，以降低死锁风险。  
