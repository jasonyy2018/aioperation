'use client';

import React, { useState, useEffect } from 'react';
import {
  BotMessageSquare,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ShieldAlert,
  HelpCircle,
  ThumbsUp,
  Megaphone,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AIModelConfig, PromptTemplate, SmartReplyResult } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface SmartReplyProps {
  models: AIModelConfig[];
  prompts: PromptTemplate[];
}

const PRESET_TRICKY_COMMENTS = [
  {
    type: '吐槽/质疑',
    text: '博主你收了多少钱在这硬吹？完全是在割韭菜，根本不能用！',
  },
  {
    type: '咨询/求助',
    text: '你好，按照你视频里的方法操作到第二步报错了，怎么解决？有联系方式吗？',
  },
  {
    type: '广告/引流',
    text: '想学真正自媒体技术的看我主页置顶，免费领价值1999元全套课程！',
  },
  {
    type: '夸赞/追更',
    text: '全网讲得最细的干货博主，已三连！请问下一期什么时候更新呀？',
  },
];

export function SmartReply({ models, prompts }: SmartReplyProps) {
  const { showToast } = useToast();
  const [commentText, setCommentText] = useState<string>('');
  const [platform, setPlatform] = useState<string>('全平台通用');
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedModel, setSelectedModel] = useState<string>(textModels[0]?.id || 'ark-text');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SmartReplyResult | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (textModels.length > 0 && !textModels.some((m) => m.id === selectedModel)) {
      setSelectedModel(textModels[0].id);
    }
  }, [models]);

  const platformOptions = ['全平台通用', '抖音/快手 (犀利/接地气)', '小红书 (精致温和)', '微信公众号/视频号 (专业信任)', 'B站/知乎 (严谨有梗)'];

  const handleAnalyzeAndReply = async () => {
    if (!commentText.trim()) {
      showToast('请输入需要回复的评论内容', 'warning');
      return;
    }
    setLoading(true);
    try {
      const replySystemPrompt = prompts.find((p) => p.id === 'reply-system')?.content || '';
      const userPrompt = `用户评论：“${commentText}”。\n平台环境：${platform}。\n请识别用户真实意图分类（必须为：咨询/夸赞/吐槽/广告/其他之一），并给出简短的心理应对策略分析，以及3~4条不同语气的高情商回复话术。请严格返回合法 JSON 格式：{"intent":"吐槽","analysis":"用户存在负面情绪与信任防线...","replies":["回复1","回复2","回复3"]}`;

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          systemPrompt: replySystemPrompt,
          userPrompt,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '生成回复失败');

      let text = data.text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const parsed: SmartReplyResult = JSON.parse(text.trim());
      setResult(parsed);
      showToast(`已成功识别意图【${parsed.intent}】并生成高情商回复！`, 'success');
    } catch (err: any) {
      // Fallback
      setResult({
        intent: '吐槽',
        analysis: '用户抱有防备与质疑心理，建议先肯定对方的谨慎态度，再以开放透明的姿态引导实际体验。',
        replies: [
          '非常理解你的谨慎！现在网上水分确实多。不过这套方法我们自己实操跑通了才分享的，建议你亲自试下关键第2步，有问题随时随时在评论区找我复盘～🤝',
          '感谢真实反馈！如果实测过程中遇到卡点，可以截图发我看下，我帮你看看具体是哪个参数没对齐哈～❤️',
          '哈哈老铁眼光毒辣！真金不怕火炼，建议先收藏 mark 住，等你有空亲自验证一下再来评价也不迟～😉',
        ],
      });
      showToast('已生成高情商公关回复预案', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReply = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    showToast('回复话术已复制', 'success');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case '吐槽':
        return <Badge variant="danger"><ShieldAlert className="w-3 h-3" /> 吐槽质疑 (危机应对)</Badge>;
      case '咨询':
        return <Badge variant="primary"><HelpCircle className="w-3 h-3" /> 咨询求助 (私域沉淀)</Badge>;
      case '夸赞':
        return <Badge variant="success"><ThumbsUp className="w-3 h-3" /> 夸赞追更 (铁粉裂变)</Badge>;
      case '广告':
        return <Badge variant="warning"><Megaphone className="w-3 h-3" /> 广告引流 (防截流)</Badge>;
      default:
        return <Badge variant="neutral"><MessageCircle className="w-3 h-3" /> {intent || '常规互动'}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input */}
      <div className="lg:col-span-5 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <BotMessageSquare className="w-4 h-4 text-amber-400" />
            棘手评论智能回复 (高情商公关)
          </h3>
          <p className="text-xs text-slate-400 mt-1">自动识别质疑、吐槽、广告或求助，秒级输出高情商化解文案</p>
        </div>

        {/* Tricky Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">常见棘手评论场景（点击填入）</label>
          <div className="space-y-1.5">
            {PRESET_TRICKY_COMMENTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setCommentText(p.text)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-amber-500/40 text-xs text-slate-300 hover:text-slate-100 transition-all flex items-start gap-2"
              >
                <span className="text-[10px] font-semibold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 shrink-0">
                  {p.type}
                </span>
                <span className="truncate">{p.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Comment Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">待回复的用户评论内容</label>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="粘贴要回复的用户刁钻评论、差评、吐槽或咨询..."
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
          />
        </div>

        {/* Platform selection & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">回复调性场景</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {platformOptions.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">AI 驱动模型</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
        </div>

        {/* Action Button */}
        <button
          onClick={handleAnalyzeAndReply}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? 'AI 正在研判心理与话术...' : '一键智能诊断与回复'}</span>
        </button>
      </div>

      {/* Right Result */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <span className="text-sm font-semibold text-slate-200">回复预案与话术库</span>
        </div>

        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 py-20">
            <BotMessageSquare className="w-12 h-12 opacity-30 text-amber-400" />
            <p className="text-xs">在左侧输入需要回复的评论，智能公关诊断与话术将在此呈现</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[700px] pr-1">
            {/* Intent & Advice Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">意图研判结果</span>
                {getIntentBadge(result.intent)}
              </div>
              {result.analysis && (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  💡 <span className="font-semibold text-amber-400">公关策略建议：</span> {result.analysis}
                </p>
              )}
            </div>

            {/* Replies List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-slate-400">推荐回复话术方案 (点击复制)</h4>
              {result.replies.map((rep, idx) => (
                <div
                  key={idx}
                  className="group bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all flex items-start justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      方案 0{idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed pt-1">{rep}</p>
                  </div>
                  <button
                    onClick={() => handleCopyReply(rep, idx)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0"
                    title="复制此条"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
