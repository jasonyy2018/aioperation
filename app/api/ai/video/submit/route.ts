import { NextRequest, NextResponse } from 'next/server';
import { submitVideoAI } from '@/lib/services/ai-clients';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { modelId = 'minimax-video', prompt, imageUrl, customModels } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt 不能为空' }, { status: 400 });
    }

    const res = await submitVideoAI({
      modelId,
      prompt,
      imageUrl,
      customModels,
    });

    return NextResponse.json(res);
  } catch (error: any) {
    console.error('[API /api/ai/video/submit] Error:', error);
    return NextResponse.json({ error: error.message || '视频任务提交失败' }, { status: 500 });
  }
}
