import { BasePipeline, PipelineConfig, PipelineResult } from './BasePipeline';
import { GitHubTrendingScraper } from '../scrapers/GitHubTrendingScraper';
import { JSONExporter } from '../exporters/JSONExporter';
import { MarkdownExporter } from '../exporters/MarkdownExporter';
import { ScraperConfig, ExporterConfig } from '../types';
import { TrendItem } from '../types';

/**
 * GitHub Trending流水线配置接口
 */
import { ProxyConfig } from '../types/scraper.types';

export interface GithubTrendingPipelineConfig extends Partial<PipelineConfig> {
  maxItems?: number;
  languages?: string[];  // 多语言列表，用于生成多语言trending
  timeRange?: string;  // 时间范围：daily, weekly, monthly
  includeDescription?: boolean;  // 是否包含项目描述
  includeStars?: boolean;  // 是否包含星标数
  includeForks?: boolean;  // 是否包含Fork数
  proxy?: ProxyConfig;  // 代理配置
}

/**
 * GitHub Trending处理流水线
 * 继承BasePipeline，实现GitHub Trending的抓取和导出
 */
export class GithubTrendingPipeline extends BasePipeline {
  private githubConfig: GithubTrendingPipelineConfig;

  constructor(config: GithubTrendingPipelineConfig = {}) {
    // 设置默认配置
    const defaultConfig: GithubTrendingPipelineConfig = {
      ...{
        jsonOutputDir: './data/github/json',
        markdownOutputDir: './data/github/markdown',
        maxItems: 25,
        languages: ['python'],  // 默认只包含Python
        timeRange: 'daily',  // 默认每日趋势
        includeDescription: true,
        includeStars: true,
        includeForks: true,
        proxy: undefined,  // 默认不使用代理
      },
      ...config,
    };

    // 创建GitHub Trending抓取器
    const scraperConfig: ScraperConfig = {
      url: GithubTrendingPipeline.buildGitHubUrl('', defaultConfig.timeRange || 'daily'),
      timeout: defaultConfig.timeout || 30000,
      retries: defaultConfig.maxRetries || 3,
      proxy: defaultConfig.proxy,  // 添加代理支持
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    };

    const scraper = new GitHubTrendingScraper(scraperConfig);

    // 创建导出器
    const exporters = GithubTrendingPipeline.createExporters(defaultConfig);

    // 调用父类构造函数
    super(scraper, exporters, defaultConfig as PipelineConfig);

    this.githubConfig = defaultConfig;
  }

  /**
   * 获取流水线名称
   */
  protected getPipelineName(): string {
    return 'github';
  }

  /**
   * 构建GitHub Trending URL
   */
  private static buildGitHubUrl(language: string, timeRange: string): string {
    let url = 'https://github.com/trending';
    
    // 如果有指定语言，添加到URL路径中
    if (language && language.trim() !== '') {
      url += `/${language}`;
    }
    
    // 如果有时间范围且不是默认的daily，添加查询参数
    if (timeRange && timeRange !== 'daily') {
      const params = new URLSearchParams();
      params.append('since', timeRange);
      url += `?${params.toString()}`;
    }
    
    return url;
  }

  /**
   * 解析代理字符串为ProxyConfig对象
   */
  private static parseProxyString(proxyString: string): ProxyConfig {
    try {
      const url = new URL(proxyString);
      const proxyConfig: ProxyConfig = {
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
        protocol: url.protocol === 'https:' ? 'https' : 'http',
      };

      // 如果有用户名和密码
      if (url.username && url.password) {
        proxyConfig.auth = {
          username: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
        };
      }

      return proxyConfig;
    } catch (error) {
      throw new Error(`Invalid proxy URL format: ${proxyString}. Expected format: http://host:port or https://host:port`);
    }
  }

  /**
   * 创建导出器
   */
  private static createExporters(config: GithubTrendingPipelineConfig) {
    const exporters = [];

    // 生成默认文件名
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeSuffix = config.timeRange !== 'daily' ? `_${config.timeRange}` : '';
    const defaultFilename = `github_trending${timeSuffix}_${dateStr}`;

    // 只有当jsonOutputDir不为空时才创建JSON导出器
    if (config.jsonOutputDir) {
      const jsonExporterConfig: ExporterConfig = {
        format: 'json',
        outputDir: config.jsonOutputDir,
        filename: `${defaultFilename}.json`,
      };
      exporters.push(new JSONExporter(jsonExporterConfig));
    }

    // 只有当markdownOutputDir不为空时才创建GitHub Markdown导出器
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
   * 重写数据抓取方法，添加GitHub特定的处理逻辑
   */
  protected async scrapeData() {
    this.log('开始抓取GitHub Trending数据...');
    
    const result = await super.scrapeData();
    
    if (result.success && result.data) {
      // 应用GitHub特定的过滤和处理
      const processedData = this.processGithubData(result.data);
      result.data = processedData;
      
      this.log(`GitHub数据处理完成，过滤后剩余 ${processedData.length} 条数据`);
    }
    
    return result;
  }

  /**
   * 获取多语言trending数据
   */
  public async getMultiLanguageData(): Promise<Record<string, TrendItem[]>> {
    const multiLanguageData: Record<string, TrendItem[]> = {};
    
    // 如果languages为空，返回空对象（表示只获取全站trending）
    if (!this.githubConfig.languages || this.githubConfig.languages.length === 0) {
      this.log('languages为空，只获取全站trending数据');
      return multiLanguageData;
    }
    
    for (const language of this.githubConfig.languages) {
      this.log(`开始抓取 ${language} 语言trending数据...`);
      
      try {
        // 创建临时配置
        const tempConfig = {
          ...this.githubConfig,
          language,
          maxItems: this.githubConfig.maxItems || 10,
        };

        const lang_url = GithubTrendingPipeline.buildGitHubUrl(language, tempConfig.timeRange || 'daily');

        console.log(lang_url);
        
        // 创建临时抓取器
        const scraperConfig: ScraperConfig = {
          url: lang_url,
          timeout: tempConfig.timeout || 30000,
          retries: tempConfig.maxRetries || 3,
          proxy: tempConfig.proxy,  // 添加代理支持
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
        };
        
        const scraper = new GitHubTrendingScraper(scraperConfig);
        const result = await scraper.scrape();
        
        if (result.success && result.data) {
          const processedData = this.processGithubData(result.data);
          // 为每个数据项添加语言标识
          const dataWithLanguage = processedData.map(item => ({
            ...item,
            language: language,
          }));
          multiLanguageData[language] = dataWithLanguage;
          this.log(`成功获取 ${language} 语言数据 ${dataWithLanguage.length} 条`);
        } else {
          this.log(`获取 ${language} 语言数据失败`);
          multiLanguageData[language] = [];
        }
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.logError(`获取 ${language} 语言数据时发生错误`, error);
        multiLanguageData[language] = [];
      }
    }
    
    return multiLanguageData;
  }

  /**
   * 处理GitHub数据，应用过滤规则
   */
  private processGithubData(items: TrendItem[]): TrendItem[] {
    let processedItems = [...items];

    // 限制数量
    if (this.githubConfig.maxItems && processedItems.length > this.githubConfig.maxItems) {
      processedItems = processedItems.slice(0, this.githubConfig.maxItems);
      this.log(`限制数据数量为 ${this.githubConfig.maxItems} 条`);
    }

    // 处理描述信息
    if (!this.githubConfig.includeDescription) {
      processedItems = processedItems.map(item => ({
        ...item,
        description: '',
      }));
    }

    // 处理元数据
    processedItems = processedItems.map(item => {
      const metadata = { ...item.metadata };
      
      if (!this.githubConfig.includeStars && metadata.stars) {
        delete metadata.stars;
      }
      
      if (!this.githubConfig.includeForks && metadata.forks) {
        delete metadata.forks;
      }
      
      return {
        ...item,
        metadata,
      };
    });

    return processedItems;
  }

  /**
   * 获取GitHub Trending统计信息
   */
  public getGithubStats(items: TrendItem[]): {
    totalItems: number;
    withDescription: number;
    withStars: number;
    withForks: number;
    avgStars: number;
    topLanguage?: string;
  } {
    const totalItems = items.length;
    const withDescription = items.filter(item => 
      item.description && item.description.trim().length > 0
    ).length;
    const withStars = items.filter(item => 
      item.metadata?.stars !== undefined
    ).length;
    const withForks = items.filter(item => 
      item.metadata?.forks !== undefined
    ).length;
    
    const starsValues = items
      .map(item => {
        const stars = item.metadata?.stars;
        if (!stars) return 0;
        
        const starsStr = String(stars);
        const numericValue = parseFloat(starsStr.replace(/[^\d.]/g, ''));
        return isNaN(numericValue) ? 0 : numericValue;
      })
      .filter(value => value > 0);
    
    const avgStars = starsValues.length > 0 
      ? starsValues.reduce((sum, val) => sum + val, 0) / starsValues.length 
      : 0;

    // 统计最热门的编程语言
    const languageCounts: Record<string, number> = {};
    items.forEach(item => {
      const language = item.metadata?.language;
      if (language) {
        languageCounts[language] = (languageCounts[language] || 0) + 1;
      }
    });
    
    const topLanguage = Object.keys(languageCounts).length > 0
      ? Object.entries(languageCounts).sort(([,a], [,b]) => b - a)[0][0]
      : undefined;

    return {
      totalItems,
      withDescription,
      withStars,
      withForks,
      avgStars: Math.round(avgStars),
      topLanguage,
    };
  }

  /**
   * 重写数据导出方法，支持多语言数据
   */
  protected async exportData(items: TrendItem[]): Promise<any[]> {
    this.log('开始数据导出...');
    const results: any[] = [];

    // 获取多语言数据
    let multiLanguageData: Record<string, TrendItem[]> = {};
    if (this.githubConfig.languages && this.githubConfig.languages.length > 0) {
      multiLanguageData = await this.getMultiLanguageData();
    }

    // 合并所有数据到一个数组
    let allData: TrendItem[] = [];
    
    // 添加全站trending数据（标记为全局）
    const globalData = items.map(item => ({
      ...item,
      language: 'global',  // 标记为全局trending
    }));
    allData.push(...globalData);
    
    // 添加多语言数据
    for (const [language, languageData] of Object.entries(multiLanguageData)) {
      allData.push(...languageData);
    }

    this.log(`合并后总数据量: ${allData.length} 条 (全局: ${globalData.length} 条, 多语言: ${allData.length - globalData.length} 条)`);

    for (const exporter of this.exporters) {
      try {
        let result;
        
        // // 所有导出器都使用合并后的数据
        // if (exporter instanceof MarkdownExporter) {
        //   result = await exporter.export(allData);
        // } else {
        //   result = await exporter.export(allData);
        // }
        // 
        result = await exporter.export(allData);        
        

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
   * 执行GitHub流水线并返回详细结果
   */
  public async executeWithStats(): Promise<PipelineResult & { stats?: any }> {
    const result = await this.execute();
    
    if (result.success && result.scrapedData) {
      const stats = this.getGithubStats(result.scrapedData);
      this.log(`GitHub Trending统计: 总计${stats.totalItems}条，含描述${stats.withDescription}条，含星标${stats.withStars}条，含Fork${stats.withForks}条，平均星标${stats.avgStars}，热门语言${stats.topLanguage || '无'}`);
      
      return {
        ...result,
        stats,
      };
    }
    
    return result;
  }

  /**
   * 获取GitHub配置
   */
  public getGithubConfig(): GithubTrendingPipelineConfig {
    return { ...this.githubConfig };
  }

  /**
   * 更新GitHub配置
   */
  public updateGithubConfig(newConfig: Partial<GithubTrendingPipelineConfig>): void {
    this.githubConfig = { ...this.githubConfig, ...newConfig };
    this.updateConfig(newConfig);
    this.log('GitHub配置已更新');
  }

  /**
   * 设置编程语言列表
   */
  public setLanguages(languages: string[]): void {
    this.githubConfig.languages = languages;
    this.log(`设置编程语言列表: ${languages.join(', ')}`);
  }

  /**
   * 设置时间范围
   */
  public setTimeRange(timeRange: 'daily' | 'weekly' | 'monthly'): void {
    this.githubConfig.timeRange = timeRange;
    this.log(`设置时间范围: ${timeRange}`);
  }
} 