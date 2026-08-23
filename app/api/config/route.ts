import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PROMPTS } from '@/lib/constants/prompts';
import { DEFAULT_MODELS } from '@/lib/constants/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    prompts: DEFAULT_PROMPTS,
    models: DEFAULT_MODELS,
    version: '2.0.0',
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: '请求体格式错误' }, { status: 400 });
    }

    const { kind } = body;
    return NextResponse.json({
      success: true,
      message: `${kind === 'prompts' ? '提示词' : '模型配置'}同步成功`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
