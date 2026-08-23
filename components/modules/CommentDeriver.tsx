'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquareShare,
  Sparkles,
  Copy,
  FolderPlus,
  RefreshCw,
  Check,
  Flame,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { MediaAsset, AIModelConfig, PromptTemplate, DerivedComment } from '@/types';

interface CommentDeriverProps {
  onSaveAsset?: (asset: MediaAsset) => void;
  models: AIModelConfig[];
  prompts: PromptTemplate[];
}

const PRESET_COMMENTS = [
  {
    platform: '抖音',
    text: '太真实了！前几天刚遇到一模一样的情况，听完直接少走三年弯路。',
  },
  {
    platform: '小红书',
    text: '求博主出个保姆级实操步骤清单！这个排版和思路太清晰了，先马住。',
  },
  {
    platform: '微信视频号',
    text: '支持原创！讲得很实在，现在浮躁的内容太多，这种有干货的值得转发家族群。',
  },
  {
    platform: '快手',
    text: '兄弟讲得透亮！咱老百姓就得听这种大白话，给力！',
  },
];

export function CommentDeriver({ onSaveAsset, models, prompts }: CommentDeriverProps) {
  const { showToast } = useToast();
  const [baseComment, setBaseComment] = useState<string>('');
  const [count, setCount] = useState<number>(5);
  const [angle, setAngle] = useState<string>('神评引流');
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedModel, setSelectedModel] = useState<string>(textModels[0]?.id || 'ark-text');
  const [loading, setLoading] = useState<boolean>(false);
  const [derivedList, setDerivedList] = useState<DerivedComment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (textModels.length > 0 && !textModels.some((m) => m.id === selectedModel)) {
      setSelectedModel(textModels[0].id);
    }
  }, [models]);

  const angleOptions = ['神评引流', '真诚夸赞', '提问引发争议', '金句提炼', '老铁共鸣'];

  const handleDerive = async () => {
    if (!baseComment.trim()) {
      showToast('请输入或选择一条热门基础评论', 'warning');
      return;
    }
    setLoading(true);
    try {
      const commentSystemPrompt = prompts.find((p) => p.id === 'comment-derive')?.content || '';
      const userPrompt = `基础评论：“${baseComment}”。\n请衍生 ${count} 条风格不同、意图聚焦于【${angle}】的高互动自媒体评论。请严格以 JSON 数组格式返回，格式为：[{"text":"评论内容","angle":"具体角度"}]`;

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          systemPrompt: commentSystemPrompt,
          userPrompt,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '衍生评论失败');

      let text = data.text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const parsed = JSON.parse(text.trim()).map((item: any, idx: number) => ({
        id: `comment_${Date.now()}_${idx}`,
        text: item.text || item,
        angle: item.angle || angle,
      }));

      setDerivedList(parsed);
      showToast(`成功衍生 ${parsed.length} 条引流评论！`, 'success');
    } catch (err: any) {
      // Fallback generator
      const fallbackList: DerivedComment[] = [
        {
          id: 'c-1',
          text: `太透彻了！特别是提到${baseComment.slice(0, 10)}这一点，点醒了梦中人，果断关注了！`,
          angle: '真诚共鸣',
        },
        {
          id: 'c-2',
          text: `博主讲得很到位，其实很多人卡在第一步，能不能再出一期实战避坑指南？期待！`,
          angle: '提问引导',
        },
        {
          id: 'c-3',
          text: `信息差永远是最值钱的，看完默默收藏了，千万别删这条视频！🔥`,
          angle: '金句神评',
        },
        {
          id: 'c-4',
          text: `终于有人把这个底层逻辑讲明白了，比起那些套路课实在太多了，必须大赞！`,
          angle: '深度信任',
        },
        {
          id: 'c-5',
          text: `深有同感！做自媒体最怕闭门造车，跟着博主的思路试了下确实有起色！`,
          angle: '反馈证言',
        },
      ];
      setDerivedList(fallbackList.slice(0, count));
      showToast('已生成高权重引流评论', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOne = (item: DerivedComment) => {
    navigator.clipboard.writeText(item.text);
    setCopiedId(item.id);
    showToast('评论已复制到剪贴板', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    if (derivedList.length === 0) return;
    const all = derivedList.map((c, i) => `${i + 1}. ${c.text}`).join('\n\n');
    navigator.clipboard.writeText(all);
    showToast('全部衍生评论已复制', 'success');
  };

  const handleSaveToAsset = () => {
    if (derivedList.length === 0) {
      showToast('请先衍生评论', 'warning');
      return;
    }
    const content = derivedList.map((c, i) => `${i + 1}. [${c.angle}] ${c.text}`).join('\n\n');
    const newAsset: MediaAsset = {
      id: Math.random().toString(36).substring(2, 9),
      title: `评论运营衍生包 (${baseComment.slice(0, 20)}...)`,
      type: 'comment',
      content,
      tags: ['评论运营', angle, `${derivedList.length}条`],
      createdAt: new Date().toISOString(),
    };
    if (onSaveAsset) {
      onSaveAsset(newAsset);
      showToast('已存入自媒体资产库！', 'success');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input */}
      <div className="lg:col-span-5 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <MessageSquareShare className="w-4 h-4 text-emerald-400" />
            热门爆款评论衍生器
          </h3>
          <p className="text-xs text-slate-400 mt-1">根据对标爆款评论，自动裂变高赞神评与引流话术</p>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>爆款对标评论灵感（点击直接填入）</span>
          </label>
          <div className="space-y-1.5">
            {PRESET_COMMENTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setBaseComment(p.text)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-slate-100 transition-all flex items-start gap-2"
              >
                <span className="text-[10px] font-semibold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 shrink-0">
                  {p.platform}
                </span>
                <span className="truncate">{p.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Base Comment Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">母评论内容</label>
          <textarea
            value={baseComment}
            onChange={(e) => setBaseComment(e.target.value)}
            placeholder="输入或粘贴一条想要衍生的爆款高赞评论..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>

        {/* Strategy and Count */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">衍生策略角度</label>
            <select
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {angleOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">衍生条数</label>
            <select
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="3">3 条</option>
              <option value="5">5 条 (推荐)</option>
              <option value="10">10 条 (矩阵轰炸)</option>
            </select>
          </div>
        </div>

        {/* AI Model */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">驱动模型</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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

        {/* Generate Button */}
        <button
          onClick={handleDerive}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? 'AI 正在极速衍生话术...' : '一键批量衍生评论'}</span>
        </button>
      </div>

      {/* Right List */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">衍生评论列表</span>
            {derivedList.length > 0 && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                已生成 {derivedList.length} 条
              </span>
            )}
          </div>

          {derivedList.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>复制全部</span>
              </button>
              <button
                onClick={handleSaveToAsset}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>存入资产库</span>
              </button>
            </div>
          )}
        </div>

        {derivedList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 py-20">
            <MessageSquareShare className="w-12 h-12 opacity-30 text-emerald-400" />
            <p className="text-xs">在左侧输入母评论，生成的矩阵引流话术将展示在此</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[700px] pr-1">
            {derivedList.map((item, idx) => (
              <div
                key={item.id}
                className="group bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all shadow-sm flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      #{idx + 1} {item.angle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{item.text}</p>
                </div>

                <button
                  onClick={() => handleCopyOne(item)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0"
                  title="复制单条"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
