import { BasePipeline, PipelineConfig, PipelineResult } from './BasePipeline';
import { HuggingFacePapersScraper } from '../scrapers/HuggingFacePapersScraper';
import { JSONExporter } from '../exporters/JSONExporter';
import { MarkdownExporter } from '../exporters/MarkdownExporter';
import { ScraperConfig, ExporterConfig, ProxyConfig, LLMConfig } from '../types';
import { TrendItem } from '../types';
import { ArxivPapersScraper } from '../scrapers/ArxivPapersScraper';
import { QianfanProvider } from '../providers/QianfanProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { BaseProvider } from '../providers/BaseProvider';
import { BingTranslateProvider } from '../providers/BingTranslateProvider';
import { PaperAnalysisScraper } from '../providers/PaperAnalysisScraper';
import path from 'path';
import { readFileSync } from 'fs';
import { join } from 'path';
import fs from 'fs';


/**
 * HuggingFace Papers流水线配置接口
 */
export interface HFPaperPipelineConfig extends Partial<PipelineConfig> {
  maxItems?: number;
  category?: string;  // 论文分类：nlp, computer-vision, audio, etc.
  timeRange?: string;  // 时间范围：day, week, month
  includeAbstract?: boolean;  // 是否包含摘要
  includeAuthors?: boolean;  // 是否包含作者信息
  includeCitations?: boolean;  // 是否包含引用数
  includeDownloads?: boolean;  // 是否包含下载数
  proxy?: ProxyConfig;  // 代理配置
  llmConfig?: LLMConfig;  // LLM配置
}


/**
 * HuggingFace Papers处理流水线
 * 继承BasePipeline，实现HuggingFace Papers的抓取和导出
 */
export class HFPaperPipeline extends BasePipeline {
  private hfConfig: HFPaperPipelineConfig;
  private arxivScraper: ArxivPapersScraper;
  private llmProvider?: BaseProvider;
  private paperAnalysisPrompt?: string;
  private useLLMAnalysis: boolean;
  private pipelineName: string = "hf";
  private translateProvider?: BingTranslateProvider;
  private paperAnalysisScraper?: PaperAnalysisScraper;

  constructor(config: HFPaperPipelineConfig = {}) {
    // 设置默认配置
    const defaultConfig: HFPaperPipelineConfig = {
      ...{
        jsonOutputDir: './data/json',
        markdownOutputDir: './data/markdown',
        maxItems: 20,
        category: '',  // 空字符串表示所有分类
        timeRange: 'day',  // 默认每日论文
        includeAbstract: true,
        includeAuthors: true,
        includeCitations: true,
        includeDownloads: true,
        proxy: undefined,  // 默认不使用代理
        llmConfig: undefined, // 默认不使用LLM
      },
      ...config,
    };

    // 创建HuggingFace Papers抓取器
    const scraperConfig: ScraperConfig = {
      url: HFPaperPipeline.buildHFUrl(defaultConfig.category || '', defaultConfig.timeRange || 'day'),
      timeout: defaultConfig.timeout || 30000,
      retries: defaultConfig.maxRetries || 3,
      proxy: defaultConfig.proxy,  // 添加代理支持
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://huggingface.co/',
      },
    };

    const scraper = new HuggingFacePapersScraper(scraperConfig);

    const pipelineName = "hf";

    defaultConfig.jsonOutputDir = path.join(defaultConfig.jsonOutputDir || './data/json', pipelineName);  
    defaultConfig.markdownOutputDir = path.join(defaultConfig.markdownOutputDir || './data/markdown', pipelineName);

    // 创建导出器
    const exporters = HFPaperPipeline.createExporters(defaultConfig);

    // 调用父类构造函数
    super(scraper, exporters, defaultConfig as PipelineConfig);

    this.hfConfig = defaultConfig;
    this.pipelineName = pipelineName;
    // 初始化类属性
    this.arxivScraper = new ArxivPapersScraper({
      url: 'https://arxiv.org/list/cs/new',
      timeout: 30000,
    });
    
    this.useLLMAnalysis = defaultConfig.llmConfig !== undefined;

    if (this.useLLMAnalysis && defaultConfig.llmConfig) {
      const llmConfig = defaultConfig.llmConfig;
      console.log("llmConfig: ", llmConfig);
      if (llmConfig.provider === 'qianfan') {
        this.llmProvider = new QianfanProvider(llmConfig);
      } else {
        this.llmProvider = new OpenAIProvider(llmConfig);
      }
      this.paperAnalysisPrompt = this.loadPromptTemplate(join(__dirname, 'prompts', 'paper_analysis.txt'));
    }

    this.translateProvider = new BingTranslateProvider();

    // console.log("paperAnalysisPrompt: ", this.paperAnalysisPrompt);
    this.paperAnalysisScraper = new PaperAnalysisScraper();
  }

  /**
   * 获取流水线名称
   */
  protected getPipelineName(): string {
    return this.pipelineName;
  }

  /**
   * 构建HuggingFace Papers URL
   */
  private static buildHFUrl(category: string, timeRange: string): string {
    const baseUrl = 'https://huggingface.co/papers';
    const params = new URLSearchParams();
    
    if (category) {
      params.append('category', category);
    }
    
    if (timeRange && timeRange !== 'day') {
      params.append('time', timeRange);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * 创建导出器
   */
  private static createExporters(config: HFPaperPipelineConfig) {
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
   * 重写数据抓取方法，添加HF特定的处理逻辑
   */
  protected async scrapeData() {
    this.log('开始抓取HuggingFace Papers数据...');
    
    const result = await super.scrapeData();
    
    if (result.success && result.data) {
      // 应用HF特定的过滤和处理
      const processedData = this.processHFData(result.data);
      result.data = processedData;
      
      this.log(`HuggingFace数据处理完成，过滤后剩余 ${processedData.length} 条数据`);
    }
    
    return result;
  }

  /**
   * 处理HF数据，应用过滤规则
   */
  private processHFData(items: TrendItem[]): TrendItem[] {
    let processedItems = [...items];

    // 限制数量
    if (this.hfConfig.maxItems && processedItems.length > this.hfConfig.maxItems) {
      processedItems = processedItems.slice(0, this.hfConfig.maxItems);
      this.log(`限制数据数量为 ${this.hfConfig.maxItems} 条`);
    }

    // 处理摘要信息
    if (!this.hfConfig.includeAbstract) {
      processedItems = processedItems.map(item => ({
        ...item,
        description: '',
      }));
    }

    // 处理元数据
    processedItems = processedItems.map(item => {
      const metadata = { ...item.metadata };
      
      if (!this.hfConfig.includeAuthors && metadata.authors) {
        delete metadata.authors;
      }
      
      if (!this.hfConfig.includeCitations && metadata.citations) {
        delete metadata.citations;
      }
      
      if (!this.hfConfig.includeDownloads && metadata.downloads) {
        delete metadata.downloads;
      }
      
      return {
        ...item,
        metadata,
      };
    });

    return processedItems;
  }

  /**
   * 获取HuggingFace Papers统计信息
   */
  public getHFStats(items: TrendItem[]): {
    totalItems: number;
    withAbstract: number;
    withAuthors: number;
    withCitations: number;
    withDownloads: number;
    avgCitations: number;
    topCategory?: string;
  } {
    const totalItems = items.length;
    const withAbstract = items.filter(item => 
      item.description && item.description.trim().length > 0
    ).length;
    const withAuthors = items.filter(item => 
      item.metadata?.authors !== undefined
    ).length;
    const withCitations = items.filter(item => 
      item.metadata?.citations !== undefined
    ).length;
    const withDownloads = items.filter(item => 
      item.metadata?.downloads !== undefined
    ).length;
    
    const citationsValues = items
      .map(item => {
        const citations = item.metadata?.citations;
        if (!citations) return 0;
        
        const citationsStr = String(citations);
        const numericValue = parseFloat(citationsStr.replace(/[^\d.]/g, ''));
        return isNaN(numericValue) ? 0 : numericValue;
      })
      .filter(value => value > 0);
    
    const avgCitations = citationsValues.length > 0 
      ? citationsValues.reduce((sum, val) => sum + val, 0) / citationsValues.length 
      : 0;

    // 统计最热门的论文分类
    const categoryCounts: Record<string, number> = {};
    items.forEach(item => {
      const category = item.metadata?.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    const topCategory = Object.keys(categoryCounts).length > 0
      ? Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0][0]
      : undefined;

    return {
      totalItems,
      withAbstract,
      withAuthors,
      withCitations,
      withDownloads,
      avgCitations: Math.round(avgCitations),
      topCategory,
    };
  }

  /**
   * 并发控制函数 - 限制LLM调用频率为每秒2次
   */
  private async processWithRateLimit<T>(
    items: T[],
    processor: (item: T, index: number) => Promise<any>,
    rateLimit: number = 2 // 每秒2次
  ): Promise<any[]> {
    const results: any[] = [];
    const delay = 1000 / rateLimit; // 每次调用间隔500ms
    
    for (let i = 0; i < items.length; i++) {
      const startTime = Date.now();
      const result = await processor(items[i], i);
      results.push(result);
      
      // 如果不是最后一个，则等待到下一个时间窗口
      if (i < items.length - 1) {
        const elapsed = Date.now() - startTime;
        const waitTime = Math.max(0, delay - elapsed);
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    return results;
  }

  /**
   * 处理单篇论文的完整流程
   */
  private async processPaper(item: TrendItem): Promise<{ item: TrendItem; success: boolean }> {
    try {
      if (!item.url) {
        return { item, success: false };
      }

      const arxivUrl = item.url.replace('https://huggingface.co/papers/', 'https://arxiv.org/abs/');
      const paperInfo = await this.arxivScraper.getFullPaperInfo(arxivUrl);
      
      if (!paperInfo.success) {
        return { item, success: false };
      }

      const {
        paper: originalPaperContent,
        authors: paperAuthors,
        summary: paperSummary,
        categories: paperCategories,
        pdfUrl: paperPdfUrl,
        arxivUrl: paperArxivUrl,
        arxivId: paperArxivId,
        published: paperPublished,
        updated: paperUpdated
      } = paperInfo;

      let llmAnalysis = '';
      
      // 只有在启用LLM分析且有论文内容时才进行LLM分析
      if (this.useLLMAnalysis && originalPaperContent && this.llmProvider && this.paperAnalysisPrompt) {
        // paperContent长度限制，如果超过6000个单词，选择中间6000个单词，其余删除
        let paperContent = originalPaperContent;
        const paperContentLength = paperContent.split(' ').length;
        if (paperContentLength > 6000) {
          const startIndex = Math.floor((paperContentLength - 6000) / 2);
          paperContent = paperContent.slice(startIndex, startIndex + 6000);
        }
        // paperContent添加摘前面
        paperContent = `摘要：${paperSummary}\n正文：${paperContent}`;
        const userContent = this.paperAnalysisPrompt.replace('##paper_content##', paperContent);
        console.log("User Content Length: ", userContent.length);
        console.log("User Words Number: ", userContent.split(' ').length);
        // console.log("User Content: ", userContent);
        const messages = [{ role: 'user' as const, content: userContent }];
        const paperLLMResponse = await this.llmProvider.chat(messages);
        llmAnalysis = paperLLMResponse.content;
      }

      let zh_summary = ''
      if (this.translateProvider && paperSummary) {
        try {
          const translatedResult = await this.translateProvider.translate(paperSummary, 'en', 'zh-Hans');
          zh_summary = translatedResult.translation;
        } catch (error) {
          console.error("翻译失败: ", error);
          zh_summary = `Translation Failed: ${error}`;
        }
        console.log("translatedSummary: ", zh_summary);
      }
      let llm_analysis = '';
      if (this.paperAnalysisScraper && paperArxivId) {
        try {
          llm_analysis = await this.paperAnalysisScraper.fetchInterpretation(paperArxivId);
        } catch (error) {
          console.error("获取论文分析失败: ", error);
          llm_analysis = `LLM Analysis Failed: ${error}`;
        }
      }

      // 更新item的metadata - 无论是否调用LLM都要更新这些字段
      item.description = paperSummary || undefined;
      item.metadata = {
        ...item.metadata,
        llmAnalysis,
        authors: paperAuthors,
        categories: paperCategories,
        pdfUrl: paperPdfUrl,
        arxivUrl: paperArxivUrl,
        arxivId: paperArxivId,
        published: paperPublished,
        updated: paperUpdated,
        zh_summary: zh_summary,
        llm_analysis: llm_analysis,
      };

      this.log(`✅ 论文处理完成: ${item.title}${this.useLLMAnalysis ? ' (含LLM分析)' : ' (仅抓取数据)'}`);
      return { item, success: true };
    } catch (error) {
      this.log(`❌ 论文处理失败: ${item.title} - ${error}`);
      return { item, success: false };
    } finally {
      if (this.paperAnalysisScraper) {
        await this.paperAnalysisScraper.close();
      }
    }
  }

  /**
   * 执行HF流水线并返回详细结果
   */
  public async executeWithStats(): Promise<PipelineResult & { stats?: any }> {
    const pipelineStartTime = Date.now();
    const result = await this.execute(false);
    
    if (result.success && result.scrapedData) {
      const stats = this.getHFStats(result.scrapedData);
      this.log(`HuggingFace Papers统计: 总计${stats.totalItems}条，含摘要${stats.withAbstract}条，含作者${stats.withAuthors}条，含引用${stats.withCitations}条，含下载${stats.withDownloads}条，平均引用${stats.avgCitations}，热门分类${stats.topCategory || '无'}`);
      
      // 处理论文数据（抓取详细信息 + 可选的LLM分析）
      this.log(`开始处理 ${result.scrapedData.length} 篇论文${this.useLLMAnalysis ? '（含LLM分析）' : '（仅抓取数据）'}...`);
      const llmStartTime = Date.now();
      
      const processedResults = await this.processWithRateLimit(
        result.scrapedData,
        (item, index) => this.processPaper(item),
        this.useLLMAnalysis ? 2 : 10 // LLM分析时每秒2次，仅抓取数据时每秒10次
      );
      
      const llmEndTime = Date.now();
      const successCount = processedResults.filter(r => r.success).length;
      this.log(`✅ 论文处理完成: ${successCount}/${result.scrapedData.length} 成功，耗时 ${((llmEndTime - llmStartTime) / 1000).toFixed(1)}s`);

      // 确保处理后的数据被正确更新到result中
      result.scrapedData = processedResults.map(r => r.item);

      // 导出数据
      const exportResults = await this.exportData(result.scrapedData); 
      // 检查是否有导出失败
      const failedExports = exportResults.filter(result => !result.success);
      if (failedExports.length > 0) {
        failedExports.forEach(result => {
          if (result.error) {
            console.log(`导出失败: ${result.error}`);
          }
        });
      }
      const pipelineEndTime = Date.now();
      result.duration = pipelineEndTime - pipelineStartTime;

      // 更新索引文件
      await this.updateMarkdownIndex(this.config.markdownOutputDir || './data/markdown', this.pipelineName);

      return {
        ...result,
        stats,
      };
    }
    
    return result;
  }

  /**
   * 获取HF配置
   */
  public getHFConfig(): HFPaperPipelineConfig {
    return { ...this.hfConfig };
  }

  /**
   * 更新HF配置
   */
  public updateHFConfig(newConfig: Partial<HFPaperPipelineConfig>): void {
    this.hfConfig = { ...this.hfConfig, ...newConfig };
    this.updateConfig(newConfig);
    this.log('HuggingFace配置已更新');
  }

  /**
   * 设置论文分类过滤
   */
  public setCategory(category: string): void {
    this.hfConfig.category = category;
    this.log(`设置论文分类过滤: ${category}`);
  }

  /**
   * 设置时间范围
   */
  public setTimeRange(timeRange: 'day' | 'week' | 'month'): void {
    this.hfConfig.timeRange = timeRange;
    this.log(`设置时间范围: ${timeRange}`);
  }

  private loadPromptTemplate(templatePath: string): string {
    try {
      return readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`无法读取prompt模板文件: ${templatePath}`, error);
      throw error;
    }
  }
} 