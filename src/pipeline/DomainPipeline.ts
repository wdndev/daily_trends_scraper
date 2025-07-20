import { BasePipeline, PipelineConfig, PipelineResult } from './BasePipeline';
import { ArxivPapersScraper } from '../scrapers/ArxivPapersScraper';
import { JSONExporter } from '../exporters/JSONExporter';
import { MarkdownExporter } from '../exporters/MarkdownExporter';
import { ScraperConfig, ExporterConfig } from '../types';
import { BingTranslateProvider } from '../providers/BingTranslateProvider';
import { PaperAnalysisScraper } from '../providers/PaperAnalysisScraper';
import { TrendItem } from '../types';
import path from 'path';
import fs from 'fs';

/**
 * 领域流水线配置接口
 */
export interface DomainPipelineConfig extends Partial<PipelineConfig> {
  domain?: (
    | 'NLP'
    | 'LLM'
    | 'Agent'
    | 'AI'
    | 'CV'
    | 'Evaluation'
    | 'Multimodal'
    | 'Robotics'
  )[];
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
  private pipelineName: string;
  private translateProvider?: BingTranslateProvider;
  private paperAnalysisScraper?: PaperAnalysisScraper;
  constructor(config: DomainPipelineConfig = {}) {
    // 设置默认配置
    const defaultConfig: DomainPipelineConfig = {
      ...{
        jsonOutputDir: './data/json',
        markdownOutputDir: './data/markdown',
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

    const pipelineName = 'domain';

    defaultConfig.jsonOutputDir = path.join(
      defaultConfig.jsonOutputDir || './data/json',
      pipelineName
    );
    defaultConfig.markdownOutputDir = path.join(
      defaultConfig.markdownOutputDir || './data/markdown',
      pipelineName
    );

    // 创建导出器
    const exporters = DomainPipeline.createExporters(defaultConfig);

    // 调用父类构造函数
    super(scraper, exporters, defaultConfig as PipelineConfig);
    this.domainConfig = defaultConfig;
    this.pipelineName = pipelineName;

    this.translateProvider = new BingTranslateProvider();

    this.paperAnalysisScraper = new PaperAnalysisScraper();
  }

  /**
   * 获取流水线名称
   */
  protected getPipelineName(): string {
    return this.pipelineName;
  }

  /**
   * 创建导出器
   */
  private static createExporters(config: DomainPipelineConfig) {
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
      const jsonOutputDir = path.join(config.jsonOutputDir, yearMonthStr);
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
      const mdOutputDir = path.join(config.markdownOutputDir, yearMonthStr);
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
   * 重写数据抓取方法，只抓取指定领域的论文
   */
  protected async scrapeData(): Promise<any> {
    this.log(`开始抓取领域的论文...`);

    try {
      let domainItems: TrendItem[] = [];
      // 遍历domain列表抓取论文
      const domains = this.domainConfig.domain || ['LLM'];
      for (const domain of domains) {
        let items = await (
          this.scraper as ArxivPapersScraper
        ).getPapersByDomain(domain);
        if (this.domainConfig.filterByDate) {
          items = this.filterByDateRange(items);
        }
        if (
          this.domainConfig.maxResults &&
          items.length > this.domainConfig.maxResults
        ) {
          items = items.slice(0, this.domainConfig.maxResults);
        }
        if (this.domainConfig.includeFullText) {
          items = await this.enrichWithFullText(items);
        }
        // items的metadata添加domain
        // 添加翻译功能
        for (const item of items) {
          let zh_summary = '';
          let llm_analysis = '';
          if (this.translateProvider && item.description) {
            try {
              const translatedResult = await this.translateProvider.translate(
                item.description,
                'en',
                'zh-Hans'
              );
              zh_summary = translatedResult.translation;
            } catch (error) {
              console.error('翻译失败: ', error);
              zh_summary = `Translation Failed: ${error}`;
            }
          }
          try {
            let arxivId = item.metadata?.arxivId || '';
            console.log('arxivId: ', arxivId);
            if (this.paperAnalysisScraper && arxivId) {
              console.log('开始分析论文: ', arxivId);
              llm_analysis =
                await this.paperAnalysisScraper.fetchInterpretation(arxivId);
              console.log('论文分析完成: ', arxivId);
            }
          } catch (error) {
            console.error('获取论文分析失败: ', error);
            llm_analysis = `LLM Analysis Failed: ${error}`;
          }
          item.metadata = {
            ...item.metadata,
            domain: `${domain}`,
            zh_summary: zh_summary,
            llm_analysis: llm_analysis,
          };
          item.source = `ArXiv Domain`;
        }
        this.log(`成功抓取 ${items.length} 篇 ${domain} 论文`);
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
    } finally {
      if (this.paperAnalysisScraper) {
        await this.paperAnalysisScraper.close();
      }
    }
  }

  public getDomainStats(items: TrendItem[]): {
    totalItems: number;
    withFullText: number;
  } {
    return {
      totalItems: items.length,
      withFullText: items.filter(item => item.metadata?.hasFullText).length,
    };
  }

  /**
   * 执行领域论文抓取并返回详细结果
   */
  public async executeWithStats(): Promise<PipelineResult & { stats?: any }> {
    const result = await this.execute();
    if (result.success && result.scrapedData) {
      const stats = this.getDomainStats(result.scrapedData);
      this.log(
        `领域论文统计: 总计${stats.totalItems}篇，含全文${stats.withFullText}篇`
      );

      // 更新索引文件
      await this.updateMarkdownIndex(
        this.config.markdownOutputDir || './data/markdown',
        this.pipelineName
      );

      return {
        ...result,
        stats,
      };
    }
    return result;
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
          const fullText = await (
            this.scraper as ArxivPapersScraper
          ).getPaperFullText(item.url);
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
          fullTextError:
            error instanceof Error ? error.message : 'Unknown error',
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
      const paperInfo = await (
        this.scraper as ArxivPapersScraper
      ).getFullPaperInfo(arxivUrl);
      return paperInfo;
    } catch (error) {
      this.logError('获取论文详细信息失败', error);
      throw error;
    }
  }
}
