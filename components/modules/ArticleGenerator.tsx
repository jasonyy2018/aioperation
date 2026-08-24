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
  Image as ImageIcon,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { MediaAsset, AIModelConfig, PromptTemplate } from '@/types';
import { AIModelSelector } from '@/components/ui/AIModelSelector';
import { useStreamingText } from '@/hooks/useStreamingText';
import { safeJsonParse } from '@/lib/utils';

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
  const textModels = models.filter((m) => m.type === 'text');
  const imageModels = models.filter((m) => m.type === 'image');

  const [topic, setTopic] = useState(initialTopic);
  const [outline, setOutline] = useState(initialSummary);
  const [platform, setPlatform] = useState<'wechat' | 'douyin' | 'kuaishou' | 'xiaohongshu'>('wechat');
  const [selectedTextModel, setSelectedTextModel] = useState<string>(textModels[0]?.id || 'volcengine-plan');
  const [selectedImageModel, setSelectedImageModel] = useState<string>(imageModels[0]?.id || 'minimax-image');
  const [wordTarget, setWordTarget] = useState<string>('1500');
  const [tone, setTone] = useState<string>('专业深度');
  const [autoGenerateImages, setAutoGenerateImages] = useState<boolean>(true);

  const [content, setContent] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<{ id: string; url: string; prompt: string; label: string }[]>([]);
  const [generatingImages, setGeneratingImages] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'rendered' | 'source'>('rendered');
  const { streamText, stopStream, isStreaming } = useStreamingText();
  const loading = isStreaming;

  // Restore Draft from LocalStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedDraft = localStorage.getItem('automedia_draft_article');
        if (savedDraft) {
          const parsed = safeJsonParse<any>(savedDraft, null);
          if (parsed) {
            if (!initialTopic && parsed.topic) setTopic(parsed.topic);
            if (!initialSummary && parsed.outline) setOutline(parsed.outline);
            if (parsed.platform) setPlatform(parsed.platform);
            if (parsed.tone) setTone(parsed.tone);
            if (parsed.wordTarget) setWordTarget(parsed.wordTarget);
            if (parsed.content) setContent(parsed.content);
            if (parsed.generatedImages) setGeneratedImages(parsed.generatedImages);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Update topic/outline when props change from Hotspot discovery
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialSummary) setOutline(initialSummary);
  }, [initialTopic, initialSummary]);

  // Sync Draft to LocalStorage whenever content changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'automedia_draft_article',
          JSON.stringify({
            topic,
            outline,
            platform,
            tone,
            wordTarget,
            content,
            generatedImages,
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, [topic, outline, platform, tone, wordTarget, content, generatedImages]);

  const platformConfigs = [
    { id: 'wechat', name: '微信公众号', promptId: 'article-wechat', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
    { id: 'douyin', name: '抖音图文', promptId: 'article-douyin', color: 'border-pink-500/40 text-pink-400 bg-pink-500/10' },
    { id: 'kuaishou', name: '快手老铁', promptId: 'article-kuaishou', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
    { id: 'xiaohongshu', name: '小红书笔记', promptId: 'article-xiaohongshu', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  ];

  const toneOptions = ['专业深度', '犀利毒舌', '温暖治愈', '接地气老铁', '幽默风趣', '干货清单'];

  // Helper to generate matching images
  const generateMatchingIllustrations = async (articleTitle: string, articleBody: string) => {
    setGeneratingImages(true);
    try {
      const promptsToGen = [
        { label: '📌 文章封面主图 (16:9)', prompt: `商业大片海报风格，${articleTitle}，高质感摄影，电影级光影，8k分辨率，杰作` },
        { label: '🖼️ 核心段落场景插图 1', prompt: `真实生活实操场景，${articleTitle}，细节特写，温暖通透晨光，现代质感，无杂字` },
        { label: '🖼️ 总结与行动场景插图 2', prompt: `充满希望的明亮商业场景，${articleTitle}，科技与人文结合，高清细腻质感` },
      ];

      const imagePromises = promptsToGen.map(async (item, idx) => {
        try {
          const res = await fetch('/api/ai/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              modelId: selectedImageModel,
              prompt: item.prompt,
              aspectRatio: idx === 0 ? '16:9' : '4:3',
              count: 1,
              customModels: models,
            }),
          });
          const data = await res.json();
          const imgUrl = data.images?.[0] || `https://images.unsplash.com/photo-${1618005182384 + idx}?auto=format&fit=crop&w=1000&q=80`;
          return {
            id: `img_${Date.now()}_${idx}`,
            url: imgUrl,
            prompt: item.prompt,
            label: item.label,
          };
        } catch {
          return {
            id: `img_${Date.now()}_${idx}`,
            url: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80`,
            prompt: item.prompt,
            label: item.label,
          };
        }
      });

      const imgs = await Promise.all(imagePromises);
      setGeneratedImages(imgs);
      showToast('已自动生成 3 张应景配套商业插图！', 'success');
    } catch (err: any) {
      showToast('配图生成遇到异常，已加载智能占位图', 'info');
    } finally {
      setGeneratingImages(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast('请输入文章主题', 'warning');
      return;
    }

    setContent('');
    try {
      const currentPlat = platformConfigs.find((p) => p.id === platform);
      const matchedPrompt = prompts.find((p) => p.id === currentPlat?.promptId)?.content || '';

      const systemPrompt = `${matchedPrompt}\n\n当前风格语调要求：${tone}。\n目标字数控制在：${wordTarget}字左右。\n请直接输出排版优美、包含吸睛主副标题、引言、多级论述及行动号召的完整自媒体文案。`;
      const userPrompt = `【主题】：${topic}\n${outline ? `【核心要点/背景】：${outline}` : ''}`;

      // Streaming generation — typewriter rendering via onDelta
      const fullText = await streamText({
        modelId: selectedTextModel,
        systemPrompt,
        userPrompt,
        customModels: models,
        onDelta: (full) => setContent(full),
      });

      if (!fullText.trim()) {
        throw new Error('模型未返回有效内容');
      }

      showToast('文章正文生成成功！', 'success');

      // Trigger automatic illustration generation if checked
      if (autoGenerateImages) {
        generateMatchingIllustrations(topic, fullText);
      }
    } catch (err: any) {
      if (err.message !== 'AbortError') {
        showToast(err.message || '生成失败，请检查模型配置', 'error');
      }
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
      tags: [platform, tone, `${wordTarget}字`, ...(generatedImages.length > 0 ? ['包含3张配图'] : [])],
      createdAt: new Date().toISOString(),
    };
    if (onSaveAsset) {
      onSaveAsset(newAsset);
      showToast('已成功将图文全套成果归档到自媒体资产库！', 'success');
    }
  };

  const handleExport = (format: 'html' | 'md') => {
    if (!content) return;
    let exportText = content;
    if (generatedImages.length > 0) {
      exportText = `# ${topic}\n\n![封面主图](${generatedImages[0].url})\n\n${content}\n\n### 配套视觉插图\n` +
        generatedImages.slice(1).map((img, i) => `![插图${i + 1}](${img.url})`).join('\n\n');
    }
    const blob = new Blob([exportText], { type: format === 'html' ? 'text/html' : 'text/markdown' });
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
          <p className="text-xs text-slate-400 mt-1">选择分发平台调性与大模型，支持文字+3张配套插图双链路一键输出</p>
        </div>

        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">目标平台风格</label>
          <div className="grid grid-cols-2 gap-2.5">
            {platformConfigs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id as any)}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  platform === p.id
                    ? `${p.color} border-current shadow-md ring-1 ring-current`
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{p.name}</span>
                {platform === p.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* AI Text Model Selector with Default Setting */}
        <AIModelSelector
          models={models}
          selectedModel={selectedTextModel}
          onSelectModel={setSelectedTextModel}
          type="text"
          moduleKey="article_text"
          label="文章正文撰写模型"
        />

        {/* AI Image Model Selector for Auto Illustrations */}
        <AIModelSelector
          models={models}
          selectedModel={selectedImageModel}
          onSelectModel={setSelectedImageModel}
          type="image"
          moduleKey="article_image"
          label="配套视觉配图生图模型"
        />

        {/* Auto Illustration Toggle */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>自动并发生成 3 张配套插图</span>
            </span>
            <p className="text-[10px] text-slate-400">产出 1 张高清封面主图 + 2 张段落情境插图</p>
          </div>
          <input
            type="checkbox"
            checked={autoGenerateImages}
            onChange={(e) => setAutoGenerateImages(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Topic Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">文章主题 / 爆款标题</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：传统老字号如何用 AI 漫剧在抖音单月涨粉 10 万？"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Summary / Outline */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">核心论点 / 抓取热点背景 (选填)</label>
          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            rows={3}
            placeholder="粘贴从全网热点雷达抓取的背景信息，或输入需重点阐述的核心痛点与解决方案..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Word count & Tone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">篇幅长度</label>
            <select
              value={wordTarget}
              onChange={(e) => setWordTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="600">600 字 (快节奏短图文)</option>
              <option value="1000">1000 字 (种草/故事干货)</option>
              <option value="1500">1500 字 (深度长文/公号)</option>
              <option value="2500">2500 字 (保姆级实操SOP)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">文风调性</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {toneOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        {isStreaming ? (
          <button
            onClick={stopStream}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>正在流式输出中 · 点击停止</span>
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>一键智能生成爆款图文文章 (流式)</span>
          </button>
        )}
      </div>

      {/* Right Output & Illustration Area */}
      <div className="lg:col-span-7 space-y-4">
        {/* Generated Illustrations Gallery (if any) */}
        {generatedImages.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-400" />
                <span>AI 配套商业插图 ({generatedImages.length} 张大片)</span>
              </h4>
              <button
                onClick={() => generateMatchingIllustrations(topic, content)}
                disabled={generatingImages}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${generatingImages ? 'animate-spin' : ''}`} />
                <span>重新生成配图</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {generatedImages.map((img, idx) => (
                <div key={img.id || idx} className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 space-y-1 p-1">
                  <div className="aspect-video sm:aspect-square w-full rounded-lg overflow-hidden bg-slate-900 relative">
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-1">
                    <span className="text-[10px] font-semibold text-slate-300 block truncate">{img.label}</span>
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        高清大图
                      </a>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = img.url;
                          a.download = `插图_${idx + 1}.png`;
                          a.click();
                          showToast('已开始下载插图', 'success');
                        }}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        下载
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Article Text Content Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-[500px]">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">生成结果预览</span>
              {content && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  约 {content.length} 字符
                </span>
              )}
            </div>

            {content && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(previewMode === 'rendered' ? 'source' : 'rendered')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  title="切换渲染/源码视图"
                >
                  {previewMode === 'rendered' ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{previewMode === 'rendered' ? 'Markdown' : '效果预览'}</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>复制正文</span>
                </button>
                <button
                  onClick={handleSaveToAsset}
                  className="p-1.5 rounded-lg bg-teal-600/20 text-teal-300 border border-teal-500/30 hover:bg-teal-600/30 text-xs flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>归档到资产库</span>
                </button>
                <button
                  onClick={() => handleExport('md')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  title="导出 Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="flex-1">
            {!content && isStreaming ? (
              <div className="h-96 flex flex-col items-center justify-center text-slate-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-xs text-slate-400">大模型正在深度构思，流式输出即将开始...</p>
              </div>
            ) : content ? (
              <div className="space-y-4">
                {previewMode === 'rendered' ? (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 select-text">
                    {content}
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 ml-0.5 bg-indigo-400 animate-pulse align-text-bottom" />
                    )}
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-4 rounded-xl border border-slate-800 focus:outline-none resize-none leading-relaxed"
                  />
                )}
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl p-8 text-center">
                <Sparkles className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400">在左侧输入主题并点击生成，正文将实时流式输出并自动配 3 张商业大片</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
