import { BaseProvider } from './BaseProvider';
import { LLMMessage, LLMResponse, LLMStreamResponse } from '../types';

/**
 * 示例Provider - 用于演示如何实现BaseProvider
 * 这个Provider模拟LLM响应，实际项目中可以替换为真实的LLM服务
 */
export class ExampleProvider extends BaseProvider {
  /**
   * 非流式处理
   */
  public async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    this.validateMessages(messages);

    // 模拟API调用延迟
    await this.delay(1000);

    // 模拟响应
    const lastMessage = messages[messages.length - 1];
    const response = `这是对"${lastMessage.content}"的模拟回复。`;

    return {
      content: response,
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
      finish_reason: 'stop',
    };
  }

  /**
   * 流式处理
   */
  public async *chatStream(messages: LLMMessage[]): AsyncIterable<LLMStreamResponse> {
    this.validateMessages(messages);

    const lastMessage = messages[messages.length - 1];
    const fullResponse = `这是对"${lastMessage.content}"的模拟流式回复。`;
    const words = fullResponse.split(' ');

    for (let i = 0; i < words.length; i++) {
      // 模拟流式输出
      await this.delay(100);
      
      yield {
        content: words[i] + (i < words.length - 1 ? ' ' : ''),
        done: false,
        usage: {
          prompt_tokens: 100,
          completion_tokens: i + 1,
          total_tokens: 101 + i,
        },
      };
    }

    // 发送完成信号
    yield {
      content: '',
      done: true,
      usage: {
        prompt_tokens: 100,
        completion_tokens: words.length,
        total_tokens: 100 + words.length,
      },
      finish_reason: 'stop',
    };
  }

  /**
   * 处理趋势数据的便捷方法
   */
  public async processTrends(items: any[]): Promise<LLMResponse> {
    const systemMessage = this.buildSystemMessage(
      '你是一个专业的数据分析师，请分析以下趋势数据并生成摘要。'
    );

    const userMessage = this.buildUserMessage(
      this.buildTrendsPrompt(items)
    );

    return this.chat([systemMessage, userMessage]);
  }

  /**
   * 构建趋势数据提示词
   */
  private buildTrendsPrompt(items: any[]): string {
    const itemsText = items
      .map((item, index) => `${index + 1}. ${item.title}${item.description ? ` - ${item.description}` : ''}`)
      .join('\n');

    return `请分析以下${items.length}条趋势数据，生成一个简洁的摘要报告：

${itemsText}

请从以下几个方面进行分析：
1. 主要趋势和热点
2. 技术发展方向
3. 值得关注的项目或话题
4. 总结和建议

请用中文回答，格式要清晰易读。`;
  }
} 