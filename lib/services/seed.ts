import 'server-only';
import bcrypt from 'bcryptjs';
import { getDb, seedDefaults } from '@/lib/db';
import { DEFAULT_USERS } from '@/lib/constants/users';
import { DEFAULT_PROMPTS } from '@/lib/constants/prompts';
import { DEFAULT_MODELS } from '@/lib/constants/models';

/**
 * 首次访问时初始化数据库种子数据：
 * - 默认用户（明文密码 → bcrypt 哈希）
 * - 默认提示词模板
 * - 默认 AI 模型配置
 */

let seeded = false;

export function ensureSeed() {
  if (seeded) return;
  const db = getDb();

  // Seed prompts & models
  seedDefaults(DEFAULT_PROMPTS, DEFAULT_MODELS);

  // Seed users (hash plaintext default passwords)
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (userCount.c === 0) {
    const insert = db.prepare(
      `INSERT OR IGNORE INTO users
       (id, username, name, password_hash, role, applied_role, apply_reason, organization, email, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction(() => {
      for (const u of DEFAULT_USERS) {
        insert.run(
          u.id,
          u.username,
          u.name,
          u.password ? bcrypt.hashSync(u.password, 10) : null,
          u.role,
          u.appliedRole || u.role,
          u.applyReason || '',
          u.organization || '',
          u.email || null,
          u.phone || null,
          u.status
        );
      }
    });
    tx();
  }

  seeded = true;
}
