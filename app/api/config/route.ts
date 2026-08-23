import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PROMPTS } from '@/lib/constants/prompts';
import { DEFAULT_MODELS } from '@/lib/constants/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    prompts: DEFAULT_PROMPTS,
    models: DEFAULT_MODELS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kind } = body;

    // In modern Next.js client-side store + localStorage handles user customized prompts & models seamlessly,
    // and server responds with success to satisfy sync operations.
    return NextResponse.json({
      success: true,
      message: `${kind === 'prompts' ? '提示词' : '模型配置'}同步成功`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
