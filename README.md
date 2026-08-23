# 🚀 AI 赋能直播网创一体化实战平台

**生产级多引擎自媒体 AI 创作与全网矩阵运营工作台**

> 上海市黄浦区就业促进中心 ✖️ 星光色谷老字号公共创业实训载体  
> LiveOps OS v2.0 | Next.js 16 · React 19 · TypeScript · Tailwind CSS

---

## 🌟 核心功能与 18 大模块

### 实战创作工作台
| 模块 | 说明 |
|------|------|
| 🔥 热点话题发现 | 实时抓取 Bing / 百度高热度新闻与爆款话题 |
| 🎯 曼陀罗选题与 IP | 九宫格裂变 64 爆款选题 + 账号人设四件套 |
| 🎬 AI 漫剧分镜 | 三视图一致性 + 4 阶段带货脚本卡片流 |
| 📸 商业虚拟影棚 | 白底图置换 12+ 场景 + 老照片高清修复 |
| 📝 图文文章生成 | 公众号 / 抖音 / 快手 / 小红书 多平台调性 |
| 🎬 短视频分镜脚本 | 前3秒黄金钩子 + 运镜 Prompt + 口播台词 |
| 🎨 AI 商业生图 | MiniMax / 混元 / Agnes 多引擎生图 |
| 🎥 AI 视频渲染 | 文生视频 + 图生视频异步进度轮询 |

### 直播与运营中枢
| 模块 | 说明 |
|------|------|
| 📡 智能直播操盘 | 排品看板 + 7分钟话术 + 弹幕场控 |
| 💬 热门评论衍生 | 裂变神评引流话术矩阵 |
| 🤖 棘手评论回复 | 危机公关高情商回复预案 |
| 👥 全网矩阵账号 | 8 大平台账号管理与广告法自检 |
| 📂 数字资产库 | 全模态归档检索与导出 |

### 实训教学与孵化
| 模块 | 说明 |
|------|------|
| 🏆 18课时通关打卡 | 阶梯式作业提交 + AI 初审 + 导师评审 |
| 🌐 访客地域统计 | IP 分布、省市地域与访问流水 |

### 系统配置底座
| 模块 | 说明 |
|------|------|
| 👥 用户与角色权限 | RBAC 四级角色体系 (admin/mentor/enterprise/student) |
| 🤖 大模型引擎配置 | MiniMax / 火山方舟 / 混元 / Agnes / Seedance |
| ⚙️ 提示词系统 | 全模块 System Prompt 可视化调优 |

---

## 🚀 快速启动

### 方式一：Docker 部署（推荐）

```bash
# 1. 复制环境变量模板并填入密钥
cp .env.example .env.local

# 2. 编辑 .env.local 填入真实 API Key

# 3. 启动容器
docker compose up -d

# 4. 查看运行状态
docker compose logs -f

# 访问 http://localhost:8765
```

### 方式二：本地开发

```bash
# 1. 安装依赖
npm install

# 2. 开发模式 (热重载)
npm run dev
# → http://localhost:8765

# 3. 生产构建
npm run build
npm run start
```

### 方式三：Windows 双击启动

双击 `启动平台.bat` 即可自动启动开发服务器。

---

## 🔑 默认登录账号

| 用户名 | 密码 | 角色 | 用途 |
|--------|------|------|------|
| `admin` | `admin` | 超级管理员 | 全权限管理 |
| `mentor_li` | `mentor` | 实训导师 | 作业评审指导 |
| `laozihao_boss` | `boss` | 老字号企业 | 爆款策划带货 |
| `student_zhang` | `student` | 实训学员 | 基础创作实操 |

> **安全提醒**：请在首次登录后立即修改默认密码，并将 `.env.local` 加入 `.gitignore`。

---

## ⚙️ 环境变量配置

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `MM_API_KEY` | MiniMax (海螺AI) API Key | [minimaxi.com](https://minimaxi.com) |
| `HY_API_KEY` | 腾讯混元 API Key | [云开发平台](https://cloud.tencent.com) |
| `AGNES_API_KEY` | Agnes AI API Key | [agnes-ai.com](https://agnes-ai.com) |
| `ARK_API_KEY` | 字节火山方舟 API Key | [volcengine.com](https://volcengine.com) |
| `SEEDANCE_MINI_API_KEY` | Seedance 2 Mini API Key | AggregateAPI |
| `PORT` | 服务端口 | 默认 `8765` |

---

## 📦 项目架构

```
自媒体AI运营平台/
├── app/
│   ├── api/          # Next.js API Routes (服务端)
│   ├── globals.css   # 全局样式 + 暗色主题变量
│   ├── layout.tsx    # 根布局 (Auth/Toast/ErrorBoundary)
│   └── page.tsx      # 主页路由
├── components/
│   ├── auth/         # 认证上下文 & 登录页
│   ├── layout/       # 侧边栏 & 顶部导航
│   ├── modules/      # 18 个业务功能模块
│   └── ui/           # 通用 UI 组件 (Toast/Modal/Badge/Skeleton/...)
├── lib/
│   ├── constants/    # 配置常量 (models/prompts/users)
│   ├── middleware.ts # API 限流中间件
│   ├── services/     # AI 客户端服务 (含重试逻辑)
│   └── utils.ts      # 工具函数
├── types/            # TypeScript 类型定义
├── middleware.ts     # Next.js 全局中间件 (安全头 + 限流)
└── docker-compose.yml
```

---

## 🔒 安全特性

- ✅ **服务端 API 代理** — 所有 AI 请求经 Next.js 后端中转，API Key 不暴露给前端
- ✅ **IP 限流** — 每个 IP 每分钟最多 30 次请求，超限返回 429
- ✅ **登录防爆破** — 5 次失败后自动锁定 5 分钟
- ✅ **安全响应头** — X-Content-Type-Options / X-Frame-Options / X-XSS-Protection
- ✅ **错误边界** — 全局 + 模块级双保险，单个模块崩溃不影响整体
- ✅ **输入校验** — 所有 API 请求参数类型和长度校验

---

## 📄 License

本项目仅供黄浦区老字号实训教学使用，禁止商业转载。
