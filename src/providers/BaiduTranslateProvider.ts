import axios from 'axios';

/**
 * 百度翻译提供者
 * 基于百度翻译API的简单封装
 */
export class BaiduTranslateProvider {
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  /**
   * 翻译文本
   * @param text 要翻译的文本
   * @param from 源语言代码
   * @param to 目标语言代码
   * @returns 翻译后的文本
   */
  public async translate(text: string, from: string = 'en', to: string = 'zh'): Promise<string> {
    const accessToken = await this.getAccessToken();
    
    const options = {
      method: 'POST',
      url: `https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1?access_token=${accessToken}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify({
        from: from,
        to: to,
        q: text
      })
    };

    try {
      const response = await axios(options);
      const data = response.data;
      
      // 调试：打印完整的API响应
      // console.log('API响应:', JSON.stringify(data, null, 2));
      
      // 检查是否有错误
      if (data.error_code) {
        throw new Error(`翻译错误: ${data.error_msg || data.error_code}`);
      }
      
      // 解析翻译结果
      if (data.trans_result && data.trans_result.length > 0) {
        return data.trans_result[0].dst;
      }
      
      // 如果没有trans_result，尝试其他可能的字段
      if (data.result && data.result.trans_result && data.result.trans_result.length > 0) {
        return data.result.trans_result[0].dst;
      }
      
      throw new Error('翻译结果为空');
    } catch (error: any) {
      if (error.response) {
        // 服务器响应了错误状态码
        throw new Error(`翻译失败: ${error.response.status} - ${error.response.data?.error_msg || error.response.statusText}`);
      } else if (error.request) {
        // 请求已发出但没有收到响应
        throw new Error(`翻译失败: 网络错误 - 无法连接到服务器`);
      } else {
        // 其他错误
        throw new Error(`翻译失败: ${error.message || error}`);
      }
    }
  }

  /**
   * 获取访问令牌
   * @returns 访问令牌
   */
  private async getAccessToken(): Promise<string> {
    const options = {
      method: 'POST',
      url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`,
    };

    try {
      const response = await axios(options);
      return response.data.access_token;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`获取访问令牌失败: ${error.response.status} - ${error.response.data?.error_description || error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`获取访问令牌失败: 网络错误 - 无法连接到服务器`);
      } else {
        throw new Error(`获取访问令牌失败: ${error.message || error}`);
      }
    }
  }
} 