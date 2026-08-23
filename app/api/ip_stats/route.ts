import { NextRequest, NextResponse } from 'next/server';
import { VisitorLog, IpStatsSummary } from '@/types';

export const dynamic = 'force-dynamic';

// In-memory ring buffer for visitor logs (persists during server lifetime)
const MAX_LOGS = 500;
let visitorLogs: VisitorLog[] = [];

export async function GET(req: NextRequest) {
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  // Calculate summary
  const totalVisits = visitorLogs.length;
  const uniqueIps = new Set(visitorLogs.map((l) => l.ip)).size;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayVisits = visitorLogs.filter((l) => l.timestamp.startsWith(todayStr)).length;

  const cityCountMap: Record<string, number> = {};
  const ispCountMap: Record<string, number> = {};

  for (const log of visitorLogs) {
    const c = log.city || log.region || '未知城市';
    cityCountMap[c] = (cityCountMap[c] || 0) + 1;
    const i = log.isp || '未知运营商';
    ispCountMap[i] = (ispCountMap[i] || 0) + 1;
  }

  const topCities = Object.entries(cityCountMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topIsps = Object.entries(ispCountMap)
    .map(([isp, count]) => ({ isp, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const summary: IpStatsSummary = {
    totalVisits,
    uniqueIps,
    todayVisits,
    topCities,
    topIsps,
    recentLogs: visitorLogs.slice(0, 50),
  };

  return NextResponse.json({ summary, clientIp });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientIp =
      body.ip ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const log: VisitorLog = {
      id: Math.random().toString(36).substring(2, 9),
      ip: clientIp,
      country: body.country || '中国',
      region: body.region || '',
      city: body.city || '未知',
      isp: body.isp || '本地网络',
      userAgent: req.headers.get('user-agent') || 'Unknown',
      path: body.path || '/',
      timestamp: new Date().toISOString(),
    };

    visitorLogs.unshift(log);
    if (visitorLogs.length > MAX_LOGS) {
      visitorLogs = visitorLogs.slice(0, MAX_LOGS);
    }

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  visitorLogs = [];
  return NextResponse.json({ success: true, message: '访客记录已清空' });
}
