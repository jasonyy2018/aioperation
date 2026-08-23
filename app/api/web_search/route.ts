import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveWebSearch } from '@/lib/services/crawler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const count = parseInt(searchParams.get('count') || '10', 10);

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
    return NextResponse.json({ results: [], error: error.message || '搜索解析失败' }, { status: 500 });
  }
}
