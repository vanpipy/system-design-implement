# Implementation Plan: Balance Module

**Branch**: `001-balance-module` | **Date**: 2026-03-07 | **Spec**: `specs/001-balance-module/spec.md`  
**Input**: Feature specification from `/specs/001-balance-module/spec.md`

## Summary

余额模块提供并发安全、防止超扣、支持单请求多笔交易并生成交易快照的账户余额能力。当前工程使用 Nest.js（TypeScript）实现应用逻辑，使用 Prisma 作为 ORM，开发环境使用 SQLite，生产环境使用 PostgreSQL，运行环境通过 Docker 进行容器化部署。这些基础设施（Nest.js 工程、Prisma 集成、SQLite/PostgreSQL 配置、Docker 化，以及基于 Jest 的测试框架）已经在仓库中完成搭建，余额模块将在此技术基座之上实现具体的记账、幂等控制与快照审计能力。

## Technical Context

**Language/Version**: Node.js 20.x + TypeScript（Nest.js 框架）  
**Primary Dependencies**: Nest.js, Prisma ORM, Jest  
**Storage**: SQLite（开发环境，通过 Prisma）、PostgreSQL（生产环境，通过 Prisma）  
**Testing**: Jest（单元测试与 e2e 测试），开发流程遵循 TDD（先写测试再实现）  
**Target Platform**: Docker 容器中的 Linux 运行环境  
**Project Type**: Web-service（金融后端 API 服务）  
**Performance Goals**: 在单节点（4 vCPU / 8GB 内存）部署下，针对典型业务负载（每秒 ≤ 50 个余额写请求、≤ 200 个只读查询），在不牺牲资金正确性的前提下，余额相关 API 的 p95 延迟应 ≤ 200ms，非业务性错误率（排除资金不足、幂等重复等业务拒绝）应 ≤ 0.1%。  
**Constraints**: 强一致性优先于延迟优化；在涉及高风险记账与对账的操作上允许更高延迟。余额模块不主动引入分布式事务或跨服务的强一致协议，如需更大规模与更复杂一致性边界，需要在系统层面通过水平扩展、分片或异步化方案统一规划。  
**Scale/Scope**: 初期按 10 万账户、每日 100 万笔余额变更量级进行设计与容量规划，视实际业务发展和压测结果再行调整与优化。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Security-First：余额模块访问数据库时，凭据与其他敏感配置必须通过环境变量或安全配置管理，不得写入代码或日志；Docker 镜像中不得包含明文 secrets。  
- Strong Consistency by Default：余额变更与交易流水写入必须使用数据库事务，并在高并发账户或跨账户转账等高风险场景下结合行级悲观锁，确保不会出现“丢钱、多记钱或错账”的情形；任何降级为最终一致的模式必须在接口与文档中显式标注，并配套对账与补偿机制。  
- High Cohesion, Low Coupling：余额模块在 Nest.js 中应作为独立模块存在，封装账户余额、交易流水、幂等记录等逻辑，通过清晰的服务接口或 API 控制器向外暴露能力；与其他域（如用户、订单）通过明确的接口或事件集成，避免隐式耦合。  
- Test-First（TDD）：使用 Jest 为余额模块编写单元测试、集成测试与 e2e 测试，用例覆盖“无丢钱、无重复记账、防止超扣、幂等重放正确”等关键金融不变量；测试需在本地与 CI 中全部通过后才允许合并。

当前技术栈（Nest.js + Prisma + SQLite/PostgreSQL + Docker + Jest）与金融系统宪法中对安全性、强一致性与 TDD 的要求保持一致，余额模块的设计与实现必须持续通过宪法检查。

## Project Structure

### Documentation (this feature)

```text
specs/001-balance-module/
├── spec.md        # 余额模块特性规格
├── plan.md        # 本文件（/speckit.plan 阶段输出）
├── research.md    # Phase 0 输出：调研与技术决策（待创建）
├── data-model.md  # Phase 1 输出：数据模型与约束（待创建）
├── quickstart.md  # Phase 1 输出：本地开发与部署指引（待创建）
├── contracts/     # Phase 1 输出：对外接口契约（待创建）
└── tasks.md       # Phase 2 输出：任务拆解（由 /speckit.tasks 生成）
```

### Source Code (repository root)

```text
financial-system/
├── backend/                  # Nest.js 后端服务
│   ├── src/                  # 应用入口与业务代码（包含余额模块）
│   ├── test/                 # Jest 单元与 e2e 测试
│   └── prisma/               # Prisma schema 与生成代码
└── specs/
    └── 001-balance-module/   # 余额模块的详细规格与计划文档（与本 plan 对应）
```

**Structure Decision**:  
项目在 `financial-system/backend` 中采用单一 Nest.js 工程，通过 Prisma 访问 SQLite/PostgreSQL。余额模块在代码中作为独立的 Nest.js 模块存在，并在根目录下 `specs/001-balance-module/` 维护 speckit.plan 体系下的规格与计划文档。代码与文档通过共享的技术栈与金融宪法保持一致，后续变更需要同时更新实现与规格。

## Complexity Tracking

目前未发现需要违反宪法原则的复杂度扩张点，如增加额外项目或引入过度抽象；若后续设计中出现新的模式（例如单独的对账服务或复杂的仓储层抽象），将以本节记录其必要性及被拒绝的简单替代方案。
