import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('automedia_session')?.value;
  if (!token) {
    return NextResponse.json({ isLoggedIn: false });
  }
  const user = getSessionUser(token);
  if (!user) {
    return NextResponse.json({ isLoggedIn: false });
  }
  return NextResponse.json({ isLoggedIn: true, user });
}
