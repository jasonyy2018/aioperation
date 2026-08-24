/**
 * API 认证与限流工具函数
 * 在 Next.js App Router 中通过 middleware.ts 或各 route 内部调用
 */

export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute window
// 一般 API: 120 次/分钟（登录页会并发调用 me/ip_stats/assets/users 等多个接口，
// 反代场景下所有用户可能共享同一出口 IP，30 次极易误伤）
const MAX_REQUESTS = 120;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now > record.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * AI 生成类接口的独立限流（更严格，防滥用）
 * 与一般 API 分开计数，互不影响
 */
const aiRateLimits = new Map<string, RateLimitRecord>();
const AI_MAX_REQUESTS = 20; // AI 生成: 20 次/分钟

export function checkAIRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = aiRateLimits.get(ip);

  if (!record || now > record.resetAt) {
    aiRateLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= AI_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export function getRateLimitRemaining(ip: string): number {
  const record = rateLimits.get(ip);
  if (!record) return MAX_REQUESTS;
  return Math.max(0, MAX_REQUESTS - record.count);
}

/**
 * 清理过期的限速记录（每隔一段时间调用一次）
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimits.entries()) {
    if (now > record.resetAt) {
      rateLimits.delete(key);
    }
  }
}
