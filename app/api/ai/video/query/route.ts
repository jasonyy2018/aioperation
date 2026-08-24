import { NextRequest, NextResponse } from 'next/server';
import { queryVideoAI } from '@/lib/services/ai-clients';
import { checkAIRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkAIRateLimit(ip)) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get('modelId') || 'minimax-video';
    const taskId = searchParams.get('taskId') || '';

    if (!taskId) {
      return NextResponse.json({ error: 'taskId 不能为空' }, { status: 400 });
    }

    const res = await queryVideoAI({ modelId, taskId });
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('[API /api/ai/video/query] Error:', error);
    return NextResponse.json(
      { status: 'failed', error: '查询失败，请稍后重试' },
      { status: 500 }
    );
  }
}
