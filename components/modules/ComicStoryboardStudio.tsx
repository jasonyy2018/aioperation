'use client';

import React, { useState, useEffect } from 'react';
import {
  Clapperboard,
  Sparkles,
  Layers,
  Video,
  Copy,
  Check,
  FolderPlus,
  ArrowRight,
  RefreshCw,
  Eye,
  Film,
  Camera,
  Play,
  Share2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  AIModelConfig,
  PromptTemplate,
  MediaAsset,
  ThreeViewsAsset,
  ComicSceneCard,
} from '@/types';
import { Badge } from '@/components/ui/Badge';

interface ComicStoryboardStudioProps {
  models: AIModelConfig[];
  prompts: PromptTemplate[];
  initialTheme?: string;
  onSaveAsset?: (asset: MediaAsset) => void;
  onSendToVideoStudio?: (prompt: string) => void;
}

export function ComicStoryboardStudio({
  models,
  prompts,
  initialTheme = '百年老字号糕点秘方被偷，学徒靠AI改良配方惊艳全城',
  onSaveAsset,
  onSendToVideoStudio,
}: ComicStoryboardStudioProps) {
  const { showToast } = useToast();
  const textModels = models.filter((m) => m.type === 'text');
  const imageModels = models.filter((m) => m.type === 'image');
  const [selectedTextModel, setSelectedTextModel] = useState<string>(textModels[0]?.id || 'minimax-text');
  const [selectedImageModel, setSelectedImageModel] = useState<string>(imageModels[0]?.id || 'minimax-image');

  const [activeTab, setActiveTab] = useState<'cards' | 'threeviews'>('cards');

  // Storyboard state
  const [theme, setTheme] = useState<string>(initialTheme);
  const [productSellingPoint, setProductSellingPoint] = useState<string>('传统古法工艺，0反式脂肪酸，现烤现发，买一送一');
  const [loadingCards, setLoadingCards] = useState<boolean>(false);
  const [cards, setCards] = useState<ComicSceneCard[]>([]);
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);

  // Three Views state
  const [charName, setCharName] = useState<string>('苏黎（青年老字号传人）');
  const [charStyle, setCharStyle] = useState<string>('3D国潮皮克斯质感 + 真实电影级打光');
  const [charFeatures, setCharFeatures] = useState<string>('深蓝色中式改良唐装，短发干净利落，胸前挂着微型单反相机');
  const [loadingThreeViews, setLoadingThreeViews] = useState<boolean>(false);
  const [threeViewsData, setThreeViewsData] = useState<ThreeViewsAsset | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialTheme) setTheme(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    if (textModels.length > 0 && !textModels.some((m) => m.id === selectedTextModel)) {
      setSelectedTextModel(textModels[0].id);
    }
    if (imageModels.length > 0 && !imageModels.some((m) => m.id === selectedImageModel)) {
      setSelectedImageModel(imageModels[0].id);
    }
  }, [models]);

  // Handle Comic Storyboard Generation
  const handleGenerateCards = async () => {
    if (!theme.trim()) {
      showToast('请输入漫剧剧情主题', 'warning');
      return;
    }
    setLoadingCards(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'comic-storyboard')?.content || '';
      const userPrompt = `漫剧带货剧本主题：【${theme}】。\n产品核心卖点/FABE信息：【${productSellingPoint}】。\n请按4张标准卡片（前3秒钩子/痛点展开/FABE卖点/行动转化）设计分镜与运镜Prompt。`;

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedTextModel,
          systemPrompt: promptContent,
          userPrompt,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '生成分镜失败');

      let text = data.text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const parsed: ComicSceneCard[] = JSON.parse(text.trim());
      setCards(parsed);
      setActiveCardIdx(0);
      showToast('已成功生成 4 阶段 AI 漫剧导演卡片流！', 'success');
    } catch (err: any) {
      showToast(err.message || '解析分镜卡片异常', 'error');
    } finally {
      setLoadingCards(false);
    }
  };

  // Handle Three Views Generation
  const handleGenerateThreeViews = async () => {
    if (!charName.trim()) {
      showToast('请输入角色或老字号商品名称', 'warning');
      return;
    }
    setLoadingThreeViews(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'three-views-visual')?.content || '';
      const userPrompt = `角色/商品：【${charName}】。\n视觉风格：【${charStyle}】。\n核心特征：【${charFeatures}】。\n请生成正面、侧面、背面三视图的高清生图Prompt与锁特征Seed建议。`;

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedTextModel,
          systemPrompt: promptContent,
          userPrompt,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '生成三视图提示词失败');

      let text = data.text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const parsed: ThreeViewsAsset = JSON.parse(text.trim());
      setThreeViewsData(parsed);
      showToast('三视图一致性视觉指令已生成！', 'success');
    } catch (err: any) {
      showToast(err.message || '生成三视图指令异常', 'error');
    } finally {
      setLoadingThreeViews(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('已复制到剪贴板', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>AI 漫剧导演卡片流 (FABE带货)</span>
          </button>
          <button
            onClick={() => setActiveTab('threeviews')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'threeviews'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>角色/商品三视图一致性资产</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">剧本文案模型:</span>
            <select
              value={selectedTextModel}
              onChange={(e) => setSelectedTextModel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {textModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. Cards Studio Tab */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Inputs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-sm text-slate-100">漫剧剧情与带货卖点</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">微短剧剧情主题 / 冲突起点</label>
              <textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                rows={3}
                placeholder="例如：百年老字号传承危机，新主理人通过老照片修复研发国潮新品破局"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">产品核心卖点 (FABE)</label>
              <input
                type="text"
                value={productSellingPoint}
                onChange={(e) => setProductSellingPoint(e.target.value)}
                placeholder="例如：现烤现发、古法手工、限时直降50元"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleGenerateCards}
              disabled={loadingCards}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${loadingCards ? 'animate-spin' : ''}`} />
              <span>{loadingCards ? '导演正在推演 4 幕分镜...' : '一键生成 4 幕导演卡片流'}</span>
            </button>

            {/* Quick Presets */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500 font-semibold">快速剧情模板:</span>
              <div className="space-y-1">
                {[
                  '老字号老师傅退休，关门前最后一批限量糕点被疯抢',
                  '摄影小白在星光器材城淘到神仙古董镜头，拍出千万播放大片',
                  '传统实体店老板娘亲自下场爆改门店，单日营业额翻十倍',
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setTheme(preset)}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors truncate"
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Cards Showcase */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>漫剧导演卡片流 {cards.length > 0 && `(4 幕分镜全流程)`}</span>
              </h3>

              {cards.length > 0 && (
                <button
                  onClick={() => {
                    onSaveAsset?.({
                      id: `comic_${Date.now()}`,
                      title: `AI漫剧分镜 - ${theme.slice(0, 16)}`,
                      type: 'comic',
                      content: JSON.stringify(cards, null, 2),
                      tags: ['AI漫剧', 'FABE带货', '分镜脚本'],
                      createdAt: new Date().toLocaleString(),
                    });
                    showToast('已保存至资产库！', 'success');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>保存至资产库</span>
                </button>
              )}
            </div>

            {cards.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <Clapperboard className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">点击左侧生成，AI 导演将为您编排具备强吸睛与高转化卖点的 4 幕分镜卡片</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                {/* 4 Cards Grid Tabs */}
                <div className="grid grid-cols-4 gap-2">
                  {cards.map((card, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => setActiveCardIdx(cIdx)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        activeCardIdx === cIdx
                          ? 'bg-purple-500/20 border-purple-500/60 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[10px] font-mono block text-slate-500">第 {cIdx + 1} 幕</span>
                      <span className="text-xs font-bold truncate block">{card.stepName}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Card Deep Dive */}
                {cards[activeCardIdx] && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple">第 {activeCardIdx + 1} 幕 · {cards[activeCardIdx].stepName}</Badge>
                        {cards[activeCardIdx].fabeAnalysis && (
                          <span className="text-xs text-rose-300 font-medium">
                            【{cards[activeCardIdx].fabeAnalysis}】
                          </span>
                        )}
                      </div>
                      {onSendToVideoStudio && (
                        <button
                          onClick={() => onSendToVideoStudio(cards[activeCardIdx].videoPrompt)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white text-xs font-semibold shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>发送至 AI 视频渲染</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Visual & Dialogue */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-400">画面景别与动作:</span>
                          <p className="text-xs text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                            {cards[activeCardIdx].visualDesc}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-indigo-400">运镜指令 (Camera Move):</span>
                          <p className="text-xs font-mono text-indigo-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                            {cards[activeCardIdx].cameraMovement}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-emerald-400">配音台词 / 旁白:</span>
                          <p className="text-xs font-medium text-emerald-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                            “{cards[activeCardIdx].dialogue}”
                          </p>
                        </div>
                      </div>

                      {/* AI Prompts */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-cyan-400">AI 生图 Prompt:</span>
                            <button
                              onClick={() => copyText(cards[activeCardIdx].imagePrompt, 'img')}
                              className="p-0.5 text-slate-400 hover:text-white"
                            >
                              {copiedKey === 'img' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                            {cards[activeCardIdx].imagePrompt}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-purple-400">可灵/即梦 图生视频 Prompt:</span>
                            <button
                              onClick={() => copyText(cards[activeCardIdx].videoPrompt, 'vid')}
                              className="p-0.5 text-slate-400 hover:text-white"
                            >
                              {copiedKey === 'vid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                            {cards[activeCardIdx].videoPrompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Three Views Tab */}
      {activeTab === 'threeviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-100">三视图特征定义</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">角色 / 商品名称</label>
              <input
                type="text"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="例如：苏师傅（老字号非遗手艺人）或 黄浦老月饼礼盒"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">美术与光影风格</label>
              <select
                value={charStyle}
                onChange={(e) => setCharStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="3D国潮皮克斯质感 + 真实电影级打光">3D国潮皮克斯质感 (极高辨识度)</option>
                <option value="写实商业广告摄影 + 8k超精细细节">写实商业广告摄影 (真实可信度高)</option>
                <option value="日系治愈微动漫 + 柔和光斑">日系治愈微动漫 (小红书/生活方式)</option>
                <option value="赛博朋克国潮 + 霓虹体积光">赛博朋克国潮 (年轻人/科技吸睛)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">核心锁定特征 (发型/服饰/LOGO)</label>
              <textarea
                value={charFeatures}
                onChange={(e) => setCharFeatures(e.target.value)}
                rows={3}
                placeholder="例如：深蓝色中式立领唐装，胸口金色刺绣LOGO，银边眼镜"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleGenerateThreeViews}
              disabled={loadingThreeViews}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${loadingThreeViews ? 'animate-spin' : ''}`} />
              <span>{loadingThreeViews ? '正在计算三视图指令...' : '生成三视图一致性视觉指令'}</span>
            </button>
          </div>

          {/* Three Views Result */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>三视图（正面 / 侧面 / 背面）特征锁定库</span>
              </h3>

              {threeViewsData && (
                <button
                  onClick={() => {
                    onSaveAsset?.({
                      id: `threeviews_${Date.now()}`,
                      title: `三视图资产 - ${threeViewsData.characterName}`,
                      type: 'comic',
                      content: JSON.stringify(threeViewsData, null, 2),
                      tags: ['三视图', '一致性', threeViewsData.characterName],
                      createdAt: new Date().toLocaleString(),
                    });
                    showToast('三视图资产已保存！', 'success');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>保存至资产库</span>
                </button>
              )}
            </div>

            {!threeViewsData ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <Camera className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">点击左侧生成，AI 将输出正面、侧面、背面标准化一致性生图指令与 Seed 锁定码</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                {/* 3 Prompts Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">① 正面视图 (Front)</span>
                      <button
                        onClick={() => copyText(threeViewsData.frontPrompt, 'front')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'front' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      {threeViewsData.frontPrompt}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">② 侧面视图 (Side)</span>
                      <button
                        onClick={() => copyText(threeViewsData.sidePrompt, 'side')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'side' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      {threeViewsData.sidePrompt}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">③ 背面视图 (Back)</span>
                      <button
                        onClick={() => copyText(threeViewsData.backPrompt, 'back')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'back' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      {threeViewsData.backPrompt}
                    </p>
                  </div>
                </div>

                {/* Consistency Lock Code */}
                {threeViewsData.seedCode && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-400">
                        🔑 跨分镜角色/商品特征锁定关键词 (Consistency Token)
                      </span>
                      <button
                        onClick={() => copyText(threeViewsData.seedCode || '', 'seed')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'seed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                      {threeViewsData.seedCode}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      在后续生成分镜图时，请将该特征段落加入 Prompt 前缀中，可大幅提高多镜头画面人物的一致性。
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
