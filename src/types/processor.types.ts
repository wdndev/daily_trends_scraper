import { TrendItem } from './common.types';

// 处理结果接口
export interface ProcessResult {
  success: boolean;
  data: TrendItem[];
  processedData?: any;
  error?: string;
  processingTime?: number;
}

// 处理器配置接口
export interface ProcessorConfig {
  name: string;
  enabled: boolean;
  priority: number;
  timeout?: number;
  retries?: number;
}

// 处理器状态接口
export interface ProcessorStatus {
  isProcessing: boolean;
  lastProcessTime?: Date;
  totalProcessed: number;
  currentBatch?: number;
  errors: string[];
}

// 处理器统计接口
export interface ProcessorStats {
  totalProcessed: number;
  successfulProcesses: number;
  failedProcesses: number;
  averageProcessingTime: number;
  lastError?: string;
}

// 处理任务接口
export interface ProcessTask {
  id: string;
  type: 'trends' | 'analysis' | 'summary';
  data: TrendItem[];
  priority: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
} 