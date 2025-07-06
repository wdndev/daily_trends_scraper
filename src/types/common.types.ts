// 基础数据项接口
export interface TrendItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  source: string;
  timestamp: Date;
  language?: string;  // 语言来源，用于标识数据来自哪个语言trending
  metadata?: Record<string, any>;
}

// 通用结果接口
export interface BaseResult {
  success: boolean;
  error?: string;
}

// 通用配置接口
export interface BaseConfig {
  timeout?: number;
  retries?: number;
} 