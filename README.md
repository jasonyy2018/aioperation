# 自媒体AI运营平台 (Next.js 16 全栈版)

生产级多引擎自媒体 AI 创作与全网矩阵运营工作台，基于 **Next.js 16 (App Router + React 19 + TypeScript + Tailwind CSS)** 构建，支持 **纯原生 Docker 容器化（无需 Nginx）** 独立部署。

---

## 🌟 核心功能与 12 大模块

1. **🔥 热点话题发现**：全网实时抓取 Bing / 百度实时新闻与爆款话题，分类过滤与一键创作流转。
2. **📝 图文文章生成**：公众号、抖音、快手、小红书 4 大平台调性文章深度撰写与 Markdown / HTML 实时预览。
3. **🎬 短视频脚本生成**：分镜头切分、前3秒吸睛钩子、运镜提示词、口播台词与背景音乐联动。
4. **🎨 AI 图片创作**：MiniMax Image-01、腾讯混元 Image、Agnes 2.1 Flash 商业生图与垫图支持。
5. **🎥 AI 视频创作**：文生视频与图生视频、异步任务进度实时轮询、影视级动态渲染与在线播放。
6. **💬 热门评论衍生**：根据对标爆款评论，自动裂变多角度神评与矩阵引流话术。
7. **🤖 棘手评论回复**：智能识别质疑/吐槽/咨询/广告意图，输出危机公关与高情商化解预案。
8. **👥 账号矩阵管理**：全网 8 大主流平台账号状态、粉丝量与类目看板。
9. **📂 自媒体资产库**：图文、脚本、图片、视频与评论统一归档、检索、导出与本地持久化。
10. **🌐 访客 IP 统计**：独立访客 IP 追踪、省市地域分布、网络运营商分布与实时访问流水。
11. **⚙️ 提示词系统配置**：全模块 System Prompt 可视化调优与一键出厂重置。
12. **🤖 大模型配置管理**：火山方舟、MiniMax、混元、Agnes、Seedance 接口与连通性自检。

---

## 🚀 快速启动

### 方式一：Docker 部署（推荐，无 Nginx 依赖）

确保本地或云服务器已安装 Docker 与 Docker Compose：

```bash
# 启动容器服务（后台运行）
docker compose up -d

# 查看运行状态与日志
docker compose logs -f

# 停止服务
docker compose down
```

启动完成后，直接在浏览器访问：
👉 `http://localhost:8765`（或 `http://<服务器公网IP>:8765`）

---

### 方式二：本地 Node.js 启动

需要 Node.js >= 18.18.0：

```bash
# 1. 安装依赖
npm install

# 2. 本地开发调试
npm run dev

# 3. 生产模式构建与启动
npm run build
npm run start
```

---

## ⚙️ 环境变量配置 (`.env.local` / Docker 环境变量)

| 变量名 | 说明 | 默认值 |
| :--- | :--- | :--- |
| `PORT` | 服务监听端口 | `8765` |
| `ARK_API_KEY` | 字节火山方舟 API Key | 已内置默认 Key |
| `MM_API_KEY` | MiniMax (海螺AI) API Key | 已内置默认 Key |
| `HY_API_KEY` | 腾讯混元 API Key | 已内置默认 Key |
| `AGNES_API_KEY` | Agnes AI API Key | 已内置默认 Key |
| `SEEDANCE_MINI_API_KEY` | Seedance 2 Mini API Key | 已内置默认 Key |

---

## 🐳 Dockerfile 架构说明

本项目采用 **Next.js Standalone** 多阶段构建技术：
1. **deps 阶段**：安装纯净运行依赖
2. **builder 阶段**：执行 `next build` 产出独立运行时 `.next/standalone`
3. **runner 阶段**：基于精简的 `node:alpine` 镜像直接以 `node server.js` 启动独立 HTTP 服务，内存占用极低（< 100MB），彻底摆脱任何 Nginx 配置与反向代理负担。
