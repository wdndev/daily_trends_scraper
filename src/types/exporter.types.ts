import { TrendItem } from './common.types';

// 导出器配置接口
export interface ExporterConfig {
  outputDir: string;
  filename: string;
  format: 'json' | 'markdown' | 'csv' | 'xml';
}

// 导出结果接口
export interface ExportResult {
  success: boolean;
  filePath: string;
  error?: string;
  fileSize?: number;
  exportedAt: Date;
}

// 导出器状态接口
export interface ExporterStatus {
  isExporting: boolean;
  lastExportTime?: Date;
  totalExported: number;
  currentFormat?: string;
}

// 导出格式选项接口
export interface ExportFormat {
  name: string;
  extension: string;
  mimeType: string;
  description: string;
}

// 导出统计接口
export interface ExportStats {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  totalDataSize: number;
  averageExportTime: number;
} 