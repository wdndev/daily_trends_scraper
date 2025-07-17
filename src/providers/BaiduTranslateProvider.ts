import axios from 'axios';
import * as crypto from 'crypto';

export interface BaiduTranslateConfig {
  appid: string;
  appkey: string;
}


/**
 * 百度翻译提供者
 * 基于百度翻译API的简单封装
 */
export class BaiduTranslateProvider {
  private appid: string;
  private appkey: string;
  private endpoint: string = 'http://api.fanyi.baidu.com';
  private path: string = '/api/trans/vip/translate';

  constructor(config: BaiduTranslateConfig) {
    this.appid = config.appid;
    this.appkey = config.appkey;
  }

  /**
   * 翻译文本
   * @param text 要翻译的文本
   * @param from 源语言代码
   * @param to 目标语言代码
   * @returns 翻译结果对象
   */
  public async translate(text: string, from: string = 'en', to: string = 'zh'): Promise<any> {
    // 生成随机数和签名
    const salt = this.generateRandomSalt();
    const sign = this.generateSign(text, salt);
    
    // 构建请求参数
    const payload = {
      appid: this.appid,
      q: text,
      from: from,
      to: to,
      salt: salt,
      sign: sign
    };

    try {
      // 发送请求
      const response = await axios.post(`${this.endpoint}${this.path}`, null, {
        params: payload,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      // 处理API响应
      if (response.data.error_code) {
        throw new Error(`翻译API错误: ${response.data.error_code} - ${response.data.error_msg}`);
      }
      
      // 提取翻译结果
      return {
        original: text,
        translation: response.data.trans_result?.map((item: any) => item.dst).join('\n') || '',
        raw: response.data
      };
    } catch (error: any) {
      if (error.response) {
        throw new Error(`HTTP错误: ${error.response.status} - ${error.response.statusText}`);
      }
      throw new Error(`翻译失败: ${error.message}`);
    }
  }

  /**
   * 批量翻译文本
   * @param texts 要翻译的文本数组
   * @param from 源语言代码
   * @param to 目标语言代码
   * @param concurrency 并发请求数限制
   * @returns 翻译结果数组
   */
  public async batchTranslate(
    texts: string[], 
    from: string = 'en', 
    to: string = 'zh',
    concurrency: number = 5
  ): Promise<any[]> {
    const results: any[] = [];
    let index = 0;
    
    // 控制并发请求数的执行函数
    const worker = async () => {
      while (index < texts.length) {
        const currentIndex = index++;
        try {
          const result = await this.translate(texts[currentIndex], from, to);
          results[currentIndex] = result;
        } catch (error) {
          results[currentIndex] = {
            original: texts[currentIndex],
            error: (error as Error).message
          };
        }
      }
    };
    
    // 创建并发工作线程
    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);
    
    return results;
  }

  /**
   * 生成随机数
   * @returns 随机整数
   */
  private generateRandomSalt(): number {
    return Math.floor(Math.random() * (65536 - 32768 + 1)) + 32768;
  }

  /**
   * 生成签名
   * @param text 翻译文本
   * @param salt 随机数
   * @returns 签名结果
   */
  private generateSign(text: string, salt: number): string {
    const str = this.appid + text + salt + this.appkey;
    return crypto.createHash('md5').update(str).digest('hex');
  }
}