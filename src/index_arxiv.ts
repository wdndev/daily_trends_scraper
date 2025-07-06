import { HuggingFacePapersScraper } from './scrapers/HuggingFacePapersScraper';
import { ArxivPapersScraper } from './scrapers/ArxivPapersScraper';
import fs from 'fs';

if (require.main === module) {
  (async () => {
    const arxiv_scraper = new ArxivPapersScraper({
      url: 'https://arxiv.org/list/cs.AI/recent',
      timeout: 30000,
      metadata: {
        category: 'cs.AI',
      },
      proxy: {
        host: '127.0.0.1',
        port: 7890,
        protocol: 'http',
      }
    });
    // const result = await arxiv_scraper.scrape();
    const result = await arxiv_scraper.getFullPaperInfo('https://arxiv.org/abs/2507.02357');
    // const result = await arxiv_scraper.getPapersByDomain("Agent");
    console.log(result);
    // console.log(result.data.length);
    // 保存结果到json文件
    fs.writeFileSync('result.json', JSON.stringify(result, null, 2));
  })();
}

// ----------------------------------


// import { config } from 'dotenv';
// import { GitHubTrendingScraper } from './scrapers/github/GitHubTrendingScraper';
// import { WeiboHotScraper } from './scrapers/weibo/WeiboHotScraper';
// import { HuggingFacePapersScraper } from './scrapers/huggingface/HuggingFacePapersScraper';
// import { OpenAIProvider } from './providers/OpenAIProvider';
// import { JSONExporter } from './exporters/JSONExporter';
// import { MarkdownExporter } from './exporters/MarkdownExporter';
// import { TrendItem, ScraperConfig, LLMConfig, ExporterConfig } from './types';

// // 加载环境变量
// config();

// class DailyTrendsScraper {
//   private scrapers: any[] = [];
//   private processor: OpenAIProvider;
//   private exporters: any[] = [];

//   constructor() {
//     this.initializeScrapers();
//     this.initializeProcessor();
//     this.initializeExporters();
//   }

//   private initializeScrapers() {
//     const scraperConfigs: Record<string, ScraperConfig> = {
//       github: {
//         url: process.env.GITHUB_TRENDING_URL || 'https://github.com/trending',
//         timeout: 30000,
//       },
//       weibo: {
//         url: process.env.WEIBO_HOT_URL || 'https://s.weibo.com/top/summary',
//         timeout: 30000,
//       },
//       huggingface: {
//         url: process.env.HUGGINGFACE_PAPERS_URL || 'https://huggingface.co/papers',
//         timeout: 30000,
//       },
//     };

//     this.scrapers = [
//       new GitHubTrendingScraper(scraperConfigs.github),
//       new WeiboHotScraper(scraperConfigs.weibo),
//       new HuggingFacePapersScraper(scraperConfigs.huggingface),
//     ];
//   }

//   private initializeProcessor() {
//     const llmConfig: LLMConfig = {
//       apiKey: process.env.OPENAI_API_KEY!,
//       baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
//       modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
//       maxTokens: 1000,
//       temperature: 0.7,
//     };

//     this.processor = new OpenAIProvider(llmConfig);
//   }

//   private initializeExporters() {
//     const outputDir = process.env.OUTPUT_DIR || './data';
//     const date = new Date().toISOString().split('T')[0];

//     const jsonConfig: ExporterConfig = {
//       outputDir,
//       filename: process.env.JSON_OUTPUT_FILE || `daily_trends_${date}.json`,
//       format: 'json',
//     };

//     const markdownConfig: ExporterConfig = {
//       outputDir,
//       filename: process.env.MARKDOWN_OUTPUT_FILE || `daily_trends_${date}.md`,
//       format: 'markdown',
//     };

//     this.exporters = [
//       new JSONExporter(jsonConfig),
//       new MarkdownExporter(markdownConfig),
//     ];
//   }

//   public async run(): Promise<void> {
//     try {
//       console.log('开始每日趋势抓取...\n');

//       // 1. 抓取数据
//       const allItems: TrendItem[] = [];
      
//       for (const scraper of this.scrapers) {
//         const result = await scraper.scrape();
//         if (result.success) {
//           allItems.push(...result.data);
//         }
//       }

//       console.log(`📊 总共抓取到 ${allItems.length} 条数据\n`);

//       if (allItems.length === 0) {
//         console.log('❌ 没有抓取到任何数据，程序退出');
//         return;
//       }

//       // 2. LLM处理
//       const processResult = await this.processor.processTrends(allItems);

//       // 3. 导出数据
//       for (const exporter of this.exporters) {
//         await exporter.export(allItems, processResult.processedData);
//       }

//       console.log('✅ 每日趋势抓取完成！');
//     } catch (error) {
//       console.error('❌ 程序执行失败:', error);
//       process.exit(1);
//     }
//   }
// }

// // 运行程序
// if (require.main === module) {
//   const scraper = new DailyTrendsScraper();
//   scraper.run();
// }

// export { DailyTrendsScraper }; 