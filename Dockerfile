# Stage 1: Install dependencies
FROM node:22-alpine AS deps
# libc6-compat: 兼容层；python3/make/g++ 仅在无匹配预编译产物时编译原生模块用
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# 自检：better-sqlite3 必须能在 Alpine(musl) 中加载运行
# （v12+ 自带 linuxmusl-x64.node 预编译产物；若失败说明环境异常，构建立即报错）
RUN node -e "const D=require('/app/node_modules/better-sqlite3'); const db=new D(':memory:'); db.exec('SELECT 1'); db.close(); console.log('[deps] better-sqlite3 works in Alpine')"

# Stage 2: Build the application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV CI=true

# Build the Next.js app with standalone output
RUN npm run build

# Stage 3: Production runner (standalone, no Nginx needed)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8765
ENV HOSTNAME="0.0.0.0"
ENV AUTOMEDIA_DATA_DIR=/app/data

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 数据目录：预建并授权给 nextjs 用户（SQLite 数据库存储位置）
# 使用绑定挂载时，宿主机需保证该目录对 uid 1001 可写: chown -R 1001:1001 ./data
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# better-sqlite3 原生模块：standalone 追踪对 .node 二进制不可靠，显式补拷整个包
# （v12+ 自带 linuxmusl 预编译产物，无需 bindings/file-uri-to-path 等额外依赖）
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

USER nextjs

# 启动前自检：SQLite 引擎必须可用（快速失败 + 明确错误），然后启动服务
CMD ["sh", "-c", "node -e \"const D=require('better-sqlite3'); const d=new D('/app/data/.startup-check'); d.exec('CREATE TABLE IF NOT EXISTS t(x)'); d.close(); fs=require('fs'); fs.unlinkSync('/app/data/.startup-check'); console.log('[startup] SQLite OK')\" || { echo '[startup] SQLite FAILED - check /app/data permissions'; exit 1; }; exec node server.js"]

EXPOSE 8765

# Health check - API health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8765/api/health || exit 1
