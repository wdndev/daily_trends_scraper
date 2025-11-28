import { HotNewsPipeline, HotNewsPipelineConfig } from './pipeline/HotNewsPipeline';
import { join } from 'path';

/**
 * 执行新闻API流水线
 */
async function executeHotNewsPipeline(
  configPath?: string,
  jsonOutputDir: string = './data/json',
  markdownOutputDir: string = './data/markdown',
  maxItems?: number,
  parallel: boolean = true,
  delayBetweenPlatforms: number = 1000
): Promise<any> {
  console.log('========================================');
  console.log('  新闻API数据抓取工具');
  console.log('========================================\n');

  const pipelineConfig: HotNewsPipelineConfig = {
    configPath: configPath || join(process.cwd(), 'config', 'hot_news.json'),
    jsonOutputDir,
    markdownOutputDir,
    maxItems: maxItems || 50,
    filterAds: true,
    timeout: 30000,
    maxRetries: 2,
    parallel,
    delayBetweenPlatforms,
    enableLogging: true,
  };

  const pipeline = new HotNewsPipeline(pipelineConfig);
  const result = await pipeline.executeWithStats();

  if (result.success) {
    console.log(`\n✅ 新闻API流水线执行成功!`);
    console.log(`📊 执行时间: ${result.duration}ms`);
    console.log(`📈 抓取数据: ${result.scrapedData?.length || 0} 条`);
    
    // 显示统计信息
    if (result.stats) {
      console.log(`\n📊 统计信息:`);
      console.log(`  - 成功平台: ${result.stats.totalPlatforms}`);
      console.log(`  - 总数据量: ${result.stats.totalItems} 条`);
      result.stats.platforms.forEach((platform: any) => {
        console.log(`  - ${platform.platformName}: ${platform.totalItems} 条（含链接 ${platform.withUrl} 条）`);
      });
    }
  } else {
    console.log(`\n❌ 新闻API流水线执行失败!`);
    if (result.errors) {
      console.log('错误信息:');
      result.errors.forEach((error: string, index: number) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
  }

  return result;
}

// 主函数
async function main() {
  const configPath = join(process.cwd(), 'config', 'hot_news.json');
  const jsonOutputDir = './data/json';
  const markdownOutputDir = './data/markdown';
  const maxItems = 50;
  
  // 使用并行执行（更快）
  await executeHotNewsPipeline(configPath, jsonOutputDir, markdownOutputDir, maxItems, true);
  
  // 如果需要顺序执行（避免API限流），可以使用下面的代码：
  // await executeHotNewsPipeline(configPath, jsonOutputDir, markdownOutputDir, maxItems, false, 1000);
}

if (require.main === module) {
  main().catch(console.error);
}

export { executeHotNewsPipeline };