import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { TrendItem, ScraperConfig, ScrapeResult, ProxyConfig } from '../types';

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected httpClient: AxiosInstance;
  protected source: string;

  constructor(config: ScraperConfig, source: string) {
    this.config = config;
    this.source = source;
    
    const axiosConfig: AxiosRequestConfig = {
      timeout: config.timeout || 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...config.headers,
      },
    };

    // 添加代理配置
    if (config.proxy) {
      const protocol = config.proxy.protocol || 'http';
      const auth = config.proxy.auth ? `${config.proxy.auth.username}:${config.proxy.auth.password}@` : '';
      axiosConfig.proxy = {
        host: config.proxy.host,
        port: config.proxy.port,
        protocol,
        auth: config.proxy.auth,
      };
      console.log(`使用代理: ${protocol}://${auth}${config.proxy.host}:${config.proxy.port}`);
    }

    this.httpClient = axios.create(axiosConfig);
  }

  /**
   * 抽象方法：子类必须实现具体的抓取逻辑
   */
  protected abstract parseContent(content: string): TrendItem[];

  /**
   * 执行抓取
   */
  public async scrape(): Promise<ScrapeResult> {
    try {
      console.log(`开始抓取 ${this.source}...`);
      
      const response = await this.httpClient.get(this.config.url);
      const items = this.parseContent(response.data);
      
      const result: ScrapeResult = {
        success: true,
        data: items,
        source: this.source,
        timestamp: new Date(),
      };

      console.log(`成功抓取 ${this.source}，共 ${items.length} 条数据`);
      return result;
    } catch (error) {
      console.error(`抓取 ${this.source} 失败:`, error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: this.source,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 重试机制
   */
  protected async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (i < maxRetries - 1) {
          console.log(`重试第 ${i + 1} 次...`);
          await this.delay(1000 * (i + 1)); // 指数退避
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 