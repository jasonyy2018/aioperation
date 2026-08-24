import { NextRequest, NextResponse } from 'next/server';
import { submitVideoAI } from '@/lib/services/ai-clients';
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

    const { modelId = 'minimax-video', prompt, imageUrl, customModels } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt 不能为空' }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: '提示词过长，请控制在 2000 字符以内' }, { status: 400 });
    }

    const res = await submitVideoAI({
      modelId,
      prompt: prompt.trim(),
      imageUrl,
      customModels,
    });

    return NextResponse.json(res);
  } catch (error: any) {
    console.error('[API /api/ai/video/submit] Error:', error);
    const isNetworkError = error?.message?.includes('Failed to fetch');
    const statusCode = isNetworkError ? 503 : 500;
    const message = isNetworkError
      ? 'AI 视频服务暂时不可用，请稍后重试'
      : error?.message?.includes('API')
      ? '视频任务提交失败，请检查模型配置'
      : '视频任务提交失败，请稍后重试';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
