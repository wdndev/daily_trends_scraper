import { BasePipeline, PipelineConfig, PipelineResult } from './BasePipeline';
import { HotNewsScraper } from '../scrapers/HotNewsScraper';
import { JSONExporter } from '../exporters/JSONExporter';
import { MarkdownExporter } from '../exporters/MarkdownExporter';
import { ScraperConfig, ExporterConfig } from '../types';
import { TrendItem } from '../types';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as fs from 'fs';

/**
 * 平台配置接口
 */
export interface Platform {
  id: string;
  name: string;
}

/**
 * 配置文件接口
 */
interface Config {
  apiUrl: string;
  platforms: Platform[];
}

/**
 * 新闻API流水线配置接口
 */
export interface HotNewsPipelineConfig extends Partial<PipelineConfig> {
  configPath?: string;  // 配置文件路径
  platforms?: Platform[];  // 或者直接传入平台列表
  maxItems?: number;
  filterAds?: boolean;
  parallel?: boolean;  // 是否并行执行，默认true
  delayBetweenPlatforms?: number;  // 顺序执行时的延迟（毫秒）
}

/**
 * 新闻API处理流水线
 * 继承BasePipeline，实现所有平台的抓取和导出
 */
export class HotNewsPipeline extends BasePipeline {
  private newsApiConfig: HotNewsPipelineConfig;
  private pipelineName: string = 'hot_news';
  private platforms: Platform[];

  constructor(config: HotNewsPipelineConfig) {
    // 设置默认配置
    const defaultConfig: HotNewsPipelineConfig = {
      ...{
        jsonOutputDir: './data/json',
        markdownOutputDir: './data/markdown',
        maxItems: 50,
        filterAds: true,
        timeout: 30000,
        maxRetries: 2,
        parallel: true,
        delayBetweenPlatforms: 1000,
      },
      ...config,
    };

    // 加载平台配置（在调用 super 之前）
    let platforms: Platform[];
    if (defaultConfig.configPath) {
      platforms = HotNewsPipeline.loadPlatformsFromConfigStatic(defaultConfig.configPath);
    } else if (defaultConfig.platforms && defaultConfig.platforms.length > 0) {
      platforms = defaultConfig.platforms;
    } else {
      throw new Error('必须提供 configPath 或 platforms 配置');
    }

    // 创建一个虚拟的 scraper（实际不会使用，因为我们会重写 execute 方法）
    const scraperConfig: ScraperConfig = {
      url: 'https://newsnow.busiyi.world/api/s',
      timeout: defaultConfig.timeout || 30000,
      retries: defaultConfig.maxRetries || 2,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    };

    const scraper = new HotNewsScraper(
      scraperConfig,
      'dummy',
      'News API'
    );

    // 设置输出目录（使用 pipelineName 常量）
    const pipelineName = 'hot_news';
    defaultConfig.jsonOutputDir = join(defaultConfig.jsonOutputDir || './data/json', pipelineName);
    defaultConfig.markdownOutputDir = join(defaultConfig.markdownOutputDir || './data/markdown', pipelineName);

    // 创建导出器（用于合并导出）
    const exporters = HotNewsPipeline.createExporters(defaultConfig);

    // 调用父类构造函数
    super(scraper, exporters, defaultConfig as PipelineConfig);

    // 现在可以安全地访问 this
    this.newsApiConfig = defaultConfig;
    this.platforms = platforms;
  }

  /**
   * 从配置文件加载平台列表（静态方法，可在 super 之前调用）
   */
  private static loadPlatformsFromConfigStatic(configPath: string): Platform[] {
    try {
      const configContent = readFileSync(configPath, 'utf-8');
      const config: Config = JSON.parse(configContent);
      return config.platforms;
    } catch (error) {
      console.error(`加载配置文件失败: ${error}`);
      throw error;
    }
  }

  /**
   * 获取流水线名称
   */
  protected getPipelineName(): string {
    return this.pipelineName;
  }

  /**
   * 创建导出器（用于合并导出）
   */
  private static createExporters(config: HotNewsPipelineConfig) {
    const exporters = [];

    // 获取当前日期信息
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    // 日期字符串（YYYY-MM-DD格式）
    const dateStr = `${year}-${month}-${day}`;
    // 年月字符串（YYYYMM格式）
    const yearMonthStr = `${year}${month}`;
    const defaultFilename = `${dateStr}`;

    // 只有当jsonOutputDir不为空时才创建JSON导出器
    if (config.jsonOutputDir) {
      const jsonOutputDir = join(config.jsonOutputDir, yearMonthStr);
      // 创建jsonOutputDir目录
      fs.mkdirSync(jsonOutputDir, { recursive: true });
      const jsonExporterConfig: ExporterConfig = {
        format: 'json',
        outputDir: jsonOutputDir,
        filename: `${defaultFilename}.json`,
      };
      exporters.push(new JSONExporter(jsonExporterConfig));
    }

    // 只有当markdownOutputDir不为空时才创建Markdown导出器
    if (config.markdownOutputDir) {
      const mdOutputDir = join(config.markdownOutputDir, yearMonthStr);
      // 创建mdOutputDir目录
      fs.mkdirSync(mdOutputDir, { recursive: true });
      const mdExporterConfig: ExporterConfig = {
        format: 'markdown',
        outputDir: mdOutputDir,
        filename: `${defaultFilename}.md`,
      };
      exporters.push(new MarkdownExporter(mdExporterConfig));
    }

    return exporters;
  }

  /**
   * 执行单个平台的数据抓取
   */
  private async scrapePlatform(platform: Platform): Promise<{ success: boolean; platformName: string; items?: TrendItem[]; error?: string }> {
    this.log(`开始抓取${platform.name}数据...`);
    
    try {
      const scraperConfig: ScraperConfig = {
        url: `https://newsnow.busiyi.world/api/s?id=${platform.id}`,
        timeout: this.newsApiConfig.timeout || 30000,
        retries: this.newsApiConfig.maxRetries || 2,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
        },
      };

      const scraper = new HotNewsScraper(scraperConfig, platform.id, platform.name);
      const result = await scraper.scrape();
      
      if (result.success && result.data) {
        // 应用平台特定的过滤和处理
        const processedData = this.processNewsData(result.data);
        this.log(`${platform.name}数据处理完成，过滤后剩余 ${processedData.length} 条数据`);
        return { success: true, platformName: platform.name, items: processedData };
      } else {
        return { success: false, platformName: platform.name, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logError(`抓取${platform.name}数据失败`, error);
      return { success: false, platformName: platform.name, error: errorMessage };
    }
  }

  /**
   * 处理新闻数据，应用过滤规则
   */
  private processNewsData(items: TrendItem[]): TrendItem[] {
    let processedItems = [...items];

    // 限制数量
    if (this.newsApiConfig.maxItems && processedItems.length > this.newsApiConfig.maxItems) {
      processedItems = processedItems.slice(0, this.newsApiConfig.maxItems);
      this.log(`限制数据数量为 ${this.newsApiConfig.maxItems} 条`);
    }

    // 过滤广告
    if (this.newsApiConfig.filterAds) {
      processedItems = processedItems.filter(item => {
        const title = item.title.toLowerCase();
        const description = (item.description || '').toLowerCase();
        
        const adKeywords = ['广告', '推广', 'sponsored', 'ad', 'promotion'];
        return !adKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );
      });
      this.log(`过滤广告后剩余 ${processedItems.length} 条数据`);
    }

    return processedItems;
  }

  /**
   * 获取平台统计信息
   */
  private getPlatformStats(items: TrendItem[]): {
    totalItems: number;
    withUrl: number;
  } {
    const totalItems = items.length;
    const withUrl = items.filter(item => item.url).length;

    return {
      totalItems,
      withUrl,
    };
  }

  /**
   * 获取所有平台统计信息
   */
  private getAllPlatformsStats(allPlatformData: Array<{ platformName: string; items: TrendItem[] }>): {
    totalPlatforms: number;
    totalItems: number;
    platforms: Array<{ platformName: string; totalItems: number; withUrl: number }>;
  } {
    const platforms = allPlatformData.map(platformData => {
      const stats = this.getPlatformStats(platformData.items);
      return {
        platformName: platformData.platformName,
        totalItems: stats.totalItems,
        withUrl: stats.withUrl,
      };
    });

    return {
      totalPlatforms: allPlatformData.length,
      totalItems: allPlatformData.reduce((sum, p) => sum + p.items.length, 0),
      platforms,
    };
  }

  /**
   * 执行流水线并返回详细结果
   */
  public async executeWithStats(): Promise<PipelineResult & { stats?: any }> {
    const startTime = new Date();
    const errors: string[] = [];

    this.log('开始执行新闻API流水线...');
    this.log(`平台数量: ${this.platforms.length}`);
    this.log(`平台列表: ${this.platforms.map(p => p.name).join(', ')}`);

    try {
      // 确保输出目录存在
      await this.ensureOutputDir();

      // 执行所有平台的抓取
      let allPlatformData: Array<{ platformName: string; items: TrendItem[] }> = [];
      
      if (this.newsApiConfig.parallel !== false) {
        // 并行执行
        this.log('🚀 开始并行执行所有平台流水线...');
        const pipelinePromises = this.platforms.map(platform => this.scrapePlatform(platform));
        const results = await Promise.allSettled(pipelinePromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success && result.value.items) {
            allPlatformData.push({
              platformName: result.value.platformName,
              items: result.value.items,
            });
          } else {
            const errorMsg = result.status === 'rejected' 
              ? 'Promise rejected' 
              : result.value.error || 'Unknown error';
            errors.push(`${this.platforms[index].name}: ${errorMsg}`);
            this.logError(`${this.platforms[index].name}抓取失败`, errorMsg);
          }
        });
      } else {
        // 顺序执行
        this.log('🚀 开始顺序执行所有平台流水线...');
        const delay = this.newsApiConfig.delayBetweenPlatforms || 1000;
        
        for (let i = 0; i < this.platforms.length; i++) {
          const platform = this.platforms[i];
          const result = await this.scrapePlatform(platform);
          
          if (result.success && result.items) {
            allPlatformData.push({
              platformName: result.platformName,
              items: result.items,
            });
          } else {
            errors.push(`${platform.name}: ${result.error || 'Unknown error'}`);
            this.logError(`${platform.name}抓取失败`, result.error);
          }
          
          // 最后一个平台不需要延迟
          if (i < this.platforms.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // 统计信息
      const stats = this.getAllPlatformsStats(allPlatformData);
      this.log(`\n📊 执行结果统计:`);
      this.log(`✅ 成功平台: ${stats.totalPlatforms}/${this.platforms.length}`);
      this.log(`📈 总数据量: ${stats.totalItems} 条`);
      stats.platforms.forEach(platform => {
        this.log(`  - ${platform.platformName}: ${platform.totalItems} 条（含链接 ${platform.withUrl} 条）`);
      });

      // 合并所有平台的数据
      const allItems: TrendItem[] = [];
      allPlatformData.forEach(platformData => {
        allItems.push(...platformData.items);
      });

      // 准备 processedData 用于导出器适配多平台格式
      const processedData = allPlatformData.length > 0 ? {
        totalPlatforms: allPlatformData.length,
        totalItems: allItems.length,
        platforms: allPlatformData.map(p => ({
          platformName: p.platformName,
          itemCount: p.items.length,
        })),
        allPlatformData: allPlatformData, // 保留原始多平台数据结构，供导出器使用
      } : undefined;

      // 使用父类的 exportData 方法导出数据
      const exportResults = allPlatformData.length > 0 
        ? await this.exportDataWithProcessedData(allItems, processedData)
        : [];

      // 更新索引文件
      await this.updateMarkdownIndex(this.config.markdownOutputDir || './data/markdown', this.pipelineName);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.log(`流水线执行完成，耗时: ${duration}ms`);

      return {
        success: errors.length === 0,
        scrapedData: allItems,
        exportResults: exportResults,
        errors: errors.length > 0 ? errors : undefined,
        startTime,
        endTime,
        duration,
        stats,
      };
    } catch (error) {
      this.logError('流水线执行过程中发生异常', error);
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      return {
        success: false,
        scrapedData: undefined,
        exportResults: undefined,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        startTime,
        endTime,
        duration,
      };
    }
  }

  /**
   * 重写 exportData 方法，支持传递 processedData 给导出器
   */
  protected async exportDataWithProcessedData(
    items: TrendItem[],
    processedData?: any
  ): Promise<any[]> {
    this.log('开始数据导出...');
    const results: any[] = [];

    for (const exporter of this.exporters) {
      try {
        // 调用导出器的 export 方法，传入 items 和 processedData
        // 导出器会根据 processedData 中的 allPlatformData 自动适配格式
        const result = await exporter.export(items, processedData);
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
   * 获取平台配置
   */
  public getPlatformConfig(): HotNewsPipelineConfig {
    return { ...this.newsApiConfig };
  }

  /**
   * 更新平台配置
   */
  public updatePlatformConfig(newConfig: Partial<HotNewsPipelineConfig>): void {
    this.newsApiConfig = { ...this.newsApiConfig, ...newConfig };
    this.updateConfig(newConfig);
    this.log('新闻API配置已更新');
  }
}