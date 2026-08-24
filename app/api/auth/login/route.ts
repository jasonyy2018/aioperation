import { NextRequest, NextResponse } from 'next/server';
import { login, logout } from '@/lib/services/auth';
import { ensureSeed } from '@/lib/services/seed';
import { checkRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'automedia_session';

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
    // 数据库初始化/播种失败会在此被捕获并返回可读错误（而非 HTML 错误页）
    ensureSeed();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: '请求体格式错误' }, { status: 400 });
    }

    const { username, password } = body || {};
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const result = await login(String(username), String(password), ip);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 401 });
    }

    const res = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });
    res.cookies.set(SESSION_COOKIE, result.token || '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 3600,
      path: '/',
    });
    return res;
  } catch (err: any) {
    console.error('[API /api/auth/login] Error:', err);
    const detail = process.env.NODE_ENV === 'production'
      ? `服务内部错误: ${(err?.message || '未知').slice(0, 150)}`
      : String(err?.message || err);
    return NextResponse.json({ success: false, message: detail }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    logout(token);
  }
  const res = NextResponse.json({ success: true, message: '已退出登录' });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
  return res;
}
