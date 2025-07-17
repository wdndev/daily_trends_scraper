import { OpenAIProvider } from './providers/OpenAIProvider';
import { QianfanProvider } from './providers/QianfanProvider';
import { LLMMessage, LLMConfig} from './types';

import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import fs from 'fs';

// 重新加载环境变量的函数
function reloadEnvVars(): void {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    // 清除之前的环境变量
    const envLines = envContent.split('\n');
    envLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    console.warn('无法重新加载 .env 文件:', error);
  }
}

// 读取prompt模板的函数
function loadPromptTemplate(templatePath: string): string {
  try {
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`无法读取prompt模板文件: ${templatePath}`, error);
    throw error;
  }
}

// 每次运行时重新加载环境变量
reloadEnvVars();

// const llmConfig: LLMConfig = {
//   provider: process.env.PROVIDER as 'openai' | 'qianfan' || 'openai',
//   apiKey: process.env.API_KEY || '',
//   baseUrl: process.env.BASE_URL || 'https://api.openai.com/v1',
//   modelName: process.env.MODEL_NAME || 'gpt-3.5-turbo',
//   maxTokens: 4000,
//   // temperature: 0.7,
//   stream: false,
// };

const llmConfig: LLMConfig = {
  provider: 'openai',
  apiKey: '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',
  baseUrl: 'https://openrouter.ai/api/v1',
  modelName: 'deepseek/deepseek-chat-v3-0324:free',
  maxTokens: 4000,
  // temperature: 0.7,
  stream: false,
};

if (require.main === module) {
  (async () => {
    let provider: OpenAIProvider | QianfanProvider;
    console.log(llmConfig);
    if (llmConfig.provider === 'qianfan') {
      provider = new QianfanProvider(llmConfig);
    } else {
      provider = new OpenAIProvider(llmConfig);
    }

    // // 读取论文数据
    // const result_json = fs.readFileSync('result_data.json', 'utf-8');
    // const paper_text = JSON.parse(result_json).paper;
    
    // // 读取prompt模板
    // const promptTemplate = loadPromptTemplate(join(__dirname, 'pipeline', 'prompts', 'paper_analysis.txt'));
    
    // // 替换模板中的占位符
    // const userContent = promptTemplate.replace('##paper_content##', paper_text);

    // console.log(userContent.length);

    const messages: LLMMessage[] = [
      // { role: 'system', content: '你是一个专业的帮助用户解决问题的助手。' },
      { role: 'user', content: "你好啊，你是谁？" },
    ];
    const response = await provider.chat(messages);
    console.log(response.content);
    console.log(response.usage);

    // const response = await provider.chatStream(messages);
    // for await (const chunk of response) {
    //   console.log(chunk.content);
    // }
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