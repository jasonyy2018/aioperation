import { NextRequest, NextResponse } from 'next/server';
import { callTextAI } from '@/lib/services/ai-clients';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { modelId = 'ark-text', systemPrompt, userPrompt, customModels } = body;

    if (!userPrompt) {
      return NextResponse.json({ error: 'userPrompt 不能为空' }, { status: 400 });
    }

    const text = await callTextAI({
      modelId,
      systemPrompt,
      userPrompt,
      customModels,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('[API /api/ai/text] Error:', error);
    return NextResponse.json({ error: error.message || '生成失败' }, { status: 500 });
  }
}
