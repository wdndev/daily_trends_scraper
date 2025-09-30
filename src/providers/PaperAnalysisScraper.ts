import puppeteer, { Browser, Page } from 'puppeteer';
import TurndownService from 'turndown';
// @ts-ignore - cheerio 没有类型定义
import * as cheerio from 'cheerio';

export class PaperAnalysisScraper {
  private browser: Browser | null = null;
  private turndownService: TurndownService;
  private pagePool: Page[] = [];
  private readonly maxPoolSize: number = 3;
  
  // LaTeX符号映射
  private readonly symbolMap: { [key: string]: string } = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\pi': 'π', '\\sigma': 'σ',
    '\\tau': 'τ', '\\phi': 'φ', '\\omega': 'ω', '\\sum': '∑', '\\int': '∫',
    '\\infty': '∞', '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
    '\\times': '×', '\\div': '÷', '\\pm': '±', '\\rightarrow': '→', '\\leftarrow': '←',
    '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\in': '∈', '\\notin': '∉',
    '\\subset': '⊂', '\\supset': '⊃', '\\cup': '∪', '\\cap': '∩', '\\emptyset': '∅',
    '\\forall': '∀', '\\exists': '∃', '\\nabla': '∇', '\\partial': '∂', '\\sqrt': '√',
    '\\cdot': '·', '\\ldots': '...', '\\cdots': '⋯', '\\vdots': '⋮', '\\ddots': '⋱',
    '\\leftrightarrow': '↔', '\\Leftrightarrow': '⇔', '\\uparrow': '↑', '\\downarrow': '↓',
    '\\updownarrow': '↕', '\\Uparrow': '⇑', '\\Downarrow': '⇓', '\\Updownarrow': '⇕'
  };

  // 预编译常用正则表达式
  private readonly regexPatterns = {
    blockMath: /\$\$([\s\S]*?)\$\$/g,
    blockLatex: /\\\[([\s\S]*?)\\\]/g,
    inlineMath: /\$([^$\n]+?)\$/g,
    inlineLatex: /\\\(([\s\S]*?)\\\)/g,
    latexCommand: /\\[a-zA-Z]+/g,
    frac1: /\\?frac\{([^}]+)\}\{([^}]+)\}/g,
    frac2: /frac([a-zA-Z_()]+)([0-9]+)\^([^\s,)]+)/g,
    frac3: /frac([a-zA-Z_()]+)([0-9]+)(?![a-zA-Z_()])/g,
    markdownLink: /\[([^\]]+)\]\s*\n?\s*\(([^)]+)\)/g,
    markdownTable: /^(\|.*\|)\n(\|[-\s|:]+\|)\n((?:\|.*\|(?:\n|$))*)/gm
  };

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });
  }

  // 初始化 Puppeteer，支持多次复用
  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-sync'
        ]
      });
    }
    return this.browser;
  }

  // 从页面池获取页面或创建新页面
  private async getPage(): Promise<Page> {
    if (this.pagePool.length > 0) {
      const page = this.pagePool.pop()!;
      // 清理页面状态
      await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
      return page;
    }
    
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await this.setupPage(page);
    return page;
  }

  // 归还页面到池中
  private async releasePage(page: Page) {
    if (!page.isClosed() && this.pagePool.length < this.maxPoolSize) {
      this.pagePool.push(page);
    } else if (!page.isClosed()) {
      await page.close();
    }
  }

  // 设置页面优化选项
  private async setupPage(page: Page) {
    await page.setViewport({ width: 1280, height: 720 });
    await page.setJavaScriptEnabled(true);
    
    // 更激进的资源拦截
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();
      
      // 拦截不需要的资源
      if (['image', 'font', 'media', 'stylesheet', 'websocket'].includes(resourceType) ||
          url.includes('analytics') || url.includes('ads') || url.includes('tracking')) {
        req.abort();
      } else {
        req.continue();
      }
    });
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

  // 主方法：抓取解读并转为 Markdown（带重试机制）
  public async fetchInterpretation(paperId: string, retries: number = 2): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchInterpretationInternal(paperId);
      } catch (error: any) {
        lastError = error;
        if (attempt < retries) {
          console.warn(`抓取 ${paperId} 失败，重试 ${attempt + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw new Error(`抓取失败（已重试${retries}次）: ${lastError?.message || lastError}`);
  }

  // 内部方法：实际的抓取逻辑
  private async fetchInterpretationInternal(paperId: string): Promise<string> {
    const url = `https://papers.cool/arxiv/${paperId}`;
    const page = await this.getPage();
  
    const basePaperId = paperId.replace(/\./g, '\\.').replace(/v\d+$/, '');
    const kimiButtonSelector = `#kimi-${basePaperId}`;
    const kimiContentSelector = `#kimi-container-${basePaperId}`;
  
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForSelector(kimiButtonSelector, { timeout: 3000 });
      await page.click(kimiButtonSelector);
  
      // 等待内容加载
      await page.waitForFunction(
        (selector: string) => {
          const el = document.querySelector(selector);
          return el && el.textContent && el.textContent.trim().length > 1000;
        },
        { timeout: 30000, polling: 1000 },
        kimiContentSelector
      );
  
      const kimiContentHTML = await page.$eval(
        kimiContentSelector,
        (el: Element) => el.innerHTML
      );
  
      // 使用优化的文本处理流水线
      const result = this.processTextPipeline(kimiContentHTML);
      
      return result;
    } finally {
      await this.releasePage(page);
    }
  }

  // 优化的文本处理流水线
  private processTextPipeline(html: string): string {
    // 1. HTML to Markdown
    const kimiContentMarkdown = this.processHTMLWithTables(html);
    
    // 2. 一次性处理所有文本转换（减少多次遍历）
    let text = kimiContentMarkdown
      .replace(/^#+\s?/gm, '')  // 移除标题标记
      .replace(/[ \t]+$/gm, '')  // 移除行尾空白
      .replace(/\n{4,}/g, '\n\n\n')  // 清理多余空行
      .replace(/[ \t]{2,}/g, ' ');  // 清理多余空格
    
    // 3. 处理表格数据
    text = this.processVerticalTableData(text);
    
    // 4. 处理数学公式
    text = this.processMathFormulas(text);
    
    // 5. 修复链接和最终清理
    return this.fixMarkdownLinks(text)
      .replace(/([。！？，；：])\1+/g, '$1')
      .replace(/(\n[-*]\s.+)\n\n(?=[-*]\s)/g, '$1\n')
      .replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
      .replace(/(#{1,6}\s.+)\n([^\n#])/g, '$1\n\n$2')
      .replace(/(\*\*Q\d+\*\*[^\n]+)\n{3,}/g, '$1\n\n')
      .replace(/\\(?=[^\\*_`[\]()#+\-.!])/g, '')
      .trim()
      .replace(/\n{3,}/g, '\n\n');
  }




  // 使用 cheerio + turndown 处理包含表格的 HTML
  private processHTMLWithTables(html: string): string {
    try {
      // 使用 cheerio 解析 HTML
      const $ = cheerio.load(html);
      
      // 清理MathJax和不需要的元素
      this.cleanupMathJaxElements($);
      
      // 处理FAQ结构
      this.processFAQStructure($);
      
      // 先处理表格，保存表格的Markdown
      const tableMarkdowns: string[] = [];
      $('table').each((index, table) => {
        const $table = $(table);
        const markdownTable = this.convertHTMLTableToMarkdown($table);
        if (markdownTable.trim()) {
          tableMarkdowns.push(markdownTable);
          // 用占位符替换表格
          $table.replaceWith(`TABLEPLACEHOLDER${index}`);
        }
      });
      
      // 使用 turndown 处理其他内容
      const processedHTML = $.html();
      let result = this.turndownService.turndown(processedHTML);
      
      // 恢复表格格式
      tableMarkdowns.forEach((tableMarkdown, index) => {
        const placeholder = `TABLEPLACEHOLDER${index}`;
        result = result.replace(new RegExp(placeholder, 'g'), tableMarkdown);
      });
      
      return result;
    } catch (error) {
      console.warn('cheerio 处理失败，回退到 turndown:', error);
      // 回退到 turndown
      return this.turndownService.turndown(html);
    }
  }

  // 清理MathJax元素，只保留纯文本或script标签中的内容
  private cleanupMathJaxElements($: any): void {
    // 删除MathJax的预览和辅助元素
    $('.MathJax_Preview, .MJX_Assistive_MathML').remove();
    
    // 处理MathJax显示元素，提取script标签中的LaTeX
    $('.MathJax').each((index: number, element: any) => {
      const $element = $(element);
      // 尝试找到包含LaTeX的script标签
      const $script = $element.find('script[type*="math/tex"]');
      if ($script.length > 0) {
        const latex = $script.text().trim();
        if (latex) {
          // 根据是否是display模式决定格式
          const isDisplay = $script.attr('type')?.includes('mode=display');
          const formatted = isDisplay ? `\n$$${latex}$$\n` : ` $${latex}$ `;
          $element.replaceWith(formatted);
          return;
        }
      }
      // 如果没有script标签，尝试获取纯文本
      const text = $element.text().trim();
      if (text) {
        $element.replaceWith(text);
      } else {
        $element.remove();
      }
    });
    
    // 处理MathJax_Display块级公式
    $('.MathJax_Display').each((index: number, element: any) => {
      const $element = $(element);
      const $script = $element.find('script[type*="math/tex"]');
      if ($script.length > 0) {
        const latex = $script.text().trim();
        if (latex) {
          $element.replaceWith(`\n$$${latex}$$\n`);
          return;
        }
      }
      const text = $element.text().trim();
      if (text) {
        $element.replaceWith(`\n${text}\n`);
      } else {
        $element.remove();
      }
    });
    
    // 删除其他MathJax相关的样式和辅助元素
    $('nobr, .MathJax_CHTML').each((index: number, element: any) => {
      const $element = $(element);
      const text = $element.text().trim();
      if (text) {
        $element.replaceWith(text);
      } else {
        $element.remove();
      }
    });
  }

  // 处理FAQ结构，将问答格式化
  private processFAQStructure($: any): void {
    // 处理问题部分
    $('.faq-q').each((index: number, element: any) => {
      const $element = $(element);
      const text = $element.text().trim();
      // 保留原有的强调格式，添加换行
      $element.replaceWith(`\n\n${text}\n`);
    });
    
    // 处理答案部分
    $('.faq-a').each((index: number, element: any) => {
      const $element = $(element);
      // 保持答案内容的HTML结构，只是移除外层div
      const content = $element.html();
      $element.replaceWith(content);
    });
    
    // 清理kimi-container的外层div
    $('.kimi-container, .notranslate').each((index: number, element: any) => {
      const $element = $(element);
      const content = $element.html();
      $element.replaceWith(content);
    });
  }

  // 将 HTML 表格转换为 Markdown 表格
  private convertHTMLTableToMarkdown($table: any): string {
    const rows: string[][] = [];
    
    // 优化：直接处理所有 tr 元素，避免重复查询
    const $rows = $table.find('tr');
    if ($rows.length === 0) {
      return '';
    }
    
    $rows.each((index: number, row: any) => {
      const $row = cheerio.load(row);
      const cells: string[] = [];
      $row('td, th').each((cellIndex: number, cell: any) => {
        const cellText = $row(cell).text().trim();
        if (cellText) {
          cells.push(cellText);
        }
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    
    if (rows.length === 0) {
      return '';
    }
    
    // 生成 Markdown 表格
    const markdownRows: string[] = [];
    
    // 添加表头
    if (rows.length > 0) {
      markdownRows.push('| ' + rows[0].join(' | ') + ' |');
      // 添加分隔符
      const separator = '| ' + rows[0].map(() => '---').join(' | ') + ' |';
      markdownRows.push(separator);
      
      // 添加数据行
      for (let i = 1; i < rows.length; i++) {
        markdownRows.push('| ' + rows[i].join(' | ') + ' |');
      }
    }
    
    return '\n\n' + markdownRows.join('\n') + '\n\n';
  }



  // 将 Markdown 表格转换为纯文本（使用预编译正则）
  private convertMarkdownTablesToText(text: string): string {
    this.regexPatterns.markdownTable.lastIndex = 0;
    return text.replace(this.regexPatterns.markdownTable, 
      (match, header, separator, rows) => {
        const lines = [header, ...rows.trim().split('\n')];
        return lines
          .filter(line => line.trim())
          .map(line => {
            const cells = line.split('|')
              .map((cell: string) => cell.trim())
              .filter((cell: string) => cell.length > 0);
            return cells.length > 0 ? cells.join(' | ') : '';
          })
          .filter(line => line)
          .join('\n') + '\n';
      }
    );
  }

  // 处理垂直排列的表格数据
  private processVerticalTableData(text: string): string {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // 跳过已经格式化的Markdown表格
      if (line.startsWith('|') && line.includes('|')) {
        processedLines.push(line);
        i++;
        continue;
      }
      
      // 简化表格检测：只检测明显的表格模式
      if (line && this.isTableStart(line)) {
        const tableResult = this.extractSimpleTable(lines, i);
        if (tableResult.formattedTable) {
          processedLines.push(tableResult.formattedTable);
          i = tableResult.endIndex;
          continue;
        }
      }
      
      processedLines.push(line);
      i++;
    }
    
    return processedLines.join('\n');
  }

  // 简化的表格开始检测
  private isTableStart(line: string): boolean {
    const tableKeywords = ['任务', '实验目的', '变量', '参数', '指标', '结果'];
    return tableKeywords.some(keyword => line.includes(keyword));
  }

  // 简化的表格提取
  private extractSimpleTable(lines: string[], startIndex: number): { formattedTable: string, endIndex: number } {
    const tableRows: string[] = [];
    let i = startIndex;
    
    // 收集表格行，最多10行
    while (i < lines.length && lines[i].trim() && tableRows.length < 10) {
      const line = lines[i].trim();
      if (line.length > 0 && line.length < 100 && 
          !line.includes('**') && 
          !line.includes('##') &&
          !line.startsWith('-') &&
          !line.startsWith('1.') &&
          !line.startsWith('2.') &&
          !line.startsWith('3.')) {
        tableRows.push(line);
      } else {
        break;
      }
      i++;
    }
    
    if (tableRows.length === 0) {
      return { formattedTable: '', endIndex: i };
    }
    
    // 简单格式化：每行一个条目
    const formattedTable = tableRows.join('\n');
    
    return { formattedTable, endIndex: i };
  }



  // 处理数学公式，将LaTeX公式转换为纯文本（使用预编译正则）
  private processMathFormulas(text: string): string {
    // 重置正则表达式的lastIndex（全局正则需要重置）
    this.regexPatterns.blockMath.lastIndex = 0;
    this.regexPatterns.blockLatex.lastIndex = 0;
    this.regexPatterns.inlineMath.lastIndex = 0;
    this.regexPatterns.inlineLatex.lastIndex = 0;
    
    // 处理块级公式
    text = text.replace(this.regexPatterns.blockMath, (match, formula) => 
      `\n${this.convertLatexToText(formula.trim())}\n`
    );
    text = text.replace(this.regexPatterns.blockLatex, (match, formula) => 
      `\n${this.convertLatexToText(formula.trim())}\n`
    );
    
    // 处理行内公式
    text = text.replace(this.regexPatterns.inlineMath, (match, formula) => 
      ` ${this.convertLatexToText(formula.trim())} `
    );
    text = text.replace(this.regexPatterns.inlineLatex, (match, formula) => 
      ` ${this.convertLatexToText(formula.trim())} `
    );
    
    // 处理没有$包围的LaTeX公式
    return this.processInlineLatex(text);
  }

  // 处理内联LaTeX公式（没有$包围的）
  private processInlineLatex(text: string): string {
    this.regexPatterns.latexCommand.lastIndex = 0;
    return text.split('\n').map(line => {
      return this.regexPatterns.latexCommand.test(line) ? this.convertLatexToText(line) : line;
    }).join('\n');
  }

  // 统一处理所有frac格式（使用预编译正则）
  private processAllFracFormats(text: string): string {
    // 重置正则表达式
    this.regexPatterns.frac1.lastIndex = 0;
    this.regexPatterns.frac2.lastIndex = 0;
    this.regexPatterns.frac3.lastIndex = 0;
    
    text = text.replace(this.regexPatterns.frac1, (match, num, den) => {
      return `(${this.convertLatexToText(num)}) / (${this.convertLatexToText(den)})`;
    });
    
    text = text.replace(this.regexPatterns.frac2, (match, num, den, sup) => {
      return `(${this.convertLatexToText(num)}) / (${this.convertLatexToText(den)})^(${this.convertLatexToText(sup)})`;
    });
    
    text = text.replace(this.regexPatterns.frac3, (match, num, den) => {
      return `(${this.convertLatexToText(num)}) / (${this.convertLatexToText(den)})`;
    });

    return text;
  }

  // 统一处理所有LaTeX清理规则
  private applyLatexCleanupRules(text: string): string {
    // 1. 处理上标和下标
    text = text.replace(/\^\{([^}]+)\}/g, '^($1)')
               .replace(/_\{([^}]+)\}/g, '_($1)')
               .replace(/\^([a-zA-Z0-9])/g, '^$1')
               .replace(/_([a-zA-Z0-9])/g, '_$1');
    
    // 2. 处理括号（统一处理left/right）
    const bracketPairs: [string, string][] = [
      ['\\(', '('], ['\\)', ')'], ['\\[', '['], ['\\]', ']'], ['\\{', '{'], ['\\}', '}']
    ];
    for (const [left, right] of bracketPairs) {
      text = text.replace(new RegExp(`\\\\left${left.replace(/[\\()[\]{}]/g, '\\$&')}`, 'g'), right);
      text = text.replace(new RegExp(`\\\\right${left.replace(/[\\()[\]{}]/g, '\\$&')}`, 'g'), right);
    }
    
    // 3. 处理带参数的LaTeX命令（格式控制和样式）
    const commandsWithArgs = [
      'mathbb', 'mathcal', 'mathfrak', 'mathscr', 'mathsf', 'mathit', 'mathtt',
      'text', 'mathrm', 'mathbf', 'textbf', 'textit', 'emph', 'underline', 
      'overline', 'textsc', 'textsl', 'textsf', 'texttt'
    ];
    for (const cmd of commandsWithArgs) {
      text = text.replace(new RegExp(`\\\\${cmd}\\{([^}]+)\\}`, 'g'), '$1');
    }
    
    // 4. 处理函数名（无参数）
    const functions = ['log', 'exp', 'sin', 'cos', 'tan', 'max', 'min', 'arg', 
                       'lim', 'sup', 'inf', 'clip'];
    for (const func of functions) {
      text = text.replace(new RegExp(`\\\\${func}`, 'g'), func);
    }
    
    // 5. 处理大小控制命令（无参数或可选参数）
    const sizeCommands = ['big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 
                          'Bigr', 'biggl', 'biggr', 'Biggl', 'Biggr', 'middle',
                          'left', 'right', 'vphantom', 'hphantom', 'phantom'];
    for (const cmd of sizeCommands) {
      text = text.replace(new RegExp(`\\\\${cmd}\\{([^}]+)\\}`, 'g'), '$1');
      text = text.replace(new RegExp(`\\\\${cmd}`, 'g'), '');
    }
    
    // 6. 使用预定义的符号映射
    for (const [latex, unicode] of Object.entries(this.symbolMap)) {
      text = text.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), unicode);
    }
    
    // 7. 处理环境和剩余的LaTeX命令
    text = text.replace(/\\begin\{[^}]+\}/g, '')
               .replace(/\\end\{[^}]+\}/g, '')
               .replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1')
               .replace(/\\[a-zA-Z]+/g, (match) => match.substring(1))
               .replace(/\{([^{}]+)\}/g, '$1')
               .replace(/\\/g, '');
    
    // 8. 最终清理空白
    return text.replace(/\s+/g, ' ').trim();
  }

  // 将LaTeX公式转换为可读文本
  private convertLatexToText(latex: string): string {
    let text = latex;
    
    // 统一处理所有frac格式
    text = this.processAllFracFormats(text);
    
    // 统一处理所有LaTeX清理规则
    text = this.applyLatexCleanupRules(text);
    
    return text;
  }

  // 清理多余的空白和空行（已整合到processTextPipeline，保留用于兼容性）
  private cleanupWhitespace(text: string): string {
    return text
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/[ \t]{2,}/g, ' ');
  }

  // 最终清理和格式化（已整合到processTextPipeline，保留用于兼容性）
  private finalCleanup(text: string): string {
    return text
      .replace(/([。！？，；：])\1+/g, '$1')
      .replace(/(\n[-*]\s.+)\n\n(?=[-*]\s)/g, '$1\n')
      .replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
      .replace(/(#{1,6}\s.+)\n([^\n#])/g, '$1\n\n$2')
      .replace(/(\*\*Q\d+\*\*[^\n]+)\n{3,}/g, '$1\n\n')
      .replace(/\\(?=[^\\*_`[\]()#+\-.!])/g, '')
      .trim()
      .replace(/\n{3,}/g, '\n\n');
  }

  // 修复Markdown链接格式（使用预编译正则）
  private fixMarkdownLinks(text: string): string {
    this.regexPatterns.markdownLink.lastIndex = 0;
    return text.replace(this.regexPatterns.markdownLink, (match, linkText, url) => {
      const cleanUrl = url.replace(/\s+/g, '');
      return `[${linkText}](${cleanUrl})`;
    });
  }

  // 关闭所有资源
  public async close() {
    // 关闭页面池中的所有页面
    for (const page of this.pagePool) {
      if (!page.isClosed()) {
        await page.close();
      }
    }
    this.pagePool = [];
    
    // 关闭浏览器
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// 使用示例
async function main() {
  const scraper = new PaperAnalysisScraper();
  
  try {
    const paperId = '2505.12843';
    console.log(`正在抓取论文: ${paperId}...\n`);
    
    const markdown = await scraper.fetchInterpretation(paperId);
    
    console.log('=== 抓取成功 ===');
    console.log(`论文ID: ${paperId}`);
    console.log(`内容长度: ${markdown.length} 字符\n`);
    console.log('=== 内容预览 ===');
    console.log(markdown);
    console.log('\n...\n');
    
  } catch (error: any) {
    console.error('抓取失败:', error.message);
  } finally {
    await scraper.close();
  }
}

// 仅在直接运行时执行
if (require.main === module) {
  main();
}
