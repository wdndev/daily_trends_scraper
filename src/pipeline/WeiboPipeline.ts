import { BasePipeline, PipelineConfig, PipelineResult } from './BasePipeline';
import { WeiboHotScraper } from '../scrapers/WeiboHotScraper';
import { JSONExporter } from '../exporters/JSONExporter';
import { MarkdownExporter } from '../exporters/MarkdownExporter';
import { ScraperConfig, ExporterConfig } from '../types';
import { TrendItem } from '../types';

/**
 * 微博流水线配置接口
 */
export interface WeiboPipelineConfig extends Partial<PipelineConfig> {
  maxItems?: number;
  filterAds?: boolean;
  includeUserInfo?: boolean;
}

/**
 * 微博热搜处理流水线
 * 继承BasePipeline，实现微博热搜的抓取和导出
 */
export class WeiboPipeline extends BasePipeline {
  private weiboConfig: WeiboPipelineConfig;

  constructor(config: WeiboPipelineConfig = {}) {
    // 设置默认配置
    const defaultConfig: WeiboPipelineConfig = {
      ...{
        jsonOutputDir: './data/weibo/json',
        markdownOutputDir: './data/weibo/markdown',
        maxItems: 55,
        filterAds: true,
        includeUserInfo: true,
      },
      ...config,
    };

    // 创建微博热搜抓取器
    const scraperConfig: ScraperConfig = {
      url: 'https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot',
      timeout: defaultConfig.timeout || 30000,
      retries: defaultConfig.maxRetries || 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://m.weibo.cn/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };

    const scraper = new WeiboHotScraper(scraperConfig);

    // 创建导出器
    const exporters = WeiboPipeline.createExporters(defaultConfig);

    // 调用父类构造函数
    super(scraper, exporters, defaultConfig as PipelineConfig);

    this.weiboConfig = defaultConfig;
  }

  /**
   * 获取流水线名称
   */
  protected getPipelineName(): string {
    return 'weibo';
  }

  /**
   * 创建导出器
   */
  private static createExporters(config: WeiboPipelineConfig) {
    const exporters = [];

    // 生成默认文件名
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const defaultFilename = `weibo_${dateStr}`;

    // 只有当jsonOutputDir不为空时才创建JSON导出器
    if (config.jsonOutputDir) {
      const jsonExporterConfig: ExporterConfig = {
        format: 'json',
        outputDir: config.jsonOutputDir,
        filename: `${defaultFilename}.json`,
      };
      exporters.push(new JSONExporter(jsonExporterConfig));
    }

    // 只有当markdownOutputDir不为空时才创建Markdown导出器
    if (config.markdownOutputDir) {
      const mdExporterConfig: ExporterConfig = {
        format: 'markdown',
        outputDir: config.markdownOutputDir,
        filename: `${defaultFilename}.md`,
      };
      exporters.push(new MarkdownExporter(mdExporterConfig));
    }

    return exporters;
  }

  /**
   * 重写数据抓取方法，添加微博特定的处理逻辑
   */
  protected async scrapeData() {
    this.log('开始抓取微博热搜数据...');
    
    const result = await super.scrapeData();
    
    if (result.success && result.data) {
      // 应用微博特定的过滤和处理
      const processedData = this.processWeiboData(result.data);
      result.data = processedData;
      
      this.log(`微博数据处理完成，过滤后剩余 ${processedData.length} 条数据`);
    }
    
    return result;
  }

  /**
   * 处理微博数据，应用过滤规则
   */
  private processWeiboData(items: TrendItem[]): TrendItem[] {
    let processedItems = [...items];

    // 限制数量
    if (this.weiboConfig.maxItems && processedItems.length > this.weiboConfig.maxItems) {
      processedItems = processedItems.slice(0, this.weiboConfig.maxItems);
      this.log(`限制数据数量为 ${this.weiboConfig.maxItems} 条`);
    }

    // 过滤广告
    if (this.weiboConfig.filterAds) {
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

    // 处理用户信息
    if (!this.weiboConfig.includeUserInfo) {
      processedItems = processedItems.map(item => ({
        ...item,
        description: item.description?.replace(/^用户:\s*/, '') || '',
      }));
    }

    return processedItems;
  }

  /**
   * 获取微博热搜统计信息
   */
  public getWeiboStats(items: TrendItem[]): {
    totalItems: number;
    withUserInfo: number;
    withUrl: number;
    avgHotValue: number;
  } {
    const totalItems = items.length;
    const withUserInfo = items.filter(item => 
      item.description && item.description.includes('用户:')
    ).length;
    const withUrl = items.filter(item => item.url).length;
    
    const hotValues = items
      .map(item => {
        const hotValue = item.metadata?.hotValue;
        if (!hotValue) return 0;
        
        // 确保hotValue是字符串类型
        const hotValueStr = String(hotValue);
        const numericValue = parseFloat(hotValueStr.replace(/[^\d.]/g, ''));
        return isNaN(numericValue) ? 0 : numericValue;
      })
      .filter(value => value > 0);
    
    const avgHotValue = hotValues.length > 0 
      ? hotValues.reduce((sum, val) => sum + val, 0) / hotValues.length 
      : 0;

    return {
      totalItems,
      withUserInfo,
      withUrl,
      avgHotValue: Math.round(avgHotValue),
    };
  }

  /**
   * 执行微博流水线并返回详细结果
   */
  public async executeWithStats(): Promise<PipelineResult & { stats?: any }> {
    const result = await this.execute();
    
    if (result.success && result.scrapedData) {
      const stats = this.getWeiboStats(result.scrapedData);
      this.log(`微博热搜统计: 总计${stats.totalItems}条，含用户信息${stats.withUserInfo}条，含链接${stats.withUrl}条，平均热度${stats.avgHotValue}`);
      
      return {
        ...result,
        stats,
      };
    }
    
    return result;
  }

  /**
   * 获取微博配置
   */
  public getWeiboConfig(): WeiboPipelineConfig {
    return { ...this.weiboConfig };
  }

  /**
   * 更新微博配置
   */
  public updateWeiboConfig(newConfig: Partial<WeiboPipelineConfig>): void {
    this.weiboConfig = { ...this.weiboConfig, ...newConfig };
    this.updateConfig(newConfig);
    this.log('微博配置已更新');
  }
} 