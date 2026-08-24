# Stage 1: Install dependencies
FROM node:22-alpine AS deps
# better-sqlite3 是原生模块，Alpine(musl) 无预编译产物，需 python3/make/g++ 现场编译
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Stage 2: Build the application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Suppress warnings during build
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

# better-sqlite3 原生二进制：standalone 追踪有时会遗漏 .node 文件，显式补拷
# (若 standalone 已包含则覆盖为相同内容，无副作用)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

# Health check - API health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8765/api/health || exit 1

USER nextjs

EXPOSE 8765

# Start the server
CMD ["node", "server.js"]
