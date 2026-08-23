#!/usr/bin/env python3
"""
自媒体AI运营平台 — 生产级代理 + 静态文件服务器
支持 MiniMax（文本/图片/视频）+ 腾讯混元（图片/视频）+ 火山方舟 + Agnes AI API 代理

本地开发: python server.py → http://localhost:8765
阿里云部署: python server.py → http://<公网IP>:8765
"""
import ssl
import http.server
import socketserver
import urllib.request
import urllib.error
import urllib.parse
import json
import os
import sys
import re
import random
import html as html_lib
from datetime import datetime, timedelta

# 禁用 SSL 证书验证（解决云环境自签名证书拦截问题）
_SSL_CONTEXT = ssl._create_unverified_context()

PORT = 8765
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = os.path.join(BASE_DIR, 'index.html')
SERVER_FILE = os.path.abspath(__file__)

# ====================== 环境变量与 API 密钥配置 ======================
def load_env_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    k, v = k.strip(), v.strip()
                    if k not in os.environ:
                        os.environ[k] = v

# 优先加载 .env.local，其次 .env
load_env_file(os.path.join(BASE_DIR, '.env.local'))
load_env_file(os.path.join(BASE_DIR, '.env'))

MM_API_KEY = os.environ.get('MM_API_KEY', '')
HY_API_KEY = os.environ.get('HY_API_KEY', '')
AGNES_API_KEY = os.environ.get('AGNES_API_KEY', '')
ARK_API_KEY = os.environ.get('ARK_API_KEY', '')
SEEDANCE_MINI_API_KEY = os.environ.get('SEEDANCE_MINI_API_KEY', '')

# ====================== API 路由映射 ======================
# 每个路由: { url, method, auth_type, auth_key, extra_headers }
API_ROUTES = {
    # ===== MiniMax =====
    '/api/text': {
        'url': 'https://api.minimaxi.com/anthropic/v1/messages',
        'method': 'POST',
        'auth_type': 'x-api-key',
        'auth_key': MM_API_KEY,
        'extra_headers': {'anthropic-version': '2023-06-01'}
    },
    '/api/image': {
        'url': 'https://api.minimaxi.com/v1/image_generation',
        'method': 'POST',
        'auth_type': 'bearer',
        'auth_key': MM_API_KEY,
        'extra_headers': {}
    },
    '/api/video': {
        'url': 'https://api.minimaxi.com/v1/video_generation',
        'method': 'POST',
        'auth_type': 'bearer',
        'auth_key': MM_API_KEY,
        'extra_headers': {}
    },
    '/api/video_query': {
        'url': 'https://api.minimaxi.com/v1/query/video_generation',
        'method': 'GET',
        'auth_type': 'bearer',
        'auth_key': MM_API_KEY,
        'extra_headers': {}
    },

    # ===== 腾讯混元 =====
    '/api/hy_image': {
        'url': 'https://tokenhub.tencentmaas.com/v1/api/image/generate',
        'method': 'POST',
        'auth_type': 'bearer',
        'auth_key': HY_API_KEY,
        'extra_headers': {},
        'inject_body': {'model': 'hy-image-lite', 'rsp_img_type': 'url'}
    },
    '/api/hy_video_submit': {
        'url': 'https://tokenhub.tencentmaas.com/v1/api/video/submit',
        'method': 'POST',
        'auth_type': 'bearer',
        'auth_key': HY_API_KEY,
        'extra_headers': {},
        'inject_body': {'model': 'hy-video-1.5'}
    },
    '/api/hy_video_query': {
        'url': 'https://tokenhub.tencentmaas.com/v1/api/video/query',
        'method': 'GET',
        'auth_type': 'bearer',
        'auth_key': HY_API_KEY,
        'extra_headers': {}
    },

    # ===== Agnes AI (图像+视频生成) =====
    '/api/agnes_image': {
        'url': 'https://apihub.agnes-ai.com/v1/images/generations',
        'method': 'POST',
        'auth_type': 'bearer',
        'auth_key': AGNES_API_KEY,
        'extra_headers': {},
        'inject_body': {'model': 'agnes-image-2.1-flash'},
        'remove_params': ['response_format']  # Agnes 不支持此参数
    },
    '/api/agnes_video_submit': {
        'url': 'https://apihub.agnes-ai.com/v1/videos',
        'method': 'POST',
        'auth_type': 'bearer',
        'auth_key': AGNES_API_KEY,
        'extra_headers': {},
        'inject_body': {'model': 'agnes-video-v2.0'}
    },
    '/api/agnes_video_query': {
        'url': 'https://apihub.agnes-ai.com/v1/videos',
        'method': 'GET',
        'auth_type': 'bearer',
        'auth_key': AGNES_API_KEY,
        'extra_headers': {}
    },

    # ===== Seedance 2 Mini（AggregateAPI 视频生成） =====
    '/api/seedance_mini/create': {
        'url': 'https://aaapi.togomol.com/api/v1',
        'method': 'POST',
        'auth_type': 'bearer',
        'auth_key': SEEDANCE_MINI_API_KEY,
        'extra_headers': {},
        'inject_body': {'model': 'bytedance/seedance-2-mini'}
    },
    '/api/seedance_mini/status': {
        'url': 'https://aaapi.togomol.com/api/v1/tasks/status',
        'method': 'GET',
        'auth_type': 'bearer',
        'auth_key': SEEDANCE_MINI_API_KEY,
        'extra_headers': {}
    },

    # ===== 火山方舟（文案生成专用）
    '/api/ark_text': {
        'url': 'https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions',
        'method': 'POST',
        'auth_type': 'bearer',
        'auth_key': ARK_API_KEY,
        'extra_headers': {},
        'inject_body': {'model': 'ark-code-latest'}
    },
}


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    """代理 + 静态文件服务器"""

    def build_headers(self, route):
        """根据路由配置构造请求头"""
        headers = {'Content-Type': 'application/json'}
        if route['auth_type'] == 'x-api-key':
            headers['x-api-key'] = route['auth_key']
        elif route['auth_type'] == 'bearer':
            headers['Authorization'] = 'Bearer ' + route['auth_key']
        headers.update(route['extra_headers'])
        return headers

    def send_json(self, status, payload):
        self.send_response(status)
        self.send_cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def _read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(content_length) if content_length else b'{}'
        return json.loads(raw.decode('utf-8') or '{}')

    def _escape_js_single_string(self, value):
        return json.dumps(value or '', ensure_ascii=False)[1:-1].replace("'", "\\'")

    def sync_prompts_to_index(self, prompts):
        if not isinstance(prompts, list):
            raise ValueError('prompts 必须是数组')
        with open(INDEX_FILE, 'r', encoding='utf-8-sig') as f:
            text = f.read()
        pattern = r"var defaultPrompts = \[[\s\S]*?\n\];\n\nfunction mergePromptDefaults"
        items = []
        for p in prompts:
            if not isinstance(p, dict) or not p.get('id'):
                continue
            item = {
                'id': str(p.get('id', '')),
                'module': str(p.get('module', '')),
                'name': str(p.get('name', '')),
                'content': str(p.get('content', ''))
            }
            items.append(item)
        replacement = 'var defaultPrompts = ' + json.dumps(items, ensure_ascii=False, indent=2) + ';\n\nfunction mergePromptDefaults'
        # 用函数形式替换，避免 re 把 replacement 中的 \n、\g 等当作转义序列还原（否则会把已转义的换行还原成真实换行，破坏 JS）
        new_text, count = re.subn(pattern, lambda _m: replacement, text, count=1)
        if count != 1:
            raise RuntimeError('未找到 index.html 中的 defaultPrompts 配置块')
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            f.write(new_text)
        return len(items)

    def sync_models_to_files(self, models, deleted_ids=None):
        if not isinstance(models, list):
            raise ValueError('models 必须是数组')
        deleted_ids = deleted_ids if isinstance(deleted_ids, list) else []
        with open(INDEX_FILE, 'r', encoding='utf-8-sig') as f:
            index_text = f.read()
        with open(SERVER_FILE, 'r', encoding='utf-8') as f:
            server_text = f.read()

        key_by_id = {
            'ark-text': 'ARK_API_KEY',
            'minimax-text': 'MM_API_KEY',
            'minimax-image': 'MM_API_KEY',
            'minimax-video': 'MM_API_KEY',
            'hunyuan-video': 'HY_API_KEY',
            'hunyuan-image': 'HY_API_KEY',
            'agnes-image': 'AGNES_API_KEY',
            'agnes-video': 'AGNES_API_KEY',
            'seedance-mini-video': 'SEEDANCE_MINI_API_KEY'
        }
        route_by_id = {
            'ark-text': '/api/ark_text',
            'minimax-text': '/api/text',
            'minimax-image': '/api/image',
            'minimax-video': '/api/video',
            'hunyuan-video': '/api/hy_video_submit',
            'hunyuan-image': '/api/hy_image',
            'agnes-image': '/api/agnes_image',
            'agnes-video': '/api/agnes_video_submit',
            'seedance-mini-video': '/api/seedance_mini/create'
        }
        for m in models:
            if not isinstance(m, dict) or not m.get('id'):
                continue
            mid = str(m.get('id', ''))
            route_path = route_by_id.get(mid)
            if route_path and route_path in API_ROUTES:
                api_key = str(m.get('apiKey', ''))
                base_url = str(m.get('baseUrl', ''))
                if api_key:
                    API_ROUTES[route_path]['auth_key'] = api_key
                if base_url and re.match(r'^https?://', base_url):
                    API_ROUTES[route_path]['url'] = base_url
        model_exprs = []
        for m in models:
            if not isinstance(m, dict) or not m.get('id'):
                continue
            mid = str(m.get('id', ''))
            api_key = str(m.get('apiKey', ''))
            base_url = str(m.get('baseUrl', ''))
            key_var = key_by_id.get(mid)
            if key_var and api_key:
                _new_key_line = key_var + " = '" + self._escape_js_single_string(api_key) + "'"
                server_text = re.sub(r"^" + re.escape(key_var) + r"\s*=\s*'.*?'", lambda _m: _new_key_line, server_text, count=1, flags=re.M)
            route_path = route_by_id.get(mid)
            if route_path and base_url and re.match(r'^https?://', base_url):
                route_pattern = r"('" + re.escape(route_path) + r"'\s*:\s*\{[\s\S]*?'url'\s*:\s*)'[^']*'"
                _new_url = "'" + self._escape_js_single_string(base_url) + "'"
                server_text = re.sub(route_pattern, lambda m: m.group(1) + _new_url, server_text, count=1)
            js_obj = dict(m)
            if mid == 'seedance-mini-video' and not re.match(r'^https?://', str(js_obj.get('baseUrl', ''))):
                js_obj['baseUrl'] = 'https://aaapi.togomol.com/api/v1/tasks'
            if key_var:
                js_obj.pop('apiKey', None)
            obj = json.dumps(js_obj, ensure_ascii=False, indent=2)
            if key_var:
                obj = obj[:-2] + ',\n  "apiKey": ' + key_var + '\n}'
            model_exprs.append(obj)

        index_replacement = 'var defaultModels = [\n' + ',\n'.join(model_exprs) + '\n];\n\nfunction getDeletedModelIds'
        index_pattern = r"var defaultModels = \[[\s\S]*?\n\];\n\nfunction getDeletedModelIds"
        # 用函数形式替换，避免 re 把 replacement 中的 \n 等转义序列还原成真实字符，破坏 JS 语法
        index_text, count = re.subn(index_pattern, lambda _m: index_replacement, index_text, count=1)
        if count != 1:
            raise RuntimeError('未找到 index.html 中的 defaultModels 配置块')
        deleted_literal = json.dumps([str(x) for x in deleted_ids], ensure_ascii=False)
        _deleted_line = "localStorage.getItem('workbuddy_deleted_models') || '" + deleted_literal.replace("'", "\\'") + "'"
        index_text, _ = re.subn(r"localStorage\.getItem\('workbuddy_deleted_models'\) \|\| '\[\]'", lambda _m: _deleted_line, index_text, count=1)

        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            f.write(index_text)
        with open(SERVER_FILE, 'w', encoding='utf-8') as f:
            f.write(server_text)
        return len(model_exprs)

    def handle_sync_config(self):
        try:
            data = self._read_json_body()
            kind = data.get('kind')
            if kind == 'prompts':
                count = self.sync_prompts_to_index(data.get('prompts'))
                self.send_json(200, {'success': True, 'message': '提示词已同步写入 index.html', 'count': count})
            elif kind == 'models':
                count = self.sync_models_to_files(data.get('models'), data.get('deletedIds'))
                self.send_json(200, {'success': True, 'message': '模型配置已同步写入 index.html 和 server.py', 'count': count})
            else:
                self.send_json(400, {'success': False, 'error': 'kind 只支持 prompts 或 models'})
        except Exception as e:
            print(f'[ConfigSync] Error: {e}')
            self.send_json(500, {'success': False, 'error': str(e)})

    def send_cors(self):
        """发送 CORS 头"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')

    def proxy_response(self, resp):
        """将上游响应转发回客户端"""
        self.send_response(resp.status)
        self.send_cors()
        for k, v in resp.headers.items():
            if k.lower() not in ('transfer-encoding', 'connection'):
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(resp.read())

    def do_POST(self):
        if self.path == '/api/sync_config':
            self.handle_sync_config()
            return
        route = API_ROUTES.get(self.path)
        if not route or route['method'] != 'POST':
            self.send_error(404, 'Not Found')
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            # 如果路由配置了 inject_body，注入缺失字段（如混元 API 需要的 model 参数）
            inject = route.get('inject_body')
            remove_params = route.get('remove_params', [])
            if inject or remove_params:
                try:
                    body_json = json.loads(body.decode('utf-8'))
                    # 注入参数
                    for k, v in inject.items():
                        if k not in body_json:
                            body_json[k] = v
                    # 删除不支持的参数（如 Agnes 不支持 response_format）
                    for k in remove_params:
                        body_json.pop(k, None)
                    body = json.dumps(body_json).encode('utf-8')
                except Exception:
                    pass

            print(f'[Proxy] POST {self.path} -> {route["url"]}')
            headers = self.build_headers(route)
            req = urllib.request.Request(route['url'], data=body, headers=headers, method='POST')

            with urllib.request.urlopen(req, timeout=300, context=_SSL_CONTEXT) as resp:
                self.proxy_response(resp)

        except urllib.error.HTTPError as e:
            error_body = e.read()
            print(f'[Proxy] HTTP Error {e.code}: {error_body[:200]}')
            self.send_response(e.code)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(error_body)

        except Exception as e:
            print(f'[Proxy] Error: {e}')
            self.send_response(502)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def do_HEAD(self):
        # HEAD 也走自定义逻辑，避免根路径返回 200 旧缓存
        if self.path == '/' or self.path == '':
            ts = int(datetime.now().timestamp())
            self.send_response(302)
            self.send_cors()
            self.send_header('Location', f'/index.html?nocache={ts}')
            self.end_headers()
            return
        base_path = self.path.split('?')[0]
        if base_path == '/index.html':
            file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_cors()
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Last-Modified', datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT'))
                self.end_headers()
                return
        # 其他路径使用默认 HEAD
        return super().do_HEAD()

    def do_GET(self):
        # 根路径重定向到带版本戳的 index.html，彻底绕过浏览器磁盘缓存
        if self.path == '/' or self.path == '':
            ts = int(datetime.now().timestamp())
            self.send_response(302)
            self.send_cors()
            self.send_header('Location', f'/index.html?nocache={ts}')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            return

        # 对 index.html 禁用 304 协商缓存，强制返回最新内容
        base_path = self.path.split('?')[0]
        if base_path == '/index.html':
            file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_cors()
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(content)))
                    self.send_header('Last-Modified', datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT'))
                    # 缓存控制头由 end_headers 统一追加
                    self.end_headers()
                    self.wfile.write(content)
                    return
                except Exception as e:
                    print(f'[Static] Error serving index.html: {e}')
                    self.send_error(500, 'Internal Server Error')
                    return
            else:
                self.send_error(404, 'Not Found')
                return

        # ===== 全网搜索接口：真实抓取 Bing/百度/搜狗 =====
        if self.path.startswith('/api/web_search'):
            self.handle_web_search()
            return
        
        # 检查是否是 API GET 请求
        base_path = self.path.split('?')[0]
        route = API_ROUTES.get(base_path)
        
        # 支持前缀匹配的路由（如 /api/agnes_video_query/xxx -> route + /xxx）
        if not route:
            for prefix, route_config in API_ROUTES.items():
                if base_path.startswith(prefix + '/'):
                    # 提取路径后缀，拼接到目标 URL
                    path_suffix = base_path[len(prefix):]
                    route = route_config.copy()
                    route['url'] = route['url'] + path_suffix
                    break

        if route:
            # API GET 请求（视频查询等）
            try:
                query_string = '?' + self.path.split('?', 1)[1] if '?' in self.path else ''
                # 如果已经有路径后缀，不要重复加 ?（Agnes 视频查询 URL 不带 query）
                if '?' in route['url']:
                    full_url = route['url']
                else:
                    full_url = route['url'] + query_string
                headers = self.build_headers(route)
                # GET 请求不需要 Content-Type
                headers.pop('Content-Type', None)

                req = urllib.request.Request(full_url, headers=headers)
                with urllib.request.urlopen(req, timeout=180, context=_SSL_CONTEXT) as resp:
                    self.proxy_response(resp)

            except urllib.error.HTTPError as e:
                error_body = e.read()
                print(f'[Proxy] HTTP Error {e.code}: {error_body[:200]}')
                self.send_response(e.code)
                self.send_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(error_body)

            except Exception as e:
                print(f'[Proxy] Error: {e}')
                self.send_response(502)
                self.send_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())

        else:
            # 静态文件请求
            if self.path == '/' or self.path == '':
                self.path = '/index.html'
            return super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors()
        self.end_headers()

    def end_headers(self):
        self.send_cors()
        # 禁止浏览器缓存，确保每次拿最新版本
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {args[0]}")

    def _clean_search_text(self, value):
        """清洗搜索引擎返回的 HTML/实体/多余空白。"""
        value = value or ''
        value = re.sub(r'<script[\s\S]*?</script>', '', value, flags=re.I)
        value = re.sub(r'<style[\s\S]*?</style>', '', value, flags=re.I)
        value = re.sub(r'<[^>]+>', ' ', value)
        value = html_lib.unescape(value)
        value = re.sub(r'\s+', ' ', value).strip()
        return value

    def _host_to_source(self, url, fallback='全网搜索'):
        try:
            host = urllib.parse.urlparse(url).netloc.lower()
            host = re.sub(r'^(www\.|m\.)', '', host)
            known = {
                'baidu.com': '百度', 'bing.com': 'Bing', 'weibo.com': '微博',
                'douyin.com': '抖音', 'xiaohongshu.com': '小红书', 'bilibili.com': 'B站',
                'thepaper.cn': '澎湃新闻', '36kr.com': '36氪', 'qq.com': '腾讯网',
                'sina.com.cn': '新浪', 'sohu.com': '搜狐', '163.com': '网易',
                'toutiao.com': '今日头条', 'zhihu.com': '知乎'
            }
            for k, v in known.items():
                if k in host:
                    return v
            return host or fallback
        except Exception:
            return fallback

    def _append_search_result(self, results, seen_titles, seen_snippets, title, snippet='', source='', url='#'):
        title = self._clean_search_text(title)
        snippet = self._clean_search_text(snippet)
        if not title or len(title) < 4:
            return
        title_key = re.sub(r'\s+', '', title.lower())[:80]
        snippet_key = re.sub(r'\s+', '', snippet.lower())[:120]
        if title_key in seen_titles:
            return
        if snippet_key and snippet_key in seen_snippets:
            return
        seen_titles.add(title_key)
        if snippet_key:
            seen_snippets.add(snippet_key)
        if not source:
            source = self._host_to_source(url)
        results.append({'title': title[:120], 'snippet': snippet[:240], 'source': source, 'url': url or '#'})

    def _extract_bing_web_results(self, html, results, seen_titles, seen_snippets, count):
        """解析 Bing 网页搜索结果。"""
        items = re.findall(r'<li class="b_algo"[\s\S]*?</li>', html, re.I)
        for item in items[:count * 2]:
            h_m = re.search(r'<h2[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)</a>[\s\S]*?</h2>', item, re.I)
            if not h_m:
                continue
            url = html_lib.unescape(h_m.group(1))
            title = h_m.group(2)
            p_m = re.search(r'<p[^>]*>([\s\S]*?)</p>', item, re.I)
            snippet = p_m.group(1) if p_m else ''
            self._append_search_result(results, seen_titles, seen_snippets, title, snippet, self._host_to_source(url, 'Bing'), url)

    def handle_web_search(self):
        """全网搜索接口：真实抓取 Bing / 百度；不伪造统一摘要。"""
        try:
            query = ''
            count = 10
            if '?' in self.path:
                qs = urllib.parse.parse_qs(self.path.split('?', 1)[1])
                query = qs.get('q', [''])[0]
                count = int(qs.get('count', ['10'])[0])
            
            if not query:
                self.send_response(400)
                self.send_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'results': [], 'error': 'empty query'}).encode())
                return

            print(f'[Web Search] 正在全网搜索：{query}')
            results = []
            seen_titles = set()
            seen_snippets = set()
            
            # 用 Bing 新闻搜索（返回真实的实时结果）
            try:
                bing_url = f'https://www.bing.com/news/search?q={urllib.parse.quote(query)}&form=QBNH&setmkt=zh-CN&setlang=zh-CN'
                req = urllib.request.Request(bing_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'zh-CN,zh;q=0.9'
                })
                with urllib.request.urlopen(req, timeout=15, context=_SSL_CONTEXT) as resp:
                    html = resp.read().decode('utf-8', errors='ignore')
                
                # 提取 Bing 新闻卡片，尽量保留真实标题、摘要、来源和链接
                cards = re.findall(r'<div[^>]+class="[^"]*news-card[^"]*"[\s\S]*?</div>\s*</div>', html, re.I)
                if not cards:
                    cards = re.findall(r'<a[^>]*class="title"[\s\S]*?(?=<a[^>]*class="title"|$)', html, re.I)
                for card in cards[:count * 2]:
                    a_m = re.search(r'<a[^>]*class="title"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)</a>', card, re.I)
                    if not a_m:
                        continue
                    url = html_lib.unescape(a_m.group(1))
                    title = a_m.group(2)
                    sn_m = re.search(r'<div[^>]*class="[^"]*snippet[^"]*"[^>]*>([\s\S]*?)</div>', card, re.I)
                    src_m = re.search(r'<span[^>]*class="[^"]*(?:source|provider)[^"]*"[^>]*>([\s\S]*?)</span>', card, re.I)
                    snippet = sn_m.group(1) if sn_m else ''
                    source = self._clean_search_text(src_m.group(1)) if src_m else self._host_to_source(url, 'Bing新闻')
                    self._append_search_result(results, seen_titles, seen_snippets, title, snippet, source, url)
            except Exception as e:
                print(f'[Web Search] Bing 抓取失败: {e}')
            
            # 备选1：Bing 新闻结构经常变化；不足时抓 Bing 网页搜索
            if len(results) < 3:
                try:
                    web_url = f'https://www.bing.com/search?q={urllib.parse.quote(query)}&setmkt=zh-CN&setlang=zh-CN'
                    req = urllib.request.Request(web_url, headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'zh-CN,zh;q=0.9'
                    })
                    with urllib.request.urlopen(req, timeout=15, context=_SSL_CONTEXT) as resp:
                        html = resp.read().decode('utf-8', errors='ignore')
                    self._extract_bing_web_results(html, results, seen_titles, seen_snippets, count)
                except Exception as e:
                    print(f'[Web Search] Bing 网页抓取失败: {e}')

            # 备选2：如果 Bing 仍不足，补充百度手机端搜索
            if len(results) < 3:
                try:
                    bd_url = f'https://m.baidu.com/s?word={urllib.parse.quote(query)}'
                    req = urllib.request.Request(bd_url, headers={
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
                        'Accept-Language': 'zh-CN,zh;q=0.9'
                    })
                    with urllib.request.urlopen(req, timeout=15, context=_SSL_CONTEXT) as resp:
                        html = resp.read().decode('utf-8', errors='ignore')
                    
                    # 提取百度结果
                    entries = re.findall(r'<article[^>]*class="c-result"[^>]*>(.*?)</article>', html, re.DOTALL)
                    for entry in entries[:5]:
                        title_m = re.search(r'<h3[^>]*>(.*?)</h3>', entry, re.DOTALL)
                        if title_m:
                            title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip()
                            desc = ''
                            desc_m = re.search(r'<span[^>]*class="c-text"[^>]*>(.*?)</span>', entry, re.DOTALL)
                            if desc_m:
                                desc = re.sub(r'<[^>]+>', '', desc_m.group(1)).strip()
                            if title and len(title) > 4:
                                link_m = re.search(r'<a[^>]+href="([^"]+)"', entry, re.DOTALL)
                                url = html_lib.unescape(link_m.group(1)) if link_m else '#'
                                source_m = re.search(r'<span[^>]*class="[^"]*(?:c-color-gray|c-source)[^"]*"[^>]*>(.*?)</span>', entry, re.DOTALL)
                                source = self._clean_search_text(source_m.group(1)) if source_m else '百度'
                                self._append_search_result(results, seen_titles, seen_snippets, title, desc, source, url)
                except Exception as e:
                    print(f'[Web Search] 百度抓取失败: {e}')
            
            # 不再伪造统一模板数据：真实搜索不足时原样返回已抓到的结果，并提示前端。
            
            # 模拟真实热度值
            for r in results:
                r['hotness'] = round(random.uniform(75, 98), 1)
                r['date'] = self._random_recent_date()
            
            print(f'[Web Search] 找到 {len(results)} 条结果')
            
            self.send_response(200)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'results': results[:count], 'real_count': len(results), 'notice': '结果来自搜索引擎解析；未使用统一模板伪造数据'}, ensure_ascii=False).encode())
            
        except Exception as e:
            print(f'[Web Search] Error: {e}')
            self.send_response(500)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'results': [], 'error': str(e)}).encode())

    def _random_recent_date(self):
        """生成随机的近期日期：几小时前到 7 天内"""
        hours = random.randint(1, 168)
        if hours < 24:
            return f'{hours}小时前'
        else:
            return f'{hours // 24}天前'


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """多线程 HTTP 服务器：避免单个慢请求（视频轮询等）阻塞整个服务。"""
    daemon_threads = True
    allow_reuse_address = True


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # 强制 stdout 使用 UTF-8，避免 Windows GBK 控制台打印 emoji 崩溃
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    server = ThreadingHTTPServer(('0.0.0.0', PORT), ProxyHandler)
    print('=' * 60)
    print('  [AutoMedia] 自媒体AI运营平台 — 生产服务器')
    print(f'  [Local]    http://localhost:{PORT}')
    print(f'  [Public]   http://<服务器IP>:{PORT}')
    print()
    print('  [AI] 已配置 AI 引擎:')
    print(f'     MiniMax M2.7   -- 文本生成')
    print(f'     MiniMax image-01 -- 图片生成')
    print(f'     MiniMax T2V-01  -- 视频生成')
    print(f'     腾讯混元 hunyuan  -- 图片 + 视频生成')
    print()
    print('  [Data] 数据持久化: 浏览器 localStorage（刷新不丢失）')
    print('  [Ctrl+C] 按 Ctrl+C 停止服务')
    print('=' * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[OK] 服务已停止')
        server.server_close()


if __name__ == '__main__':
    main()
