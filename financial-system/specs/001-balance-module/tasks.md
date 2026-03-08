# Tasks: Balance Module（余额模块）

**Input**: Design documents from `/specs/001-balance-module/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: 本特性遵循 TDD 要求，每个用户故事都包含测试任务。

**Organization**: 任务按用户故事分组，便于独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无直接依赖）
- **[Story]**: 用户故事标签（如 US1, US2, US3）
- 描述中必须包含明确的文件路径

---

## Phase 1: Setup（共享基础设施）

**Purpose**: 为余额模块准备必要的本地环境与数据库基础

- [x] T001 确认 `backend/.env` 中配置了 `DATABASE_URL` 指向本地开发数据库（PostgreSQL 或 SQLite）
- [x] T002 在 `backend/prisma/` 下执行并验证现有迁移，确保 `account_balance`、`transaction_journal`、`balance_snapshot`、`idempotency_record` 表已创建
- [x] T003 [P] 在 `backend/` 下确认 Jest 单元测试与 e2e 测试命令可正常运行（`npm run test`、`npm run test:e2e`）

---

## Phase 2: Foundational（阻塞前置能力）

**Purpose**: 为所有用户故事提供统一的账务模块基础结构与技术能力  
**⚠️ CRITICAL**: 未完成前不可开始任何用户故事实现

- [x] T004 在 `backend/src/balance/balance.module.ts` 中创建 `BalanceModule` 并在 `backend/src/app.module.ts` 中完成模块注册
- [x] T005 [P] 在 `backend/src/balance/balance.repository.ts` 中实现基于 Prisma 的账户余额与交易流水仓储封装（读取/写入 AccountBalance 与 BalanceTransaction）
- [x] T006 [P] 在 `backend/src/balance/idempotency.repository.ts` 中实现 IdempotencyRecord 的读写接口
- [x] T007 在 `backend/src/balance/transaction-manager.ts` 中封装基于 Prisma 的事务与行级悲观锁操作（使用 `SELECT ... FOR UPDATE` 等等价机制）
- [x] T008 在 `backend/src/balance/balance.service.ts` 中定义余额领域服务接口与骨架方法（如 `applyTransactions`、`getBalance`）
- [x] T009 [P] 在 `backend/src/balance/balance.controller.ts` 中创建控制器骨架，并配置基础路由前缀 `/balances`

**Checkpoint**: 完成后，余额模块的基础结构与数据库访问能力准备就绪，可开始各用户故事的具体实现。

---

## Phase 3: User Story 1 - 并发安全余额更新（Priority: P1）🎯 MVP

**Goal**: 在高并发场景下，对单账户执行多笔加/扣交易，确保余额计算正确且无丢单、重复扣减或竞态错误。  
**Independent Test**: 在受控环境下构造高并发请求（如 1000 个并发请求，每个请求多笔交易），验证最终余额与理论值完全一致且无负余额。

### Tests for User Story 1（TDD）

- [x] T010 [P] [US1] 在 `backend/test/balance/balance-concurrency.e2e-spec.ts` 中编写 e2e 测试，模拟高并发对同一账户发送多笔交易请求并验证最终余额正确
- [x] T011 [P] [US1] 在 `backend/test/balance/balance.service.spec.ts` 中编写单元测试，覆盖 `BalanceService.applyTransactions` 的正常路径与并发相关场景
- [x] T036 [P] [US1] 在 `backend/test/balance/balance.service.spec.ts` 中增加处理中途失败或数据库异常场景的单元测试，验证事务回滚后账户余额、交易流水与余额快照状态保持一致（通过仓储调用与幂等记录状态间接验证）

### Implementation for User Story 1

- [x] T012 [P] [US1] 在 `backend/src/balance/dto/create-balance-transactions.dto.ts` 中定义 `POST /balances/transactions` 请求 DTO，包含账户信息、幂等键与交易列表，并添加 class-validator 校验
- [x] T013 [P] [US1] 在 `backend/src/balance/balance.service.ts` 中实现 `applyTransactions` 核心逻辑，基于 `TransactionManager` 使用悲观锁更新 `AccountBalance` 并生成 `BalanceTransaction`
- [x] T014 [US1] 在 `backend/src/balance/balance.controller.ts` 中实现 `POST /balances/transactions` 控制器方法，调用 `BalanceService.applyTransactions` 并返回包含账户前后余额与交易列表的响应
- [x] T015 [US1] 在 `backend/src/balance/balance.service.ts` 中集成幂等处理逻辑，使用 `IdempotencyRecord` 保证相同幂等键请求返回一致结果且不重复记账
- [x] T016 [US1] 在 `backend/src/balance/balance.service.ts` 中确保账户余额更新与 `BalanceTransaction`/`BalanceSnapshot` 写入在同一数据库事务内完成
- [ ] T017 [US1] 在 `backend/src/balance/balance.service.ts` 中为关键路径添加日志与监控埋点（如请求 ID、账户 ID、批次 ID、重试次数、冲突标记）

**Checkpoint**: 完成后，可通过并发 e2e 测试与单元测试验证单账户并发记账的正确性，形成可演示的 MVP。

---

## Phase 4: User Story 2 - 防止超扣与批量原子处理（Priority: P1）

**Goal**: 在单请求多笔交易场景中，保证任一时刻余额不低于允许阈值；当交易会导致超扣时，按照约定策略（例如全量回滚/整体拒绝）处理并返回清晰错误。  
**Independent Test**: 针对包含超扣场景的请求集合，验证所有会导致余额低于阈值的请求均被拒绝或回滚，且余额不出现负值。

### Tests for User Story 2（TDD）

- [x] T018 [P] [US2] 在 `backend/test/balance/overdraft-batch.e2e-spec.ts` 中编写 e2e 测试，覆盖“全部扣款导致超扣时整体拒绝”的场景
- [x] T019 [P] [US2] 在 `backend/test/balance/failure-policy.spec.ts` 中编写单元测试，验证批量交易失败策略（全量回滚/整体拒绝）的决策逻辑

### Implementation for User Story 2

- [x] T020 [P] [US2] 在 `backend/src/balance/config/balance.config.ts` 中定义批量失败策略配置（如 `failurePolicy`），并提供从环境变量或配置文件加载的机制
- [x] T021 [US2] 在 `backend/src/balance/balance.service.ts` 中扩展 `applyTransactions`，在执行过程中检查 `minBalance` 与 `allowNegative`，并根据策略对超扣场景进行整体拒绝
- [x] T022 [US2] 在 `backend/src/balance/balance.controller.ts` 中完善 `POST /balances/transactions` 响应结构，在超扣时返回 `status: "REJECTED"`、错误码 `INSUFFICIENT_FUNDS` 以及请求前后余额信息
- [x] T023 [US2] 在 `backend/src/balance/balance.service.ts` 中处理交易列表为空的场景，将其视为无操作但返回成功，并记录相应快照

#### 批量失败策略说明

- 批量失败策略通过配置项 `BALANCE_FAILURE_POLICY` 控制，作用域为 Balance 模块后端进程。  
- 当前实现仅支持策略值：`REJECT_BATCH`，并将其作为默认策略：当环境变量缺失或配置为非法值时，仍回退到 `REJECT_BATCH`。  
- 当策略为 `REJECT_BATCH` 时，`T020–T023` 的实现需要保证：  
  - 在事务内预演整批交易序列，结合账户的 `minBalance` 与 `allowNegative`；  
  - 一旦预演过程中任意一笔会导致余额低于允许阈值，则整批请求被拒绝，不落账任何 `BalanceTransaction`；  
  - 写入一条 `BalanceSnapshot`，其 `status` 为 `REJECTED`，`beforeBalance` 与 `afterBalance` 相同；  
  - API 返回体中 `status: "REJECTED"`，错误码为 `INSUFFICIENT_FUNDS`。  
- 后续如扩展其他失败策略（例如新策略名），应在 `T020` 所在配置文件中新增策略枚举值及解析逻辑，并在 `T021` 中的超扣处理分支中基于策略值切换行为。  

**Checkpoint**: 完成后，可以独立验证批量交易在各种超扣情况中的行为，并保证不会产生负余额。

---

## Phase 5: User Story 3 - 交易快照与审计追踪（Priority: P2）

**Goal**: 支持基于请求 ID 或账户 + 时间范围查询交易快照和流水，以便审计/风控/运维快速重放余额变更过程。  
**Independent Test**: 在执行多笔交易后，能通过快照与流水查询完整重构某时段内的余额变更，并区分成功与拒绝请求。

### Tests for User Story 3（TDD）

- [x] T024 [P] [US3] 在 `backend/test/balance/snapshot-by-request.e2e-spec.ts` 中编写 e2e 测试，验证通过 `requestId` 查询单次请求快照的能力
- [x] T025 [P] [US3] 在 `backend/test/balance/snapshot-by-account.e2e-spec.ts` 中编写 e2e 测试，验证按账户 + 时间范围查询快照列表的能力
- [x] T026 [P] [US3] 在 `backend/test/balance/transactions-query.e2e-spec.ts` 中编写 e2e 测试，验证按账户 + 时间范围 + `businessRefNo` 查询交易流水的能力

### Implementation for User Story 3

- [x] T027 [P] [US3] 在 `backend/src/balance/snapshot.service.ts` 中实现基于 `BalanceSnapshot` 的查询服务，支持按 `requestId` 和账户 + 会计日期区间查询
- [x] T028 [US3] 在 `backend/src/balance/balance.controller.ts` 中实现 `GET /balances/snapshots` 接口，映射到 `SnapshotService` 并返回符合契约的列表结构
- [x] T029 [US3] 在 `backend/src/balance/transaction-query.service.ts` 中实现基于 `BalanceTransaction` 的流水查询服务，支持账户 + 时间范围 + `businessRefNo`
- [x] T030 [US3] 在 `backend/src/balance/balance.controller.ts` 中实现 `GET /balances/transactions` 接口，调用 `TransactionQueryService` 并返回契约定义的流水列表

**Checkpoint**: 完成后，审计/风控可通过快照与流水接口独立完成余额变更追踪与问题定位。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 改进跨故事的质量与运维能力

- [x] T031 [P] 在 `financial-system/specs/001-balance-module/` 与 `backend/` 中补充和更新与余额模块相关的文档（如 quickstart、错误码说明）
- [x] T032 统一 `backend/src/balance/` 下的错误处理与日志格式，确保对外返回结构稳定并便于检索
- [x] T033 [P] 为 `backend/src/balance/` 中的关键服务（如 `BalanceService`、`SnapshotService`）补充更多单元测试，提高覆盖率
- [x] T034 [P] 针对高并发热点账户和大批量查询场景，在 `backend/prisma/schema.prisma` 和数据库层评估并优化索引（如快照/流水查询索引）
- [ ] T035 对余额模块进行一次端到端的 quickstart 验证，根据 `backend/README.md` 与未来的 `quickstart.md` 说明执行本地启动、迁移、并发测试与查询流程
- [x] T036 [P] 在 `backend/src/balance/idempotency-cleanup.service.ts` 中实现基于 `expiredAt` 或创建时间的幂等记录清理服务，确保只清理已过期且不再需要重放的记录
- [x] T037 在 `backend/test/balance/idempotency-cleanup.e2e-spec.ts` 中编写 e2e 测试，验证幂等清理任务不会影响已落账的交易流水与余额快照查询能力
- [x] T038 [P] 在 `backend/src/balance/` 中统一错误响应模型与敏感信息日志策略，避免在日志与对外响应中暴露账户标识、幂等键等敏感字段，并在现有 e2e 测试中覆盖典型失败场景

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup（Phase 1）**: 无依赖，可立即开始
- **Foundational（Phase 2）**: 依赖 Phase 1，阻塞所有用户故事实现
- **User Stories（Phase 3+）**: 依赖 Phase 2 完成
  - 用户故事可在 Foundational 完成后并行推进（若有多人协作）
  - 或按优先级顺序串行推进（P1 → P1 → P2）
- **Polish（Phase 6）**: 依赖所有目标用户故事完成后执行

### User Story Dependencies

- **User Story 1（P1，US1）**: 完成 Foundational 后即可开始，无对其他故事的依赖
- **User Story 2（P1，US2）**: 完成 Foundational 后可开始，复用 US1 的基础能力但在测试上应保持可独立验证
- **User Story 3（P2，US3）**: 完成 Foundational 后可开始，依赖流水与快照写入能力，但查询逻辑和接口可独立验证

### Within Each User Story

- 测试任务（若存在）应先于实现任务编写，并在实现前保证测试先失败
- 数据访问层与仓储优先，其次是领域服务，再次是控制器与接口
- 实现完成后运行对应 e2e / 单元测试，确认该故事可独立通过

### Parallel Opportunities

- Phase 1 中 T002/T003 可与环境准备并行
- Phase 2 中标记为 [P] 的仓储、事务管理与控制器骨架可并行实现
- 各用户故事内部标记为 [P] 的测试与模型/服务可并行推进（前提是文件路径不冲突）
- 不同用户故事可以由不同开发者并行实现，前提是 Foundational 已完成且接口契约保持稳定
