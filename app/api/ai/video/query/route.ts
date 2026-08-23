import { NextRequest, NextResponse } from 'next/server';
import { queryVideoAI } from '@/lib/services/ai-clients';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
    return NextResponse.json({ status: 'failed', error: error.message || '查询失败' }, { status: 500 });
  }
}
