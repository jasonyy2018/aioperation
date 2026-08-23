'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Sparkles,
  ShoppingBag,
  MessageSquare,
  BarChart3,
  Plus,
  Trash2,
  Copy,
  Check,
  FolderPlus,
  ArrowRight,
  TrendingUp,
  Zap,
  Clock,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  AIModelConfig,
  PromptTemplate,
  MediaAsset,
  LiveProductItem,
  LiveBarrageLog,
} from '@/types';
import { Badge } from '@/components/ui/Badge';

interface LiveStreamingCockpitProps {
  models: AIModelConfig[];
  prompts: PromptTemplate[];
  onSaveAsset?: (asset: MediaAsset) => void;
}

const DEFAULT_PRODUCTS: LiveProductItem[] = [
  {
    id: 'p1',
    name: '【老字号引流款】手工鲜肉月饼单只装 (限量体验)',
    type: 'hook',
    originalPrice: 15,
    livePrice: 3.9,
    stock: 50,
    fabeSellingPoint: '非遗师傅现揉现烤，皮脆肉嫩，每人限购1只，用来拉爆直播间互动率与留存',
    urgencyScript: '家人们，3块9连肉钱都不够！老字号今天就是给咱们直播间开门交个朋友，只放50单！',
  },
  {
    id: 'p2',
    name: '【爆款主力】传统手工苏式月饼6只礼盒装',
    type: 'burst',
    originalPrice: 98,
    livePrice: 49.9,
    stock: 200,
    fabeSellingPoint: '0添加防腐剂，传统古法起酥64层，顺丰冷链直达，送礼自吃首选',
    urgencyScript: '专柜卖98！今天直播间拍一盒送定制保温袋，仅限倒计时最后3分钟！',
  },
  {
    id: 'p3',
    name: '【高客单利润款】非遗匠心百年典藏红金尊享礼盒',
    type: 'profit',
    originalPrice: 298,
    livePrice: 198,
    stock: 80,
    fabeSellingPoint: '非遗非物质文化名录联名，含金箔封印，配定制实木刀叉，送长辈尊贵体面',
    urgencyScript: '全上海专柜限量供应，今天直播间直降100，买一盒直接送价值59元的品茶套装！',
  },
];

export function LiveStreamingCockpit({
  models,
  prompts,
  onSaveAsset,
}: LiveStreamingCockpitProps) {
  const { showToast } = useToast();
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedModel, setSelectedModel] = useState<string>(textModels[0]?.id || 'minimax-text');

  const [activeTab, setActiveTab] = useState<'matrix' | 'script' | 'barrage' | 'review'>('matrix');

  // Product Matrix state
  const [products, setProducts] = useState<LiveProductItem[]>(DEFAULT_PRODUCTS);
  const [liveTheme, setLiveTheme] = useState<string>('上海老字号中秋非遗手工糕点专场');

  // Live Script state
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [generatingScript, setGeneratingScript] = useState<boolean>(false);

  // Barrage Field Control state
  const [barrageInput, setBarrageInput] = useState<string>('这么便宜是不是假货？怎么证明是老字号？');
  const [barrageLogs, setBarrageLogs] = useState<LiveBarrageLog[]>([
    {
      id: 'b1',
      user: '上海老克勒888',
      message: '这么便宜是不是假货？怎么证明是老字号？',
      intent: 'authenticity',
      strategy: '出示官方老字号授权与非遗资质，展示实时后厨监控或专柜连线，打消疑虑',
      recommendedReply: '“大哥您问得太专业了！您看我身后就是咱们南京东路百年老店的现烤操作间！假一赔十，支持全国专柜验货，老字号招牌比天大，绝不砸自己的招牌！”',
      timestamp: '刚刚',
    },
  ]);
  const [analyzingBarrage, setAnalyzingBarrage] = useState<boolean>(false);

  useEffect(() => {
    if (textModels.length > 0 && !textModels.some((m) => m.id === selectedModel)) {
      setSelectedModel(textModels[0].id);
    }
  }, [models]);

  // Generate Full Live Script
  const handleGenerateLiveScript = async () => {
    setGeneratingScript(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'live-script')?.content || '';
      const userPrompt = `直播专场主题：【${liveTheme}】。\n当前直播间排品清单：\n${products
        .map(
          (p, i) =>
            `${i + 1}. [${p.type === 'hook' ? '引流款' : p.type === 'burst' ? '爆款' : '利润款'}] ${p.name} (原价¥${p.originalPrice} 直播价¥${p.livePrice}) - 卖点: ${p.fabeSellingPoint}`
        )
        .join('\n')}\n请输出完整的7分钟自然流起号、开场留人、塑品与倒计时逼单话术。`;

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          systemPrompt: promptContent,
          userPrompt,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '生成话术失败');

      setGeneratedScript(data.text);
      setActiveTab('script');
      showToast('直播全套话术剧本已生成！', 'success');
    } catch (err: any) {
      showToast(err.message || '生成失败', 'error');
    } finally {
      setGeneratingScript(false);
    }
  };

  // Handle Barrage Instant Analysis
  const handleAnalyzeBarrage = async () => {
    if (!barrageInput.trim()) {
      showToast('请输入观众弹幕内容', 'warning');
      return;
    }
    setAnalyzingBarrage(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'live-barrage')?.content || '';
      const userPrompt = `弹幕内容：“${barrageInput}”。直播主题：“${liveTheme}”。请分析意图并给出主播/副播可以直接脱口而出的高情商控场话术。`;

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          systemPrompt: promptContent,
          userPrompt,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '场控分析失败');

      let text = data.text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const parsed = JSON.parse(text.trim());
      const newLog: LiveBarrageLog = {
        id: `barrage_${Date.now()}`,
        user: `观众_${Math.random().toString(36).slice(2, 6)}`,
        message: barrageInput,
        intent: parsed.intent || 'price',
        strategy: parsed.strategy || '',
        recommendedReply: parsed.recommendedReply || parsed.reply || '',
        timestamp: new Date().toLocaleTimeString(),
      };

      setBarrageLogs((prev) => [newLog, ...prev]);
      setBarrageInput('');
      showToast('已生成高情商控场回复话术！', 'success');
    } catch (err: any) {
      showToast(err.message || '场控分析异常', 'error');
    } finally {
      setAnalyzingBarrage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>直播排品矩阵看板</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'script'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>全套起号与逼单话术剧本</span>
          </button>
          <button
            onClick={() => setActiveTab('barrage')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'barrage'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>实时弹幕场控助手</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'review'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>6 大数据复盘诊断</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">话术模型:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            {textModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Product Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 w-full sm:w-auto flex-1">
              <label className="text-xs font-semibold text-slate-300">本场直播专场主题</label>
              <input
                type="text"
                value={liveTheme}
                onChange={(e) => setLiveTheme(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={handleGenerateLiveScript}
              disabled={generatingScript}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              <Sparkles className={`w-4 h-4 ${generatingScript ? 'animate-spin' : ''}`} />
              <span>{generatingScript ? '正在生成话术剧本...' : '一键生成本场直播全套话术剧本'}</span>
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {products.map((p, idx) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        p.type === 'hook'
                          ? 'primary'
                          : p.type === 'burst'
                          ? 'danger'
                          : p.type === 'profit'
                          ? 'purple'
                          : 'cyan'
                      }
                    >
                      {p.type === 'hook'
                        ? '1. 引流款 (拉停留)'
                        : p.type === 'burst'
                        ? '2. 爆款品 (冲GMV)'
                        : '3. 高利润品'}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">库存: {p.stock}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 leading-snug">{p.name}</h4>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-lg font-black text-rose-400">¥{p.livePrice}</span>
                    <span className="text-xs text-slate-500 line-through">¥{p.originalPrice}</span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                    <span className="text-indigo-400 font-semibold block text-[11px]">FABE 卖点提炼:</span>
                    <p className="text-slate-300 leading-relaxed">{p.fabeSellingPoint}</p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-500/20 space-y-1 text-xs">
                  <span className="text-rose-400 font-semibold block text-[11px]">逼单紧迫感话术:</span>
                  <p className="text-rose-200 font-mono text-[11px] leading-relaxed">“{p.urgencyScript}”</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Script Tab */}
      {activeTab === 'script' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>全套直播话术与排品剧本</span>
            </h3>

            {generatedScript && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedScript);
                    showToast('已复制全部话术剧本！', 'success');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制话术</span>
                </button>
                <button
                  onClick={() => {
                    onSaveAsset?.({
                      id: `live_script_${Date.now()}`,
                      title: `直播剧本 - ${liveTheme}`,
                      type: 'live',
                      content: generatedScript,
                      tags: ['直播话术', '自然流起号', liveTheme],
                      createdAt: new Date().toLocaleString(),
                    });
                    showToast('已保存至资产库！', 'success');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>归档至资产库</span>
                </button>
              </div>
            )}
          </div>

          {!generatedScript ? (
            <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-700 stroke-[1.5]" />
              <p className="text-xs">在“直播排品矩阵”中编排商品后，点击生成全套 7 分钟起号与逼单话术</p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                {generatedScript}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 3. Barrage Field Control Tab */}
      {activeTab === 'barrage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-100">实时弹幕场控助手</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              输入观众弹幕的质疑或问题，AI 将在 1 秒内分析心理痛点并输出主播可直接脱口而出的高情商化解话术。
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">观众弹幕内容</label>
              <textarea
                value={barrageInput}
                onChange={(e) => setBarrageInput(e.target.value)}
                rows={3}
                placeholder="例如：这么便宜是不是快过期了？或者 为什么比某宝还便宜50块？"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 font-semibold">常见棘手弹幕:</span>
              <div className="space-y-1">
                {[
                  '这么便宜是不是假货？怎么证明是老字号？',
                  '拍了能今天发货吗？后天就要送长辈！',
                  '比线下门店还便宜，是不是缩水减料了？',
                ].map((demo, dIdx) => (
                  <button
                    key={dIdx}
                    onClick={() => setBarrageInput(demo)}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors truncate"
                  >
                    • {demo}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyzeBarrage}
              disabled={analyzingBarrage}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${analyzingBarrage ? 'animate-spin' : ''}`} />
              <span>{analyzingBarrage ? '正在生成化解话术...' : '秒级生成高情商场控回复'}</span>
            </button>
          </div>

          {/* Barrage Feed */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>弹幕控场实战记录 ({barrageLogs.length} 条)</span>
            </h3>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
              {barrageLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-semibold text-rose-300">
                      观众弹幕: “{log.message}”
                    </span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-indigo-400">💡 心理化解策略:</span>
                    <p className="text-xs text-slate-300">{log.strategy}</p>
                  </div>

                  <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">🎙️ 主播/场控脱口而出话术:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(log.recommendedReply);
                          showToast('已复制控场话术', 'success');
                        }}
                        className="text-xs text-indigo-400 hover:text-white"
                      >
                        复制
                      </button>
                    </div>
                    <p className="text-xs text-slate-100 leading-relaxed font-medium">
                      {log.recommendedReply}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Live Review Tab */}
      {activeTab === 'review' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>直播间 6 大核心数据复盘诊断</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              通过浅层与深层数据漏斗，AI 自动诊断转粉率、停留时长与千川投放投产比
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">平均停留时长</span>
              <h4 className="text-xl font-bold text-emerald-400">1分42秒</h4>
              <p className="text-[10px] text-emerald-500">高于同赛道 82% 主播</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">互动率 (评论/点赞)</span>
              <h4 className="text-xl font-bold text-indigo-400">14.6%</h4>
              <p className="text-[10px] text-indigo-400">引流款抽奖带动显著</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">粉丝转化率</span>
              <h4 className="text-xl font-bold text-purple-400">8.2%</h4>
              <p className="text-[10px] text-purple-400">公域转粉丝团表现极佳</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">成交转化率 (CVR)</span>
              <h4 className="text-xl font-bold text-rose-400">5.9%</h4>
              <p className="text-[10px] text-rose-400">爆款品买一送一促单成功</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>AI 直播操盘复盘诊断建议</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong>优点：</strong>第 1 款 3.9 元老字号体验装在开播前 15 分钟迅速将自然流推至峰值，弹幕互动率达 14.6%。
              </li>
              <li>
                <strong>优化点：</strong>在转入第 3 款 198 元高客单礼盒时，留存出现断崖式下跌。建议在两者之间插入 49.9 元的主力爆款进行价格过渡，避免观众价格心理落差过大。
              </li>
              <li>
                <strong>下场策略：</strong>增加倒计时逼单音效，每隔 20 分钟重新进行一次 7 分钟自然流起号循环。
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
