import { AIModelConfig } from '@/types';
import { DEFAULT_MODELS } from '@/lib/constants/models';

export function getModelConfig(modelId: string, customModels?: AIModelConfig[], expectedType?: string): AIModelConfig {
  if (customModels && customModels.length > 0) {
    const found = customModels.find((m) => m.id === modelId || m.modelName === modelId || m.name === modelId);
    if (found) return found;

    if (expectedType) {
      const typedActive = customModels.find((m) => m.type === expectedType && m.status === 'active');
      if (typedActive) return typedActive;
    }
  }

  const defaultModel = DEFAULT_MODELS.find((m) => m.id === modelId);
  if (defaultModel) return defaultModel;

  if (customModels && customModels.length > 0) {
    const firstActive = customModels.find((m) => m.status === 'active');
    if (firstActive) return firstActive;
    return customModels[0];
  }

  return DEFAULT_MODELS[0];
}

function resolveChatUrl(baseUrl: string): string {
  let url = baseUrl.trim().replace(/\/+$/, '');
  if (url.endsWith('/chat/completions') || url.endsWith('/messages')) {
    return url;
  }
  if (url.endsWith('/v1')) {
    return `${url}/chat/completions`;
  }
  return `${url}/v1/chat/completions`;
}

function resolveImageUrl(baseUrl: string): string {
  let url = baseUrl.trim().replace(/\/+$/, '');
  if (url.endsWith('/images/generations') || url.endsWith('/image/generate') || url.endsWith('/image_generation')) {
    return url;
  }
  if (url.endsWith('/v1')) {
    return `${url}/images/generations`;
  }
  return `${url}/v1/images/generations`;
}

function resolveVideoUrl(baseUrl: string): string {
  let url = baseUrl.trim().replace(/\/+$/, '');
  if (url.endsWith('/videos') || url.endsWith('/video/submit') || url.endsWith('/video_generation')) {
    return url;
  }
  if (url.endsWith('/v1')) {
    return `${url}/videos`;
  }
  return `${url}/v1/videos`;
}

// 1. Text Completion (Ark / MiniMax / OpenAI compatible / Custom)
export async function callTextAI(params: {
  modelId: string;
  systemPrompt?: string;
  userPrompt: string;
  customModels?: AIModelConfig[];
}): Promise<string> {
  const model = getModelConfig(params.modelId, params.customModels, 'text');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // MiniMax Anthropic format
  if (model.id === 'minimax-text' || model.protocol?.includes('Anthropic')) {
    headers['x-api-key'] = model.apiKey;
    headers['anthropic-version'] = '2023-06-01';

    const body: Record<string, any> = {
      model: model.modelName || 'minimax-text-01',
      max_tokens: 4096,
      messages: [{ role: 'user', content: params.userPrompt }],
    };
    if (params.systemPrompt) {
      body.system = params.systemPrompt;
    }

    const res = await fetch(model.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`MiniMax API 错误 (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.content && Array.isArray(data.content)) {
      return data.content.map((c: any) => c.text || '').join('');
    }
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    return JSON.stringify(data);
  }

  // OpenAI / Ark / Custom format
  headers['Authorization'] = `Bearer ${model.apiKey}`;
  const messages: any[] = [];
  if (params.systemPrompt) {
    messages.push({ role: 'system', content: params.systemPrompt });
  }
  messages.push({ role: 'user', content: params.userPrompt });

  const targetModel =
    model.modelName ||
    (model.id === 'ark-text' ? 'ark-code-latest' : model.name || 'gpt-3.5-turbo');

  const body: Record<string, any> = {
    model: targetModel,
    messages,
    temperature: 0.7,
  };

  const endpoint = resolveChatUrl(model.baseUrl);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${model.name} API 错误 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('模型未返回有效文本内容');
  }
  return text;
}

// 2. Image Generation (MiniMax / Hunyuan / Agnes / Custom)
export async function callImageAI(params: {
  modelId: string;
  prompt: string;
  aspectRatio?: string;
  refImageUrl?: string;
  count?: number;
  customModels?: AIModelConfig[];
}): Promise<string[]> {
  const model = getModelConfig(params.modelId, params.customModels, 'image');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${model.apiKey}`,
  };

  if (model.id === 'minimax-image') {
    const res = await fetch(model.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio || '1:1',
        n: params.count || 1,
        image_url: params.refImageUrl || undefined,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`MiniMax 生图错误 (${res.status}): ${errText}`);
    }
    const data = await res.json();
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => item.url || item.image_url).filter(Boolean);
    }
    if (data.output?.images) {
      return data.output.images;
    }
    throw new Error('MiniMax 未返回图片链接');
  }

  if (model.id === 'hunyuan-image') {
    const res = await fetch(model.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model.modelName || 'hy-image-lite',
        prompt: params.prompt,
        rsp_img_type: 'url',
        aspect_ratio: params.aspectRatio || '1:1',
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`混元生图错误 (${res.status}): ${errText}`);
    }
    const data = await res.json();
    if (data.images && Array.isArray(data.images)) {
      return data.images.map((img: any) => img.url || img);
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((img: any) => img.url);
    }
    throw new Error('腾讯混元未返回图片');
  }

  // Agnes AI Image / OpenAI standard / Custom Image Models
  const targetModel = model.modelName || (model.id === 'agnes-image' ? 'agnes-image-2.1-flash' : 'dall-e-3');
  const endpoint = resolveImageUrl(model.baseUrl);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: targetModel,
      prompt: params.prompt,
      n: params.count || 1,
      size: params.aspectRatio === '16:9' ? '1024x576' : params.aspectRatio === '9:16' ? '576x1024' : '1024x1024',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${model.name} 生图错误 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.data && Array.isArray(data.data)) {
    return data.data.map((d: any) => d.url).filter(Boolean);
  }
  throw new Error(`${model.name} 未返回图片链接`);
}

// 3. Video Task Submit (MiniMax / Hunyuan / Agnes / Seedance / Custom)
export async function submitVideoAI(params: {
  modelId: string;
  prompt: string;
  imageUrl?: string;
  customModels?: AIModelConfig[];
}): Promise<{ taskId: string; message?: string }> {
  const model = getModelConfig(params.modelId, params.customModels, 'video');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${model.apiKey}`,
  };

  if (model.id === 'minimax-video') {
    const res = await fetch(model.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: params.prompt,
        first_frame_image: params.imageUrl || undefined,
      }),
    });
    if (!res.ok) throw new Error(`MiniMax 视频提交失败: ${await res.text()}`);
    const data = await res.json();
    return { taskId: data.task_id || data.id || '' };
  }

  if (model.id === 'hunyuan-video') {
    const res = await fetch(model.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model.modelName || 'hy-video-1.5',
        prompt: params.prompt,
        image: params.imageUrl || undefined,
      }),
    });
    if (!res.ok) throw new Error(`腾讯混元视频提交失败: ${await res.text()}`);
    const data = await res.json();
    return { taskId: data.task_id || data.id || '' };
  }

  if (model.id === 'seedance-mini-video') {
    const res = await fetch(model.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model.modelName || 'bytedance/seedance-2-mini',
        prompt: params.prompt,
        image_url: params.imageUrl || undefined,
      }),
    });
    if (!res.ok) throw new Error(`Seedance 2 Mini 提交失败: ${await res.text()}`);
    const data = await res.json();
    return { taskId: data.task_id || data.id || '' };
  }

  // Agnes AI / Custom Video
  const targetModel = model.modelName || (model.id === 'agnes-video' ? 'agnes-video-v2.0' : 'video-model');
  const endpoint = resolveVideoUrl(model.baseUrl);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: targetModel,
      prompt: params.prompt,
      image_url: params.imageUrl || undefined,
    }),
  });
  if (!res.ok) throw new Error(`${model.name} 视频提交失败: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.id || data.task_id || '' };
}

// 4. Video Task Query
export async function queryVideoAI(params: {
  modelId: string;
  taskId: string;
  customModels?: AIModelConfig[];
}): Promise<{ status: 'pending' | 'processing' | 'success' | 'failed'; videoUrl?: string; error?: string }> {
  const model = getModelConfig(params.modelId, params.customModels);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${model.apiKey}`,
  };

  let queryUrl = '';
  if (model.id === 'minimax-video') {
    queryUrl = `https://api.minimaxi.com/v1/query/video_generation?task_id=${encodeURIComponent(params.taskId)}`;
  } else if (model.id === 'hunyuan-video') {
    queryUrl = `https://tokenhub.tencentmaas.com/v1/api/video/query?task_id=${encodeURIComponent(params.taskId)}`;
  } else if (model.id === 'seedance-mini-video') {
    queryUrl = `https://aaapi.togomol.com/api/v1/tasks/status?task_id=${encodeURIComponent(params.taskId)}`;
  } else if (model.id === 'agnes-video') {
    queryUrl = `https://apihub.agnes-ai.com/v1/videos/${encodeURIComponent(params.taskId)}`;
  } else {
    queryUrl = `${model.baseUrl}/${encodeURIComponent(params.taskId)}`;
  }

  const res = await fetch(queryUrl, { method: 'GET', headers });
  if (!res.ok) {
    return { status: 'failed', error: `查询失败 (${res.status}): ${await res.text()}` };
  }

  const data = await res.json();
  const statusStr = (data.status || data.state || data.task_status || '').toLowerCase();

  if (['success', 'succeeded', 'completed', 'done'].includes(statusStr)) {
    const videoUrl = data.file_id || data.video_url || data.url || data.output?.url || data.output?.video_url || data.result?.url;
    return { status: 'success', videoUrl };
  }

  if (['failed', 'error', 'canceled'].includes(statusStr)) {
    return { status: 'failed', error: data.error_message || data.message || '视频生成失败' };
  }

  return { status: 'processing' };
}
