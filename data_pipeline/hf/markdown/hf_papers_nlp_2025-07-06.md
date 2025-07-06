---
title: HuggingFace Papers 2025-07-06
date: 2019-06-18
author: wdndev
tags: [HuggingFace, Papers, AI]
categories: 
- AI
hidden: true
comments: false
---

> 数据来源：[HuggingFace Papers](https://huggingface.co/papers)

## Latest Papers

### 1. [WebSailor: Navigating Super-human Reasoning for Web Agent](https://huggingface.co/papers/2507.02592)

Transcending human cognitive limitations represents a critical frontier in LLM training. Proprietary agentic systems like DeepResearch have demonstrated superhuman capabilities on extremely complex information-seeking benchmarks such as BrowseComp, a feat previously unattainable. We posit that their success hinges on a sophisticated reasoning pattern absent in open-source models: the ability to systematically reduce extreme uncertainty when navigating vast information landscapes. Based on this insight, we introduce WebSailor, a complete post-training methodology designed to instill this crucial capability. Our approach involves generating novel, high-uncertainty tasks through structured sampling and information obfuscation, RFT cold start, and an efficient agentic RL training algorithm, Duplicating Sampling Policy Optimization (DUPO). With this integrated pipeline, WebSailor significantly outperforms all opensource agents in complex information-seeking tasks, matching proprietary agents' performance and closing the capability gap.

**Authors**: Kuan Li,Zhongwang Zhang,Huifeng Yin,Liwen Zhang,Litu Ou,Jialong Wu,Wenbiao Yin,Baixuan Li,Zhengwei Tao,Xinyu Wang,Weizhou Shen,Junkai Zhang,Dingchu Zhang,Xixi Wu,Yong Jiang,Ming Yan,Pengjun Xie,Fei Huang,Jingren Zhou

**Categories**: cs.CL,cs.AI

**PDF URL**: https://arxiv.org/pdf/2507.02592.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02592

**Arxiv ID**: 2507.02592

**Published**: 2025-07-03T12:59:07Z

**Updated**: 2025-07-03T12:59:07.000Z

---

### 2. [LangScene-X: Reconstruct Generalizable 3D Language-Embedded Scenes with TriMap Video Diffusion](https://huggingface.co/papers/2507.02813)

Recovering 3D structures with open-vocabulary scene understanding from 2D images is a fundamental but daunting task. Recent developments have achieved this by performing per-scene optimization with embedded language information. However, they heavily rely on the calibrated dense-view reconstruction paradigm, thereby suffering from severe rendering artifacts and implausible semantic synthesis when limited views are available. In this paper, we introduce a novel generative framework, coined LangScene-X, to unify and generate 3D consistent multi-modality information for reconstruction and understanding. Powered by the generative capability of creating more consistent novel observations, we can build generalizable 3D language-embedded scenes from only sparse views. Specifically, we first train a TriMap video diffusion model that can generate appearance (RGBs), geometry (normals), and semantics (segmentation maps) from sparse inputs through progressive knowledge integration. Furthermore, we propose a Language Quantized Compressor (LQC), trained on large-scale image datasets, to efficiently encode language embeddings, enabling cross-scene generalization without per-scene retraining. Finally, we reconstruct the language surface fields by aligning language information onto the surface of 3D scenes, enabling open-ended language queries. Extensive experiments on real-world data demonstrate the superiority of our LangScene-X over state-of-the-art methods in terms of quality and generalizability. Project Page: https://liuff19.github.io/LangScene-X.

**Authors**: Fangfu Liu,Hao Li,Jiawei Chi,Hanyang Wang,Minghui Yang,Fudong Wang,Yueqi Duan

**Categories**: cs.CV

**PDF URL**: https://arxiv.org/pdf/2507.02813.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02813

**Arxiv ID**: 2507.02813

**Published**: 2025-07-03T17:21:23Z

**Updated**: 2025-07-03T17:21:23.000Z

---

### 3. [Thinking with Images for Multimodal Reasoning: Foundations, Methods, and Future Frontiers](https://huggingface.co/papers/2506.23918)

Recent progress in multimodal reasoning has been significantly advanced by textual Chain-of-Thought (CoT), a paradigm where models conduct reasoning within language. This text-centric approach, however, treats vision as a static, initial context, creating a fundamental "semantic gap" between rich perceptual data and discrete symbolic thought. Human cognition often transcends language, utilizing vision as a dynamic mental sketchpad. A similar evolution is now unfolding in AI, marking a fundamental paradigm shift from models that merely think about images to those that can truly think with images. This emerging paradigm is characterized by models leveraging visual information as intermediate steps in their thought process, transforming vision from a passive input into a dynamic, manipulable cognitive workspace. In this survey, we chart this evolution of intelligence along a trajectory of increasing cognitive autonomy, which unfolds across three key stages: from external tool exploration, through programmatic manipulation, to intrinsic imagination. To structure this rapidly evolving field, our survey makes four key contributions. (1) We establish the foundational principles of the think with image paradigm and its three-stage framework. (2) We provide a comprehensive review of the core methods that characterize each stage of this roadmap. (3) We analyze the critical landscape of evaluation benchmarks and transformative applications. (4) We identify significant challenges and outline promising future directions. By providing this structured overview, we aim to offer a clear roadmap for future research towards more powerful and human-aligned multimodal AI.

**Authors**: Zhaochen Su,Peng Xia,Hangyu Guo,Zhenhua Liu,Yan Ma,Xiaoye Qu,Jiaqi Liu,Yanshu Li,Kaide Zeng,Zhengyuan Yang,Linjie Li,Yu Cheng,Heng Ji,Junxian He,Yi R. Fung

**Categories**: cs.CV

**PDF URL**: https://arxiv.org/pdf/2506.23918.pdf

**Arxiv URL**: https://arxiv.org/abs/2506.23918

**Arxiv ID**: 2506.23918

**Published**: 2025-06-30T14:48:35Z

**Updated**: 2025-06-30T14:48:35.000Z

---

### 4. [Skywork-Reward-V2: Scaling Preference Data Curation via Human-AI Synergy](https://huggingface.co/papers/2507.01352)

Despite the critical role of reward models (RMs) in reinforcement learning from human feedback (RLHF), current state-of-the-art open RMs perform poorly on most existing evaluation benchmarks, failing to capture the spectrum of nuanced and sophisticated human preferences. Even approaches that incorporate advanced training techniques have not yielded meaningful performance improvements. We hypothesize that this brittleness stems primarily from limitations in preference datasets, which are often narrowly scoped, synthetically labeled, or lack rigorous quality control. To address these challenges, we present a large-scale preference dataset comprising 40 million preference pairs, named SynPref-40M. To enable data curation at scale, we design a human-AI synergistic two-stage pipeline that leverages the complementary strengths of human annotation quality and AI scalability. In this pipeline, humans provide verified annotations, while large language models perform automatic curation based on human guidance. Training on this preference mixture, we introduce Skywork-Reward-V2, a suite of eight reward models ranging from 0.6B to 8B parameters, trained on a carefully curated subset of 26 million preference pairs from SynPref-40M. We demonstrate that Skywork-Reward-V2 is versatile across a wide range of capabilities, including alignment with human preferences, objective correctness, safety, resistance to stylistic biases, and best-of-N scaling, achieving state-of-the-art performance across seven major reward model benchmarks. Ablation studies confirm that the effectiveness of our approach stems not only from data scale but also from high-quality curation. The Skywork-Reward-V2 series represents substantial progress in open reward models, highlighting the untapped potential of existing preference datasets and demonstrating how human-AI curation synergy can unlock significantly higher data quality.

**Authors**: Chris Yuhao Liu,Liang Zeng,Yuzhen Xiao,Jujie He,Jiacai Liu,Chaojie Wang,Rui Yan,Wei Shen,Fuxiang Zhang,Jiacheng Xu,Yang Liu,Yahui Zhou

**Categories**: cs.CL,cs.AI,cs.LG

**PDF URL**: https://arxiv.org/pdf/2507.01352.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.01352

**Arxiv ID**: 2507.01352

**Published**: 2025-07-02T04:40:29Z

**Updated**: 2025-07-02T04:40:29.000Z

---

### 5. [Heeding the Inner Voice: Aligning ControlNet Training via Intermediate Features Feedback](https://huggingface.co/papers/2507.02321)

Despite significant progress in text-to-image diffusion models, achieving precise spatial control over generated outputs remains challenging. ControlNet addresses this by introducing an auxiliary conditioning module, while ControlNet++ further refines alignment through a cycle consistency loss applied only to the final denoising steps. However, this approach neglects intermediate generation stages, limiting its effectiveness. We propose InnerControl, a training strategy that enforces spatial consistency across all diffusion steps. Our method trains lightweight convolutional probes to reconstruct input control signals (e.g., edges, depth) from intermediate UNet features at every denoising step. These probes efficiently extract signals even from highly noisy latents, enabling pseudo ground truth controls for training. By minimizing the discrepancy between predicted and target conditions throughout the entire diffusion process, our alignment loss improves both control fidelity and generation quality. Combined with established techniques like ControlNet++, InnerControl achieves state-of-the-art performance across diverse conditioning methods (e.g., edges, depth).

**Authors**: Nina Konovalova,Maxim Nikolaev,Andrey Kuznetsov,Aibek Alanov

**Categories**: cs.CV

**PDF URL**: https://arxiv.org/pdf/2507.02321.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02321

**Arxiv ID**: 2507.02321

**Published**: 2025-07-03T05:25:53Z

**Updated**: 2025-07-03T05:25:53.000Z

---

### 6. [IntFold: A Controllable Foundation Model for General and Specialized Biomolecular Structure Prediction](https://huggingface.co/papers/2507.02025)

We introduce IntFold, a controllable foundation model for both general and specialized biomolecular structure prediction. IntFold demonstrates predictive accuracy comparable to the state-of-the-art AlphaFold3, while utilizing a superior customized attention kernel. Beyond standard structure prediction, IntFold can be adapted to predict allosteric states, constrained structures, and binding affinity through the use of individual adapters. Furthermore, we introduce a novel confidence head to estimate docking quality, offering a more nuanced assessment for challenging targets such as antibody-antigen complexes. Finally, we share insights gained during the training process of this computationally intensive model.

**Authors**: The IntFold Team,Leon Qiao,Wayne Bai,He Yan,Gary Liu,Nova Xi,Xiang Zhang

**Categories**: q-bio.BM

**PDF URL**: https://arxiv.org/pdf/2507.02025.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02025

**Arxiv ID**: 2507.02025

**Published**: 2025-07-02T16:09:47Z

**Updated**: 2025-07-02T16:09:47.000Z

---

### 7. [Energy-Based Transformers are Scalable Learners and Thinkers](https://huggingface.co/papers/2507.02092)

Inference-time computation techniques, analogous to human System 2 Thinking, have recently become popular for improving model performances. However, most existing approaches suffer from several limitations: they are modality-specific (e.g., working only in text), problem-specific (e.g., verifiable domains like math and coding), or require additional supervision/training on top of unsupervised pretraining (e.g., verifiers or verifiable rewards). In this paper, we ask the question "Is it possible to generalize these System 2 Thinking approaches, and develop models that learn to think solely from unsupervised learning?" Interestingly, we find the answer is yes, by learning to explicitly verify the compatibility between inputs and candidate-predictions, and then re-framing prediction problems as optimization with respect to this verifier. Specifically, we train Energy-Based Transformers (EBTs) -- a new class of Energy-Based Models (EBMs) -- to assign an energy value to every input and candidate-prediction pair, enabling predictions through gradient descent-based energy minimization until convergence. Across both discrete (text) and continuous (visual) modalities, we find EBTs scale faster than the dominant Transformer++ approach during training, achieving an up to 35% higher scaling rate with respect to data, batch size, parameters, FLOPs, and depth. During inference, EBTs improve performance with System 2 Thinking by 29% more than the Transformer++ on language tasks, and EBTs outperform Diffusion Transformers on image denoising while using fewer forward passes. Further, we find that EBTs achieve better results than existing models on most downstream tasks given the same or worse pretraining performance, suggesting that EBTs generalize better than existing approaches. Consequently, EBTs are a promising new paradigm for scaling both the learning and thinking capabilities of models.

**Authors**: Alexi Gladstone,Ganesh Nanduru,Md Mofijul Islam,Peixuan Han,Hyeonjeong Ha,Aman Chadha,Yilun Du,Heng Ji,Jundong Li,Tariq Iqbal

**Categories**: cs.LG,cs.AI,cs.CL,cs.CV

**PDF URL**: https://arxiv.org/pdf/2507.02092.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02092

**Arxiv ID**: 2507.02092

**Published**: 2025-07-02T19:17:29Z

**Updated**: 2025-07-02T19:17:29.000Z

---

### 8. [Decoupled Planning and Execution: A Hierarchical Reasoning Framework for Deep Search](https://huggingface.co/papers/2507.02652)

Complex information needs in real-world search scenarios demand deep reasoning and knowledge synthesis across diverse sources, which traditional retrieval-augmented generation (RAG) pipelines struggle to address effectively. Current reasoning-based approaches suffer from a fundamental limitation: they use a single model to handle both high-level planning and detailed execution, leading to inefficient reasoning and limited scalability. In this paper, we introduce HiRA, a hierarchical framework that separates strategic planning from specialized execution. Our approach decomposes complex search tasks into focused subtasks, assigns each subtask to domain-specific agents equipped with external tools and reasoning capabilities, and coordinates the results through a structured integration mechanism. This separation prevents execution details from disrupting high-level reasoning while enabling the system to leverage specialized expertise for different types of information processing. Experiments on four complex, cross-modal deep search benchmarks demonstrate that HiRA significantly outperforms state-of-the-art RAG and agent-based systems. Our results show improvements in both answer quality and system efficiency, highlighting the effectiveness of decoupled planning and execution for multi-step information seeking tasks. Our code is available at https://github.com/ignorejjj/HiRA.

**Authors**: Jiajie Jin,Xiaoxi Li,Guanting Dong,Yuyao Zhang,Yutao Zhu,Yang Zhao,Hongjin Qian,Zhicheng Dou

**Categories**: cs.AI,cs.CL,cs.IR

**PDF URL**: https://arxiv.org/pdf/2507.02652.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02652

**Arxiv ID**: 2507.02652

**Published**: 2025-07-03T14:18:08Z

**Updated**: 2025-07-03T14:18:08.000Z

---

### 9. [Fast and Simplex: 2-Simplicial Attention in Triton](https://huggingface.co/papers/2507.02754)

Recent work has shown that training loss scales as a power law with both model size and the number of tokens, and that achieving compute-optimal models requires scaling model size and token count together. However, these scaling laws assume an infinite supply of data and apply primarily in compute-bound settings. As modern large language models increasingly rely on massive internet-scale datasets, the assumption that they are compute-bound is becoming less valid. This shift highlights the need for architectures that prioritize token efficiency. In this work, we investigate the use of the 2-simplicial Transformer, an architecture that generalizes standard dot-product attention to trilinear functions through an efficient Triton kernel implementation. We demonstrate that the 2-simplicial Transformer achieves better token efficiency than standard Transformers: for a fixed token budget, similarly sized models outperform their dot-product counterparts on tasks involving mathematics, coding, reasoning, and logic. We quantify these gains by demonstrating that $2$-simplicial attention changes the exponent in the scaling laws for knowledge and reasoning tasks compared to dot product attention.

**Authors**: Aurko Roy,Timothy Chou,Sai Surya Duvvuri,Sijia Chen,Jiecao Yu,Xiaodong Wang,Manzil Zaheer,Rohan Anil

**Categories**: cs.LG,cs.AI

**PDF URL**: https://arxiv.org/pdf/2507.02754.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02754

**Arxiv ID**: 2507.02754

**Published**: 2025-07-03T16:16:34Z

**Updated**: 2025-07-03T16:16:34.000Z

---

### 10. [Can LLMs Identify Critical Limitations within Scientific Research? A Systematic Evaluation on AI Research Papers](https://huggingface.co/papers/2507.02694)

Peer review is fundamental to scientific research, but the growing volume of publications has intensified the challenges of this expertise-intensive process. While LLMs show promise in various scientific tasks, their potential to assist with peer review, particularly in identifying paper limitations, remains understudied. We first present a comprehensive taxonomy of limitation types in scientific research, with a focus on AI. Guided by this taxonomy, for studying limitations, we present LimitGen, the first comprehensive benchmark for evaluating LLMs' capability to support early-stage feedback and complement human peer review. Our benchmark consists of two subsets: LimitGen-Syn, a synthetic dataset carefully created through controlled perturbations of high-quality papers, and LimitGen-Human, a collection of real human-written limitations. To improve the ability of LLM systems to identify limitations, we augment them with literature retrieval, which is essential for grounding identifying limitations in prior scientific findings. Our approach enhances the capabilities of LLM systems to generate limitations in research papers, enabling them to provide more concrete and constructive feedback.

**Authors**: Zhijian Xu,Yilun Zhao,Manasi Patwardhan,Lovekesh Vig,Arman Cohan

**Categories**: cs.CL

**PDF URL**: https://arxiv.org/pdf/2507.02694.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02694

**Arxiv ID**: 2507.02694

**Published**: 2025-07-03T15:04:38Z

**Updated**: 2025-07-03T15:04:38.000Z

---

### 11. [Bourbaki: Self-Generated and Goal-Conditioned MDPs for Theorem Proving](https://huggingface.co/papers/2507.02726)

Reasoning remains a challenging task for large language models (LLMs), especially within the logically constrained environment of automated theorem proving (ATP), due to sparse rewards and the vast scale of proofs. These challenges are amplified in benchmarks like PutnamBench, which contains university-level problems requiring complex, multi-step reasoning. To address this, we introduce self-generated goal-conditioned MDPs (sG-MDPs), a new framework in which agents generate and pursue their subgoals based on the evolving proof state. Given this more structured generation of goals, the resulting problem becomes more amenable to search. We then apply Monte Carlo Tree Search (MCTS)-like algorithms to solve the sG-MDP, instantiating our approach in Bourbaki (7B), a modular system that can ensemble multiple 7B LLMs for subgoal generation and tactic synthesis. On PutnamBench, Bourbaki (7B) solves 26 problems, achieving new state-of-the-art results with models at this scale.

**Authors**: Matthieu Zimmer,Xiaotong Ji,Rasul Tutunov,Anthony Bordg,Jun Wang,Haitham Bou Ammar

**Categories**: cs.AI,cs.LG

**PDF URL**: https://arxiv.org/pdf/2507.02726.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02726

**Arxiv ID**: 2507.02726

**Published**: 2025-07-03T15:41:38Z

**Updated**: 2025-07-03T15:41:38.000Z

---

### 12. [Self-Correction Bench: Revealing and Addressing the Self-Correction Blind Spot in LLMs](https://huggingface.co/papers/2507.02778)

Although large language models (LLMs) have become transformative, they still make mistakes and can explore unproductive reasoning paths. Self-correction is an important capability for a trustworthy LLM, particularly an autoregressive LLM. While LLMs can identify error in user input, they exhibit a systematic 'Self-Correction Blind Spot' - failing to correct identical error in their own outputs. To systematically study this phenomenon, we introduce Self-Correction Bench, a systematic framework to measure this phenomenon through controlled error injection at three complexity levels. Testing 14 models, we find an average 64.5% blind spot rate. We find multiple evidences that this limitation relates to training data composition: human training demonstrations predominantly show error-free responses rather than error-correction sequences, unlike RL-trained models that learn error correction through outcome feedback. Remarkably, simply appending "Wait" reduces blind spots by 89.3%, suggesting that the capability exists but requires activation. Our work highlights a critical limitation in current LLMs and offers potential avenues for improving their reliability and trustworthiness.

**Authors**: Ken Tsui

**Categories**: cs.CL,cs.AI,cs.LG

**PDF URL**: https://arxiv.org/pdf/2507.02778.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.02778

**Arxiv ID**: 2507.02778

**Published**: 2025-07-03T16:41:30Z

**Updated**: 2025-07-03T16:41:30.000Z

---

### 13. [ZeCO: Zero Communication Overhead Sequence Parallelism for Linear Attention](https://huggingface.co/papers/2507.01004)

Linear attention mechanisms deliver significant advantages for Large Language Models (LLMs) by providing linear computational complexity, enabling efficient processing of ultra-long sequences (e.g., 1M context). However, existing Sequence Parallelism (SP) methods, essential for distributing these workloads across devices, become the primary bottleneck due to substantial communication overhead. In this paper, we introduce ZeCO (Zero Communication Overhead) sequence parallelism for linear attention models, a new SP method designed to overcome these limitations and achieve end-to-end near-linear scalability for long sequence training. For example, training a model with a 1M sequence length across 64 devices using ZeCO takes roughly the same time as training with an 16k sequence on a single device. At the heart of ZeCO lies All-Scan, a new collective communication primitive. All-Scan provides each SP rank with precisely the initial operator state it requires while maintaining a minimal communication footprint, effectively eliminating communication overhead. Theoretically, we prove the optimaity of ZeCO, showing that it introduces only negligible time and space overhead. Empirically, we compare the communication costs of different sequence parallelism strategies and demonstrate that All-Scan achieves the fastest communication in SP scenarios. Specifically, on 256 GPUs with an 8M sequence length, ZeCO achieves a 60\% speedup compared to the current state-of-the-art (SOTA) SP method. We believe ZeCO establishes a clear path toward efficiently training next-generation LLMs on previously intractable sequence lengths.

**Authors**: Yuhong Chou,Zehao Liu,Ruijie Zhu,Xinyi Wan,Tianjian Li,Congying Chu,Qian Liu,Jibin Wu,Zejun Ma

**Categories**: cs.LG

**PDF URL**: https://arxiv.org/pdf/2507.01004.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.01004

**Arxiv ID**: 2507.01004

**Published**: 2025-07-01T17:54:53Z

**Updated**: 2025-07-01T17:54:53.000Z

---

### 14. [Selecting and Merging: Towards Adaptable and Scalable Named Entity Recognition with Large Language Models](https://huggingface.co/papers/2506.22813)

Supervised fine-tuning (SFT) is widely used to align large language models (LLMs) with information extraction (IE) tasks, such as named entity recognition (NER). However, annotating such fine-grained labels and training domain-specific models is costly. Existing works typically train a unified model across multiple domains, but such approaches lack adaptation and scalability since not all training data benefits target domains and scaling trained models remains challenging. We propose the SaM framework, which dynamically Selects and Merges expert models at inference time. Specifically, for a target domain, we select domain-specific experts pre-trained on existing domains based on (i) domain similarity to the target domain and (ii) performance on sampled instances, respectively. The experts are then merged to create task-specific models optimized for the target domain. By dynamically merging experts beneficial to target domains, we improve generalization across various domains without extra training. Additionally, experts can be added or removed conveniently, leading to great scalability. Extensive experiments on multiple benchmarks demonstrate our framework's effectiveness, which outperforms the unified model by an average of 10%. We further provide insights into potential improvements, practical experience, and extensions of our framework.

**Authors**: Zhuojun Ding,Wei Wei,Chenghao Fan

**Categories**: cs.CL

**PDF URL**: https://arxiv.org/pdf/2506.22813.pdf

**Arxiv URL**: https://arxiv.org/abs/2506.22813

**Arxiv ID**: 2506.22813

**Published**: 2025-06-28T08:28:52Z

**Updated**: 2025-06-28T08:28:52.000Z

---

### 15. [AsyncFlow: An Asynchronous Streaming RL Framework for Efficient LLM Post-Training](https://huggingface.co/papers/2507.01663)

Reinforcement learning (RL) has become a pivotal technology in the post-training phase of large language models (LLMs). Traditional task-colocated RL frameworks suffer from significant scalability bottlenecks, while task-separated RL frameworks face challenges in complex dataflows and the corresponding resource idling and workload imbalance. Moreover, most existing frameworks are tightly coupled with LLM training or inference engines, making it difficult to support custom-designed engines. To address these challenges, we propose AsyncFlow, an asynchronous streaming RL framework for efficient post-training. Specifically, we introduce a distributed data storage and transfer module that provides a unified data management and fine-grained scheduling capability in a fully streamed manner. This architecture inherently facilitates automated pipeline overlapping among RL tasks and dynamic load balancing. Moreover, we propose a producer-consumer-based asynchronous workflow engineered to minimize computational idleness by strategically deferring parameter update process within staleness thresholds. Finally, the core capability of AsynFlow is architecturally decoupled from underlying training and inference engines and encapsulated by service-oriented user interfaces, offering a modular and customizable user experience. Extensive experiments demonstrate an average of 1.59 throughput improvement compared with state-of-the-art baseline. The presented architecture in this work provides actionable insights for next-generation RL training system designs.

**Authors**: Zhenyu Han,Ansheng You,Haibo Wang,Kui Luo,Guang Yang,Wenqi Shi,Menglong Chen,Sicheng Zhang,Zeshun Lan,Chunshi Deng,Huazhong Ji,Wenjie Liu,Yu Huang,Yixiang Zhang,Chenyi Pan,Jing Wang,Xin Huang,Chunsheng Li,Jianping Wu

**Categories**: cs.LG,cs.AI

**PDF URL**: https://arxiv.org/pdf/2507.01663.pdf

**Arxiv URL**: https://arxiv.org/abs/2507.01663

**Arxiv ID**: 2507.01663

**Published**: 2025-07-02T12:45:34Z

**Updated**: 2025-07-02T12:45:34.000Z

---

### 16. [CRISP-SAM2: SAM2 with Cross-Modal Interaction and Semantic Prompting for Multi-Organ Segmentation](https://huggingface.co/papers/2506.23121)

Multi-organ medical segmentation is a crucial component of medical image processing, essential for doctors to make accurate diagnoses and develop effective treatment plans. Despite significant progress in this field, current multi-organ segmentation models often suffer from inaccurate details, dependence on geometric prompts and loss of spatial information. Addressing these challenges, we introduce a novel model named CRISP-SAM2 with CRoss-modal Interaction and Semantic Prompting based on SAM2. This model represents a promising approach to multi-organ medical segmentation guided by textual descriptions of organs. Our method begins by converting visual and textual inputs into cross-modal contextualized semantics using a progressive cross-attention interaction mechanism. These semantics are then injected into the image encoder to enhance the detailed understanding of visual information. To eliminate reliance on geometric prompts, we use a semantic prompting strategy, replacing the original prompt encoder to sharpen the perception of challenging targets. In addition, a similarity-sorting self-updating strategy for memory and a mask-refining process is applied to further adapt to medical imaging and enhance localized details. Comparative experiments conducted on seven public datasets indicate that CRISP-SAM2 outperforms existing models. Extensive analysis also demonstrates the effectiveness of our method, thereby confirming its superior performance, especially in addressing the limitations mentioned earlier. Our code is available at: https://github.com/YU-deep/CRISP\_SAM2.git.

**Authors**: Xinlei Yu,Chanmiao Wang,Hui Jin,Ahmed Elazab,Gangyong Jia,Xiang Wan,Changqing Zou,Ruiquan Ge

**Categories**: eess.IV,cs.AI,cs.CV,cs.LG

**PDF URL**: https://arxiv.org/pdf/2506.23121.pdf

**Arxiv URL**: https://arxiv.org/abs/2506.23121

**Arxiv ID**: 2506.23121

**Published**: 2025-06-29T07:05:27Z

**Updated**: 2025-06-29T07:05:27.000Z

---

### 17. [HalluSegBench: Counterfactual Visual Reasoning for Segmentation Hallucination Evaluation](https://huggingface.co/papers/2506.21546)

Recent progress in vision-language segmentation has significantly advanced grounded visual understanding. However, these models often exhibit hallucinations by producing segmentation masks for objects not grounded in the image content or by incorrectly labeling irrelevant regions. Existing evaluation protocols for segmentation hallucination primarily focus on label or textual hallucinations without manipulating the visual context, limiting their capacity to diagnose critical failures. In response, we introduce HalluSegBench, the first benchmark specifically designed to evaluate hallucinations in visual grounding through the lens of counterfactual visual reasoning. Our benchmark consists of a novel dataset of 1340 counterfactual instance pairs spanning 281 unique object classes, and a set of newly introduced metrics that quantify hallucination sensitivity under visually coherent scene edits. Experiments on HalluSegBench with state-of-the-art vision-language segmentation models reveal that vision-driven hallucinations are significantly more prevalent than label-driven ones, with models often persisting in false segmentation, highlighting the need for counterfactual reasoning to diagnose grounding fidelity.

**Authors**: Xinzhuo Li,Adheesh Juvekar,Xingyou Liu,Muntasir Wahed,Kiet A. Nguyen,Ismini Lourentzou

**Categories**: cs.CV,cs.AI,cs.CL,cs.LG

**PDF URL**: https://arxiv.org/pdf/2506.21546.pdf

**Arxiv URL**: https://arxiv.org/abs/2506.21546

**Arxiv ID**: 2506.21546

**Published**: 2025-06-26T17:59:12Z

**Updated**: 2025-06-26T17:59:12.000Z

---

