import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/services/auth';
import { checkRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: '请求体格式错误' }, { status: 400 });
    }

    const { username, name, password, role, organization, phone, applyReason } = body || {};

    if (!username || !name || !password) {
      return NextResponse.json(
        { success: false, message: '用户名、姓名、密码为必填项' },
        { status: 400 }
      );
    }

    const result = await register({
      username: String(username),
      name: String(name),
      password: String(password),
      role,
      organization: organization ? String(organization) : undefined,
      phone: phone ? String(phone) : undefined,
      applyReason: applyReason ? String(applyReason) : undefined,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error('[API /api/auth/register] Error:', err);
    return NextResponse.json({ success: false, message: '注册失败，请稍后重试' }, { status: 500 });
  }
}
