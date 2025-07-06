import * as cheerio from 'cheerio';
import { BaseScraper } from './BaseScraper';
import { TrendItem, ScraperConfig } from '../types';

export class HuggingFacePapersScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config, 'HuggingFace Papers');
  }

  protected parseContent(html: string): TrendItem[] {
    const $ = cheerio.load(html);
    const items: TrendItem[] = [];

    // 解析HuggingFace Papers页面
    $('article').each((index, element) => {
      const $element = $(element);
      
      const titleElement = $element.find('h3 a');
      let title = titleElement.text().trim();
      const url = titleElement.attr('href');
      
      const description = $element.find('p').text().trim();
      const authors = $element.find('.author').text().trim();
      const date = $element.find('.date').text().trim();
      
      // 清理标题：移除换行符和多余空格，合并为一行
      if (title) {
        title = this.cleanTitle(title);
        
        items.push({
          id: `hf-${index}-${Date.now()}`,
          title,
          description,
          url: url ? `https://huggingface.co${url}` : undefined,
          source: 'HuggingFace Papers',
          timestamp: new Date(),
          metadata: {
            authors,
            date,
            rank: index + 1,
          },
        });
      }
    });

    return items.slice(0, 20); // 限制返回前20个
  }

  /**
   * 清理标题，将多行标题合并为一行
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/\n/g, ' ') // 将换行符替换为空格
      .replace(/\r/g, ' ') // 将回车符替换为空格
      .replace(/\t/g, ' ') // 将制表符替换为空格
      .replace(/\s+/g, ' ') // 将多个连续空格替换为单个空格
      .trim(); // 移除首尾空格
  }
} 