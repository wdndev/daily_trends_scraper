# 类型定义说明

本项目采用模块化的类型定义结构，将不同类型的接口分离到独立的文件中，提高代码的可维护性和可读性。

## 文件结构

```
src/types/
├── index.ts              # 主索引文件，重新导出所有类型
├── common.types.ts       # 通用基础类型
├── llm.types.ts          # LLM相关类型
├── scraper.types.ts      # 抓取器相关类型
├── exporter.types.ts     # 导出器相关类型
├── processor.types.ts    # 处理器相关类型
├── config.types.ts       # 应用配置相关类型
└── README.md            # 本文档
```

## 各文件说明

### 1. common.types.ts - 通用基础类型

包含项目中所有模块都会使用的基础类型定义：

- `TrendItem`: 趋势数据项接口
- `BaseResult`: 基础结果接口
- `BaseConfig`: 基础配置接口

### 2. llm.types.ts - LLM相关类型

包含所有与LLM（大语言模型）相关的类型定义：

- `LLMMessage`: LLM消息格式（兼容OpenAI）
- `LLMConfig`: LLM配置接口
- `LLMResponse`: LLM响应接口
- `LLMStreamResponse`: LLM流式响应接口
- `LLMUsage`: LLM使用统计接口
- `LLMModel`: LLM模型信息接口

### 3. scraper.types.ts - 抓取器相关类型

包含数据抓取相关的类型定义：

- `ScraperConfig`: 抓取器配置接口
- `ScrapeResult`: 抓取结果接口
- `ScraperStatus`: 抓取器状态接口
- `ScraperMetadata`: 抓取器元数据接口
- `ScraperStats`: 抓取器统计接口

### 4. exporter.types.ts - 导出器相关类型

包含数据导出相关的类型定义：

- `ExporterConfig`: 导出器配置接口
- `ExportResult`: 导出结果接口
- `ExporterStatus`: 导出器状态接口
- `ExportFormat`: 导出格式选项接口
- `ExportStats`: 导出统计接口

### 5. processor.types.ts - 处理器相关类型

包含数据处理相关的类型定义：

- `ProcessResult`: 处理结果接口
- `ProcessorConfig`: 处理器配置接口
- `ProcessorStatus`: 处理器状态接口
- `ProcessorStats`: 处理器统计接口
- `ProcessTask`: 处理任务接口

### 6. config.types.ts - 应用配置相关类型

包含应用整体配置相关的类型定义：

- `AppConfig`: 应用主配置接口
- `AppSettings`: 应用设置接口
- `ScraperConfigs`: 抓取器配置集合接口
- `ExporterConfigs`: 导出器配置集合接口
- `LoggingConfig`: 日志配置接口
- `ScheduleConfig`: 调度配置接口
- `EnvConfig`: 环境变量配置接口

## 使用方式

### 导入所有类型

```typescript
import { TrendItem, LLMMessage, ScraperConfig } from '../types';
```

### 导入特定模块类型

```typescript
import { LLMMessage, LLMConfig } from '../types/llm.types';
import { ScraperConfig, ScrapeResult } from '../types/scraper.types';
```

### 类型扩展

如果需要扩展某个类型，可以在对应的类型文件中添加：

```typescript
// 在 llm.types.ts 中添加新的LLM相关类型
export interface LLMCustomConfig extends LLMConfig {
  customField: string;
}
```

## 类型设计原则

1. **单一职责**: 每个类型文件只负责特定领域的类型定义
2. **可扩展性**: 使用接口继承和联合类型提高扩展性
3. **类型安全**: 使用严格的类型定义，避免使用 `any`
4. **文档化**: 每个接口都有清晰的注释说明
5. **一致性**: 保持命名和结构的一致性

## 最佳实践

1. **优先使用接口**: 对于对象类型，优先使用 `interface` 而不是 `type`
2. **使用联合类型**: 对于有限的值集合，使用联合类型
3. **可选属性**: 对于非必需的属性，使用 `?` 标记
4. **泛型支持**: 对于可重用的类型，考虑使用泛型
5. **类型导出**: 所有公共类型都应该在 `index.ts` 中重新导出

## 扩展指南

当需要添加新的类型时：

1. 确定类型所属的模块
2. 在对应的 `.types.ts` 文件中添加类型定义
3. 在 `index.ts` 中重新导出新类型
4. 更新本文档
5. 添加相应的单元测试 