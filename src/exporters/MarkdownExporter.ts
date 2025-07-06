import { BaseExporter } from './BaseExporter';
import { TrendItem } from '../types';
import moment from 'moment';

export class MarkdownExporter extends BaseExporter {
  protected formatData(items: TrendItem[], processedData?: any): string {
    const dateStr = moment().format('YYYY-MM-DD');
    const time = moment().format('HH:mm:ss');
    
    // 按来源分组
    const groupedItems = this.groupBySource(items);
    
    let markdown = '';
    
    // 处理每个来源的数据
    for (const [source, sourceItems] of Object.entries(groupedItems)) {
      switch (source) {
        case 'GitHub Trending':
          markdown += this.generateGitHubMarkdown(sourceItems, dateStr);
          break;
        case 'Weibo Hot':
          markdown += this.generateWeiboMarkdown(sourceItems, dateStr);
          break;
        case 'HuggingFace Papers':
          markdown += this.generateHuggingFaceMarkdown(sourceItems, dateStr);
          break;
        case 'ArXiv Domain':
          markdown += this.generateArXivDomainMarkdown(sourceItems, dateStr);
          break;
        default:
          markdown += this.generateDefaultMarkdown(sourceItems, source, dateStr, time);
      }
    }

    // 添加LLM处理结果
    if (processedData?.content) {
      markdown += `## AI 分析摘要\n\n`;
      markdown += `${processedData.content}\n\n`;
    }

    return markdown;
  }

  private generateGitHubMarkdown(items: TrendItem[], dateStr: string): string {
    let md = `---\ntitle: GitHub Trending ${dateStr}\ndate: 2019-06-18\nauthor: wdndev\ntags: [GitHub, Trending]\ncategories: \n- GitHub\nhidden: true\ncomments: false\n---\n\n`;
    md += `> 数据来源：[github.com/trending](https://github.com/trending)\n\n`;
    // md += `## Any Languages\n\n`;
    let pre_language = '';
    items.forEach(repo => {
      if (repo.language !== pre_language) {
        md += `## ${repo.language} Languages\n\n`;
        pre_language = repo.language || '';
      }
      const metadata = repo.metadata || {};
      md += `### [${repo.title}](${repo.url})\n`;
      if (repo.description) md += `${repo.description}\n\n`;
      md += `- ⭐ Stars: ${metadata.stars || 0}\n`;
      md += `- 🍴 Forks: ${metadata.forks || 0}\n`;
      md += `- 📝 Language: ${metadata.language || 'N/A'}\n\n`;
      md += `---\n\n`;
    });

    return md;
  }

  private generateWeiboMarkdown(items: TrendItem[], dateStr: string): string {
    let md = `---\ntitle: Weibo Hot ${dateStr}\ndate: 2019-06-18\nauthor: wdndev\ntags: [微博, 热搜]\ncategories: \n- 微博\nhidden: true\ncomments: false\n---\n\n`;
    md += `> 数据来源：[微博热搜](https://s.weibo.com/top/summary)\n\n`;
    md += `| 排名 | 话题 | 热度 | 用户 |\n|:----:|:------|:-----:|:----:|\n`;
    
    items.forEach((item, i) => {
      const metadata = item.metadata || {};
      const hotValue = metadata.hotValue || metadata.descExtr || '';
      const user = metadata.user || '';
      md += `| ${i+1} | [${item.title}](${item.url || '#'}) | ${hotValue} | ${user} |\n`;
    });
    
    return md;
  }

  private generateHuggingFaceMarkdown(items: TrendItem[], dateStr: string): string {
    let md = `---\ntitle: HuggingFace Papers ${dateStr}\ndate: 2019-06-18\nauthor: wdndev\ntags: [HuggingFace, Papers, AI]\ncategories: \n- AI\nhidden: true\ncomments: false\n---\n\n`;
    md += `> 数据来源：[HuggingFace Papers](https://huggingface.co/papers)\n\n`;
    md += `## Latest Papers\n\n`;
    
    items.forEach((paper, i) => {
      const metadata = paper.metadata || {};
      md += `### ${i+1}. [${paper.title}](${paper.url || '#'})\n\n`;
      if (paper.description) md += `${paper.description}\n\n`;
      if (metadata.authors) md += `**Authors**: ${metadata.authors}\n\n`;
      if (metadata.llmAnalysis) md += `**LLM Analysis**: ${metadata.llmAnalysis}\n\n`;
      if (metadata.categories) md += `**Categories**: ${metadata.categories}\n\n`;
      if (metadata.pdfUrl) md += `**PDF URL**: ${metadata.pdfUrl}\n\n`;
      if (metadata.arxivUrl) md += `**Arxiv URL**: ${metadata.arxivUrl}\n\n`;
      if (metadata.arxivId) md += `**Arxiv ID**: ${metadata.arxivId}\n\n`;
      if (metadata.published) md += `**Published**: ${metadata.published}\n\n`;
      if (metadata.updated) md += `**Updated**: ${metadata.updated}\n\n`;
      md += `---\n\n`;
    });
    
    return md;
  }

  private generateArXivDomainMarkdown(items: TrendItem[], dateStr: string): string {
    let md = `---\ntitle: ArXiv Domain ${dateStr}\ndate: 2019-06-18\nauthor: wdndev\ntags: [ArXiv, Domain, AI]\ncategories: \n- AI\nhidden: true\ncomments: false\n---\n\n`;
    md += `> 数据来源：[ArXiv Domain](https://arxiv.org)\n\n`;
    
    let pre_domain = '';
    items.forEach(paper => {
      const metadata = paper.metadata || {};
      const domain = metadata.domain || '';
      if (domain !== pre_domain) {
        md += `## ${domain} Domain Papers\n\n`;
        pre_domain = domain;
      }
      const rank = metadata.rank || 0;
      md += `### ${rank}. [${paper.title}](${paper.url || '#'})\n`;
      if (paper.description) md += `${paper.description}\n\n`;
      if (metadata.authors) md += `**Authors**: ${metadata.authors}\n\n`;
      if (metadata.llmAnalysis) md += `**LLM Analysis**: ${metadata.llmAnalysis}\n\n`;
      if (metadata.categories) md += `**Categories**: ${metadata.categories}\n\n`;
      if (metadata.pdfUrl) md += `**PDF URL**: ${metadata.pdfUrl}\n\n`;
      if (metadata.arxivUrl) md += `**Arxiv URL**: ${metadata.arxivUrl}\n\n`;
      if (metadata.published) md += `**Published**: ${metadata.published}\n\n`;
      if (metadata.updated) md += `**Updated**: ${metadata.updated}\n\n`;
      md += `---\n\n`;
    });
    
    return md;
  }

  private generateDefaultMarkdown(items: TrendItem[], source: string, dateStr: string, time: string): string {
    let markdown = `# ${source} 趋势报告\n\n`;
    markdown += `**生成时间**: ${dateStr} ${time}\n\n`;
    markdown += `**数据总量**: ${items.length} 条\n\n`;
    
    items.forEach((item, index) => {
      markdown += `### ${index + 1}. ${item.title}\n\n`;
      if (item.description) {
        markdown += `${item.description}\n\n`;
      }
      if (item.url) {
        markdown += `🔗 [查看详情](${item.url})\n\n`;
      }
      if (item.metadata) {
        markdown += `**元数据**: ${JSON.stringify(item.metadata)}\n\n`;
      }
      markdown += `---\n\n`;
    });

    return markdown;
  }

  private groupBySource(items: TrendItem[]): Record<string, TrendItem[]> {
    return items.reduce((groups, item) => {
      if (!groups[item.source]) {
        groups[item.source] = [];
      }
      groups[item.source].push(item);
      return groups;
    }, {} as Record<string, TrendItem[]>);
  }
} 