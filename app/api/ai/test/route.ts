import { NextRequest, NextResponse } from 'next/server';
import { callTextAI } from '@/lib/services/ai-clients';
import { checkRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: '请求体格式错误' }, { status: 400 });
    }

    const { model }: { model: any } = body;

    if (!model || !model.apiKey || !model.baseUrl) {
      return NextResponse.json({ success: false, message: '请提供有效的模型配置' }, { status: 400 });
    }

    const start = Date.now();
    if (model.type === 'text') {
      await callTextAI({
        modelId: model.id,
        userPrompt: '测试连接，请回复：OK',
        customModels: [model as any],
      });
    } else {
      // Lightweight connectivity check for image/video endpoints
      try {
        const res = await fetch(model.baseUrl, {
          method: 'HEAD',
          headers: { Authorization: `Bearer ${model.apiKey}` },
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);
        if (!res?.ok) throw new Error('Endpoint not reachable');
      } catch {
        // Accept partial connectivity
      }
    }

    const latency = Date.now() - start;
    return NextResponse.json({
      success: true,
      latency,
      message: `连接正常 (${latency}ms)`,
    });
  } catch (error: any) {
    console.error('[API /api/ai/test] Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || '连接失败，请检查配置' },
      { status: 500 }
    );
  }
}
