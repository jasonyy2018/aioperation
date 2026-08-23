'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Download,
  FolderPlus,
  RefreshCw,
  Eye,
  Code,
  Check,
  Zap,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { MediaAsset, AIModelConfig, PromptTemplate } from '@/types';

interface ArticleGeneratorProps {
  initialTopic?: string;
  initialSummary?: string;
  onSaveAsset?: (asset: MediaAsset) => void;
  models: AIModelConfig[];
  prompts: PromptTemplate[];
}

export function ArticleGenerator({
  initialTopic = '',
  initialSummary = '',
  onSaveAsset,
  models,
  prompts,
}: ArticleGeneratorProps) {
  const { showToast } = useToast();
  const [topic, setTopic] = useState(initialTopic);
  const [outline, setOutline] = useState(initialSummary);
  const [platform, setPlatform] = useState<'wechat' | 'douyin' | 'kuaishou' | 'xiaohongshu'>('wechat');
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedModel, setSelectedModel] = useState<string>(textModels[0]?.id || 'ark-text');
  const [wordTarget, setWordTarget] = useState<string>('1500');
  const [tone, setTone] = useState<string>('专业深度');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'rendered' | 'source'>('rendered');

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialSummary) setOutline(initialSummary);
  }, [initialTopic, initialSummary]);

  useEffect(() => {
    if (textModels.length > 0 && !textModels.some((m) => m.id === selectedModel)) {
      setSelectedModel(textModels[0].id);
    }
  }, [models]);

  const platformConfigs = [
    { id: 'wechat', name: '微信公众号', promptId: 'article-wechat', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
    { id: 'douyin', name: '抖音图文', promptId: 'article-douyin', color: 'border-pink-500/40 text-pink-400 bg-pink-500/10' },
    { id: 'kuaishou', name: '快手老铁', promptId: 'article-kuaishou', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
    { id: 'xiaohongshu', name: '小红书笔记', promptId: 'article-xiaohongshu', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  ];

  const toneOptions = ['专业深度', '犀利毒舌', '温暖治愈', '接地气老铁', '幽默风趣', '干货清单'];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast('请输入文章主题', 'warning');
      return;
    }

    setLoading(true);
    try {
      const currentPlat = platformConfigs.find((p) => p.id === platform);
      const matchedPrompt = prompts.find((p) => p.id === currentPlat?.promptId)?.content || '';

      const systemPrompt = `${matchedPrompt}\n\n当前风格语调要求：${tone}。\n目标字数控制在：${wordTarget}字左右。\n请直接输出排版优美、包含吸睛主副标题、引言、多级论述及行动号召的完整自媒体文案。`;
      const userPrompt = `【主题】：${topic}\n${outline ? `【核心要点/背景】：${outline}` : ''}`;

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          systemPrompt,
          userPrompt,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '生成失败');
      }

      setContent(data.text);
      showToast('文章生成成功！', 'success');
    } catch (err: any) {
      showToast(err.message || '生成失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    showToast('已复制到剪贴板', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToAsset = () => {
    if (!content) {
      showToast('请先生成内容', 'warning');
      return;
    }
    const newAsset: MediaAsset = {
      id: Math.random().toString(36).substring(2, 9),
      title: topic || '自媒体图文文章',
      type: 'article',
      content,
      platform,
      tags: [platform, tone, `${wordTarget}字`],
      createdAt: new Date().toISOString(),
    };
    if (onSaveAsset) {
      onSaveAsset(newAsset);
      showToast('已成功归档到自媒体资产库！', 'success');
    }
  };

  const handleExport = (format: 'html' | 'md') => {
    if (!content) return;
    const blob = new Blob([content], { type: format === 'html' ? 'text/html' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic || '自媒体图文'}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`已导出为 .${format} 文件`, 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Settings Panel */}
      <div className="lg:col-span-5 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            图文生成参数配置
          </h3>
          <p className="text-xs text-slate-400 mt-1">选择分发平台调性与大模型，一键输出爆款排版文案</p>
        </div>

        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">目标平台风格</label>
          <div className="grid grid-cols-2 gap-2.5">
            {platformConfigs.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id as any)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  platform === p.id
                    ? `${p.color} ring-1 ring-offset-1 ring-offset-slate-900 ring-indigo-500/50`
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">文章主题 / 爆款标题</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：2026年普通人做AI自媒体变现的3个破局点"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Outline / Context */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">核心论点 / 补充素材（选填）</label>
          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            placeholder="输入要包含的要点、案例或背景信息..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed"
          />
        </div>

        {/* Model, Word Count, Tone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">驱动大模型</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {models
                .filter((m) => m.type === 'text')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">目标字数</label>
            <select
              value={wordTarget}
              onChange={(e) => setWordTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="800">800 字 (精炼快读)</option>
              <option value="1500">1500 字 (标准长文)</option>
              <option value="2500">2500 字 (万字深度)</option>
              <option value="3500">3500+ 字 (行业研报)</option>
            </select>
          </div>
        </div>

        {/* Tone Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">语言风格</label>
          <div className="flex flex-wrap gap-1.5">
            {toneOptions.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  tone === t
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          <span>{loading ? 'AI 正在深度撰写中...' : '立即开始全篇生成'}</span>
        </button>
      </div>

      {/* Right Result Preview Panel */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">生成结果预览</span>
            {content && (
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                共 {content.length} 字符
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setPreviewMode('rendered')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  previewMode === 'rendered'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>排版</span>
              </button>
              <button
                onClick={() => setPreviewMode('source')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  previewMode === 'source'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>源码</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              disabled={!content}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 disabled:opacity-40 transition-colors"
              title="复制"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制'}</span>
            </button>

            <button
              onClick={() => handleExport('md')}
              disabled={!content}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 disabled:opacity-40 transition-colors"
              title="导出 Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.MD</span>
            </button>

            <button
              onClick={handleSaveToAsset}
              disabled={!content}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm disabled:opacity-40 transition-colors"
              title="存入资产库"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>存资产库</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto bg-slate-950/60 rounded-xl p-5 border border-slate-800/80">
          {!content && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 py-20">
              <Sparkles className="w-10 h-10 opacity-30 text-indigo-400" />
              <p className="text-xs">在左侧设置主题并点击“立即开始全篇生成”，文案将实时在此呈现</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-indigo-400 space-y-3 py-20">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs text-slate-400">大模型正在推演大纲与段落细节，请稍候...</p>
            </div>
          )}

          {content && !loading && previewMode === 'rendered' && (
            <div
              className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4 article-preview"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {content && !loading && previewMode === 'source' && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[450px] bg-transparent font-mono text-xs text-slate-300 resize-none focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
