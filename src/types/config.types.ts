import { ScraperConfig } from './scraper.types';
import { LLMConfig } from './llm.types';
import { ExporterConfig } from './exporter.types';

// 应用主配置接口
export interface AppConfig {
  app: AppSettings;
  scrapers: ScraperConfigs;
  llm: LLMConfig;
  exporters: ExporterConfigs;
  logging: LoggingConfig;
  schedule: ScheduleConfig;
}

// 应用设置接口
export interface AppSettings {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
  debug: boolean;
  dataDir: string;
  tempDir: string;
}

// 抓取器配置集合接口
export interface ScraperConfigs {
  github: ScraperConfig;
  weibo: ScraperConfig;
  huggingface: ScraperConfig;
  [key: string]: ScraperConfig;
}

// 导出器配置集合接口
export interface ExporterConfigs {
  json: ExporterConfig;
  markdown: ExporterConfig;
  [key: string]: ExporterConfig;
}

// 日志配置接口
export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  file: string;
  maxSize: string;
  maxFiles: number;
  console: boolean;
}

// 调度配置接口
export interface ScheduleConfig {
  enabled: boolean;
  cron: string;
  timezone: string;
  retryOnFailure: boolean;
  maxRetries: number;
}

// 环境变量配置接口
export interface EnvConfig {
  NODE_ENV: string;
  PORT?: number;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  [key: string]: string | number | undefined;
} 