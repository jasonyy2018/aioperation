import { NextRequest, NextResponse } from 'next/server';
import { DiscoveredModel, ModelType } from '@/types';

export const dynamic = 'force-dynamic';

function inferModelType(modelId: string): ModelType {
  const lower = modelId.toLowerCase();
  if (/(image|dall-e|flux|sdxl|stable-diffusion|midjourney|kolors|recraft|imagen)/i.test(lower)) {
    return 'image';
  }
  if (/(video|t2v|i2v|sora|kling|cogvideo|runway|seedance|hunyuan-video|luma|pika|minimax-video)/i.test(lower)) {
    return 'video';
  }
  return 'text';
}

function normalizeUrlCandidates(rawUrl: string): string[] {
  let url = rawUrl.trim();
  if (!url) return [];
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  const candidates: string[] = [];

  // If directly specified /models, prioritize
  if (url.endsWith('/models') || url.endsWith('/api/tags')) {
    candidates.push(url);
  }

  // Strip known sub-paths like /chat/completions, /images/generations, /messages
  const cleanBase = url
    .replace(/\/chat\/completions\/?$/i, '')
    .replace(/\/images\/generations\/?$/i, '')
    .replace(/\/videos\/?$/i, '')
    .replace(/\/messages\/?$/i, '')
    .replace(/\/+$/, '');

  // Add standard OpenAI candidates
  if (cleanBase.endsWith('/v1')) {
    candidates.push(`${cleanBase}/models`);
    const root = cleanBase.slice(0, -3);
    candidates.push(`${root}/models`);
    candidates.push(`${root}/api/tags`); // Ollama
  } else {
    candidates.push(`${cleanBase}/v1/models`);
    candidates.push(`${cleanBase}/models`);
    candidates.push(`${cleanBase}/api/tags`); // Ollama
  }

  return [...new Set(candidates)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { baseUrl, apiKey } = body;

    if (!baseUrl) {
      return NextResponse.json({ success: false, error: '请输入 API 基础地址 (Base URL)' }, { status: 400 });
    }

    const candidates = normalizeUrlCandidates(baseUrl);
    let rawModels: any[] = [];
    let matchedEndpoint = '';
    let lastError = '';

    for (const endpoint of candidates) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey.trim()}`;
          headers['x-api-key'] = apiKey.trim();
        }

        const res = await fetch(endpoint, {
          method: 'GET',
          headers,
          next: { revalidate: 0 },
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            rawModels = json.data;
            matchedEndpoint = endpoint;
            break;
          } else if (Array.isArray(json.models)) {
            // Ollama or Google/OpenRouter style
            rawModels = json.models;
            matchedEndpoint = endpoint;
            break;
          } else if (Array.isArray(json)) {
            rawModels = json;
            matchedEndpoint = endpoint;
            break;
          }
        } else {
          lastError = `端点 ${endpoint} 返回 ${res.status}: ${await res.text().catch(() => '')}`;
        }
      } catch (err: any) {
        lastError = `连接 ${endpoint} 失败: ${err.message}`;
      }
    }

    if (rawModels.length === 0) {
      return NextResponse.json({
        success: false,
        error: lastError || '未能从该接口自动获取到模型列表，请确认 API Key 和 Base URL 是否支持 GET /v1/models',
      });
    }

    const discovered: DiscoveredModel[] = rawModels
      .map((item: any) => {
        const id = item.id || item.name || (typeof item === 'string' ? item : '');
        if (!id) return null;
        return {
          id: String(id),
          name: item.name || String(id),
          type: inferModelType(String(id)),
          owned_by: item.owned_by || item.provider || undefined,
        };
      })
      .filter(Boolean) as DiscoveredModel[];

    // Sort by type (text first, image, video) then alphabetical
    discovered.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.id.localeCompare(b.id);
    });

    return NextResponse.json({
      success: true,
      count: discovered.length,
      models: discovered,
      matchedEndpoint,
    });
  } catch (error: any) {
    console.error('[API /api/ai/fetch_models] Error:', error);
    return NextResponse.json({ success: false, error: error.message || '获取模型列表异常' }, { status: 500 });
  }
}
