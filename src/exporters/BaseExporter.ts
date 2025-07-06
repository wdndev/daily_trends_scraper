import { TrendItem, ExporterConfig, ExportResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export abstract class BaseExporter {
  protected config: ExporterConfig;

  constructor(config: ExporterConfig) {
    this.config = config;
  }

  /**
   * 抽象方法：子类必须实现具体的导出逻辑
   */
  protected abstract formatData(items: TrendItem[], processedData?: any): string;

  /**
   * 执行导出
   */
  public async export(items: TrendItem[], processedData?: any): Promise<ExportResult> {
    try {
      console.log(`开始导出数据到 ${this.config.format} 格式...`);
      
      // 确保输出目录存在
      await this.ensureOutputDir();
      
      const content = this.formatData(items, processedData);
      // 根据format格式处理filename
      // const filename = (): string => {
      //   if (this.config.format === 'json') {
      //     return `${this.config.filename}.json`;
      //   } else if (this.config.format === 'markdown') {
      //     return `${this.config.filename}.md`;
      //   } else {
      //     return this.config.filename;
      //   }
      // }
      const filePath = path.join(this.config.outputDir, this.config.filename);
      
      await fs.promises.writeFile(filePath, content, 'utf-8');
      
      const result: ExportResult = {
        success: true,
        filePath,
        exportedAt: new Date(),
      };

      console.log(`成功导出数据到 ${filePath}`);
      return result;
    } catch (error) {
      console.error(`导出数据失败:`, error);
      return {
        success: false,
        filePath: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exportedAt: new Date(),
      };
    }
  }

  /**
   * 确保输出目录存在
   */
  private async ensureOutputDir(): Promise<void> {
    if (!fs.existsSync(this.config.outputDir)) {
      await fs.promises.mkdir(this.config.outputDir, { recursive: true });
    }
  }
} 