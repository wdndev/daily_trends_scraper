// LLM消息格式接口 (兼容OpenAI)
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

// LLM处理器配置接口
export interface LLMConfig {
  provider?: 'openai' | 'qianfan';
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

// LLM响应接口
export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
}

// LLM流式响应接口
export interface LLMStreamResponse {
  content: string;
  done: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
}

// LLM使用统计接口
export interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// LLM模型信息接口
export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  maxTokens?: number;
  supportsStreaming?: boolean;
}