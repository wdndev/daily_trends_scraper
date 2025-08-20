import puppeteer, { Browser, Page } from 'puppeteer';
import TurndownService from 'turndown';

type QADict = { [key: string]: string };

export class PaperAnalysisScraper {
  private browser: Browser | null = null;
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService();
  }

  // 初始化 Puppeteer，支持多次复用
  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({ headless: true });
    }
    return this.browser;
  }

  // 主方法：抓取解读并转为 Markdown
  public async fetchInterpretation(paperId: string): Promise<string> {
    const url = `https://papers.cool/arxiv/${paperId}`;
    const browser = await this.getBrowser();
    let page: Page | null = null;
  
    const basePaperId = paperId.replace(/\./g, '\\.').replace(/v\d+$/, '');
    const kimiButtonSelector = `#kimi-${basePaperId}`;
    const kimiContentSelector = `#kimi-container-${basePaperId}`;
  
    try {
      page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 3000 });
  
      await page.waitForSelector(kimiButtonSelector, { timeout: 1000 });
      await page.click(kimiButtonSelector);
  
      await page.waitForFunction(
        (selector: string) => {
          const el = document.querySelector(selector);
          return el && el.textContent && el.textContent.trim().length > 1000;
        },
        { timeout: 30000 },
        kimiContentSelector
      );
  
      const kimiContentHTML = await page.$eval(
        kimiContentSelector,
        (el: Element) => el.innerHTML
      );
  
      // turndown 转换后，将所有标题行的 # 前缀去掉，变成普通文本
      const kimiContentMarkdown = this.turndownService.turndown(kimiContentHTML);
      const plainText = kimiContentMarkdown.replace(/^#+\s?/gm, '');
      
      // 处理数学公式，避免 Nunjucks 解析冲突
      const processedText = this.processMathFormulas(plainText);
      return processedText;
    } catch (error: any) {
      throw new Error(`抓取失败: ${error.message || error}`);
    } finally {
      if (page && !page.isClosed()) {
        await page.close();
      }
    }
  }

  public async clickLLMGenerate(paperId: string): Promise<string> {
    const url = `https://papers.cool/arxiv/${paperId}`;
    const browser = await this.getBrowser();
    let page: Page | null = null;
  
    const basePaperId = paperId.replace(/\./g, '\\.').replace(/v\d+$/, '');
    const kimiButtonSelector = `#kimi-${basePaperId}`;
  
    try {
      page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 3000 });
  
      await page.waitForSelector(kimiButtonSelector, { timeout: 1000 });
      await page.click(kimiButtonSelector);
  
      // 点击后等待一小段时间确保点击生效
      await new Promise(resolve => setTimeout(resolve, 500));
  
      return 'success';
    } catch (error: any) {
      // throw new Error(`点击失败: ${error.message || error}`);
      console.error(`点击失败: ${error.message || error}`);
      return 'failed';
    } finally {
      if (page && !page.isClosed()) {
        await page.close();
      }
    }
  }

  // 普通 Q/A 文本解析
  public parseQATextToDict(text: string): QADict {
    const qaDict: QADict = {};
    const lines = text.split('\n');
    let currentQ = '';
    let currentA = '';
    let mode: 'q' | 'a' | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('Q:')) {
        if (currentQ && currentA) {
          qaDict[currentQ] = currentA.trim();
        }
        currentQ = line.replace(/^Q:\s*/, '');
        currentA = '';
        mode = 'q';
      } else if (line.startsWith('A:')) {
        currentA = line.replace(/^A:\s*/, '');
        mode = 'a';
      } else if (mode === 'a' && line) {
        currentA += '\n' + line;
      }
    }
    if (currentQ && currentA) {
      qaDict[currentQ] = currentA.trim();
    }
    return qaDict;
  }

  // Markdown Q/A 解析
  public parseMarkdownQAToDict(text: string): QADict {
    const qaRegex = /\*\*Q\*\*:\s*([\s\S]*?)(?=\*\*Q\*\*:|\*\*A\*\*:|$)/g;
    const aRegex = /\*\*A\*\*:\s*([\s\S]*?)(?=\*\*Q\*\*:|\*\*A\*\*:|$)/g;

    const qMatches = [];
    let match;
    while ((match = qaRegex.exec(text)) !== null) {
      qMatches.push({ index: match.index, question: match[1].trim() });
    }

    const aMatches = [];
    while ((match = aRegex.exec(text)) !== null) {
      aMatches.push({ index: match.index, answer: match[1].trim() });
    }

    const qaDict: QADict = {};
    for (let i = 0; i < Math.min(qMatches.length, aMatches.length); i++) {
      qaDict[qMatches[i].question] = aMatches[i].answer;
    }
    return qaDict;
  }

  // 处理数学公式，避免 Nunjucks 解析冲突
  private processMathFormulas(text: string): string {
    // 处理行内数学公式 $...$ 和 $$...$$
    let processedText = text;
    
    // 处理行内公式 $...$
    processedText = processedText.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
      // 如果公式包含 Nunjucks 语法，则包装在 raw 标签中
      if (formula.includes('{{') || formula.includes('}}') || formula.includes('{%')) {
        return `{% raw %}\$${formula}\${% endraw %}`;
      }
      return match;
    });
    
    // 处理块级公式 $$...$$
    processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      // 如果公式包含 Nunjucks 语法，则包装在 raw 标签中
      if (formula.includes('{{') || formula.includes('}}') || formula.includes('{%')) {
        return `{% raw %}\$\$${formula}\$\${% endraw %}`;
      }
      return match;
    });
    
    // 处理其他可能的数学公式格式，如 \(...\) 和 \[...\]
    processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
      if (formula.includes('{{') || formula.includes('}}') || formula.includes('{%')) {
        return `{% raw %}\\(${formula}\\){% endraw %}`;
      }
      return match;
    });
    
    processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
      if (formula.includes('{{') || formula.includes('}}') || formula.includes('{%')) {
        return `{% raw %}\\[${formula}\\]{% endraw %}`;
      }
      return match;
    });
    
    return processedText;
  }

  // 关闭 Puppeteer 实例（可选）
  public async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// // 使用示例
// async function main() {
//   const interpreter = new PaperAnalysisScraper();
//   try {
//     const markdown = await interpreter.fetchInterpretation('2507.01951');
//     console.log(markdown);

//     // const qaDict = interpreter.parseMarkdownQAToDict(markdown);
//     // console.log(qaDict);
//   } catch (err) {
//     console.error(err);
//   } finally {
//     await interpreter.close();
//   }
// }