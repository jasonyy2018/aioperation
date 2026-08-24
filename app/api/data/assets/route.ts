import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/services/auth';
import { checkRateLimit } from '@/lib/middleware';
import { MediaAsset } from '@/types';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function rowToAsset(row: any): MediaAsset {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || '[]');
  } catch { /* ignore */ }
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    content: row.content || '',
    mediaUrl: row.media_url || undefined,
    tags,
    platform: row.platform || undefined,
    createdAt: row.created_at,
  };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  const token = req.cookies.get('automedia_session')?.value;
  const user = getSessionUser(token || "");
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC LIMIT 500')
    .all(user.id);
  const assets = rows.map(rowToAsset);
  return NextResponse.json({ assets });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  const token = req.cookies.get('automedia_session')?.value;
  const user = getSessionUser(token || "");
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
    }

    const { id, title, type, content, mediaUrl, tags, platform } = body || {};
    if (!title || !type) {
      return NextResponse.json({ error: 'title 和 type 为必填' }, { status: 400 });
    }

    const db = getDb();
    const assetId = id || `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(
      `INSERT OR REPLACE INTO assets (id, user_id, title, type, content, media_url, tags, platform)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      assetId,
      user.id,
      String(title).slice(0, 200),
      String(type),
      content ? String(content) : '',
      mediaUrl || null,
      JSON.stringify(Array.isArray(tags) ? tags.slice(0, 20) : []),
      platform || null
    );

    const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
    return NextResponse.json({ success: true, asset: rowToAsset(row) });
  } catch (err: any) {
    console.error('[API /api/data/assets] Error:', err.message);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('automedia_session')?.value;
  const user = getSessionUser(token || "");
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const db = getDb();
  if (id === '__all__') {
    db.prepare('DELETE FROM assets WHERE user_id = ?').run(user.id);
    return NextResponse.json({ success: true, message: '已清空资产库' });
  }
  if (id) {
    db.prepare('DELETE FROM assets WHERE id = ? AND user_id = ?').run(id, user.id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });
}
