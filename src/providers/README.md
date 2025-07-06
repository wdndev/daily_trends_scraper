# LLM Providers 架构说明

## 概述

本项目采用统一的Provider架构来处理大语言模型(LLM)的调用，支持多种LLM服务，并提供流式和非流式两种处理方式。

## 核心组件

### BaseProvider

`BaseProvider` 是所有LLM Provider的基类，定义了统一的接口：

```typescript
export abstract class BaseProvider {
  // 非流式处理 - 返回完整响应
  public abstract chat(messages: LLMMessage[]): Promise<LLMResponse>;
  
  // 流式处理 - 返回异步迭代器
  public abstract chatStream(messages: LLMMessage[]): AsyncIterable<LLMStreamResponse>;
}
```

### 消息格式

所有Provider都使用统一的OpenAI兼容消息格式：

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}
```

## 现有Provider

### 1. OpenAIProvider

基于OpenAI官方SDK的Provider，支持GPT系列模型。

**配置示例：**
```typescript
const provider = new OpenAIProvider({
  apiKey: 'your-openai-api-key',
  baseUrl: 'https://api.openai.com/v1',
  modelName: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7,
});
```

### 2. ExampleProvider

用于开发和测试的模拟Provider，不依赖外部API。

**配置示例：**
```typescript
const provider = new ExampleProvider({
  apiKey: 'example-key',
  baseUrl: 'https://api.example.com',
  modelName: 'example-model',
  maxTokens: 1000,
  temperature: 0.7,
});
```

### 3. QianfanProvider

基于百度千帆大模型的Provider，支持ERNIE系列模型。

**配置示例：**
```typescript
const provider = new QianfanProvider({
  apiKey: 'your_qianfan_access_key',
  secretKey: 'your_qianfan_secret_key',
  modelName: 'ERNIE-Bot-turbo', // 可选，默认为 ERNIE-Bot-turbo
  maxTokens: 1000,
  temperature: 0.7,
});
```

**支持的模型：**
- `ERNIE-Bot-turbo` - 默认模型
- `ERNIE-Bot` - ERNIE Bot
- `ERNIE-Bot-4` - ERNIE Bot 4
- `ERNIE-Bot-8K` - ERNIE Bot 8K
- `ERNIE-Lite-8K` - ERNIE Lite 8K
- `ERNIE-Lite-8K-Instruct` - ERNIE Lite 8K Instruct
- `ERNIE-Tiny-8K` - ERNIE Tiny 8K
- `ERNIE-Speed-8K` - ERNIE Speed 8K
- `ERNIE-Speed-128K` - ERNIE Speed 128K

## 使用方法

### 非流式处理

```typescript
const messages: LLMMessage[] = [
  { role: 'system', content: '你是一个有用的助手。' },
  { role: 'user', content: '请介绍一下人工智能。' },
];

const response = await provider.chat(messages);
console.log(response.content);
```

### 流式处理

```typescript
const stream = provider.chatStream(messages);

for await (const chunk of stream) {
  if (!chunk.done) {
    process.stdout.write(chunk.content); // 实时输出
  } else {
    console.log('\n处理完成');
  }
}
```

### 趋势数据处理

```typescript
const trendItems = [
  { title: 'GitHub Copilot 更新', description: '新功能发布' },
  { title: 'ChatGPT 4.0', description: '多模态支持' },
];

const response = await provider.processTrends(trendItems);
console.log(response.content);
```

## 创建自定义Provider

要实现新的LLM Provider，需要继承`BaseProvider`并实现抽象方法：

```typescript
import { BaseProvider } from './BaseProvider';
import { LLMMessage, LLMResponse, LLMStreamResponse } from '../types';

export class CustomProvider extends BaseProvider {
  public async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    this.validateMessages(messages);
    
    // 实现非流式处理逻辑
    const response = await this.callCustomAPI(messages);
    
    return {
      content: response.text,
      usage: response.usage,
      finish_reason: response.finish_reason,
    };
  }

  public async *chatStream(messages: LLMMessage[]): AsyncIterable<LLMStreamResponse> {
    this.validateMessages(messages);
    
    // 实现流式处理逻辑
    const stream = await this.callCustomStreamAPI(messages);
    
    for await (const chunk of stream) {
      yield {
        content: chunk.text,
        done: chunk.done,
        usage: chunk.usage,
        finish_reason: chunk.finish_reason,
      };
    }
  }

  private async callCustomAPI(messages: LLMMessage[]) {
    // 调用自定义API的逻辑
  }

  private async *callCustomStreamAPI(messages: LLMMessage[]) {
    // 调用自定义流式API的逻辑
  }
}
```

## 配置说明

### LLMConfig 接口

```typescript
interface LLMConfig {
  apiKey: string;           // API密钥
  baseUrl: string;          // API基础URL
  modelName: string;        // 模型名称
  maxTokens?: number;       // 最大token数
  temperature?: number;     // 温度参数
  stream?: boolean;         // 是否使用流式处理
}
```

## 错误处理

所有Provider都包含内置的重试机制和错误处理：

- 自动重试失败的请求（最多3次）
- 指数退避策略
- 详细的错误信息

## 最佳实践

1. **使用类型安全**: 始终使用`LLMMessage`类型定义消息
2. **错误处理**: 使用try-catch包装Provider调用
3. **资源管理**: 流式处理完成后及时释放资源
4. **配置管理**: 使用环境变量管理敏感配置
5. **测试**: 使用`ExampleProvider`进行单元测试

## 扩展性

该架构设计具有良好的扩展性：

- 可以轻松添加新的LLM服务提供商
- 支持不同的消息格式和响应格式
- 可以添加中间件进行请求/响应处理
- 支持自定义重试策略和错误处理 