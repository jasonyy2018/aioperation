import 'server-only';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { UserProfile, UserRole, PermissionKey } from '@/types';
import { ROLE_DEFINITIONS } from '@/lib/constants/users';

/**
 * 服务端认证服务
 * - bcrypt 密码哈希（不再存明文）
 * - 服务端 Session（httpOnly Cookie）
 * - 登录尝试限流（服务端，防绕过前端）
 */

const SESSION_TTL_HOURS = 24 * 7; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;
const BCRYPT_ROUNDS = 10;

// In-memory login attempt tracking (per IP+username)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export interface SafeUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  organization?: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt?: string;
  lastLoginAt?: string;
}

/** Strip sensitive fields for client transport */
export function toSafeUser(row: any): SafeUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as UserRole,
    organization: row.organization || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

function attemptKey(ip: string, username: string): string {
  return `${ip}:${username.toLowerCase()}`;
}

function checkLockout(key: string): { locked: boolean; remainingMs: number } {
  const record = loginAttempts.get(key);
  if (!record) return { locked: false, remainingMs: 0 };
  if (Date.now() > record.resetAt) {
    loginAttempts.delete(key);
    return { locked: false, remainingMs: 0 };
  }
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return { locked: true, remainingMs: record.resetAt - Date.now() };
  }
  return { locked: false, remainingMs: 0 };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (existing && now < existing.resetAt) {
    existing.count++;
  } else {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + LOCKOUT_MINUTES * 60 * 1000,
    });
  }
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

// Periodic cleanup of expired attempt records
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of loginAttempts.entries()) {
    if (now > rec.resetAt) loginAttempts.delete(key);
  }
}, 60 * 1000);

export async function login(
  username: string,
  password: string,
  ip: string = 'unknown'
): Promise<{ success: boolean; message: string; user?: SafeUser; token?: string }> {
  const key = attemptKey(ip, username);

  const lock = checkLockout(key);
  if (lock.locked) {
    const minutesLeft = Math.ceil(lock.remainingMs / 60000);
    return { success: false, message: `登录失败次数过多，请 ${minutesLeft} 分钟后再试` };
  }

  const db = getDb();
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE OR phone = ?')
    .get(username, username, username) as any;

  if (!user) {
    recordFailedAttempt(key);
    return { success: false, message: '账号不存在' };
  }

  if (!user.password_hash) {
    return { success: false, message: '该账号未设置密码，请联系管理员' };
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    recordFailedAttempt(key);
    const attemptsLeft = MAX_LOGIN_ATTEMPTS - (loginAttempts.get(key)?.count || 0);
    return {
      success: false,
      message: `密码错误${attemptsLeft > 0 ? `（还剩 ${attemptsLeft} 次尝试）` : ''}`,
    };
  }

  if (user.status === 'pending_approval') {
    return { success: false, message: '账号正在等待审核，请联系管理员' };
  }
  if (user.status === 'disabled') {
    return { success: false, message: '账号已被禁用' };
  }
  if (user.status === 'rejected') {
    return { success: false, message: '注册申请已被拒绝' };
  }

  // Success - create session
  clearAttempts(key);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();

  // Cleanup expired sessions occasionally
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();

  db.prepare(
    'INSERT INTO sessions (token, user_id, expires_at, ip) VALUES (?, ?, ?, ?)'
  ).run(token, user.id, expiresAt, ip);

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  return { success: true, message: `欢迎回来，${user.name}！`, user: toSafeUser(user), token };
}

export function getSessionUser(token: string): SafeUser | null {
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.*, s.expires_at FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    )
    .get(token) as any;
  if (!row) return null;
  if (row.status !== 'active') return null;
  return toSafeUser(row);
}

export function logout(token: string): void {
  if (!token) return;
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export async function register(input: {
  username: string;
  name: string;
  password: string;
  role?: UserRole;
  organization?: string;
  phone?: string;
  email?: string;
  applyReason?: string;
}): Promise<{ success: boolean; message: string }> {
  const db = getDb();
  const username = input.username.trim();

  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return { success: false, message: '用户名须为 3-20 位字母、数字或下划线' };
  }
  if (input.password.length < 6) {
    return { success: false, message: '密码至少 6 位' };
  }

  const exists = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get(username);
  if (exists) return { success: false, message: '用户名已被占用' };

  if (input.phone) {
    const phoneExists = db.prepare('SELECT id FROM users WHERE phone = ?').get(input.phone);
    if (phoneExists) return { success: false, message: '手机号已被注册' };
  }

  const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const id = `user_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  try {
    db.prepare(
      `INSERT INTO users (id, username, name, password_hash, role, applied_role, apply_reason, organization, phone, email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval')`
    ).run(
      id,
      username,
      input.name.trim(),
      hash,
      input.role || 'student',
      input.role || 'student',
      input.applyReason || '',
      input.organization || '',
      input.phone || null,
      input.email || null
    );
    return { success: true, message: '注册申请已提交，等待管理员审核' };
  } catch (err: any) {
    console.error('[auth] register error:', err.message);
    return { success: false, message: '注册失败，请稍后重试' };
  }
}

export function hasPermissionServer(user: SafeUser, permission: PermissionKey): boolean {
  if (user.status !== 'active') return false;
  if (user.role === 'admin') return true;
  const db = getDb();
  const row = db.prepare('SELECT custom_permissions FROM users WHERE id = ?').get(user.id) as any;
  if (row?.custom_permissions) {
    try {
      const perms = JSON.parse(row.custom_permissions);
      if (Array.isArray(perms) && perms.includes(permission)) return true;
    } catch { /* ignore */ }
  }
  const roleDef = ROLE_DEFINITIONS[user.role];
  return roleDef?.defaultPermissions.includes(permission) || false;
}
