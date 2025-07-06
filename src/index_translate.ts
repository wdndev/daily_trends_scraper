import { BaiduTranslateProvider } from './providers/BaiduTranslateProvider';

/**
 * 百度翻译提供者使用示例
 */
async function main() {
  // 配置翻译提供者
  const translator = new BaiduTranslateProvider(
    "qoX2filhgWozrmP9udUueTyq",
    "BKG6Yr2lH6kLYKV8AE5IlRiO7nHThPMQ"
  );

  try {
    // 示例1: 单文本翻译
    console.log('=== 单文本翻译示例 ===');
    const text = "Agentic search such as Deep Research systems-where agents autonomously browse the web, synthesize information, and return comprehensive citation-backed answers-represents a major shift in how users interact with web-scale information.";
    
    const result = await translator.translate(text, 'en', 'zh');
    console.log('原文:', text);
    console.log('译文:', result);
    console.log();

    // 示例2: 批量翻译（手动实现）
    console.log('=== 批量翻译示例 ===');
    const texts = [
      "Hello, world!",
      "How are you today?",
      "This is a test message."
    ];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const result = await translator.translate(texts[i], 'en', 'zh');
        console.log(`原文 ${i + 1}:`, texts[i]);
        console.log(`译文 ${i + 1}:`, result);
        console.log();
      } catch (error) {
        console.error(`翻译文本失败: "${texts[i]}"`, error);
      }
    }

  } catch (error) {
    console.error('翻译过程中出现错误:', error);
  }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  main().catch(console.error);
}

export { main as translateExample }; 