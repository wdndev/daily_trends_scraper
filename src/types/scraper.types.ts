import { TrendItem, BaseConfig } from './common.types';

// 代理配置接口
export interface ProxyConfig {
  host: string;
  port: number;
  protocol?: 'http' | 'https';
  auth?: {
    username: string;
    password: string;
  };
}

// 抓取器配置接口
export interface ScraperConfig extends BaseConfig {
  url: string;
  headers?: Record<string, string>;
  proxy?: ProxyConfig;
  metadata?: {
    searchQuery?: string;
    category?: string;
    domain?: string;
    maxResults?: number;
  };
}

// 抓取结果接口
export interface ScrapeResult {
  success: boolean;
  data: TrendItem[];
  error?: string;
  source: string;
  timestamp: Date;
}

// 抓取器状态接口
export interface ScraperStatus {
  isRunning: boolean;
  lastRunTime?: Date;
  totalScraped: number;
  errors: string[];
}

// 抓取器元数据接口
export interface ScraperMetadata {
  name: string;
  version: string;
  description: string;
  supportedSources: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

// 抓取器统计接口
export interface ScraperStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastError?: string;
} 