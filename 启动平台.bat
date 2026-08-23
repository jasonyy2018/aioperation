@echo off
chcp 65001 >nul
title 自媒体AI运营平台 (Next.js 16 + Docker Standalone)

echo ================================================================
echo         自媒体AI运营平台 — Next.js 全栈版 (端口: 8765)
echo ================================================================
echo.
echo  请选择启动运行方式：
echo.
echo  [1] Docker 容器一键启动 (推荐，纯原生无 Nginx，开箱即用)
echo  [2] 本地 Node.js 生产模式启动 (npm run start)
echo  [3] 本地 Node.js 开发调试模式启动 (npm run dev)
echo  [4] 重新构建 Docker 镜像 (docker compose build)
echo  [5] 停止 Docker 容器服务 (docker compose down)
echo.
set /p choice=请输入选项编号 (默认 1): 

if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo.
    echo 正在启动 Docker 容器...
    docker compose up -d
    echo.
    echo [成功] 服务已在后台运行！请在浏览器打开: http://localhost:8765
    echo.
    pause
    exit /b
)

if "%choice%"=="2" (
    echo.
    echo 正在构建并以生产模式启动...
    npm run build && npm run start
    pause
    exit /b
)

if "%choice%"=="3" (
    echo.
    echo 正在以开发模式启动...
    npm run dev
    pause
    exit /b
)

if "%choice%"=="4" (
    echo.
    echo 正在重新构建 Docker 镜像...
    docker compose build --no-cache
    echo [成功] 构建完成！
    pause
    exit /b
)

if "%choice%"=="5" (
    echo.
    echo 正在停止容器服务...
    docker compose down
    echo [成功] 容器已停止！
    pause
    exit /b
)

echo 无效选项，程序退出。
pause
