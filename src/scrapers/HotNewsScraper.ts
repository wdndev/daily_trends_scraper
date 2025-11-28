import { BaseScraper } from './BaseScraper';
import { TrendItem, ScraperConfig, ScrapeResult } from '../types';

/**
 * 新闻API响应接口
 */
interface HotNewsResponse {
  status: 'success' | 'cache' | 'error';
  items?: Array<{
    title: string;
    url?: string;
    mobileUrl?: string;
  }>;
  message?: string;
}

/**
 * 通用新闻API抓取器
 * 支持所有使用 newsnow.busiyi.world/api/s 的平台
 */
export class HotNewsScraper extends BaseScraper {
  // ========== 配置区域 ==========
  // API 基础地址
  private readonly API_BASE_URL = 'https://newsnow.busiyi.world/api/s';
  // 平台 ID（从配置中获取）
  private readonly platformId: string;
  // 平台名称（从配置中获取）
  private readonly platformName: string;
  // 最大重试次数
  private readonly MAX_RETRIES = 2;
  // 重试延迟（毫秒）
  private readonly RETRY_DELAY = 3000;
  // =============================

  constructor(config: ScraperConfig, platformId: string, platformName: string) {
    super(config, platformName);
    this.platformId = platformId;
    this.platformName = platformName;
  }

  /**
   * 重写scrape方法，使用新的API接口
   */
  public async scrape(): Promise<ScrapeResult> {
    const apiUrl = `${this.API_BASE_URL}?id=${this.platformId}`;
    let lastError: Error | null = null;

    // 重试逻辑
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`开始抓取 ${this.source}... (尝试 ${attempt + 1}/${this.MAX_RETRIES + 1})`);
        
        const response = await this.httpClient.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            ...this.config.headers,
          },
        });

        const apiData: HotNewsResponse = response.data;

        // 检查响应状态
        if (apiData.status === 'error') {
          throw new Error(apiData.message || 'API 返回错误状态');
        }

        // 解析数据
        const items = this.parseContent(JSON.stringify(apiData));
        
        const result = {
          success: true,
          data: items,
          source: this.source,
          timestamp: new Date(),
        };

        const statusInfo = apiData.status === 'success' ? '最新数据' : '缓存数据';
        console.log(`成功抓取 ${this.source}（${statusInfo}），共 ${items.length} 条数据`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < this.MAX_RETRIES) {
          const waitTime = this.RETRY_DELAY * (attempt + 1);
          console.log(`抓取 ${this.source} 失败: ${lastError.message}，${waitTime}ms 后重试...`);
          await this.delay(waitTime);
        } else {
          console.error(`抓取 ${this.source} 最终失败: ${lastError.message}`);
        }
      }
    }

    // 所有重试都失败
    return {
      success: false,
      data: [],
      error: lastError?.message || 'Unknown error',
      source: this.source,
      timestamp: new Date(),
    };
  }

  protected parseContent(jsonData: string): TrendItem[] {
    try {
      const data: HotNewsResponse = JSON.parse(jsonData);
      
      if (data.status === 'error') {
        throw new Error(data.message || `${this.platformName} API返回异常`);
      }

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error(`${this.platformName} API数据结构异常：缺少 items 字段`);
      }

      const items: TrendItem[] = [];

      data.items.forEach((item, index) => {
        // 跳过无效数据
        if (!item.title || item.title.trim() === '') {
          return;
        }

        const title = item.title.trim();
        // API返回的URL已经是电脑版本，直接使用
        const originalUrl = item.url || item.mobileUrl || '';
        
        // 只对微博的特殊URL格式进行转换（s.weibo.com -> m.weibo.cn）
        // 其他平台直接使用原URL（已经是电脑版本）
        const finalUrl = this.platformId === 'weibo' 
          ? this.convertWeiboUrl(originalUrl) 
          : originalUrl;

        items.push({
          id: `${this.platformId}-${index}-${Date.now()}`,
          title,
          description: '',
          url: finalUrl || undefined,
          source: this.platformName,
          timestamp: new Date(),
          metadata: {
            rank: index + 1,
            originalUrl: originalUrl,
            mobileUrl: item.mobileUrl,
          },
        });
      });

      return items;
    } catch (error) {
      console.error(`解析${this.platformName} API数据失败:`, error);
      return [];
    }
  }

  /**
   * 转换微博URL格式
   * API返回的URL已经是电脑版本，但微博的s.weibo.com格式需要转换为m.weibo.cn
   * 其他情况（包括m.weibo.cn、weibo.com等）直接返回原URL
   */
  private convertWeiboUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;

    try {
      // 只处理微博的s.weibo.com格式，转换为m.weibo.cn格式（电脑可打开）
      if (url.includes('s.weibo.com/weibo?')) {
        const urlObj = new URL(url);
        const query = urlObj.searchParams.get('q');
        if (query) {
          // 构建 m.weibo.cn 格式的链接
          const encodedQuery = encodeURIComponent(query);
          const containerid = `100103type%3D1%26t%3D10%26q%3D${encodedQuery}`;
          return `https://m.weibo.cn/search?containerid=${containerid}`;
        }
      }
      
      // 其他情况（m.weibo.cn、weibo.com等）已经是电脑版本，直接返回
      return url;
    } catch (e) {
      // URL 解析失败，返回原链接
      console.warn(`微博链接转换失败: ${url}`, e);
      return url;
    }
  }
}