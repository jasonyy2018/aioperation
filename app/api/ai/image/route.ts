import { NextRequest, NextResponse } from 'next/server';
import { callImageAI } from '@/lib/services/ai-clients';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { modelId = 'minimax-image', prompt, aspectRatio = '1:1', refImageUrl, count = 1, customModels } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt 不能为空' }, { status: 400 });
    }

    const images = await callImageAI({
      modelId,
      prompt,
      aspectRatio,
      refImageUrl,
      count,
      customModels,
    });

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('[API /api/ai/image] Error:', error);
    return NextResponse.json({ error: error.message || '图片生成失败' }, { status: 500 });
  }
}
