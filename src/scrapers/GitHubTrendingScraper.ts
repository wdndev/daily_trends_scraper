import * as cheerio from 'cheerio';
import { BaseScraper } from './BaseScraper';
import { TrendItem, ScraperConfig } from '../types';

export class GitHubTrendingScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config, 'GitHub Trending');
  }

  protected parseContent(html: string): TrendItem[] {
    const $ = cheerio.load(html);
    const items: TrendItem[] = [];

    // 解析GitHub Trending页面
    $('article.Box-row').each((index, element) => {
      const $el = $(element);

      // 仓库名和作者
      const title = $el.find('h2 > a').text().trim().replace(/\s/g, '');
      const [author, name] = title.split('/');

      // 仓库链接
      const href = $el.find('h2 > a').attr('href');
      const url = href ? 'https://github.com' + href.trim() : '';

      // 描述
      const description = $el.find('p').text().trim();

      // 语言
      const language = $el.find('[itemprop=programmingLanguage]').text().trim() || 'N/A';

      // stars
      const stars = $el.find('a[href$="/stargazers"]').text().trim().replace(/,/g, '');

      // forks
      const forks = $el.find('a[href$="/network/members"]').text().trim().replace(/,/g, '');

      if (title && author && name && url) {
        items.push({
          id: `github-${index}-${Date.now()}`,
          title: `${author}/${name}`,
          description,
          url,
          source: 'GitHub Trending',
          timestamp: new Date(),
          metadata: {
            author,
            name,
            language,
            stars: parseInt(stars) || 0,
            forks: parseInt(forks) || 0,
            rank: index + 1,
          },
        });
      }
    });

    return items.slice(0, 25); // 限制返回前25个
  }
} 