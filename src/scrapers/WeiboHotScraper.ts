import { BaseScraper } from './BaseScraper';
import { TrendItem, ScraperConfig, ScrapeResult } from '../types';

/**
 * 微博热搜API响应接口
 */
interface WeiboApiResponse {
  ok: number;
  data: {
    cards: Array<{
      card_group: Array<{
        desc: string;
        desc_extr: string;
        scheme: string;
        mblog?: {
          text: string;
          user: {
            screen_name: string;
          };
        };
      }>;
    }>;
  };
}

export class WeiboHotScraper extends BaseScraper {
  private readonly TRENDING_URL = 'https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot';

  constructor(config: ScraperConfig) {
    super(config, 'Weibo Hot');
  }

  /**
   * 重写scrape方法，直接调用微博API
   */
  public async scrape(): Promise<ScrapeResult> {
    try {
      console.log(`开始抓取 ${this.source}...`);
      
      // 使用自定义的API URL和headers
      const response = await this.httpClient.get(this.TRENDING_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://m.weibo.cn/',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const items = this.parseContent(JSON.stringify(response.data));
      
      const result = {
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

  protected parseContent(jsonData: string): TrendItem[] {
    try {
      const data: WeiboApiResponse = JSON.parse(jsonData);
      
      if (data.ok !== 1) {
        throw new Error('微博API返回异常');
      }

      const items: TrendItem[] = [];
      const cardGroup = data.data.cards[0]?.card_group;

      if (!cardGroup || !Array.isArray(cardGroup)) {
        throw new Error('微博API数据结构异常');
      }

      cardGroup.forEach((item, index) => {
        // 跳过广告和无效数据
        if (!item.desc || item.desc.includes('广告') || item.desc.includes('推广')) {
          return;
        }

        const title = item.desc.trim();
        const hotValue = item.desc_extr || '';
        const url = item.scheme || '';
        
        // 提取用户信息（如果有）
        const user = item.mblog?.user?.screen_name || '';

        items.push({
          id: `weibo-${index}-${Date.now()}`,
          title,
          description: user ? `用户: ${user}` : '',
          url: url.startsWith('http') ? url : undefined,
          source: 'Weibo Hot',
          timestamp: new Date(),
          metadata: {
            hotValue,
            rank: index + 1,
            user,
            descExtr: item.desc_extr,
          },
        });
      });

      return items.slice(0, 55); // 限制返回前50个
    } catch (error) {
      console.error('解析微博API数据失败:', error);
      return [];
    }
  }
} 