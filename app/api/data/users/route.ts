import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser, toSafeUser } from '@/lib/services/auth';
import { checkRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/** 需要管理员权限 */
async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('automedia_session')?.value;
  const user = getSessionUser(token || '');
  if (!user) return { error: '未登录', status: 401 as const };
  if (user.role !== 'admin') return { error: '需要管理员权限', status: 403 as const };
  return { user };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  const guard = await requireAdmin(req);
  if ('error' in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const db = getDb();
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  // 不返回 password_hash — toSafeUser 已剔除
  return NextResponse.json({
    users: rows.map(toSafeUser),
    pendingCount: rows.filter((r: any) => r.status === 'pending_approval').length,
  });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('error' in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
    }

    const { id, action, role, status, customPermissions, name, organization } = body || {};
    if (!id || !action) {
      return NextResponse.json({ error: '缺少 id 或 action' }, { status: 400 });
    }

    const db = getDb();
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!target) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    switch (action) {
      case 'approve': {
        // 审批通过：pending → active，应用申请的角色
        db.prepare(
          "UPDATE users SET status = 'active', role = COALESCE(applied_role, role), applied_role = NULL WHERE id = ?"
        ).run(id);
        break;
      }
      case 'reject': {
        db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(id);
        break;
      }
      case 'disable': {
        if (target.role === 'admin' && target.id !== guard.user!.id) {
          return NextResponse.json({ error: '不能禁用其他管理员' }, { status: 400 });
        }
        db.prepare("UPDATE users SET status = 'disabled' WHERE id = ?").run(id);
        // 同步吊销该用户所有会话
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
        break;
      }
      case 'enable': {
        db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(id);
        break;
      }
      case 'setRole': {
        if (!['admin', 'mentor', 'enterprise', 'student'].includes(role)) {
          return NextResponse.json({ error: '无效角色' }, { status: 400 });
        }
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
        break;
      }
      case 'updateInfo': {
        db.prepare('UPDATE users SET name = ?, organization = ?, custom_permissions = ? WHERE id = ?')
          .run(
            name !== undefined ? String(name).slice(0, 50) : target.name,
            organization !== undefined ? String(organization).slice(0, 100) : target.organization || '',
            customPermissions !== undefined ? JSON.stringify(customPermissions) : target.custom_permissions || null,
            id
          );
        break;
      }
      default:
        return NextResponse.json({ error: `未知 action: ${action}` }, { status: 400 });
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    return NextResponse.json({ success: true, user: toSafeUser(updated) });
  } catch (err: any) {
    console.error('[API /api/data/users] PATCH Error:', err.message);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('error' in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });
  }
  if (id === guard.user!.id) {
    return NextResponse.json({ error: '不能删除自己的账号' }, { status: 400 });
  }

  const db = getDb();
  const target = db.prepare('SELECT role FROM users WHERE id = ?').get(id) as any;
  if (!target) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }
  if (target.role === 'admin') {
    const adminCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get() as any).c;
    if (adminCount <= 1) {
      return NextResponse.json({ error: '系统至少需要一个管理员账号' }, { status: 400 });
    }
  }

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
