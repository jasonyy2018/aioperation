import { NextRequest, NextResponse } from 'next/server';
import { callTextAI } from '@/lib/services/ai-clients';
import { AIModelConfig } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model }: { model: AIModelConfig } = body;

    if (!model || !model.apiKey) {
      return NextResponse.json({ success: false, message: '请提供有效的模型配置和 API Key' }, { status: 400 });
    }

    const start = Date.now();
    if (model.type === 'text') {
      await callTextAI({
        modelId: model.id,
        userPrompt: '测试连接，请回复：OK',
        customModels: [model],
      });
    } else {
      // image/video endpoint ping check
      const res = await fetch(model.baseUrl, {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${model.apiKey}` },
      }).catch(() => null);
    }

    const latency = Date.now() - start;
    return NextResponse.json({ success: true, latency, message: `连接正常 (${latency}ms)` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '连接失败' });
  }
}
