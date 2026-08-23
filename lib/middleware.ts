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
const MAX_REQUESTS = 30; // max requests per window per IP

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
