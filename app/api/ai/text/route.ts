import { NextRequest, NextResponse } from 'next/server';
import { callTextAI } from '@/lib/services/ai-clients';
import { checkRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  try {
    // Parse and validate body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
    }

    const {
      modelId = 'minimax-text',
      systemPrompt,
      userPrompt,
      customModels,
    } = body;

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return NextResponse.json({ error: 'userPrompt 不能为空' }, { status: 400 });
    }

    // Limit prompt length
    if (userPrompt.length > 8000) {
      return NextResponse.json({ error: '提示词过长，请控制在 8000 字符以内' }, { status: 400 });
    }

    const text = await callTextAI({
      modelId,
      systemPrompt,
      userPrompt: userPrompt.trim(),
      customModels,
    });

    return NextResponse.json({ text, model: modelId });
  } catch (error: any) {
    console.error('[API /api/ai/text] Error:', error);

    // Don't expose internal errors
    const isNetworkError = error?.message?.includes('Failed to fetch');
    const statusCode = isNetworkError ? 503 : 500;
    const message = isNetworkError
      ? 'AI 服务暂时不可用，请稍后重试'
      : error?.message?.includes('API')
      ? 'AI 模型调用失败，请检查配置'
      : '生成失败，请稍后重试';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
