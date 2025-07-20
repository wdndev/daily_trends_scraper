import { OpenAIProvider } from './providers/OpenAIProvider';
import { QianfanProvider } from './providers/QianfanProvider';
import { LLMMessage, LLMConfig} from './types';

import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import fs from 'fs';

// 重新加载环境变量的函数
function reloadEnvVars(): void {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    // 清除之前的环境变量
    const envLines = envContent.split('\n');
    envLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    console.warn('无法重新加载 .env 文件:', error);
  }
}

// 读取prompt模板的函数
function loadPromptTemplate(templatePath: string): string {
  try {
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`无法读取prompt模板文件: ${templatePath}`, error);
    throw error;
  }
}

// 每次运行时重新加载环境变量
reloadEnvVars();

const llmConfig: LLMConfig = {
  provider: process.env.PROVIDER as 'openai' | 'qianfan' || 'openai',
  apiKey: process.env.API_KEY || '',
  baseUrl: process.env.BASE_URL || 'https://api.openai.com/v1',
  modelName: process.env.MODEL_NAME || 'gpt-3.5-turbo',
  maxTokens: 4000,
  // temperature: 0.7,
  stream: false,
};

function processLLMAnalysisQAText(input: string): string {
  const regex = /(\*\*Q\*\*:[\s\S]*?)(?=\n\n\*\*A\*\*:|$)/g;
  return input.replace(regex, (match) => {
      // 移除Q前后的**标记
      const cleanedMatch = match.replace(/^\*\*Q\*\*:/, 'Q:');
      return `<p style="background-color: rgba(135, 206, 235, 0.3);border-radius: 0.4rem;padding: 10px;margin: 10px 0;margin-left: -10px;font-weight: bold;">\n${cleanedMatch.trim()}\n</p>`;
  });
}



if (require.main === module) {
  (async () => {
    let provider: OpenAIProvider | QianfanProvider;
    console.log(llmConfig);
    if (llmConfig.provider === 'qianfan') {
      provider = new QianfanProvider(llmConfig);
    } else {
      provider = new OpenAIProvider(llmConfig);
    }

    // // 读取论文数据
    // const result_json = fs.readFileSync('result_data.json', 'utf-8');
    // const paper_text = JSON.parse(result_json).paper;
    
    // // 读取prompt模板
    // const promptTemplate = loadPromptTemplate(join(__dirname, 'pipeline', 'prompts', 'paper_analysis.txt'));
    
    // // 替换模板中的占位符
    // const userContent = promptTemplate.replace('##paper_content##', paper_text);

    // console.log(userContent.length);

    // const messages: LLMMessage[] = [
    //   { role: 'system', content: '你是一个专业的帮助用户解决问题的助手。' },
    //   { role: 'user', content: "你好啊，你是谁？" },
    // ];
    // const response = await provider.chat(messages);
    // console.log(response.content);
    // console.log(response.usage);

    // const response = await provider.chatStream(messages);
    // for await (const chunk of response) {
    //   console.log(chunk.content);
    // }

    // 示例用法
    const originalText = "**Q**: 这篇论文试图解决什么问题？\n\n**A**: 这篇论文《A Survey of Context Engineering for Large Language Models》试图解决的主要问题是：如何通过系统化的“上下文工程”（Context Engineering）方法，优化大型语言模型（LLMs）在推理过程中的上下文信息，从而提升模型的性能和效能。\n\n具体来说，论文指出，大型语言模型的性能和效能主要取决于它们在推理过程中接收到的上下文信息。尽管这些模型在自然语言理解、生成和推理方面取得了前所未有的能力，但它们的表现和效果从根本上受到所提供上下文的制约。因此，论文提出了上下文工程这一正式学科，超越了简单的提示设计（prompt engineering），涵盖了系统优化语言模型信息负载的全过程。\n\n论文的主要贡献包括：\n\n1.  **提出上下文工程的概念**：将上下文工程定义为一个系统化的学科，它不仅包括提示设计，还涉及上下文检索、处理和管理等更复杂的操作。\n    \n2.  **构建全面的分类体系**：将上下文工程分解为基础组件（Foundational Components）和复杂的系统实现（System Implementations）。基础组件包括上下文检索与生成、上下文处理和上下文管理；系统实现则包括检索增强型生成（Retrieval-Augmented Generation, RAG）、记忆系统（Memory Systems）、工具集成推理（Tool-Integrated Reasoning）和多智能体系统（Multi-Agent Systems）。\n    \n3.  **分析当前局限性**：探讨了当前大型语言模型在上下文处理方面存在的问题，如模型的自我注意力机制在处理长序列时的计算和内存开销问题，以及模型在理解和生成复杂上下文时的可靠性问题。\n    \n4.  **提出性能提升方法**：通过检索增强型生成和超级位置提示等技术，显著提高了模型在文本导航等任务中的准确性，并在特定领域内实现了显著的性能提升。\n    \n5.  **资源优化**：通过上下文工程方法，可以在不增加模型参数的情况下，通过智能的内容过滤和直接的知识传输来优化模型的上下文使用，从而在保持响应质量的同时减少计算资源的消耗。\n    \n6.  **未来潜力探讨**：讨论了上下文工程在特定领域（如代码智能、科学研究等）的应用潜力，以及在低资源场景下通过上下文工程实现有效利用模型的能力。\n    \n7.  **揭示研究空白**：论文通过系统分析超过1400篇研究论文，不仅建立了该领域的技术路线图，还揭示了一个关键的研究空白：尽管当前的模型在理解复杂上下文方面表现出色，但在生成同样复杂、长篇幅的输出方面存在显著限制。论文指出，解决这一差距是未来研究的首要任务。\n    \n\n总的来说，论文试图通过系统化的上下文工程方法，解决大型语言模型在处理和利用上下文信息时面临的挑战，从而推动语言模型技术的发展和应用。\n\n**Q**: 有哪些相关研究？\n\n**A**: 论文中提到了多个与上下文工程相关的研究领域，这些领域涵盖了从基础组件到系统实现的各个方面。以下是一些主要的相关研究领域和具体的研究工作：\n\n基础组件相关研究\n\n1\\. 上下文检索与生成（Context Retrieval and Generation）\n\n*   **Prompt Engineering and Context Generation**：研究如何通过精心设计的提示来引导大型语言模型的行为，包括零样本（zero-shot）和少样本（few-shot）学习方法。例如，Chain-of-Thought（CoT）提示方法通过分解复杂问题为中间推理步骤来提高模型的推理能力。\n*   **External Knowledge Retrieval**：研究如何从外部知识库中检索信息以增强模型的知识。例如，Retrieval-Augmented Generation（RAG）系统结合了模型内部的知识和从外部检索到的信息，以提供更准确的生成结果。\n*   **Dynamic Context Assembly**：研究如何动态地组装检索到的信息组件，以形成最适合特定任务的上下文。这涉及到上下文的格式化、选择和优化。\n\n2\\. 上下文处理（Context Processing）\n\n*   **Long Context Processing**：研究如何处理超长序列的上下文信息，以克服传统Transformer模型在处理长序列时的计算瓶颈。例如，State Space Models（SSMs）如Mamba通过固定大小的隐藏状态来维持线性计算复杂度。\n*   **Contextual Self-Refinement and Adaptation**：研究如何通过自我反馈和迭代改进来优化模型的输出。例如，Self-Refine框架允许模型通过自我评估和修正来提高输出质量。\n*   **Multimodal Context**：研究如何整合多模态数据（如文本、图像、音频等）到上下文表示中。例如，Multimodal Large Language Models（MLLMs）通过将视觉输入转换为离散的文本标记来扩展传统语言模型的能力。\n*   **Relational and Structured Context**：研究如何处理和整合结构化数据（如知识图谱、表格等）到上下文表示中。例如，Graph Neural Networks（GNNs）被用来捕捉实体之间的复杂关系，并将其整合到语言模型的上下文表示中。\n\n3\\. 上下文管理（Context Management）\n\n*   **Fundamental Constraints**：研究大型语言模型在上下文管理方面的基本限制，如上下文窗口大小的限制和模型的无状态特性。\n*   **Memory Hierarchies and Storage Architectures**：研究如何设计和实现高效的内存层次结构和存储架构，以支持长期和短期的上下文管理。例如，MemoryBank系统通过实现类似于操作系统的虚拟内存管理来扩展模型的上下文窗口。\n*   **Context Compression**：研究如何通过压缩技术减少上下文的存储和计算需求，同时保持信息的完整性。例如，InContext Autoencoder（ICAE）通过将长上下文压缩到紧凑的内存槽中，显著提高了模型处理扩展上下文的能力。\n\n系统实现相关研究\n\n1\\. 检索增强型生成（Retrieval-Augmented Generation, RAG）\n\n*   **Modular RAG Architectures**：研究如何通过模块化设计来提高RAG系统的灵活性和可扩展性。例如，FlashRAG提供了RAG系统的模块化工具包，允许独立调整和组合各个组件。\n*   **Agentic RAG Systems**：研究如何将自主智能体的概念引入RAG系统，使模型能够动态地进行检索和决策。例如，Agentic RAG系统将检索视为动态操作，智能体作为信息调查者，分析内容并交叉引用信息。\n*   **Graph-Enhanced RAG**：研究如何通过图结构来增强RAG系统的知识表示和检索能力。例如，GraphRAG系统利用图结构来提高多跳问题回答的性能。\n\n2\\. 记忆系统（Memory Systems）\n\n*   **Memory Architectures**：研究如何设计和实现支持长期记忆的架构。例如，MemoryBank系统通过实现类似于操作系统的虚拟内存管理来扩展模型的上下文窗口。\n*   **Memory-Enhanced Agents**：研究如何将记忆系统集成到智能体中，以支持长期的交互和学习。例如，MemLLM系统通过增强的读写记忆模块来提高模型的记忆能力。\n\n3\\. 工具集成推理（Tool-Integrated Reasoning）\n\n*   **Function Calling Mechanisms**：研究如何使大型语言模型能够调用外部工具和API。例如，Toolformer通过自我监督学习，使模型能够学习使用外部工具。\n*   **Tool-Integrated Reasoning**：研究如何将工具调用与模型的推理过程相结合，以提高模型的推理能力。例如，ReAct框架通过在推理过程中插入行动步骤，使模型能够与外部环境进行交互。\n*   **Agent-Environment Interaction**：研究如何设计智能体与环境之间的交互机制，以支持复杂的任务解决。例如，Search-augmented Reasoning系统通过训练模型在多步推理任务中动态决定何时进行搜索和生成什么查询。\n\n4\\. 多智能体系统（Multi-Agent Systems）\n\n*   **Communication Protocols**：研究多智能体系统中的通信协议，以支持智能体之间的有效协作。例如，KQML和FIPA ACL是早期的多智能体通信语言，为智能体之间的标准化通信提供了基础。\n*   **Orchestration Mechanisms**：研究如何设计和实现协调机制，以管理多智能体系统中的任务分配和交互流程。例如，3S Orchestrator框架通过动态地将输入分配给多个智能体，并利用置信度指标和响应质量评估来优化任务执行。\n*   **Coordination Strategies**：研究如何设计和实现协调策略，以支持多智能体系统中的复杂任务解决。例如，SagaLLM框架通过提供事务支持和独立的验证程序，解决了多智能体系统中的事务完整性问题。\n\n评估方法相关研究\n\n*   **Evaluation Frameworks and Methodologies**：研究如何设计和实现评估框架，以系统地评估上下文工程系统的性能。例如，Component-Level Assessment和System-Level Integration Assessment分别关注单个组件和整个系统的性能评估。\n*   **Benchmark Datasets and Evaluation Paradigms**：研究如何开发和利用基准数据集，以评估上下文工程系统的性能。例如，GAIA和GTA是针对通用AI助手和工具代理的基准数据集，用于评估模型在多工具调用和复杂任务解决方面的能力。\n*   **Evaluation Challenges and Emerging Paradigms**：研究评估过程中面临的挑战和新兴的评估范式。例如，Self-Refinement Evaluation和Multi-aspect Feedback Evaluation分别关注模型的自我改进能力和多维度反馈评估。\n\n这些研究领域和具体的研究工作共同构成了上下文工程的广泛研究背景，为理解和优化大型语言模型的上下文处理能力提供了坚实的基础。\n\n**Q**: 论文如何解决这个问题？\n\n**A**: 论文通过提出一个全面的上下文工程（Context Engineering）框架来解决大型语言模型（LLMs）在上下文处理方面的挑战。这个框架将上下文工程分解为基础组件（Foundational Components）和系统实现（System Implementations），并详细探讨了每个部分的关键技术和方法。以下是论文解决上下文处理问题的主要方法和步骤：\n\n1\\. 定义上下文工程\n\n论文首先定义了上下文工程的概念，将其视为一个系统化的学科，超越了简单的提示设计（prompt engineering）。上下文工程的目标是通过优化上下文信息的生成、处理和管理，提升大型语言模型的性能和效能。\n\n2\\. 基础组件（Foundational Components）\n\n基础组件是上下文工程的核心，涵盖了上下文检索与生成、上下文处理和上下文管理。这些组件为系统实现提供了构建块。\n\n2.1 上下文检索与生成（Context Retrieval and Generation）\n\n*   **Prompt Engineering and Context Generation**：通过精心设计的提示来引导模型的行为，包括零样本（zero-shot）和少样本（few-shot）学习方法。例如，Chain-of-Thought（CoT）提示方法通过分解复杂问题为中间推理步骤来提高模型的推理能力。\n*   **External Knowledge Retrieval**：从外部知识库中检索信息以增强模型的知识。例如，Retrieval-Augmented Generation（RAG）系统结合了模型内部的知识和从外部检索到的信息，以提供更准确的生成结果。\n*   **Dynamic Context Assembly**：动态地组装检索到的信息组件，以形成最适合特定任务的上下文。这涉及到上下文的格式化、选择和优化。\n\n2.2 上下文处理（Context Processing）\n\n*   **Long Context Processing**：处理超长序列的上下文信息，以克服传统Transformer模型在处理长序列时的计算瓶颈。例如，State Space Models（SSMs）如Mamba通过固定大小的隐藏状态来维持线性计算复杂度。\n*   **Contextual Self-Refinement and Adaptation**：通过自我反馈和迭代改进来优化模型的输出。例如，Self-Refine框架允许模型通过自我评估和修正来提高输出质量。\n*   **Multimodal Context**：整合多模态数据（如文本、图像、音频等）到上下文表示中。例如，Multimodal Large Language Models（MLLMs）通过将视觉输入转换为离散的文本标记来扩展传统语言模型的能力。\n*   **Relational and Structured Context**：处理和整合结构化数据（如知识图谱、表格等）到上下文表示中。例如，Graph Neural Networks（GNNs）被用来捕捉实体之间的复杂关系，并将其整合到语言模型的上下文表示中。\n\n2.3 上下文管理（Context Management）\n\n*   **Fundamental Constraints**：研究大型语言模型在上下文管理方面的基本限制，如上下文窗口大小的限制和模型的无状态特性。\n*   **Memory Hierarchies and Storage Architectures**：设计和实现高效的内存层次结构和存储架构，以支持长期和短期的上下文管理。例如，MemoryBank系统通过实现类似于操作系统的虚拟内存管理来扩展模型的上下文窗口。\n*   **Context Compression**：通过压缩技术减少上下文的存储和计算需求，同时保持信息的完整性。例如，InContext Autoencoder（ICAE）通过将长上下文压缩到紧凑的内存槽中，显著提高了模型处理扩展上下文的能力。\n\n3\\. 系统实现（System Implementations）\n\n系统实现部分探讨了如何将基础组件集成到实际的智能系统中，以解决实际应用中的复杂问题。\n\n3.1 检索增强型生成（Retrieval-Augmented Generation, RAG）\n\n*   **Modular RAG Architectures**：通过模块化设计提高RAG系统的灵活性和可扩展性。例如，FlashRAG提供了RAG系统的模块化工具包，允许独立调整和组合各个组件。\n*   **Agentic RAG Systems**：将自主智能体的概念引入RAG系统，使模型能够动态地进行检索和决策。例如，Agentic RAG系统将检索视为动态操作，智能体作为信息调查者，分析内容并交叉引用信息。\n*   **Graph-Enhanced RAG**：通过图结构增强RAG系统的知识表示和检索能力。例如，GraphRAG系统利用图结构提高多跳问题回答的性能。\n\n3.2 记忆系统（Memory Systems）\n\n*   **Memory Architectures**：设计支持长期记忆的架构。例如，MemoryBank系统通过实现类似于操作系统的虚拟内存管理来扩展模型的上下文窗口。\n*   **Memory-Enhanced Agents**：将记忆系统集成到智能体中，支持长期的交互和学习。例如，MemLLM系统通过增强的读写记忆模块提高模型的记忆能力。\n\n3.3 工具集成推理（Tool-Integrated Reasoning）\n\n*   **Function Calling Mechanisms**：使大型语言模型能够调用外部工具和API。例如，Toolformer通过自我监督学习，使模型能够学习使用外部工具。\n*   **Tool-Integrated Reasoning**：将工具调用与模型的推理过程相结合，提高模型的推理能力。例如，ReAct框架通过在推理过程中插入行动步骤，使模型能够与外部环境进行交互。\n*   **Agent-Environment Interaction**：设计智能体与环境之间的交互机制，支持复杂任务的解决。例如，Search-augmented Reasoning系统通过训练模型在多步推理任务中动态决定何时进行搜索和生成什么查询。\n\n3.4 多智能体系统（Multi-Agent Systems）\n\n*   **Communication Protocols**：设计多智能体系统中的通信协议，支持智能体之间的有效协作。例如，KQML和FIPA ACL是早期的多智能体通信语言，为智能体之间的标准化通信提供了基础。\n*   **Orchestration Mechanisms**：设计协调机制，管理多智能体系统中的任务分配和交互流程。例如，3S Orchestrator框架通过动态地将输入分配给多个智能体，并利用置信度指标和响应质量评估来优化任务执行。\n*   **Coordination Strategies**：设计协调策略，支持多智能体系统中的复杂任务解决。例如，SagaLLM框架通过提供事务支持和独立的验证程序，解决了多智能体系统中的事务完整性问题。\n\n4\\. 评估方法（Evaluation）\n\n论文还提出了系统的评估框架，以评估上下文工程系统的性能。这包括组件级评估（Component-Level Assessment）和系统级集成评估（System-Level Integration Assessment）。\n\n4.1 组件级评估\n\n*   **Prompt Engineering**：评估提示设计的有效性，包括语义相似性、响应质量和鲁棒性。\n*   **Long Context Processing**：评估模型在处理长序列时的信息保留、位置偏差和推理连贯性。\n*   **Self-Refinement Mechanisms**：评估模型通过自我反馈和迭代改进的能力，如Self-Refine和Reflexion框架。\n*   **Structured Data Integration**：评估模型在处理结构化数据（如知识图谱、表格等）时的准确性。\n\n4.2 系统级集成评估\n\n*   **Retrieval-Augmented Generation**：评估检索质量和生成效果，包括精确度、召回率、相关性和事实准确性。\n*   **Memory Systems**：评估记忆系统的持久性和检索有效性，如LongMemEval基准测试。\n*   **Tool-Integrated Reasoning**：评估工具选择的准确性、参数提取的精确性、执行成功率和错误恢复能力。\n*   **Multi-Agent Systems**：评估通信的有效性、协调效率和集体结果质量。\n\n5\\. 未来方向和开放性挑战（Future Directions and Open Challenges）\n\n论文最后探讨了上下文工程的未来研究方向和开放性挑战，包括理论基础、计算效率、多模态整合、技术创新、应用驱动研究、部署和影响评估等方面。\n\n通过这些方法和步骤，论文不仅提供了一个全面的上下文工程框架，还为研究人员和工程师提供了一个技术路线图，以系统地优化大型语言模型的上下文处理能力。\n\n**Q**: 论文做了哪些实验？\n\n**A**: 论文《A Survey of Context Engineering for Large Language Models》是一篇综述性研究，主要目的是对上下文工程（Context Engineering）领域进行全面的系统分析和分类。因此，它并没有进行具体的实验，而是通过文献综述的方式，对现有的研究工作进行了总结和分析。论文的主要贡献在于提出了一个统一的框架，将上下文工程分解为基础组件和系统实现，并探讨了这些组件和实现的具体技术、方法和挑战。\n\n尽管论文本身没有进行实验，但它对大量的相关研究进行了系统性的分析，这些研究中可能包含了各种实验和评估。例如，论文中提到的一些具体技术或方法可能在它们的原始研究中进行了实验验证。这些实验可能包括：\n\n1.  **上下文检索与生成**：例如，Retrieval-Augmented Generation（RAG）系统在不同数据集上的性能评估，包括检索准确性和生成质量的测试。\n2.  **上下文处理**：例如，长序列处理技术（如Mamba模型）在处理超长文本序列时的效率和效果评估。\n3.  **上下文管理**：例如，MemoryBank系统在扩展上下文窗口和提高记忆能力方面的实验。\n4.  **系统实现**：例如，Agentic RAG系统在动态检索和决策方面的性能测试，以及多智能体系统在协作任务解决中的表现评估。\n\n论文通过引用这些研究，提供了对上下文工程技术的全面概述，但具体的实验设计、实施和结果分析则来自于这些被引用的原始研究。\n\n**Q**: 有什么可以进一步探索的点？\n\n**A**: 论文《A Survey of Context Engineering for Large Language Models》提出了许多未来研究方向和开放性挑战，为研究人员提供了丰富的进一步探索点。以下是一些可以进一步探索的关键领域：\n\n基础研究挑战\n\n1.  **理论基础和统一框架**：\n    \n    *   **建立统一的理论框架**：目前，上下文工程缺乏统一的理论基础，这限制了系统性的进展和最优系统设计。未来的研究可以探索信息论、优化理论和机器学习理论，为上下文工程提供坚实的理论支持。\n    *   **信息论分析**：研究上下文工程系统中的最优上下文分配策略、信息冗余量化和基本压缩限制。这将有助于开发上下文效率的数学界限、优化上下文选择的算法，并预测不同上下文配置下的系统行为。\n2.  **模型能力的不对称性**：\n    \n    *   **生成能力的提升**：尽管大型语言模型在理解复杂上下文方面表现出色，但在生成同样复杂、长篇幅的输出方面存在显著限制。未来的研究可以探索新的架构和训练方法，以提高模型在长篇幅生成任务中的表现。\n    *   **长篇幅生成的机制**：研究如何设计规划机制，以在数千个标记的长篇幅生成中保持连贯性，同时维护事实准确性和逻辑一致性。\n3.  **多模态整合和表示**：\n    \n    *   **多模态融合**：当前的多模态系统通常采用模态特定的编码器，缺乏跨模态交互。未来的研究可以探索更复杂的跨模态融合技术，以捕捉多模态数据之间的丰富依赖关系。\n    *   **图结构的整合**：研究如何将图结构（如知识图谱）与语言模型更好地整合，以处理复杂的结构化信息。这包括开发更有效的图编码方法和图-文本对齐策略。\n\n技术创新机会\n\n1.  **下一代架构**：\n    \n    *   **超越Transformer架构**：探索新的架构，如状态空间模型（SSMs）和长序列处理模型（如Mamba），以提高长序列处理的效率和效果。\n    *   **记忆增强架构**：开发更复杂的记忆增强架构，以支持长期记忆的组织和检索。\n2.  **高级推理和规划**：\n    \n    *   **因果推理和反事实思维**：研究如何使语言模型具备因果推理和反事实思维能力，以处理更复杂的推理任务。\n    *   **多步规划和执行**：开发能够分解复杂任务、制定执行策略并根据中间结果调整计划的系统。\n3.  **复杂上下文组织和图问题解决**：\n    \n    *   **图推理技术**：研究如何使语言模型更好地处理图结构数据，包括多跳推理和图遍历。\n    *   **混合方法**：探索结合图结构和文本表示的混合方法，以解决复杂的图问题。\n4.  **智能上下文组装和优化**：\n    \n    *   **自动化上下文工程**：开发能够自动优化上下文的系统，通过上下文优化算法和自适应选择策略，提高上下文的效率和质量。\n    *   **多维反馈机制**：研究如何利用多维反馈机制，如正确性、相关性、清晰度和鲁棒性，来优化上下文。\n\n应用驱动研究方向\n\n1.  **领域专业化和适应性**：\n    \n    *   **特定领域的优化**：研究如何为特定领域（如医疗保健、法律分析、科学研究等）定制上下文工程系统，以满足特定的推理模式、安全要求和合规性标准。\n    *   **领域适应技术**：开发领域适应技术，以在不重新训练整个模型的情况下，快速适应新领域。\n2.  **大规模多智能体协调**：\n    \n    *   **分布式协调机制**：研究如何在大规模多智能体系统中实现高效的分布式协调，以支持数百或数千个智能体的协作。\n    *   **通信协议和层次结构**：开发高效的通信协议和层次结构，以维持系统的一致性，同时支持局部自主性。\n3.  **人机协作和集成**：\n    \n    *   **自然交互**：研究如何使智能体能够与人类进行自然、流畅的交互，包括理解人类意图和适应人类行为模式。\n    *   **安全性和可靠性**：确保智能体在与人类交互时的安全性和可靠性，特别是在关键任务和敏感环境中。\n\n部署和影响评估\n\n1.  **可扩展性和生产部署**：\n    \n    *   **系统可扩展性**：研究如何设计可扩展的系统架构，以支持大规模部署和实时交互。\n    *   **资源优化**：开发高效的资源管理策略，以优化计算和存储资源的使用。\n2.  **安全性和鲁棒性**：\n    \n    *   **对抗性攻击的防御**：研究如何使智能体能够抵御对抗性攻击，确保系统的安全性和鲁棒性。\n    *   **错误恢复和容错**：开发错误恢复和容错机制，以提高系统在面对错误和异常情况时的稳定性。\n3.  **伦理和责任发展**：\n    \n    *   **伦理考量**：研究如何确保智能体的行为符合伦理和道德标准，特别是在涉及人类福祉和公平性的情况下。\n    *   **透明度和可解释性**：开发透明和可解释的系统，使人类能够理解和信任智能体的决策过程。\n\n这些领域提供了丰富的研究机会，可以推动上下文工程领域的发展，并为大型语言模型的实际应用提供更强大的支持。\n\n**Q**: 总结一下论文的主要内容\n\n**A**: 《A Survey of Context Engineering for Large Language Models》这篇论文提供了对上下文工程（Context Engineering）领域的全面综述，旨在系统地分析和分类上下文工程的技术和方法。论文的主要内容可以概括为以下几个部分：\n\n1\\. 引言\n\n*   **背景**：大型语言模型（LLMs）的性能和效能主要取决于它们在推理过程中接收到的上下文信息。上下文工程作为一个正式的学科，超越了简单的提示设计，涵盖了系统优化语言模型信息负载的全过程。\n*   **目标**：论文的目标是提供一个统一的框架，将上下文工程分解为基础组件和系统实现，并探讨这些组件和实现的具体技术、方法和挑战。\n\n2\\. 相关工作\n\n*   **基础组件**：论文回顾了与上下文工程相关的基础组件研究，包括上下文检索与生成、上下文处理和上下文管理。\n*   **系统实现**：论文还回顾了与上下文工程相关的系统实现研究，包括检索增强型生成（RAG）、记忆系统、工具集成推理和多智能体系统。\n\n3\\. 为什么需要上下文工程？\n\n*   **定义**：上下文工程被定义为一个系统化的学科，旨在通过优化上下文信息的生成、处理和管理，提升大型语言模型的性能和效能。\n*   **当前局限性**：论文指出，尽管大型语言模型在理解复杂上下文方面表现出色，但在生成同样复杂、长篇幅的输出方面存在显著限制。此外，模型在处理长序列时的计算和内存开销也是一个关键问题。\n*   **性能提升**：通过上下文工程方法，如检索增强型生成和超级位置提示，可以显著提高模型在文本导航等任务中的准确性。\n*   **资源优化**：通过上下文工程方法，可以在不增加模型参数的情况下，通过智能的内容过滤和直接的知识传输来优化模型的上下文使用，从而在保持响应质量的同时减少计算资源的消耗。\n*   **未来潜力**：论文讨论了上下文工程在特定领域（如代码智能、科学研究等）的应用潜力，以及在低资源场景下通过上下文工程实现有效利用模型的能力。\n\n4\\. 基础组件（Foundational Components）\n\n*   **上下文检索与生成**：\n    *   **提示工程和上下文生成**：研究如何通过精心设计的提示来引导模型的行为，包括零样本（zero-shot）和少样本（few-shot）学习方法。\n    *   **外部知识检索**：研究如何从外部知识库中检索信息以增强模型的知识。\n    *   **动态上下文组装**：研究如何动态地组装检索到的信息组件，以形成最适合特定任务的上下文。\n*   **上下文处理**：\n    *   **长序列处理**：研究如何处理超长序列的上下文信息，以克服传统Transformer模型在处理长序列时的计算瓶颈。\n    *   **上下文自我改进和适应**：研究如何通过自我反馈和迭代改进来优化模型的输出。\n    *   **多模态上下文**：研究如何整合多模态数据（如文本、图像、音频等）到上下文表示中。\n    *   **关系和结构化上下文**：研究如何处理和整合结构化数据（如知识图谱、表格等）到上下文表示中。\n*   **上下文管理**：\n    *   **基本限制**：研究大型语言模型在上下文管理方面的基本限制，如上下文窗口大小的限制和模型的无状态特性。\n    *   **内存层次结构和存储架构**：研究如何设计和实现高效的内存层次结构和存储架构，以支持长期和短期的上下文管理。\n    *   **上下文压缩**：研究如何通过压缩技术减少上下文的存储和计算需求，同时保持信息的完整性。\n\n5\\. 系统实现（System Implementations）\n\n*   **检索增强型生成（RAG）**：\n    *   **模块化RAG架构**：通过模块化设计提高RAG系统的灵活性和可扩展性。\n    *   **自主智能体RAG系统**：将自主智能体的概念引入RAG系统，使模型能够动态地进行检索和决策。\n    *   **图增强RAG**：通过图结构增强RAG系统的知识表示和检索能力。\n*   **记忆系统**：\n    *   **内存架构**：设计支持长期记忆的架构。\n    *   **记忆增强智能体**：将记忆系统集成到智能体中，支持长期的交互和学习。\n*   **工具集成推理**：\n    *   **函数调用机制**：使大型语言模型能够调用外部工具和API。\n    *   **工具集成推理**：将工具调用与模型的推理过程相结合，提高模型的推理能力。\n    *   **智能体-环境交互**：设计智能体与环境之间的交互机制，支持复杂任务的解决。\n*   **多智能体系统**：\n    *   **通信协议**：设计多智能体系统中的通信协议，支持智能体之间的有效协作。\n    *   **协调机制**：设计协调机制，管理多智能体系统中的任务分配和交互流程。\n    *   **协调策略**：设计协调策略，支持多智能体系统中的复杂任务解决。\n\n6\\. 评估方法（Evaluation）\n\n*   **评估框架和方法论**：\n    *   **组件级评估**：评估单个组件的性能，如提示设计的有效性、长序列处理的效率等。\n    *   **系统级集成评估**：评估整个系统的性能，如检索增强型生成的准确性和记忆系统的持久性。\n*   **基准数据集和评估范式**：\n    *   **基础组件基准测试**：开发针对基础组件的基准测试，如长序列处理和多模态上下文整合。\n    *   **系统实现基准测试**：开发针对系统实现的基准测试，如RAG系统和多智能体系统的性能评估。\n*   **评估挑战和新兴范式**：\n    *   **方法论局限性和偏差**：探讨现有评估方法的局限性和偏差，并提出改进方向。\n    *   **新兴评估范式**：探索新的评估范式，如自我改进评估和多维反馈评估。\n    *   **安全性和鲁棒性评估**：研究如何评估系统的安全性和鲁棒性，特别是在面对对抗性攻击和分布偏移时的表现。\n\n7\\. 未来方向和开放性挑战\n\n*   **基础研究挑战**：\n    *   **理论基础和统一框架**：建立统一的理论框架，为上下文工程提供坚实的理论支持。\n    *   **模型能力的不对称性**：研究如何提高模型在长篇幅生成任务中的表现。\n    *   **多模态整合和表示**：探索更复杂的跨模态融合技术，以捕捉多模态数据之间的丰富依赖关系。\n*   **技术创新机会**：\n    *   **下一代架构**：探索新的架构，如状态空间模型和长序列处理模型。\n    *   **高级推理和规划**：开发能够进行因果推理和多步规划的系统。\n    *   **复杂上下文组织和图问题解决**：研究如何使语言模型更好地处理图结构数据。\n    *   **智能上下文组装和优化**：开发能够自动优化上下文的系统。\n*   **应用驱动研究方向**：\n    *   **领域专业化和适应性**：为特定领域定制上下文工程系统，以满足特定的推理模式和安全要求。\n    *   **大规模多智能体协调**：研究如何在大规模多智能体系统中实现高效的分布式协调。\n    *   **人机协作和集成**：研究如何使智能体能够与人类进行自然、流畅的交互。\n*   **部署和影响评估**：\n    *   **可扩展性和生产部署**：研究如何设计可扩展的系统架构，以支持大规模部署。\n    *   **安全性和鲁棒性**：研究如何确保系统的安全性和鲁棒性，特别是在面对对抗性攻击时。\n    *   **伦理和责任发展**：研究如何确保智能体的行为符合伦理和道德标准。\n\n8\\. 结论\n\n*   **总结**：论文总结了上下文工程领域的现状，并提出了一个统一的框架，将上下文工程分解为基础组件和系统实现。\n*   **贡献**：论文不仅提供了对现有研究的全面综述，还揭示了未来研究的方向和挑战，为研究人员和工程师提供了宝贵的技术路线图。\n\n通过这些内容，论文为理解和优化大型语言模型的上下文处理能力提供了坚实的基础，并为未来的研究和应用提供了明确的方向。\n\n**Q**: 想要进一步了解论文\n\n**A**: 以上只是了解一篇论文的几个基本FAQ。如果你还想与Kimi进一步讨论该论文，请点击 [**这里**]( http://kimi.moonshot.cn/_prefill_chat?prefill_prompt= 我们要讨论的论文是A%20Survey%20of%20Context%20Engineering%20for%20Large%20Language%20Models，链接是  https://arxiv.org/pdf/2507.13334  ，已有的FAQ链接是  https://papers.cool/arxiv/kimi?paper=2507.13334  。请以此为基础，继续回答我后面的问题。&system_prompt=你是一个学术助手，后面的对话将围绕着以下论文内容进行，已经通过链接给出了论文的PDF和论文已有的FAQ。用户将继续向你咨询论文的相关问题，请你作出专业的回答，不要出现第一人称，当涉及到分点回答时，鼓励你以markdown格式输出。&send_immediately=true&force_search=false) 为你跳转Kimi AI网页版，并启动一个与该论文相关的新会话。"

  // const originalText = `**Q**: 这篇论文试图解决什么问题？\n\n**A**: 这篇论文试图解决的问题是：\n\n**Q**: 这篇论文如何解决这个问题？\n\n**A**: 通过什么养的方式。。。`;
  const processedText = processLLMAnalysisQAText(originalText);
  console.log(processedText);    

  })();
}

// ----------------------------------


// import { config } from 'dotenv';
// import { GitHubTrendingScraper } from './scrapers/github/GitHubTrendingScraper';
// import { WeiboHotScraper } from './scrapers/weibo/WeiboHotScraper';
// import { HuggingFacePapersScraper } from './scrapers/huggingface/HuggingFacePapersScraper';
// import { OpenAIProvider } from './providers/OpenAIProvider';
// import { JSONExporter } from './exporters/JSONExporter';
// import { MarkdownExporter } from './exporters/MarkdownExporter';
// import { TrendItem, ScraperConfig, LLMConfig, ExporterConfig } from './types';

// // 加载环境变量
// config();

// class DailyTrendsScraper {
//   private scrapers: any[] = [];
//   private processor: OpenAIProvider;
//   private exporters: any[] = [];

//   constructor() {
//     this.initializeScrapers();
//     this.initializeProcessor();
//     this.initializeExporters();
//   }

//   private initializeScrapers() {
//     const scraperConfigs: Record<string, ScraperConfig> = {
//       github: {
//         url: process.env.GITHUB_TRENDING_URL || 'https://github.com/trending',
//         timeout: 30000,
//       },
//       weibo: {
//         url: process.env.WEIBO_HOT_URL || 'https://s.weibo.com/top/summary',
//         timeout: 30000,
//       },
//       huggingface: {
//         url: process.env.HUGGINGFACE_PAPERS_URL || 'https://huggingface.co/papers',
//         timeout: 30000,
//       },
//     };

//     this.scrapers = [
//       new GitHubTrendingScraper(scraperConfigs.github),
//       new WeiboHotScraper(scraperConfigs.weibo),
//       new HuggingFacePapersScraper(scraperConfigs.huggingface),
//     ];
//   }

//   private initializeProcessor() {
//     const llmConfig: LLMConfig = {
//       apiKey: process.env.OPENAI_API_KEY!,
//       baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
//       modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
//       maxTokens: 1000,
//       temperature: 0.7,
//     };

//     this.processor = new OpenAIProvider(llmConfig);
//   }

//   private initializeExporters() {
//     const outputDir = process.env.OUTPUT_DIR || './data';
//     const date = new Date().toISOString().split('T')[0];

//     const jsonConfig: ExporterConfig = {
//       outputDir,
//       filename: process.env.JSON_OUTPUT_FILE || `daily_trends_${date}.json`,
//       format: 'json',
//     };

//     const markdownConfig: ExporterConfig = {
//       outputDir,
//       filename: process.env.MARKDOWN_OUTPUT_FILE || `daily_trends_${date}.md`,
//       format: 'markdown',
//     };

//     this.exporters = [
//       new JSONExporter(jsonConfig),
//       new MarkdownExporter(markdownConfig),
//     ];
//   }

//   public async run(): Promise<void> {
//     try {
//       console.log('开始每日趋势抓取...\n');

//       // 1. 抓取数据
//       const allItems: TrendItem[] = [];
      
//       for (const scraper of this.scrapers) {
//         const result = await scraper.scrape();
//         if (result.success) {
//           allItems.push(...result.data);
//         }
//       }

//       console.log(`📊 总共抓取到 ${allItems.length} 条数据\n`);

//       if (allItems.length === 0) {
//         console.log('❌ 没有抓取到任何数据，程序退出');
//         return;
//       }

//       // 2. LLM处理
//       const processResult = await this.processor.processTrends(allItems);

//       // 3. 导出数据
//       for (const exporter of this.exporters) {
//         await exporter.export(allItems, processResult.processedData);
//       }

//       console.log('✅ 每日趋势抓取完成！');
//     } catch (error) {
//       console.error('❌ 程序执行失败:', error);
//       process.exit(1);
//     }
//   }
// }

// // 运行程序
// if (require.main === module) {
//   const scraper = new DailyTrendsScraper();
//   scraper.run();
// }

// export { DailyTrendsScraper }; 