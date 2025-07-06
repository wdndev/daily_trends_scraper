import { BaseScraper } from './BaseScraper';
import { TrendItem, ScraperConfig, ScrapeResult } from '../types';
import pdfParse from 'pdf-parse';


/**
 * arXiv论文完整信息接口
 */
interface ArxivFullPaperInfo {
  // 论文全文内容（按章节存储）
  paper: string | null;
  
  // 论文基本信息
  title: string | null;
  summary: string | null;
  authors: string[] | null;
  categories: string[] | null;
  
  // 链接信息
  pdfUrl: string | null;
  abstractUrl: string | null;
  arxivUrl: string | null;
  
  // 论文标识
  arxivId: string | null;
  
  // 时间信息
  published: string | null;
  updated: string | null;
  
  // 状态信息
  success: boolean;
  error?: string;
}

export class ArxivPapersScraper extends BaseScraper {
  private readonly ARXIV_API_BASE = 'http://export.arxiv.org/api/query';
  private readonly DEFAULT_HEADERS = {
    'Accept': 'application/xml',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  };

  constructor(config: ScraperConfig) {
    super(config, 'ArXiv Papers');
  }

  // ==================== 主要抓取方法 ====================

  /**
   * 重写scrape方法，支持多种抓取模式
   */
  public async scrape(): Promise<ScrapeResult> {
    try {
      console.log(`开始抓取 ${this.source}...`);
      
      let items: TrendItem[] = [];
      
      // 根据配置决定抓取模式
      if (this.config.metadata?.searchQuery) {
        items = await this.searchPapers(this.config.metadata.searchQuery);
      } else if (this.config.metadata?.category) {
        items = await this.getPapersByCategory(this.config.metadata.category);
      } else {
        items = await this.getLatestPapers();
      }

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

  // ==================== 论文搜索方法 ====================

  /**
   * 按关键词搜索论文
   */
  private async searchPapers(query: string): Promise<TrendItem[]> {
    const searchUrl = `${this.ARXIV_API_BASE}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=50&sortBy=lastUpdatedDate&sortOrder=descending`;
    return this.makeApiRequest(searchUrl);
  }

  /**
   * 按分类抓取论文
   */
  private async getPapersByCategory(category: string): Promise<TrendItem[]> {
    const categoryUrl = `${this.ARXIV_API_BASE}?search_query=cat:${category}&start=0&max_results=50&sortBy=lastUpdatedDate&sortOrder=descending`;
    return this.makeApiRequest(categoryUrl);
  }

  /**
   * 获取最新论文
   */
  private async getLatestPapers(): Promise<TrendItem[]> {
    const latestUrl = `${this.ARXIV_API_BASE}?search_query=cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LG&start=0&max_results=50&sortBy=lastUpdatedDate&sortOrder=descending`;
    return this.makeApiRequest(latestUrl);
  }

  /**
   * 根据标题和作者搜索特定论文
   */
  public async searchPaperByTitleAndAuthor(title: string, author?: string): Promise<TrendItem | null> {
    try {
      const cleanTitle = this.cleanText(title);
      let searchQuery = `ti:"${cleanTitle}"`;
      
      if (author) {
        const cleanAuthor = this.cleanText(author);
        searchQuery += `+AND+au:"${cleanAuthor}"`;
      }
      
      const searchUrl = `${this.ARXIV_API_BASE}?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=10&sortBy=relevance&sortOrder=descending`;
      console.log('搜索URL:', searchUrl);
      
      const items = await this.makeApiRequest(searchUrl);
      console.log('解析到的论文数量:', items.length);
      
      if (items.length > 0) {
        console.log('找到论文:', items[0].title);
        return items[0];
      }
      
      // 如果精确搜索失败，尝试模糊搜索
      console.log('精确搜索失败，尝试模糊搜索...');
      return await this.fuzzySearchPaper(title, author);
      
    } catch (error) {
      console.error('搜索特定论文失败:', error);
      try {
        return await this.fuzzySearchPaper(title, author);
      } catch (fuzzyError) {
        console.error('模糊搜索也失败:', fuzzyError);
        return null;
      }
    }
  }

  /**
   * 模糊搜索论文（作为备选方案）
   */
  private async fuzzySearchPaper(title: string, author?: string): Promise<TrendItem | null> {
    try {
      const keywords = title
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 3);
      
      let searchQuery = keywords.map(kw => `ti:"${kw}"`).join('+OR+');
      if (author) {
        const authorKeywords = author
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2)
          .slice(0, 2);
        searchQuery += `+AND+(${authorKeywords.map(kw => `au:"${kw}"`).join('+OR+')})`;
      }
      
      const searchUrl = `${this.ARXIV_API_BASE}?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=20&sortBy=relevance&sortOrder=descending`;
      console.log('模糊搜索URL:', searchUrl);
      
      const items = await this.makeApiRequest(searchUrl);
      console.log('模糊搜索找到论文数量:', items.length);
      
      if (items.length > 0) {
        const targetTitle = title.toLowerCase();
        const bestMatch = items.find(item => {
          const itemTitle = item.title.toLowerCase();
          return itemTitle.includes(targetTitle) || targetTitle.includes(itemTitle);
        });
        
        if (bestMatch) {
          console.log('模糊搜索找到匹配论文:', bestMatch.title);
          return bestMatch;
        }
        
        console.log('返回第一个模糊搜索结果:', items[0].title);
        return items[0];
      }
      
      return null;
    } catch (error) {
      console.error('模糊搜索失败:', error);
      return null;
    }
  }

  /**
   * 获取热门论文（按下载量排序）
   */
  public async getPopularPapers(): Promise<TrendItem[]> {
    return this.getLatestPapers();
  }

  /**
   * 获取特定领域的论文
   */
  public async getPapersByDomain(domain: 'NLP' | 'LLM' | 'Agent' | 'AI' | 'CV' | 'Evaluation' | 'Multimodal' | 'Robotics'): Promise<TrendItem[]> {
    const domainQueries = {
      NLP: 'cat:cs.CL+OR+cat:cs.AI+AND+ti:"natural+language"',
      LLM: 'cat:cs.CL+AND+(ti:"large+language+model"+OR+ti:"LLM"+OR+ti:"transformer")',
      Agent: 'cat:cs.AI+AND+(ti:"agent"+OR+ti:"multi-agent"+OR+ti:"autonomous")',
      AI: 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL',
      CV: 'cat:cs.CV+OR+(cat:cs.AI+AND+(ti:"computer+vision"+OR+ti:"image+recognition"+OR+ti:"object+detection"+OR+ti:"semantic+segmentation"+OR+ti:"image+classification"))',
      Evaluation: 'cat:cs.AI+AND+(ti:"evaluation"+OR+ti:"benchmark"+OR+ti:"assessment"+OR+ti:"comparison"+OR+ti:"performance+analysis"+OR+ti:"model+evaluation"+OR+ti:"benchmarking")',
      Multimodal: 'cat:cs.AI+AND+(ti:"multimodal"+OR+ti:"vision-language"+OR+ti:"text-to-image"+OR+ti:"image-to-text"+OR+ti:"visual+language+model"+OR+ti:"VLM")',
      Robotics: 'cat:cs.RO+OR+(cat:cs.AI+AND+(ti:"robotics"+OR+ti:"robot"+OR+ti:"autonomous+vehicle"+OR+ti:"control+system"))',
    };

    const query = domainQueries[domain];
    const searchUrl = `${this.ARXIV_API_BASE}?search_query=${query}&start=0&max_results=50&sortBy=lastUpdatedDate&sortOrder=descending`;
    return this.makeApiRequest(searchUrl);
  }

  // ==================== URL相关方法 ====================

  /**
   * 根据 arXiv URL 获取论文详细信息
   */
  public async getPaperByUrl(arxivUrl: string): Promise<TrendItem | null> {
    try {
      const arxivId = this.extractArxivId(arxivUrl);
      if (!arxivId) {
        console.error('无效的 arXiv URL:', arxivUrl);
        return null;
      }
      
      console.log('提取的 arXiv ID:', arxivId);
      const apiUrl = `${this.ARXIV_API_BASE}?id_list=${arxivId}`;
      console.log('API URL:', apiUrl);
      
      const items = await this.makeApiRequest(apiUrl);
      console.log('解析到的论文数量:', items.length);
      
      if (items.length > 0) {
        const paper = items[0];
        console.log('找到论文:', paper.title);
        return paper;
      }
      
      return null;
    } catch (error) {
      console.error('根据URL获取论文失败:', error);
      return null;
    }
  }

  /**
   * 根据 arXiv URL 获取论文全文内容
   */
  public async getPaperFullText(arxivUrl: string): Promise<string | null> {
    try {
      const arxivId = this.extractArxivId(arxivUrl);
      if (!arxivId) {
        console.error('无法从URL提取arXiv ID:', arxivUrl);
        return null;
      }

      const pdfUrl = this.getPdfUrl(arxivId);
      console.log('获取论文PDF:', pdfUrl);
      
      const pdfResponse = await this.httpClient.get(pdfUrl, {
        headers: { ...this.DEFAULT_HEADERS, 'Accept': 'application/pdf' },
        responseType: 'arraybuffer',
      });

      if (pdfResponse.status === 200 && pdfResponse.data) {
        console.log('PDF下载成功，开始解析...');
        
        try {
          const pdfBuffer = Buffer.from(pdfResponse.data);
          const pdfData = await pdfParse(pdfBuffer);
          
          console.log('PDF解析成功');
          console.log('- 页数:', pdfData.numpages);
          console.log('- 文本长度:', pdfData.text.length);
          
          const cleanedText = this.cleanPdfText(pdfData.text);
          console.log('清理后文本长度:', cleanedText.length);
          
          const optimizedText = this.optimizeTextStructure(cleanedText);
          console.log('优化后文本长度:', optimizedText.length);
          
          
          // // 调试：显示前几行文本，帮助分析章节标题格式
          // console.log('调试：前20行文本内容:');
          // const lines = optimizedText.split('\n').slice(0, 20);
          // lines.forEach((line, index) => {
          //   console.log(`${index + 1}: "${line}"`);
          // });
          
          return optimizedText;
        } catch (parseError) {
          console.error('PDF解析失败:', parseError);
          const fallbackText = await this.getAbstractAsFallback(arxivId);
          return fallbackText ? fallbackText : null;
        }
      } else {
        console.log('PDF下载失败，尝试获取摘要...');
        const fallbackText = await this.getAbstractAsFallback(arxivId);
        return fallbackText ? fallbackText : null;
      }
      
    } catch (error) {
      console.error('获取论文全文失败:', error);
      try {
        const arxivId = this.extractArxivId(arxivUrl);
        if (arxivId) {
          const fallbackText = await this.getAbstractAsFallback(arxivId);
          return fallbackText ? fallbackText : null;
        }
      } catch (fallbackError) {
        console.error('获取摘要备选方案也失败:', fallbackError);
      }
      return null;
    }
  }

  /**
   * 获取论文的完整信息（包括 PDF 和摘要链接）
   */
  public async getFullPaperInfo(arxivUrl: string): Promise<ArxivFullPaperInfo> {
    try {
      const arxivId = this.extractArxivId(arxivUrl);
      if (!arxivId) {
        console.error('无法从URL提取arXiv ID:', arxivUrl);
        return this.createEmptyPaperInfo(arxivUrl, '无法从URL提取arXiv ID');
      }

      const [paperInfo, paperFullText] = await Promise.all([
        this.getPaperByUrl(arxivUrl),
        this.getPaperFullText(arxivUrl)
      ]);

      const pdfUrl = this.getPdfUrl(arxivId);
      const abstractUrl = this.getAbstractUrl(arxivId);

      const title = paperInfo?.title || null;
      const summary = paperInfo?.description || null;
      const authors = paperInfo?.metadata?.authors ? paperInfo.metadata.authors.split(', ') : null;
      const categories = paperInfo?.metadata?.categories ? paperInfo.metadata.categories.split(', ') : null;
      const published = paperInfo?.metadata?.published || null;
      const updated = paperInfo?.timestamp?.toISOString() || null;

      console.log('论文完整信息:');
      console.log('- arXiv ID:', arxivId);
      console.log('- PDF URL:', pdfUrl);
      console.log('- 摘要URL:', abstractUrl);
      console.log('- 论文标题:', title || '未找到');
      console.log('- 作者数量:', authors?.length || 0);
      console.log('- 分类数量:', categories?.length || 0);

      return {
        paper: paperFullText,
        title,
        summary,
        authors,
        categories,
        pdfUrl,
        abstractUrl,
        arxivUrl: arxivUrl,
        arxivId,
        published,
        updated,
        success: true,
      };
    } catch (error) {
      console.error('获取论文完整信息失败:', error);
      return this.createEmptyPaperInfo(arxivUrl, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 统一的API请求方法
   */
  private async makeApiRequest(url: string): Promise<TrendItem[]> {
    const response = await this.httpClient.get(url, { headers: this.DEFAULT_HEADERS });
    return this.parseArxivResponse(response.data);
  }

  /**
   * 获取摘要作为备选方案
   */
  private async getAbstractAsFallback(arxivId: string): Promise<string | null> {
    try {
      const abstractUrl = this.getAbstractUrl(arxivId);
      console.log('获取摘要作为备选:', abstractUrl);
      
      const response = await this.httpClient.get(abstractUrl, {
        headers: { ...this.DEFAULT_HEADERS, 'Accept': 'text/html' },
      });

      if (response.status === 200) {
        const html = response.data;
        const abstractMatch = html.match(/<blockquote class="abstract mathjax">([\s\S]*?)<\/blockquote>/);
        if (abstractMatch) {
          const abstract = this.cleanText(abstractMatch[1]);
          console.log('成功获取论文摘要，长度:', abstract.length);
          return `[摘要] ${abstract}`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('获取摘要失败:', error);
      return null;
    }
  }

  /**
   * 创建空的论文信息对象
   */
  private createEmptyPaperInfo(arxivUrl: string, error: string): ArxivFullPaperInfo {
    return {
      paper: null,
      title: null,
      summary: null,
      authors: null,
      categories: null,
      pdfUrl: null,
      abstractUrl: null,
      arxivUrl: arxivUrl,
      arxivId: null,
      published: null,
      updated: null,
      success: false,
      error,
    };
  }

  /**
   * 获取论文的 PDF 链接
   */
  public getPdfUrl(arxivId: string): string {
    return `https://arxiv.org/pdf/${arxivId}.pdf`;
  }

  /**
   * 获取论文的摘要页面链接
   */
  public getAbstractUrl(arxivId: string): string {
    return `https://arxiv.org/abs/${arxivId}`;
  }

  /**
   * 从 arXiv URL 中提取 arXiv ID
   */
  public extractArxivId(url: string): string | null {
    const match = url.match(/arxiv\.org\/abs\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  // ==================== 文本处理方法 ====================

  /**
   * 解析arXiv API响应
   */
  private parseArxivResponse(xmlData: string): TrendItem[] {
    try {
      const items: TrendItem[] = [];
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;
      let rank = 1;
      
      while ((match = entryRegex.exec(xmlData)) !== null) {
        const entryXml = match[1];
        
        const title = this.extractXmlValue(entryXml, 'title');
        const summary = this.extractXmlValue(entryXml, 'summary');
        const authors = this.extractAuthors(entryXml);
        const id = this.extractArxivIdFromXml(entryXml);
        const published = this.extractXmlValue(entryXml, 'published');
        const categories = this.extractCategories(entryXml);
        
        if (title && id) {
          items.push({
            id: `arxiv-${id}-${Date.now()}`,
            title,
            description: summary,
            url: `https://arxiv.org/abs/${id}`,
            source: 'ArXiv Papers',
            timestamp: new Date(published),
            metadata: {
              arxivId: id,
              authors: authors.join(', '),
              categories: categories.join(', '),
              published,
              pdfUrl: `https://arxiv.org/pdf/${id}.pdf`,
              abstractUrl: `https://arxiv.org/abs/${id}`,
              rank: rank,
            },
          });
          rank++;
        }
      }

      return items.slice(0, 20);
    } catch (error) {
      console.error('解析arXiv响应失败:', error);
      return [];
    }
  }

  /**
   * 从XML中提取值
   */
  private extractXmlValue(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    return match ? this.cleanText(match[1]) : '';
  }

  /**
   * 从XML中提取作者
   */
  private extractAuthors(xml: string): string[] {
    const authorMatches = xml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g);
    return authorMatches ? authorMatches.map(m => {
      const nameMatch = m.match(/<name>([\s\S]*?)<\/name>/);
      return nameMatch ? this.cleanText(nameMatch[1]) : '';
    }).filter(name => name) : [];
  }

  /**
   * 从XML中提取arXiv ID
   */
  private extractArxivIdFromXml(xml: string): string {
    const idMatch = xml.match(/<id>([\s\S]*?)<\/id>/);
    return idMatch ? idMatch[1].split('/').pop() || '' : '';
  }

  /**
   * 从XML中提取分类
   */
  private extractCategories(xml: string): string[] {
    const categoryMatches = xml.match(/<category term="([^"]*?)"/g);
    return categoryMatches ? categoryMatches.map(m => {
      const termMatch = m.match(/term="([^"]*?)"/);
      return termMatch ? termMatch[1] : '';
    }).filter(cat => cat) : [];
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    return text
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * 清理PDF文本内容
   */
  private cleanPdfText(text: string): string {
    return text
      .replace(/\f/g, '\n')
      .split('\n')
      .filter(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) return false;
        
        if (/^\d+$/.test(trimmedLine)) return false;
        
        const digitCount = (trimmedLine.match(/\d/g) || []).length;
        const specialCharCount = (trimmedLine.match(/[^\w\s.,;:!?()[\]{}"'\-–—…]/g) || []).length;
        const totalLength = trimmedLine.length;
        
        if (digitCount / totalLength > 0.3 || specialCharCount / totalLength > 0.4) {
          return false;
        }
        
        if (trimmedLine.includes('●') || trimmedLine.includes('■') || 
            trimmedLine.includes('▲') || trimmedLine.includes('◆') ||
            trimmedLine.includes('○') || trimmedLine.includes('□') ||
            trimmedLine.includes('△') || trimmedLine.includes('◇')) {
          return false;
        }
        
        if (trimmedLine.includes('x-axis') || trimmedLine.includes('y-axis') ||
            trimmedLine.includes('X轴') || trimmedLine.includes('Y轴')) {
          return false;
        }
        
        return true;
      })
      .join('\n')
      .replace(/\n\s*(References?|Bibliography|REFERENCES?|BIBLIOGRAPHY)[\s\S]*$/i, '')
      .replace(/\n\s*(Appendix|APPENDIX)[\s\S]*$/i, '')
      .replace(/\n\s*(Figure|Table|FIG\.|TAB\.)\s*\d+[^.]*\.?\s*\n/g, '\n')
      .replace(/\n\s*\d+\s*\n/g, '\n')
      .replace(/\n\s*©\s*\d{4}[\s\S]*$/i, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,;:!?()[\]{}"'\-–—…\n]/g, ' ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) return false;
        if (trimmedLine.length < 3) return false;
        if (/^[.,;:!?()[\]{}"'\-–—…\s]+$/.test(trimmedLine)) return false;
        return true;
      })
      .join('\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * 优化文本结构
   */
  private optimizeTextStructure(text: string): string {
    return text
      .split('\n\n')
      .map(paragraph => {
        let cleaned = paragraph.trim();
        cleaned = cleaned.replace(/^\d+\.\s*/, '');
        cleaned = cleaned.replace(/^[a-z]\)\s*/, '');
        cleaned = cleaned.replace(/^[ivxlcdm]+\.\s*/i, '');
        
        if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
          cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        
        return cleaned;
      })
      .filter(paragraph => {
        const trimmed = paragraph.trim();
        if (trimmed.length === 0) return false;
        if (trimmed.length < 10) return false;
        if (/^[A-Z\s]+$/.test(trimmed) && trimmed.length < 50) return false;
        return true;
      })
      .join('\n\n')
      .split('\n\n')
      .filter((paragraph, index, array) => {
        return array.indexOf(paragraph) === index;
      })
      .join('\n\n')
      .trim();
  }

  /**
   * 抽象方法实现（保持兼容性）
   */
  protected parseContent(content: string): TrendItem[] {
    return this.parseArxivResponse(content);
  }
} 