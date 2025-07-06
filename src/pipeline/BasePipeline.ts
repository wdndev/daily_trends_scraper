import { TrendItem, ScrapeResult, ExportResult } from '../types';
import { BaseScraper } from '../scrapers/BaseScraper';
import { BaseExporter } from '../exporters/BaseExporter';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 流水线配置接口
 */
export interface PipelineConfig {
  jsonOutputDir?: string;  // JSON文件输出目录
  markdownOutputDir?: string;  // Markdown文件输出目录
  filename?: string;
  dateFormat?: string;
  maxRetries?: number;
  timeout?: number;
  enableLogging?: boolean;
}

/**
 * 流水线执行结果接口
 */
export interface PipelineResult {
  success: boolean;
  scrapedData?: TrendItem[];
  exportResults?: ExportResult[];
  errors?: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * 流水线基类
 * 定义公用的变量和方法，包含输出文件夹等配置
 */
export abstract class BasePipeline {
  protected config: PipelineConfig;
  protected scraper: BaseScraper;
  protected exporters: BaseExporter[];
  protected logger: Console;

  constructor(
    scraper: BaseScraper,
    exporters: BaseExporter[],
    config: PipelineConfig
  ) {
    this.scraper = scraper;
    this.exporters = exporters;
    this.config = {
      ...{
        filename: this.generateDefaultFilename(),
        dateFormat: 'YYYY-MM-DD',
        maxRetries: 3,
        timeout: 30000,
        enableLogging: true,
      },
      ...config,
    };
    this.logger = console;
  }

  /**
   * 生成默认文件名
   */
  protected generateDefaultFilename(): string {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    return `${this.getPipelineName()}_${dateStr}`;
  }

  /**
   * 获取流水线名称（子类需要实现）
   */
  protected abstract getPipelineName(): string;

  /**
   * 确保输出目录存在
   */
  protected async ensureOutputDir(): Promise<void> {
    // 收集所有需要创建的目录
    const dirsToCreate: string[] = [];
    
    if (this.config.jsonOutputDir) {
      dirsToCreate.push(this.config.jsonOutputDir);
    }
    if (this.config.markdownOutputDir) {
      dirsToCreate.push(this.config.markdownOutputDir);
    }
    
    // 创建所有必要的目录
    for (const dir of dirsToCreate) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
        this.log(`创建输出目录: ${dir}`);
      }
    }
  }

  /**
   * 日志记录
   */
  protected log(message: string): void {
    if (this.config.enableLogging) {
      this.logger.log(`[${this.getPipelineName()}] ${message}`);
    }
  }

  /**
   * 错误日志记录
   */
  protected logError(message: string, error?: any): void {
    if (this.config.enableLogging) {
      this.logger.error(`[${this.getPipelineName()}] ${message}`, error || '');
    }
  }

  /**
   * 执行数据抓取
   */
  protected async scrapeData(): Promise<ScrapeResult> {
    this.log('开始数据抓取...');
    try {
      const result = await this.scraper.scrape();
      if (result.success) {
        this.log(`数据抓取成功，共获取 ${result.data.length} 条数据`);
      } else {
        this.logError('数据抓取失败', result.error);
      }
      return result;
    } catch (error) {
      this.logError('数据抓取过程中发生异常', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'Unknown',
        timestamp: new Date(),
      };
    }
  }

  /**
   * 执行数据导出
   */
  protected async exportData(items: TrendItem[]): Promise<ExportResult[]> {
    this.log('开始数据导出...');
    const results: ExportResult[] = [];

    for (const exporter of this.exporters) {
      try {
        const result = await exporter.export(items);
        results.push(result);
        
        if (result.success) {
          this.log(`导出成功: ${result.filePath}`);
        } else {
          this.logError(`导出失败: ${result.error}`);
        }
      } catch (error) {
        this.logError('导出过程中发生异常', error);
        results.push({
          success: false,
          filePath: '',
          error: error instanceof Error ? error.message : 'Unknown error',
          exportedAt: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * 执行完整的流水线
   */
  public async execute(isExportData: boolean = true): Promise<PipelineResult> {
    const startTime = new Date();
    const errors: string[] = [];

    this.log('开始执行流水线...');

    try {
      // 确保输出目录存在
      await this.ensureOutputDir();

      // 执行数据抓取
      const scrapeResult = await this.scrapeData();
      
      if (!scrapeResult.success) {
        errors.push(`数据抓取失败: ${scrapeResult.error}`);
        return this.createPipelineResult(false, startTime, undefined, undefined, errors);
      }

      // 执行数据导出
      let exportResults: ExportResult[] | undefined;

      if (isExportData) {
        exportResults = await this.exportData(scrapeResult.data); 
        // 检查是否有导出失败
        const failedExports = exportResults.filter(result => !result.success);
        if (failedExports.length > 0) {
          failedExports.forEach(result => {
            if (result.error) {
              errors.push(`导出失败: ${result.error}`);
            }
          });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.log(`流水线执行完成，耗时: ${duration}ms`);

      return this.createPipelineResult(
        errors.length === 0,
        startTime,
        scrapeResult.data,
        exportResults,
        errors,
        endTime,
        duration
      );

    } catch (error) {
      this.logError('流水线执行过程中发生异常', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return this.createPipelineResult(false, startTime, undefined, undefined, errors, endTime, duration);
    }
  }

  /**
   * 创建流水线结果对象
   */
  private createPipelineResult(
    success: boolean,
    startTime: Date,
    scrapedData?: TrendItem[],
    exportResults?: ExportResult[],
    errors?: string[],
    endTime?: Date,
    duration?: number
  ): PipelineResult {
    const end = endTime || new Date();
    const dur = duration || (end.getTime() - startTime.getTime());

    return {
      success,
      scrapedData,
      exportResults,
      errors,
      startTime,
      endTime: end,
      duration: dur,
    };
  }

  /**
   * 获取配置信息
   */
  public getConfig(): PipelineConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('配置已更新');
  }
} 