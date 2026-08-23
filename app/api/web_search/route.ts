import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveWebSearch } from '@/lib/services/crawler';
import { checkRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const count = Math.min(Math.max(parseInt(searchParams.get('count') || '10', 10), 1), 20);

    if (!query) {
      return NextResponse.json({ results: [], error: 'query 不能为空' }, { status: 400 });
    }

    const results = await fetchLiveWebSearch(query, count);
    return NextResponse.json({
      results,
      real_count: results.length,
      notice: '结果来自搜索引擎实时解析（无伪造模板）',
    });
  } catch (error: any) {
    console.error('[API /api/web_search] Error:', error);
    return NextResponse.json(
      { results: [], error: '搜索解析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
