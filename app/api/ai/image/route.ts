import { NextRequest, NextResponse } from 'next/server';
import { callImageAI } from '@/lib/services/ai-clients';
import { checkAIRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkAIRateLimit(ip)) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
    }

    const {
      modelId = 'minimax-image',
      prompt,
      aspectRatio = '1:1',
      refImageUrl,
      count = 1,
      customModels,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt 不能为空' }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: '提示词过长，请控制在 2000 字符以内' }, { status: 400 });
    }

    const images = await callImageAI({
      modelId,
      prompt: prompt.trim(),
      aspectRatio,
      refImageUrl,
      count: Math.min(Math.max(parseInt(count as any, 10) || 1, 1), 4),
      customModels,
    });

    return NextResponse.json({ images, model: modelId });
  } catch (error: any) {
    console.error('[API /api/ai/image] Error:', error);
    const isNetworkError = error?.message?.includes('Failed to fetch');
    const statusCode = isNetworkError ? 503 : 500;
    const message = isNetworkError
      ? 'AI 图片服务暂时不可用，请稍后重试'
      : error?.message?.includes('API')
      ? '图片生成失败，请检查模型配置'
      : '图片生成失败，请稍后重试';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
