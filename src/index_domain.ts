import { DomainPipeline, DomainPipelineConfig } from './pipeline/DomainPipeline';
import * as path from 'path';

/**
 * 使用DomainPipeline抓取特定领域的arXiv论文示例
 */
async function main() {
  console.log('开始执行领域论文抓取流水线...');

  // 示例1: 抓取NLP领域的论文
  console.log('\n=== 示例1: 抓取NLP领域论文 ===');
  const nlpConfig: DomainPipelineConfig = {
    domain: ['LLM', 'LLM', 'NLP'],
    maxResults: 10,
    includeFullText: false, // 设置为true会获取全文，但会很慢
    jsonOutputDir: path.join(__dirname, '../data_pipeline/domain/json'),
    markdownOutputDir: path.join(__dirname, '../data_pipeline/domain/markdown'),
  };

  const nlpPipeline = new DomainPipeline(nlpConfig);
  const nlpResult = await nlpPipeline.execute();
  
  if (nlpResult.success) {
    console.log(`NLP论文抓取成功，共 ${nlpResult.scrapedData?.length} 篇论文`);
  } else {
    console.error('NLP论文抓取失败:', nlpResult.errors);
  }


  console.log('\n领域论文抓取流水线执行完成！');
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}

export { main as runDomainPipeline }; 