'use client';

import React, { useState, useEffect } from 'react';
import { Search, Flame, RefreshCw, ExternalLink, Sparkles, FileText, Video, TrendingUp } from 'lucide-react';
import { HotspotItem } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';

interface HotspotDiscoveryProps {
  onQuickGenerateArticle: (title: string, summary: string) => void;
  onQuickGenerateVideo: (title: string, summary: string) => void;
}

const DEFAULT_HOTSPOTS: HotspotItem[] = [
  {
    title: 'DeepSeek R1 与开源大模型商业化落地新机遇',
    summary: '随着国产开源推理模型性能突飞猛进，各行业自媒体博主与开发者正加速将其应用于自动化内容矩阵构建与私域转化。',
    cat: 'ai',
    hotness: 98.4,
    source: '36氪',
    url: 'https://36kr.com',
    date: '2小时前',
  },
  {
    title: '短视频前3秒黄金Hook话术升级：情绪价值与认知差设计',
    summary: '2026年短视频算法进一步惩罚平铺直叙，创作者开始使用强反差冲突与场景沉浸式台词作为前置钩子。',
    cat: 'short-video',
    hotness: 95.1,
    source: '今日头条',
    url: 'https://toutiao.com',
    date: '4小时前',
  },
  {
    title: '小红书种草笔记爆款公式：搜索流量与双列点击率模型拆解',
    summary: '小红书最新搜索推荐机制倾斜实用干货与真实测评，封皮首图色系对比与痛点提炼成为主导指标。',
    cat: 'platform',
    hotness: 92.8,
    source: '小红书',
    url: 'https://xiaohongshu.com',
    date: '6小时前',
  },
  {
    title: 'AI数字人与短剧自动化剪辑生产流变现实操',
    summary: '单人创作者通过大模型分镜策划 + 图片/视频扩散模型 + 语音克隆实现单日输出10条高质量短剧。',
    cat: 'monetize',
    hotness: 91.5,
    source: '微信公众号',
    url: 'https://mp.weixin.qq.com',
    date: '8小时前',
  },
  {
    title: '微信视频号中老年情感与知识类目流量红利分析',
    summary: '视频号社交裂变机制让私域强关联博主获得更高完播率与带货转化率，信任感叙事成关键。',
    cat: 'content',
    hotness: 89.2,
    source: '澎湃新闻',
    url: 'https://thepaper.cn',
    date: '12小时前',
  },
];

export function HotspotDiscovery({ onQuickGenerateArticle, onQuickGenerateVideo }: HotspotDiscoveryProps) {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [hotspots, setHotspots] = useState<HotspotItem[]>(DEFAULT_HOTSPOTS);

  const categories = [
    { id: 'all', label: '全部热点' },
    { id: 'ai', label: 'AI科技' },
    { id: 'content', label: '内容创作' },
    { id: 'short-video', label: '短视频' },
    { id: 'platform', label: '平台动态' },
    { id: 'trend', label: '爆款趋势' },
    { id: 'monetize', label: '商业变现' },
  ];

  const handleSearch = async (searchTerm?: string) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) {
      showToast('请输入要搜索的热点关键词', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/web_search?q=${encodeURIComponent(q)}&count=12`);
      const data = await res.json();
      if (res.ok && data.results && data.results.length > 0) {
        setHotspots(data.results);
        showToast(`已实时获取 ${data.results.length} 条热点资讯`, 'success');
      } else {
        showToast('未找到相关热点，已保留默认热门推荐', 'info');
      }
    } catch (err: any) {
      showToast(err.message || '搜索失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredHotspots = hotspots.filter((item) => {
    if (category === 'all') return true;
    return item.cat === category || category === 'trend';
  });

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="全网实时热点搜索（如：AI自媒体、抖音爆款、小红书流量、短剧）..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            <span>{loading ? '正在全网抓取...' : '实时雷达搜索'}</span>
          </button>
          <button
            onClick={() => {
              setQuery('自媒体爆款');
              handleSearch('自媒体爆款');
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-colors"
          >
            换一批
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              category === c.id
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Hotspots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHotspots.map((item, idx) => (
          <div
            key={idx}
            className="group bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>热度 {item.hotness}</span>
                  </Badge>
                  <span className="text-[11px] text-slate-500">{item.source}</span>
                </div>
                {item.date && <span className="text-[11px] text-slate-500">{item.date}</span>}
              </div>

              <h3 className="font-semibold text-slate-100 text-sm line-clamp-2 mb-2 group-hover:text-orange-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                {item.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => onQuickGenerateArticle(item.title, item.summary)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 hover:text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors"
                  title="以此热点一键生成图文文案"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>生成图文</span>
                </button>
                <button
                  onClick={() => onQuickGenerateVideo(item.title, item.summary)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 hover:text-pink-300 text-xs font-medium border border-pink-500/30 transition-colors"
                  title="以此热点一键生成分镜短视频脚本"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>生成脚本</span>
                </button>
              </div>

              {item.url && item.url !== '#' && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  title="查看原文章"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
