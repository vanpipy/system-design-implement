# General RAG

## Business Workflow

```mermaid
graph TD
  User -->  ChatbotUI

  领域文档 -- 文档加载 --> 文档处理器
  文档处理器 -- 文档清洗 --> 纯内容文档
  纯内容文档 -- 文档切片 --> 块数据
  块数据 -- 向量化 --> 向量数据
  向量数据 -- 存储 --> 向量数据库

  ChatbotUI --> 网关
  网关 --> 意图识别
  意图识别 --> 规则匹配
  规则匹配 -- 命中 --> 已知意图
  规则匹配 -- 未命中 --> 缓存匹配
  缓存匹配 -- 命中 --> 已知意图
  缓存匹配 -- 未命中 --> 分类模型
  分类模型 -- 高置信度 --> 已知意图
  分类模型 -- 低置信度 --> 未知意图
  未知意图 --> 反问服务

  已知意图 --> 路由分发
  路由分发 -- 知识问答 --> RAG服务
  路由分发 -- 闲聊 --> 对话服务
  路由分发 -- 澄清 --> 反问服务
  路由分发 -- 操作 --> 工具服务
  路由分发 -- 其他 --> 反问服务

  RAG服务 --> 向量检索
  向量检索 -- 查询 --> 向量数据库
  向量检索 --> 文档块重排序
  文档块重排序 --> 上下文构建
  上下文构建 --> LLM
  LLM -- 答案JSON --> 组装服务

  对话服务 --> 闲聊类型
  闲聊类型 -- 问候 --> 问候模板
  闲聊类型 -- 感谢模板 --> 感谢模板
  闲聊类型 -- 告别 --> 告别模板
  闲聊类型 -- 其他 --> 通用模板
  问候模板 --> 个性化注入
  感谢模板 --> 个性化注入
  告别模板 --> 个性化注入
  通用模板 --> 个性化注入
  个性化注入 -- 答案JSON --> 组装服务

  反问服务 --> 反问类型
  反问类型 -- 意图不明 --> 意图澄清模板
  反问类型 -- 信息缺失 --> 信息不全模板
  反问类型 -- 多选项 --> 选项确认模板
  反问类型 -- 低置信度 --> 重述推荐模板
  意图澄清模板 --> 上下文填充
  信息不全模板 --> 上下文填充
  选项重述模板 --> 上下文填充
  重述确认模板 --> 上下文填充
  上下文填充 --> 答案JSON --> 未知意图判断
  未知意图判断 -- 是 --> 更新已知意图
  未知意图判断 -- 否 --> 已知意图
  更新已知意图 -- 答案JSON --> 组装服务

  工具服务 --> 工具类型
  工具类型 -- 信息查询 --> API调用
  工具类型 -- 计算 --> 计算引擎
  工具类型 -- 数据操作 --> 数据库操作
  工具类型 -- 外部服务 --> 第三方API
  API调用 --> 结果格式化
  计算引擎 --> 结果格式化
  数据库操作 --> 结果格式化
  第三方API --> 结果格式化
  结果格式化 -- 答案JSON --> 组装服务

  异常 --> 异常服务
  异常服务 --> 异常类型
  异常类型 --> 异常日志
  异常日志 -- 答案JSON --> 组装服务

  组装服务 --> 标准格式化
  标准格式化 --> 信息合并
  信息合并 --> 缓存判断
  缓存判断 -- 不缓存 --> 返回
  缓存判断 -- 缓存 --> 写入缓存
  写入缓存 --> 返回
  返回 --> ChatbotUI
```

## Business Plane

```mermaid
graph TD
  DomainDocs[领域文档]

  subgraph BusinessPlane[业务面]
    subgraph RAG[RAG]
      DocLoader[文档加载器]
      DocProcessor[文档清洗器]
      VectorCalculator[向量计算器]
      VectorSaver[向量存储器]
      VectorQuery[向量查询器]
      ChunkQuery[文档片查询器]
      RAGResponseGenerator[应答生成器]
    end
    subgraph KnowledgeService[知识问答服务]
      KnowledgeQuery[知识查询器]
    end
    subgraph ChatService[对话服务]
      ChatTypeSelector[对话类型选择器]
      ChatTemplateSelector[对话模板选择器]
      ChatResponseGenerator[对话应答生成器]
    end
    subgraph QuestionService[反问服务]
      QuestionTypeSelector[反问类型选择器]
      QuestionTemplateSelector[反问模板选择器]
      QuestionResponseGenerator[对话应答生成器]
    end
    subgraph ToolService[工具服务]
      ToolTypeSelector[工具类型选择器]
      ToolInvokor[工具调用器]
      ToolResponseGenerator[工具应答生成器]
    end
    subgraph ExceptionService[异常服务]
      ExceptionTypeSelector[异常类型选择器]
      ExceptionLogger[异常日志]
      ExceptionResponseGenerator[异常应答生成器]
    end
    subgraph AssembleService[组装服务]
      Format[格式化]
      Assemble[组装]
    end
  end

  DomainDocs --> DocLoader
```

## Data Plane

```mermaid  
erDiagram
  User {
    bigint id PK "自增主键"
    uuid user_id UK "用户ID"
    string user_name
  }
  Session {
    bigint id PK "自增主键"
    uuid session_id UK "会话ID"
    bigint user_id FK "外键，引用User.id"
    string title
    boolean is_deleted
    datetime create_time
    datetime update_time
    datetime delete_time
  }
  Conversation {
    bigint id PK "自增主键"
    uuid conversation_id UK "对话ID"
    bigint session_id FK "外键，引用Session.id"
    boolean is_deleted
    datetime create_time
    datetime delete_time
  }
  Request {
    bigint id PK "自增主键"
    uuid request_id UK "请求ID"
    bigint conversation_id FK "外键，引用Conversation.id"
    text content
  }
  Intent {
    bigint id PK "自增主键"
    uuid intent_id UK
    string name "意图名称"
    string description "意图描述"
    string category "分类"
  }
  Response {
    bigint id PK "自增主键"
    uuid response_id UK "响应ID"
    bigint request_id FK "外键，引用Request.id"
    text answer
  }
  ResponseSource {
    bigint id PK "自增主键"
    uuid response_source_id UK "响应来源ID"
    bigint response_id FK "外键，引用Response.id"
  }
  Document {
    bigint id PK "自增主键"
    uuid doc_id UK "文档ID"
    string name
    bigint size
    string path
    datetime create_time
    datetime update_time
    int version
  }
  %% 关联表
  DocumentPoint {
    bigint document_id FK "外键，引用Document.id，复合主键"
    string point_id FK "外键，引用Point.id，复合主键"
    %% 复合主键 (document_id, point_id)
  }
  ResponseSourcePoint {
    bigint response_source_id FK "外键，引用ResponseSource.id，复合主键"
    string point_id FK "外键，引用Point.id，复合主键"
    %% 复合主键 (response_source_id, point_id)
  }
  %% 业务抽象 Chunk
  Chunk {
    string id
    text content
    string source
  }
  %% 业务抽象 Vector
  Vector {
    string id
    float[] values
  }
  %% 物理存储Point
  Point {
    string id
    Vector vector
    Chunk payload
  }
  Feedback {
    bigint id PK "自增主键"
    uuid feedback_id UK "反馈ID"
    bigint response_id FK "外键，引用Response.id"
    tinyint status "0-bad,1-good"
  }

  User ||--o{ Session : contains
  Session ||--o{ Conversation : contains
  Conversation ||--|| Request : has
  Request ||--|| Intent : produces
  Request ||--|| Response : generates
  Response ||--|| ResponseSource : includes
  Response ||--o| Feedback : has
  Document ||--o{ DocumentPoint : has
  ResponseSource ||--o{ ResponseSourcePoint : has
  Point ||..o{ DocumentPoint : referenced_by
  Point ||..o{ ResponseSourcePoint : referenced_by
  Point ||..|| Vector : "maps_to"
  Point ||..|| Chunk : "maps_to"
```

## Control Plane

```mermaid
graph TD
  KnowledgeService[知识问答服务]
  ChatService[对话服务]
  QuestionService[反问服务]
  ToolService[工具服务]

  subgraph ControlPlane[控制面]
    subgraph IndentRecognizer[意图识别]
      RuleMatcher[规则匹配器]
      CacheMatcher[缓存匹配器]
      ConfidenceCalculator[知识服务置信度计算器]
    end
    subgraph RouteDistributor[路由分发]
      IndentStrategy[意图策略]
      DowngradeStrategy[降级策略]
    end
  end

  RuleMatcher -- matched --> RouteDistributor
  RuleMatcher --> CacheMatcher
  CacheMatcher -- matched --> RouteDistributor
  CacheMatcher --> ConfidenceCalculator
  ConfidenceCalculator -- confidence > 0.6 = knowledge --> RouteDistributor
  ConfidenceCalculator --> QuestionService
  RouteDistributor --> IndentStrategy
  IndentStrategy -- knowledge --> KnowledgeService
  IndentStrategy -- chat --> ChatService
  IndentStrategy -- clarify --> QuestionService
  IndentStrategy -- tool --> ToolService
  IndentStrategy -- others --> QuestionService
```

## Technical Solution

### Framework Layer (Structural Core)

- **Python Version**: 3.12
- **Dependency Management**: `UV` - Package management and virtual environment
- **Embedding Framework**: `sentence-transformers` - Unified embedding and similarity calculation
- **Web Framework**: `FastAPI` - API service
- **Configuration Management**: `YAML` + `Pydantic` - Configuration-driven approach
- **Service Communication**: `HTTP/REST` + `OpenAI-compatible API` - Inter-service communication
- **Chatbot Framework**: LangChain - ChatPromptTemplate/PydanticOutputParser/BaseCallbackHandler/LCEL
- **Document Framework**: LlamaIndex - SimpleDirectoryReader/SemanticSplitterNodeParser/HuggingFaceEmbedding

### Model Layer (AI Capabilities)

- **Embedding Model**: `BAAI/bge-small-zh-v1.5` - Chinese, 33MB, local CPU
- **Intent Classification Model**: `BAAI/bge-small-zh-v1.5` + Template Matching
- **Primary LLM**: `DeepSeek API` - Answer generation, low cost
- **Fallback LLM**: `llama.cpp` + `Qwen2.5-1.5B` - Local fallback option

### Storage Layer (Data Persistence)

- **Vector Database**: `Qdrant` - Vector + original text storage and retrieval
- **Relational Database**: `PostgreSQL` - Session/request/response storage
- **Cache**: `Redis` - Session state/response caching
- **Object Storage**: `MinIO` / File system - Raw document storage
- **Logger**: loguru - Local/Docker driven logger

### Deployment Layer (Runtime Environment)

- **Development Environment**: Linux with CPU
- **Containerization**: `Docker` + `Docker Compose` - Service packaging
- **Orchestration**: `Kubernetes` (optional) - Production scaling
