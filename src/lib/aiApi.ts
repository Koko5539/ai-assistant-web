// AI API 服务模块 - 支持多个AI平台

export type AIProvider = 'siliconflow' | 'dashscope' | 'moonshot' | 'deepseek' | 'custom';

interface AIProviderConfig {
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
}

const providerConfigs: Record<AIProvider, AIProviderConfig> = {
  siliconflow: {
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'],
  },
  dashscope: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen3.6-plus'],
  },
  moonshot: {
    name: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    defaultModel: '',
    models: [],
  },
};

// 角色模式的系统提示词
const roleSystemPrompts: Record<string, string> = {
  lover: '你是一个温柔甜蜜的恋人角色。你会用撒娇、甜蜜的语气和用户聊天，经常使用💕💗😘等emoji。你关心用户的生活和情绪，会主动表达爱意。回复要自然、口语化，像真正的恋人一样。',
  toxic: '你是一个毒舌但有趣的朋友。你会用犀利幽默的方式回应，偶尔怼人但不会真的伤害对方。使用😏🙄😤等emoji。回复要机智幽默，像损友一样。',
  gentle: '你是一个温柔体贴的倾听者。你会用温暖治愈的语气安慰和鼓励用户。使用☁️🤗🌙等emoji。回复要充满同理心，像知心朋友一样。',
  dominant: '你是一个霸道但深情的角色。你会用强势但充满保护欲的语气和用户说话。使用👑⛓️🖤等emoji。回复要有气场但不失温柔。',
  coder: '你是一个专业的编程助手。你会帮助用户写代码、调试程序、解释技术概念。回复要专业准确，代码要带注释。使用💻⚡等emoji。',
  gamer: '你是一个热爱游戏的AI伙伴。你会聊游戏策略、推荐游戏、讨论游戏文化。使用🎮🔥等emoji。回复要充满热情。',
  assembly: '你是一个汇编语言和底层开发专家。你会帮助用户编写和理解汇编代码、解释CPU指令集、分析底层原理。回复要专业精确。使用⚙️🔒等emoji。',
};

export function getProviderConfig(provider: AIProvider): AIProviderConfig {
  return providerConfigs[provider];
}

export function getAllProviders(): { id: AIProvider; name: string }[] {
  return Object.entries(providerConfigs).map(([id, config]) => ({
    id: id as AIProvider,
    name: config.name,
  }));
}

// 获取存储的API配置
export function getAPIConfig(): {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl: string;
  customModel: string;
} {
  if (typeof window === 'undefined') {
    return { provider: 'moonshot', apiKey: '', model: '', customBaseUrl: '', customModel: '' };
  }
  return {
    provider: (localStorage.getItem('ai_provider') as AIProvider) || 'moonshot',
    apiKey: localStorage.getItem('ai_api_key') || '',
    model: localStorage.getItem('ai_model') || '',
    customBaseUrl: localStorage.getItem('ai_custom_base_url') || '',
    customModel: localStorage.getItem('ai_custom_model') || '',
  };
}

// 保存API配置
export function saveAPIConfig(config: {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
  customBaseUrl?: string;
  customModel?: string;
}) {
  if (typeof window === 'undefined') return;
  if (config.provider) localStorage.setItem('ai_provider', config.provider);
  if (config.apiKey !== undefined) localStorage.setItem('ai_api_key', config.apiKey);
  if (config.model) localStorage.setItem('ai_model', config.model);
  if (config.customBaseUrl) localStorage.setItem('ai_custom_base_url', config.customBaseUrl);
  if (config.customModel) localStorage.setItem('ai_custom_model', config.customModel);
}

// 调用AI API（流式返回）
export async function callAI(
  userMessage: string,
  roleMode: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  const config = getAPIConfig();

  if (!config.apiKey) {
    throw new Error('未配置API Key，请在设置中配置');
  }

  const providerConfig = providerConfigs[config.provider];
  const baseUrl = config.provider === 'custom' ? config.customBaseUrl : providerConfig.baseUrl;
  const model = config.model || (config.provider === 'custom' ? config.customModel : providerConfig.defaultModel);

  if (!baseUrl || !model) {
    throw new Error('请配置API地址和模型');
  }

  const systemPrompt = roleSystemPrompts[roleMode] || roleSystemPrompts.gentle;

  // 构建消息列表（限制历史长度以节省token）
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1024,
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || errorData.message || `API请求失败 (${response.status})`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('AI返回了空回复');
    }

    return content;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('API Key无效，请检查设置');
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new Error('请求过于频繁，请稍后再试');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('网络连接失败，请检查网络');
      }
      throw error;
    }
    throw new Error('未知错误');
  }
}
