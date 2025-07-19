import { BaiduTranslateProvider } from './providers/BaiduTranslateProvider';
import { BingTranslateProvider } from './providers/BingTranslateProvider';

/**
 * 百度翻译提供者使用示例
 */
async function main_old() {
  // 配置翻译提供者
  const translator = new BaiduTranslateProvider(
    {
      appid: "20250706002398792",
      appkey: "YwQSdpuzEHt3vKqOgsww"
    }
  );

  try {
    // 示例1: 单文本翻译
    console.log('=== 单文本翻译示例 ===');
    const text = "Agentic search such as Deep Research systems-where agents autonomously browse the web, synthesize information, and return comprehensive citation-backed answers-represents a major shift in how users interact with web-scale information.";
    
    const result = await translator.translate(text, 'en', 'zh');
    console.log('原文:', result.original);
    console.log('译文:', result.translation);
    console.log();

    // 示例2: 批量翻译（使用batchTranslate方法）
    console.log('=== 批量翻译示例 ===');
    const texts = [
      "Hello, world!",
      "How are you today?",
      "This is a test message."
    ];
    
    const batchResults = await translator.batchTranslate(texts, 'en', 'zh');
    batchResults.forEach((result, i) => {
      console.log(`原文 ${i + 1}:`, result.original);
      if (result.error) {
        console.log(`错误 ${i + 1}:`, result.error);
      } else {
        console.log(`译文 ${i + 1}:`, result.translation);
      }
      console.log();
    });

  } catch (error) {
    console.error('翻译过程中出现错误:', error);
  }
}

async function main() {

  try {
    // 示例1: 单文本翻译
    console.log('=== 单文本翻译示例 ===');
    const text = "Agentic search such as Deep Research systems-where agents autonomously browse the web, synthesize information, and return comprehensive citation-backed answers-represents a major shift in how users interact with web-scale information.";
    
    const bingProvider = new BingTranslateProvider();
    const result = await bingProvider.translate(text);  
    console.log('原文:', result.text);
    console.log('译文:', result.translation);


 

  } catch (error) {
    console.error('翻译过程中出现错误:', error);
  }
}


// 如果直接运行此文件，则执行示例
if (require.main === module) {
  main().catch(console.error);
}

export { main as translateExample }; 