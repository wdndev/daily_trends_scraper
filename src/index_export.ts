import fs from 'fs';
import { MarkdownExporter } from './exporters/MarkdownExporter';
import { JSONExporter } from './exporters/JSONExporter';
import { ExporterConfig, ScraperConfig } from './types';
import { HotNewsScraper } from './scrapers/HotNewsScraper';
import { GitHubTrendingScraper } from './scrapers/GitHubTrendingScraper';
import { HuggingFacePapersScraper } from './scrapers/HuggingFacePapersScraper';

async function getWeiboHotData() {
  const weibo_scraper = new HotNewsScraper({
    url: 'https://s.weibo.com/top/summary',
    timeout: 30000,
  }, 'weibo', 'Weibo Hot');
  const result = await weibo_scraper.scrape();
  return result;
}

async function getGitHubTrendingData() {
  const github_scraper = new GitHubTrendingScraper({
      url: 'https://github.com/trending/python',
      timeout: 30000,
      proxy: {
        host: '127.0.0.1',
        port: 7890,
        protocol: 'http',
      }
    });
    const result = await github_scraper.scrape();
    return result;
}

async function getHuggingFacePapersData() {
  const huggingface_scraper = new HuggingFacePapersScraper({
    url: 'https://huggingface.co/papers',
    timeout: 30000,
    proxy: {
      host: '127.0.0.1',
      port: 7890,
      protocol: 'http',
    }
  });
  const result = await huggingface_scraper.scrape();
  return result;
}


if (require.main === module) {
  (async () => {
    const outputDir ='./data';
    const date = new Date().toISOString().split('T')[0];
    
    const weibo_data = await getWeiboHotData();
    // const github_data = await getGitHubTrendingData();
    // const huggingface_data = await getHuggingFacePapersData();

    const jsonConfig: ExporterConfig = {
      outputDir,
      filename: `daily_weibo_${date}.md`,
      format: 'markdown',
    };

    if (jsonConfig.format === 'json') { 
      const exporter = new JSONExporter(jsonConfig);
      await exporter.export(weibo_data.data);
    } else if (jsonConfig.format === 'markdown') {
      const exporter = new MarkdownExporter(jsonConfig);
      await exporter.export(weibo_data.data);
    }

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