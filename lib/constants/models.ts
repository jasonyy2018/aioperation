import { AIModelConfig } from '@/types';

export const DEFAULT_MODELS: AIModelConfig[] = [
  {
    id: 'minimax-text',
    name: 'MiniMax Claude 2.7',
    provider: 'MiniMax (海螺AI)',
    baseUrl: 'https://api.minimaxi.com/anthropic/v1/messages',
    protocol: 'Anthropic Messages API',
    type: 'text',
    status: 'active',
    apiKey: process.env.MM_API_KEY || '',
    description: 'MiniMax 对齐 Anthropic 协议模型，逻辑与结构化输出能力强。'
  },
  {
    id: 'ark-text',
    name: '火山方舟 Coding Plan',
    provider: '字节跳动火山方舟',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions',
    protocol: 'OpenAI 兼容协议',
    type: 'text',
    status: 'inactive',
    apiKey: process.env.ARK_API_KEY || '',
    description: '火山方舟文案与创作模型（需有效 CodingPlan 订阅）。'
  },
  {
    id: 'minimax-image',
    name: 'MiniMax Image-01',
    provider: 'MiniMax (海螺AI)',
    baseUrl: 'https://api.minimaxi.com/v1/image_generation',
    protocol: 'MiniMax 原生协议',
    type: 'image',
    status: 'active',
    apiKey: process.env.MM_API_KEY || '',
    description: '高质量中文图文理解与商业视觉生成。'
  },
  {
    id: 'minimax-video',
    name: 'MiniMax T2V-01',
    provider: 'MiniMax (海螺AI)',
    baseUrl: 'https://api.minimaxi.com/v1/video_generation',
    protocol: 'MiniMax 原生协议',
    type: 'video',
    status: 'active',
    apiKey: process.env.MM_API_KEY || '',
    description: '高质感动态视频渲染引擎。'
  },
  {
    id: 'hunyuan-video',
    name: '腾讯混元 hy-video-1.5',
    provider: '腾讯混元',
    baseUrl: 'https://tokenhub.tencentmaas.com/v1/api/video/submit',
    protocol: '腾讯混元 API',
    type: 'video',
    status: 'active',
    apiKey: process.env.HY_API_KEY || '',
    description: '腾讯混元 1.5 影视级视频生成模型。'
  },
  {
    id: 'hunyuan-image',
    name: '腾讯混元 Image',
    provider: '腾讯混元',
    baseUrl: 'https://tokenhub.tencentmaas.com/v1/api/image/generate',
    protocol: '腾讯混元 API',
    type: 'image',
    status: 'active',
    apiKey: process.env.HY_API_KEY || '',
    description: '腾讯混元中国风及商业写实画质生成。'
  },
  {
    id: 'agnes-image',
    name: 'Agnes AI Image 2.1 Flash',
    provider: 'Agnes AI',
    baseUrl: 'https://apihub.agnes-ai.com/v1/images/generations',
    protocol: 'OpenAI 兼容协议',
    type: 'image',
    status: 'active',
    apiKey: process.env.AGNES_API_KEY || '',
    description: '极速生图与逼真光影质感。'
  },
  {
    id: 'agnes-video',
    name: 'Agnes AI Video V2.0',
    provider: 'Agnes AI',
    baseUrl: 'https://apihub.agnes-ai.com/v1/videos',
    protocol: 'OpenAI 兼容协议',
    type: 'video',
    status: 'active',
    apiKey: process.env.AGNES_API_KEY || '',
    description: '多镜头运动与连贯动作视频生成。'
  },
  {
    id: 'seedance-mini-video',
    name: 'Seedance 2 Mini',
    provider: 'ByteDance (AggregateAPI)',
    baseUrl: 'https://aaapi.togomol.com/api/v1',
    protocol: 'AggregateAPI 异步任务',
    type: 'video',
    status: 'active',
    apiKey: process.env.SEEDANCE_MINI_API_KEY || '',
    description: '字节跳动 Seedance 2 Mini 超快速短视频合成。'
  }
];
