import { GitHubTrendingScraper } from './scrapers/GitHubTrendingScraper';
import { WeiboHotScraper } from './scrapers/WeiboHotScraper';
import { HuggingFacePapersScraper } from './scrapers/HuggingFacePapersScraper';

if (require.main === module) {
  (async () => {
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
    console.log(result);
    console.log(result.data.length);
  })();
}

// {
//   success: true,
//   data: [
//     {
//       id: 'hf-0-1751713570293',
//       title: 'WebSailor: Navigating Super-human Reasoning for Web Agent',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02592',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.293Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-1-1751713570293',
//       title: 'LangScene-X: Reconstruct Generalizable 3D Language-Embedded Scenes with TriMap Video Diffusion',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02813',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.293Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-2-1751713570293',
//       title: 'Heeding the Inner Voice: Aligning ControlNet Training via Intermediate Features Feedback',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02321',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.293Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-3-1751713570293',
//       title: 'IntFold: A Controllable Foundation Model for General and Specialized Biomolecular Structure Prediction',   
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02025',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.293Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-4-1751713570294',
//       title: 'Skywork-Reward-V2: Scaling Preference Data Curation via Human-AI Synergy',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.01352',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.294Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-5-1751713570294',
//       title: 'Thinking with Images for Multimodal Reasoning: Foundations, Methods, and Future Frontiers',
//       description: '',
//       url: 'https://huggingface.co/papers/2506.23918',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.294Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-6-1751713570294',
//       title: 'Decoupled Planning and Execution: A Hierarchical Reasoning Framework for Deep Search',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02652',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.294Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-7-1751713570294',
//       title: 'Fast and Simplex: 2-Simplicial Attention in Triton',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02754',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.294Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-8-1751713570294',
//       title: 'Bourbaki: Self-Generated and Goal-Conditioned MDPs for Theorem Proving',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02726',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.294Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-9-1751713570295',
//       title: 'Can LLMs Identify Critical Limitations within Scientific Research? A Systematic Evaluation on AI Research Papers',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02694',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.295Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-10-1751713570295',
//       title: 'Energy-Based Transformers are Scalable Learners and Thinkers',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02092',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.295Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-11-1751713570295',
//       title: 'Self-Correction Bench: Revealing and Addressing the Self-Correction Blind Spot in LLMs',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.02778',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.295Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-12-1751713570295',
//       title: 'Selecting and Merging: Towards Adaptable and Scalable Named Entity Recognition with Large Language Models',
//       description: '',
//       url: 'https://huggingface.co/papers/2506.22813',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.295Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-13-1751713570295',
//       title: 'AsyncFlow: An Asynchronous Streaming RL Framework for Efficient LLM Post-Training',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.01663',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.295Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-14-1751713570295',
//       title: 'ZeCO: Zero Communication Overhead Sequence Parallelism for Linear Attention',
//       description: '',
//       url: 'https://huggingface.co/papers/2507.01004',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.295Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-15-1751713570295',
//       title: 'CRISP-SAM2: SAM2 with Cross-Modal Interaction and Semantic Prompting for Multi-Organ Segmentation',        
//       description: '',
//       url: 'https://huggingface.co/papers/2506.23121',
//       source: 'HuggingFace Papers',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.295Z,
//       metadata: [Object]
//     },
//     {
//       id: 'hf-16-1751713570295',
//       title: 'HalluSegBench: Counterfactual Visual Reasoning for Segmentation Hallucination Evaluation',
//       description: '',
//       url: 'https://huggingface.co/papers/2506.21546',
//       source: 'HuggingFace Papers',
//       timestamp: 2025-07-05T11:06:10.295Z,
//       metadata: [Object]
//     }
//   ],
//   source: 'HuggingFace Papers',
//   timestamp: 2025-07-05T11:06:10.295Z
// }

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