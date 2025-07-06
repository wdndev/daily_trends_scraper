import { WeiboPipeline, WeiboPipelineConfig } from './pipeline/WeiboPipeline';
import { GithubTrendingPipeline, GithubTrendingPipelineConfig } from './pipeline/GithubTrendingPipeline';
import { HFPaperPipeline, HFPaperPipelineConfig } from './pipeline/HFPaperPipeline';
import { DomainPipeline, DomainPipelineConfig } from './pipeline/DomainPipeline';

// 统一配置接口
interface PipelineConfigs {
  weibo: WeiboPipelineConfig;
  github: GithubTrendingPipelineConfig;
  huggingface: HFPaperPipelineConfig;
  domain: DomainPipelineConfig;
}

// 创建统一配置
function createConfigs(
  jsonOutputDir: string, 
  markdownOutputDir: string,
  useProxy: boolean = true
): PipelineConfigs {
  const proxyConfig = useProxy ? { host: '127.0.0.1', port: 7890 } : undefined;
  
  return {
    weibo: {
      jsonOutputDir: `${jsonOutputDir}/weibo/json`,
      markdownOutputDir: `${markdownOutputDir}/weibo/markdown`,
      maxItems: 55,
      filterAds: true,
      includeUserInfo: true,
      timeout: 30000,
      enableLogging: true,
    },
    github: {
      jsonOutputDir: `${jsonOutputDir}/github/json`,
      markdownOutputDir: `${markdownOutputDir}/github/markdown`,
      maxItems: 20,
      languages: ['python', 'typescript'],
      timeRange: 'daily',
      includeDescription: true,
      includeStars: true,
      includeForks: true,
      proxy: proxyConfig,
    },
    huggingface: {
      jsonOutputDir: `${jsonOutputDir}/hf/json`,
      markdownOutputDir: `${markdownOutputDir}/hf/markdown`,
      maxItems: 20,
      category: 'nlp',
      timeRange: 'day',
      includeAbstract: true,
      includeAuthors: true,
      includeCitations: true,
      includeDownloads: true,
      proxy: proxyConfig,
    },
    domain: {
      domain: ['LLM', 'Agent', 'NLP', 'AI'],
      maxResults: 10,
      includeFullText: false,
      jsonOutputDir: `${jsonOutputDir}/domain/json`,
      markdownOutputDir: `${markdownOutputDir}/domain/markdown`,
    },
  };
}

// 统一的流水线执行函数
async function executePipeline<T>(
  pipelineName: string,
  pipelineClass: new (config: any) => any,
  config: any,
  executeMethod: string = 'executeWithStats',
  extraParams: any[] = []
): Promise<void> {
  console.log(`🚀 开始执行${pipelineName}流水线...`);
  
  try {
    const pipeline = new pipelineClass(config);
    const result = await pipeline[executeMethod](...extraParams);
    
    if (result.success) {
      console.log(`\n✅ ${pipelineName}流水线执行成功!`);
      console.log(`📊 执行时间: ${result.duration}ms`);
      console.log(`📈 抓取数据: ${result.scrapedData?.length || 0} 条`);
      console.log(`💾 导出文件: ${result.exportResults?.length || 0} 个`);
      
      // 显示统计信息
      if (result.stats) {
        console.log(`\n📊 ${pipelineName}统计:`);
        Object.entries(result.stats).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            console.log(`  ${key}: ${value}`);
          }
        });
      }
      
      // 显示导出文件
      if (result.exportResults) {
        console.log('\n📁 导出文件:');
        result.exportResults.forEach((exportResult: any, index: number) => {
          if (exportResult.success) {
            console.log(`  ${index + 1}. ${exportResult.filePath}`);
          } else {
            console.log(`  ${index + 1}. ❌ 导出失败: ${exportResult.error}`);
          }
        });
      }
    } else {
      console.log(`\n❌ ${pipelineName}流水线执行失败!`);
      if (result.errors) {
        console.log('错误信息:');
        result.errors.forEach((error: string, index: number) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
    }
  } catch (error) {
    console.error(`❌ 执行${pipelineName}流水线时发生异常:`, error);
  }
}

// 主函数
async function main() {
  const jsonOutputDir = './data_pipeline';
  const markdownOutputDir = './data_pipeline';
  const useProxy = true;
  const enableLLMAnalysis = false;
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy);
  
  console.log('🔧 开始执行数据抓取流水线...\n');
  
  // 执行各个流水线
  await executePipeline('HuggingFace Papers', HFPaperPipeline, configs.huggingface, 'executeWithStats', [enableLLMAnalysis]);
  await executePipeline('Domain Papers', DomainPipeline, configs.domain, 'execute');
  await executePipeline('GitHub Trending', GithubTrendingPipeline, configs.github);
  await executePipeline('Weibo Hot', WeiboPipeline, configs.weibo);
  
  console.log('\n🎉 所有流水线执行完成!');
}

// 导出各个流水线函数（保持向后兼容）
async function weiboPipeline(
  jsonOutputDir: string = './data_pipeline', 
  markdownOutputDir: string = './data_pipeline',
  useProxy: boolean = true
) {
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy);
  await executePipeline('Weibo Hot', WeiboPipeline, configs.weibo);
}

async function githubPipeline(
  jsonOutputDir: string = './data_pipeline', 
  markdownOutputDir: string = './data_pipeline',
  useProxy: boolean = true
) {
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy);
  await executePipeline('GitHub Trending', GithubTrendingPipeline, configs.github);
}

async function huggingfacePipeline(
  jsonOutputDir: string = './data_pipeline', 
  markdownOutputDir: string = './data_pipeline', 
  enableLLMAnalysis: boolean = true,
  useProxy: boolean = true
) {
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy);
  await executePipeline('HuggingFace Papers', HFPaperPipeline, configs.huggingface, 'executeWithStats', [enableLLMAnalysis]);
}

async function domainPipeline(
  jsonOutputDir: string = './data_pipeline', 
  markdownOutputDir: string = './data_pipeline',
  useProxy: boolean = true
) {
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy);
  await executePipeline('Domain Papers', DomainPipeline, configs.domain, 'execute');
}

if (require.main === module) {
  main().catch(console.error);
}

export { domainPipeline, huggingfacePipeline, githubPipeline, weiboPipeline };
