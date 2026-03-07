# Research: Balance Module (001-balance-module)

## Decisions

- 使用 Nest.js（TypeScript）作为余额模块的 HTTP API 框架。  
- 使用 Prisma 作为 ORM 层，统一访问 PostgreSQL（生产）和 SQLite（开发）。  
- 生产数据库选用 PostgreSQL，以满足事务、行级锁和可靠索引能力。  
- 开发环境数据库选用 SQLite，简化本地开发和测试数据准备。  
- 采用行级悲观锁（SELECT ... FOR UPDATE）作为高风险场景（高并发账户、跨账户转账）的默认并发控制策略。  
- 在 AccountBalance 表中保留 version 字段，作为乐观锁或审计用的版本计数器。  
- 通过 BalanceTransaction 记录所有余额变动，BalanceSnapshot 记录请求级快照，IdempotencyRecord 独立管理幂等。  
- 所有资金相关操作必须运行在数据库事务中，事务范围至少涵盖账户余额更新与交易流水写入。  

## Rationale

- Nest.js 提供模块化架构、内置 DI 和良好的测试支持，适合构建金融后端 API。  
- Prisma 提供类型安全的 ORM 和迁移工具，降低 SQL 层错误风险并简化模式演进。  
- PostgreSQL 在事务语义、行级锁、约束和索引能力上成熟可靠，适合资金类强一致场景。  
- SQLite 适合作为开发环境的轻量数据库，结合 Prisma 可以与生产 PostgreSQL 共用一套模型。  
- 行级悲观锁可以简化并发下的余额正确性推理，避免复杂的冲突重试逻辑，更符合“强一致性优先”的宪章要求。  
- version 字段为未来切换或补充乐观锁提供空间，也可以用于审计对比和冲突检测。  
- 将流水（BalanceTransaction）、快照（BalanceSnapshot）、幂等记录（IdempotencyRecord）拆表，可以分别优化写入路径、审计查询和重复请求处理，保持高内聚低耦合。  
- 在单个事务中完成余额更新和流水写入，可以确保不会出现“余额已变更但流水缺失”或“流水存在但余额未更新”的不一致状态。  

## Alternatives Considered

- 直接使用原生 SQL 而不引入 Prisma：  
  放弃类型安全和模式管理带来的好处，容易在多人协作与长期演进中积累隐性错误，因此未采纳。  
- 在所有场景统一使用乐观锁：  
  在高并发账户或跨账户转账场景下，会引入更多冲突处理与重试逻辑，增加实现复杂度和出错面，不符合“强一致性优先”的简化要求，因此选择悲观锁作为默认策略。  
- 使用 MySQL 作为生产数据库：  
  虽然 MySQL 也支持事务和行级锁，这里选择 PostgreSQL，因为它对 SERIALIZABLE 隔离级别支持更好，且具有更丰富的锁机制（如 SELECT FOR UPDATE），同时需要利用数据库事务 (ACID)，且在复杂查询、约束和部分索引上更符合后续审计与对账需求，。因此未采用。  
- 使用单表记录快照和流水：  
  会使表结构和索引变得复杂，审计与在线查询的工作负载混在一起，难以针对不同访问模式优化，违背高内聚低耦合原则，因此拆分为 BalanceTransaction 与 BalanceSnapshot 两个实体。  

