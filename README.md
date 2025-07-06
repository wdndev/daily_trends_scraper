# Daily Trends Scraper

每日趋势数据抓取工具，支持抓取 GitHub Trending、微博热搜、HuggingFace 论文、ArXiv 论文等资源，并提供智能分析和多格式导出功能。

## 🚀 功能特性

- **📊 多源数据抓取**: 支持 GitHub Trending、微博热搜、HuggingFace 论文、ArXiv 论文
- **🤖 AI 智能分析**: 集成 OpenAI GPT 和百度千帆 ERNIE 进行数据分析和总结
- **📄 多格式导出**: 支持 JSON 和 Markdown 格式输出
- **⚡ 流水线架构**: 模块化设计，支持独立运行各个数据源
- **🛠️ TypeScript 构建**: 完整的类型支持和现代化开发体验
- **📦 pnpm 包管理**: 更快的安装速度和更好的磁盘空间利用
- **🔧 代理支持**: 内置代理配置，支持网络环境适配

## 📁 项目结构

```
daily_trends_scraper/
├── src/
│   ├── scrapers/           # 数据抓取器
│   │   ├── BaseScraper.ts  # 抓取器基类
│   │   ├── GitHubTrendingScraper.ts
│   │   ├── WeiboHotScraper.ts
│   │   ├── HuggingFacePapersScraper.ts
│   │   └── ArxivPapersScraper.ts
│   ├── pipeline/           # 数据处理流水线
│   │   ├── BasePipeline.ts # 流水线基类
│   │   ├── GithubTrendingPipeline.ts
│   │   ├── WeiboPipeline.ts
│   │   ├── HFPaperPipeline.ts
│   │   └── DomainPipeline.ts
│   ├── providers/          # LLM提供商
│   │   ├── BaseProvider.ts
│   │   ├── OpenAIProvider.ts
│   │   ├── QianfanProvider.ts
│   │   └── ExampleProvider.ts
│   ├── exporters/          # 数据导出器
│   │   ├── BaseExporter.ts
│   │   ├── JSONExporter.ts
│   │   └── MarkdownExporter.ts
│   ├── types/              # 类型定义
│   ├── utils/              # 工具函数
│   └── index.ts            # 主入口文件
├── data_pipeline/          # 数据输出目录
├── tests/                  # 测试文件
└── ...
```

## 🛠️ 快速开始

### 1. 安装依赖

```bash
# 安装 pnpm (如果未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件并配置：

```env
# OpenAI 配置 (可选)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo

# 千帆配置 (可选)
QIANFAN_ACCESS_KEY=your_qianfan_access_key_here
QIANFAN_SECRET_KEY=your_qianfan_secret_key_here
QIANFAN_MODEL=ERNIE-Bot-turbo

# 输出配置
OUTPUT_DIR=./data_pipeline
JSON_OUTPUT_FILE=daily_trends.json
MARKDOWN_OUTPUT_FILE=daily_trends.md
```

### 3. 运行项目

```bash
# 开发模式 - 运行所有流水线
pnpm dev

# 生产模式 - 构建并运行
pnpm scrape

# 构建项目
pnpm build
```

## 📊 数据源说明

### GitHub Trending
- **功能**: 抓取 GitHub 每日趋势项目
- **配置**: 支持语言筛选、时间范围、项目数量限制
- **输出**: JSON 和 Markdown 格式，包含项目描述、星标数、Fork 数等

### 微博热搜
- **功能**: 抓取微博热搜榜
- **配置**: 支持广告过滤、用户信息包含、数量限制
- **输出**: JSON 和 Markdown 格式，包含热搜词、热度值、用户信息等

### HuggingFace Papers
- **功能**: 抓取 HuggingFace 最新论文
- **配置**: 支持分类筛选、时间范围、论文数量限制
- **输出**: JSON 和 Markdown 格式，包含摘要、作者、引用数、下载量等

### ArXiv Papers
- **功能**: 抓取 ArXiv 最新论文
- **配置**: 支持领域筛选、数量限制、全文获取
- **输出**: JSON 和 Markdown 格式，包含论文摘要、作者、分类等

## 🤖 LLM 集成

项目支持多种 LLM 提供商，用于数据分析和总结：

### OpenAI Provider
```typescript
import { OpenAIProvider } from './src/providers/OpenAIProvider';

const provider = new OpenAIProvider({
  apiKey: 'your-api-key',
  modelName: 'gpt-3.5-turbo',
  maxTokens: 1000,
});
```

### 千帆 Provider
```typescript
import { QianfanProvider } from './src/providers/QianfanProvider';

const provider = new QianfanProvider({
  apiKey: 'your-access-key',
  secretKey: 'your-secret-key',
  modelName: 'ERNIE-Bot-turbo',
});
```

## 🔧 开发指南

### 可用命令

```bash
# 开发模式运行
pnpm dev

# 构建项目
pnpm build

# 运行测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 生成测试覆盖率报告
pnpm test:coverage

# 代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix

# 代码格式化
pnpm format

# 类型检查
pnpm type-check

# 清理构建文件
pnpm clean
```

### 独立运行流水线

```bash
# 运行 GitHub Trending 流水线
pnpm tsx src/index_github.ts

# 运行微博热搜流水线
pnpm tsx src/index_weibo.ts

# 运行 HuggingFace 论文流水线
pnpm tsx src/index_hf.ts

# 运行 ArXiv 论文流水线
pnpm tsx src/index_arxiv.ts

# 运行领域论文流水线
pnpm domain
```

### 创建自定义流水线

```typescript
import { BasePipeline } from './src/pipeline/BasePipeline';
import { CustomScraper } from './src/scrapers/CustomScraper';
import { JSONExporter, MarkdownExporter } from './src/exporters';

class CustomPipeline extends BasePipeline {
  protected getPipelineName(): string {
    return 'Custom';
  }
}

const pipeline = new CustomPipeline(
  new CustomScraper(),
  [new JSONExporter(), new MarkdownExporter()],
  {
    jsonOutputDir: './data_pipeline/custom/json',
    markdownOutputDir: './data_pipeline/custom/markdown',
  }
);

await pipeline.execute();
```

## 📈 输出格式

### JSON 格式
```json
{
  "id": "unique-id",
  "title": "项目标题",
  "description": "项目描述",
  "url": "项目链接",
  "source": "数据源",
  "timestamp": "2025-01-06T00:00:00.000Z",
  "metadata": {
    "stars": 1000,
    "language": "TypeScript"
  }
}
```

### Markdown 格式
```markdown
# GitHub Trending - 2025-01-06

## 1. [项目名称](项目链接)
- **描述**: 项目描述
- **语言**: TypeScript
- **星标**: 1,000
- **Fork**: 100

## 2. [项目名称](项目链接)
...
```

## 🔧 配置说明

### 流水线配置
```typescript
interface PipelineConfig {
  jsonOutputDir?: string;      // JSON 输出目录
  markdownOutputDir?: string;  // Markdown 输出目录
  filename?: string;           // 文件名
  dateFormat?: string;         // 日期格式
  maxRetries?: number;         // 最大重试次数
  timeout?: number;            // 超时时间
  enableLogging?: boolean;     // 启用日志
}
```

### 代理配置
```typescript
const proxyConfig = {
  host: '127.0.0.1',
  port: 7890
};
```

## 🧪 测试

项目包含完整的测试套件：

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test -- --testNamePattern="GitHub"

# 生成覆盖率报告
pnpm test:coverage
```

## 📝 代码质量

项目配置了以下代码质量工具：

- **ESLint**: 代码检查和格式化
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Jest**: 单元测试
- **Husky**: Git hooks
- **lint-staged**: 提交前代码检查

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [GitHub Trending](https://github.com/trending)
- [微博热搜](https://s.weibo.com/top/summary)
- [HuggingFace Papers](https://huggingface.co/papers)
- [ArXiv](https://arxiv.org/)
