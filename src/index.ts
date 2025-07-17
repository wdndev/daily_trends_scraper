import { WeiboPipeline, WeiboPipelineConfig } from './pipeline/WeiboPipeline';
import { GithubTrendingPipeline, GithubTrendingPipelineConfig } from './pipeline/GithubTrendingPipeline';
import { HFPaperPipeline, HFPaperPipelineConfig } from './pipeline/HFPaperPipeline';
import { DomainPipeline, DomainPipelineConfig } from './pipeline/DomainPipeline';
import { LLMConfig } from './types/llm.types';
import { readFileSync } from 'fs';
import { join } from 'path';

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

reloadEnvVars();

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
  useProxy: boolean = true,
  llmAnalysisConfig?: LLMConfig
): PipelineConfigs {
  const proxyConfig = useProxy ? { host: '127.0.0.1', port: 7890 } : undefined;
  
  return {
    weibo: {
      jsonOutputDir: jsonOutputDir,
      markdownOutputDir: markdownOutputDir,
      maxItems: 55,
      filterAds: true,
      includeUserInfo: true,
      timeout: 30000,
      enableLogging: true,
    },
    github: {
      jsonOutputDir: jsonOutputDir,
      markdownOutputDir: markdownOutputDir,
      maxItems: 20,
      languages: ['python', 'typescript'],
      timeRange: 'daily',
      includeDescription: true,
      includeStars: true,
      includeForks: true,
      proxy: proxyConfig,
    },
    huggingface: {
      jsonOutputDir: jsonOutputDir,
      markdownOutputDir: markdownOutputDir,
      maxItems: 20,
      category: 'nlp',
      timeRange: 'day',
      includeAbstract: true,
      includeAuthors: true,
      includeCitations: true,
      includeDownloads: true,
      proxy: proxyConfig,
      llmConfig: llmAnalysisConfig,
      translateConfig: {
        appid: "20250706002398792",
        appkey: "YwQSdpuzEHt3vKqOgsww",
      },
    },
    domain: {
      domain: ['LLM', 'Agent', 'NLP', 'AI'],
      maxResults: 10,
      includeFullText: false,
      jsonOutputDir: jsonOutputDir,
      markdownOutputDir: markdownOutputDir,
      translateConfig: {
        appid: "20250706002398792",
        appkey: "YwQSdpuzEHt3vKqOgsww",
      },
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
): Promise<{ success: boolean; pipelineName: string; result?: any; error?: any }> {
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
      
      return { success: true, pipelineName, result };
    } else {
      console.log(`\n❌ ${pipelineName}流水线执行失败!`);
      if (result.errors) {
        console.log('错误信息:');
        result.errors.forEach((error: string, index: number) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      return { success: false, pipelineName, error: result.errors };
    }
  } catch (error) {
    console.error(`❌ 执行${pipelineName}流水线时发生异常:`, error);
    return { success: false, pipelineName, error };
  }
}

// 主函数
async function main() {
  const jsonOutputDir = './data_pipeline/json';
  const markdownOutputDir = './data_pipeline/markdown';
  const useProxy = true; 

  const llmAnalysisConfig: LLMConfig = {
    provider: process.env.PROVIDER as 'openai' | 'qianfan' || 'openai',
    apiKey: process.env.API_KEY!,
    baseUrl: process.env.BASE_URL || 'https://api.openai.com/v1',
    modelName: process.env.MODEL_NAME || 'gpt-3.5-turbo',
    maxTokens: 4000,
    // temperature: 0.7,
    stream: false,
  };
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy);
  
  console.log('🔧 开始执行数据抓取流水线...\n');
  
  // 并行执行各个流水线
  console.log('🚀 开始并行执行所有流水线...\n');
  
  const startTime = Date.now();
  
  const pipelineConfigs = [
    { name: 'HuggingFace Papers', promise: executePipeline('HuggingFace Papers', HFPaperPipeline, configs.huggingface, 'executeWithStats') },
    { name: 'Domain Papers', promise: executePipeline('Domain Papers', DomainPipeline, configs.domain) },
    { name: 'GitHub Trending', promise: executePipeline('GitHub Trending', GithubTrendingPipeline, configs.github) },
    { name: 'Weibo Hot', promise: executePipeline('Weibo Hot', WeiboPipeline, configs.weibo) }
  ];
  
  const pipelinePromises = pipelineConfigs.map(config => config.promise);
  
  const results = await Promise.allSettled(pipelinePromises);
  
  // 统计执行结果
  const totalTime = Date.now() - startTime;
  const successfulPipelines = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failedPipelines = results.length - successfulPipelines;
  
  console.log('\n📊 并行执行结果统计:');
  console.log(`⏱️  总执行时间: ${totalTime}ms`);
  console.log(`✅ 成功流水线: ${successfulPipelines}/${results.length}`);
  console.log(`❌ 失败流水线: ${failedPipelines}/${results.length}`);
  
  // 显示失败的流水线
  if (failedPipelines > 0) {
    console.log('\n❌ 失败的流水线:');
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.log(`  ${index + 1}. ${pipelineConfigs[index].name}: Promise rejected`);
      } else if (!result.value.success) {
        console.log(`  ${index + 1}. ${result.value.pipelineName}: ${result.value.error}`);
      }
    });
  }
  
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
  useProxy: boolean = true
) {
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy);
  await executePipeline('HuggingFace Papers', HFPaperPipeline, configs.huggingface, 'executeWithStats');
}

async function domainPipeline(
  jsonOutputDir: string = './data_pipeline', 
  markdownOutputDir: string = './data_pipeline',
  useProxy: boolean = true
) {
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy);
  await executePipeline('Domain Papers', DomainPipeline, configs.domain, 'execute');
}

// 新增：并行执行所有流水线的函数
async function executeAllPipelinesParallel(
  jsonOutputDir: string = './data_pipeline/json',
  markdownOutputDir: string = './data_pipeline/markdown',
  useProxy: boolean = true,
  llmAnalysisConfig?: LLMConfig
) {
  const configs = createConfigs(jsonOutputDir, markdownOutputDir, useProxy, llmAnalysisConfig);
  
  console.log('🔧 开始并行执行数据抓取流水线...\n');
  
  const startTime = Date.now();
  
  const pipelineConfigs = [
    { name: 'HuggingFace Papers', promise: executePipeline('HuggingFace Papers', HFPaperPipeline, configs.huggingface, 'executeWithStats') },
    { name: 'Domain Papers', promise: executePipeline('Domain Papers', DomainPipeline, configs.domain, 'execute') },
    { name: 'GitHub Trending', promise: executePipeline('GitHub Trending', GithubTrendingPipeline, configs.github) },
    { name: 'Weibo Hot', promise: executePipeline('Weibo Hot', WeiboPipeline, configs.weibo) }
  ];
  
  const pipelinePromises = pipelineConfigs.map(config => config.promise);
  const results = await Promise.allSettled(pipelinePromises);
  
  // 统计执行结果
  const totalTime = Date.now() - startTime;
  const successfulPipelines = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failedPipelines = results.length - successfulPipelines;
  
  console.log('\n📊 并行执行结果统计:');
  console.log(`⏱️  总执行时间: ${totalTime}ms`);
  console.log(`✅ 成功流水线: ${successfulPipelines}/${results.length}`);
  console.log(`❌ 失败流水线: ${failedPipelines}/${results.length}`);
  
  // 显示失败的流水线
  if (failedPipelines > 0) {
    console.log('\n❌ 失败的流水线:');
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.log(`  ${index + 1}. ${pipelineConfigs[index].name}: Promise rejected`);
      } else if (!result.value.success) {
        console.log(`  ${index + 1}. ${result.value.pipelineName}: ${result.value.error}`);
      }
    });
  }
  
  console.log('\n🎉 所有流水线执行完成!');
  
  return {
    totalTime,
    successfulPipelines,
    failedPipelines,
    results: results.map((result, index) => ({
      name: pipelineConfigs[index].name,
      success: result.status === 'fulfilled' && result.value.success,
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  };
}

if (require.main === module) {
  main().catch(console.error);
}

export { domainPipeline, huggingfacePipeline, githubPipeline, weiboPipeline, executeAllPipelinesParallel };
