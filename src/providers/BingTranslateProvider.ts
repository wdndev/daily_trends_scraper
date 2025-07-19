import { translate as bingTranslate } from 'bing-translate-api';


/**
 * Bing翻译提供者
 * 基于Bing翻译API的简单封装
 */
export class BingTranslateProvider {

  constructor() {
  }

  /**
   * 翻译文本
   * @param text 要翻译的文本
   * @param from 源语言代码
   * @param to 目标语言代码
   * @returns 翻译结果对象
   */
  public async translate(text: string, from: string = 'en', to: string = 'zh-Hans'): Promise<{ text: string, translation: string }> {
    try {
      const result = await bingTranslate(text, from, to);
      if (result) {
        return {
          text: result.text,
          translation: result.translation,
        };
      }
      return {
        text: text,
        translation: '翻译失败: 未获取到结果',
      };
    } catch (error) {
      return {
        text: text,
        translation: '翻译失败: ' + (error as Error).message,
      };
    }
  }

}