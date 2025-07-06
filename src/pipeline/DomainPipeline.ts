import { BasePipeline, PipelineConfig, PipelineResult } from './BasePipeline';
import { ArxivPapersScraper } from '../scrapers/ArxivPapersScraper';
import { JSONExporter } from '../exporters/JSONExporter';
import { MarkdownExporter } from '../exporters/MarkdownExporter';
import { ScraperConfig, ExporterConfig } from '../types';
import { TrendItem } from '../types';

/**
 * 领域流水线配置接口
 */
export interface DomainPipelineConfig extends Partial<PipelineConfig> {
  domain?: ('NLP' | 'LLM' | 'Agent' | 'AI' | 'CV' | 'Evaluation' | 'Multimodal' | 'Robotics')[];
  maxResults?: number;
  includeFullText?: boolean;
  filterByDate?: {
    startDate?: string;
    endDate?: string;
  };
}

/**
 * 领域流水线类
 * 专门用于抓取特定领域的arXiv论文
 */
export class DomainPipeline extends BasePipeline {
  private domainConfig: DomainPipelineConfig;

  constructor(config: DomainPipelineConfig = {}) {
    // 设置默认配置
    const defaultConfig: DomainPipelineConfig = {
      ...{
        jsonOutputDir: './data_pipeline/domain/json',
        markdownOutputDir: './data_pipeline/domain/markdown',
        domain: ['LLM'], // 默认使用LLM领域
        maxResults: 10,
        includeFullText: false,
        timeout: 30000,
        maxRetries: 3,
        enableLogging: true,
      },
      ...config,
    };

    // 去重domain列表
    if (defaultConfig.domain) {
      defaultConfig.domain = [...new Set(defaultConfig.domain)];
    }

    // 创建ArxivPapersScraper实例
    const scraperConfig: ScraperConfig = {
      url: 'https://arxiv.org/api/query',
      timeout: defaultConfig.timeout || 30000,
    };

    const scraper = new ArxivPapersScraper(scraperConfig);

    // 创建导出器
    const exporters = DomainPipeline.createExporters(defaultConfig);

    // 调用父类构造函数
    super(scraper, exporters, defaultConfig as PipelineConfig);
    this.domainConfig = defaultConfig;
  }

  /**
   * 获取流水线名称
   */
  protected getPipelineName(): string {
    return "domain";
  }

  /**
   * 创建导出器
   */
  private static createExporters(config: DomainPipelineConfig) {
    const exporters = [];

    // 生成默认文件名
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const defaultFilename = `arxiv_domain_${dateStr}`;

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
   * 重写数据抓取方法，只抓取指定领域的论文
   */
  protected async scrapeData(): Promise<any> {
    this.log(`开始抓取领域的论文...`);
    
    try {
        let domainItems: TrendItem[] = [];
        // 遍历domain列表抓取论文
        const domains = this.domainConfig.domain || ['LLM'];
        for (const domain of domains) {
            let items = await (this.scraper as ArxivPapersScraper).getPapersByDomain(domain);
            if (this.domainConfig.filterByDate) {
                items = this.filterByDateRange(items);
            }
            if (this.domainConfig.maxResults && items.length > this.domainConfig.maxResults) {
                items = items.slice(0, this.domainConfig.maxResults);
            }
            if (this.domainConfig.includeFullText) {
                items = await this.enrichWithFullText(items);
            }
            // items的metadata添加domain
            items.forEach(item => {
                item.metadata = {
                    ...item.metadata,
                    domain: `${domain}`
                };
                item.source = `ArXiv Domain`;
            });
            this.log(`成功抓取 ${items.length} 篇论文`);
            domainItems.push(...items);
        }   

      return {
        success: true,
        data: domainItems,    
        source: `ArXiv ${this.domainConfig.domain}`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logError('领域论文抓取失败', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: `ArXiv ${this.domainConfig.domain}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 按日期范围过滤论文
   */
  private filterByDateRange(items: TrendItem[]): TrendItem[] {
    const { startDate, endDate } = this.domainConfig.filterByDate!;
    
    return items.filter(item => {
      const itemDate = item.timestamp;
      
      if (startDate) {
        const start = new Date(startDate);
        if (itemDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (itemDate > end) return false;
      }
      
      return true;
    });
  }

  /**
   * 为论文添加全文内容
   */
  private async enrichWithFullText(items: TrendItem[]): Promise<TrendItem[]> {
    this.log('开始获取论文全文内容...');
    
    const enrichedItems: TrendItem[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.log(`获取全文 ${i + 1}/${items.length}: ${item.title}`);
      
      try {
        if (item.url) {
          const fullText = await (this.scraper as ArxivPapersScraper).getPaperFullText(item.url);
          if (fullText) {
            // 将全文内容添加到元数据中
            item.metadata = {
              ...item.metadata,
              fullText: fullText.substring(0, 10000), // 限制长度避免文件过大
              hasFullText: true,
            };
          } else {
            item.metadata = {
              ...item.metadata,
              hasFullText: false,
            };
          }
        }
        enrichedItems.push(item);
      } catch (error) {
        this.logError(`获取论文全文失败: ${item.title}`, error);
        item.metadata = {
          ...item.metadata,
          hasFullText: false,
          fullTextError: error instanceof Error ? error.message : 'Unknown error',
        };
        enrichedItems.push(item);
      }
      
      // 添加延迟避免请求过于频繁
      if (i < items.length - 1) {
        await this.delay(1000);
      }
    }
    
    this.log('全文内容获取完成');
    return enrichedItems;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取领域配置
   */
  public getDomainConfig(): DomainPipelineConfig {
    return this.domainConfig;
  }
  /**
   * 获取特定论文的详细信息
   */
  public async getPaperDetails(arxivUrl: string): Promise<any> {
    try {
      this.log(`获取论文详细信息: ${arxivUrl}`);
      const paperInfo = await (this.scraper as ArxivPapersScraper).getFullPaperInfo(arxivUrl);
      return paperInfo;
    } catch (error) {
      this.logError('获取论文详细信息失败', error);
      throw error;
    }
  }


}
