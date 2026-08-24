'use client';

import React, { useState, useEffect } from 'react';
import {
  Clapperboard,
  Sparkles,
  Layers,
  Copy,
  Check,
  FolderPlus,
  ArrowRight,
  Download,
  Video,
  Film,
  Camera,
  Play,
  Share2,
  ImageIcon,
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

import { AIModelSelector } from '@/components/ui/AIModelSelector';
import { useStreamingText } from '@/hooks/useStreamingText';
import { safeJsonParse, extractJsonFromAIResponse } from '@/lib/utils';

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
  const { streamText, stopStream, isStreaming } = useStreamingText();
  const textModels = models.filter((m) => m.type === 'text');
  const imageModels = models.filter((m) => m.type === 'image');
  const [selectedTextModel, setSelectedTextModel] = useState<string>(textModels[0]?.id || 'volcengine-plan');
  const [selectedImageModel, setSelectedImageModel] = useState<string>(imageModels[0]?.id || 'minimax-image');

  const [activeTab, setActiveTab] = useState<'cards' | 'threeviews'>('cards');

  // Storyboard state
  const [theme, setTheme] = useState<string>(initialTheme);
  const [productSellingPoint, setProductSellingPoint] = useState<string>('传统古法工艺，0反式脂肪酸，现烤现发，买一送一');
  const [loadingCards, setLoadingCards] = useState<boolean>(false);
  const [cards, setCards] = useState<ComicSceneCard[]>([]);
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const [renderingCardIdx, setRenderingCardIdx] = useState<number | null>(null);

  // Three Views state
  const [charName, setCharName] = useState<string>('苏黎（青年老字号传人）');
  const [charStyle, setCharStyle] = useState<string>('3D国潮皮克斯质感 + 真实电影级打光');
  const [charFeatures, setCharFeatures] = useState<string>('深蓝色中式改良唐装，短发干净利落，胸前挂着微型单反相机');
  const [loadingThreeViews, setLoadingThreeViews] = useState<boolean>(false);
  const [threeViewsData, setThreeViewsData] = useState<ThreeViewsAsset | null>(null);
  const [renderingThreeViews, setRenderingThreeViews] = useState<boolean>(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Restore draft on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('automedia_draft_comic');
        if (saved) {
          const parsed = safeJsonParse<any>(saved, null);
          if (parsed) {
            if (parsed.theme) setTheme(parsed.theme);
            if (parsed.productSellingPoint) setProductSellingPoint(parsed.productSellingPoint);
            if (parsed.cards && Array.isArray(parsed.cards)) setCards(parsed.cards);
            if (parsed.charName) setCharName(parsed.charName);
            if (parsed.charStyle) setCharStyle(parsed.charStyle);
            if (parsed.charFeatures) setCharFeatures(parsed.charFeatures);
            if (parsed.threeViewsData) setThreeViewsData(parsed.threeViewsData);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync draft to LocalStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'automedia_draft_comic',
          JSON.stringify({
            theme,
            productSellingPoint,
            cards,
            charName,
            charStyle,
            charFeatures,
            threeViewsData,
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme, productSellingPoint, cards, charName, charStyle, charFeatures, threeViewsData]);

  useEffect(() => {
    if (initialTheme) setTheme(initialTheme);
  }, [initialTheme]);

  // Handle Comic Storyboard Generation
  const handleGenerateCards = async () => {
    if (!theme.trim()) {
      showToast('请输入剧情主题', 'warning');
      return;
    }
    setLoadingCards(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'comic-storyboard')?.content || '';
      const userPrompt = `漫剧主题：【${theme}】。\n带货卖点 (FABE)：【${productSellingPoint}】。\n请输出 4 幕标准分镜（前3秒黄金钩子、痛点剧情展开、FABE卖点突围、行动号召转化）。`;

      const fullText = await streamText({
        modelId: selectedTextModel,
        systemPrompt: promptContent,
        userPrompt,
        customModels: models,
      });
      if (!fullText.trim()) throw new Error('模型未返回内容');

      const parsed = extractJsonFromAIResponse<ComicSceneCard[]>(fullText, []);
      if (!parsed || parsed.length === 0) {
        throw new Error('未能正确解析漫剧分镜，请重试');
      }

      setCards(parsed);
      setActiveCardIdx(0);
      showToast('AI 漫剧 4 阶段分镜卡片流已生成！', 'success');
    } catch (err: any) {
      showToast(err.message || '生成漫剧分镜异常', 'error');
    } finally {
      setLoadingCards(false);
    }
  };

  // Inline render card image
  const handleRenderCardImage = async (cardIdx: number) => {
    const targetCard = cards[cardIdx];
    if (!targetCard || !targetCard.imagePrompt) return;
    setRenderingCardIdx(cardIdx);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedImageModel,
          prompt: `${targetCard.imagePrompt}, masterpiece, highly detailed 8k cinematic shot`,
          aspectRatio: '16:9',
          count: 1,
          customModels: models,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '分镜生图失败');
      if (data.images && data.images.length > 0) {
        setCards((prev) =>
          prev.map((c, i) => (i === cardIdx ? { ...c, renderedImageUrl: data.images[0] } : c))
        );
        showToast(`第 ${cardIdx + 1} 幕分镜生图渲染完成！`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || '分镜生图异常', 'error');
    } finally {
      setRenderingCardIdx(null);
    }
  };

  // Handle Three Views Generation
  const handleGenerateThreeViews = async () => {
    if (!charName.trim()) {
      showToast('请输入主体名称', 'warning');
      return;
    }
    setLoadingThreeViews(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'comic-threeviews')?.content || '';
      const userPrompt = `主体名称：【${charName}】\n视觉风格：【${charStyle}】\n特征细节与服饰道具：【${charFeatures}】\n请严格按JSON结构输出三视图Prompt方案。`;

      const fullText = await streamText({
        modelId: selectedTextModel,
        systemPrompt: promptContent,
        userPrompt,
        customModels: models,
      });
      if (!fullText.trim()) throw new Error('模型未返回内容');

      const parsed = extractJsonFromAIResponse<ThreeViewsAsset | null>(fullText, null);
      if (!parsed) {
        throw new Error('未能正确解析三视图提示词数据');
      }

      setThreeViewsData(parsed);
      showToast('三视图一致性视觉指令已生成！', 'success');
    } catch (err: any) {
      showToast(err.message || '生成三视图指令异常', 'error');
    } finally {
      setLoadingThreeViews(false);
    }
  };

  // Render Three Views Image
  const handleRenderThreeViewImage = async () => {
    if (!threeViewsData || !threeViewsData.frontPrompt) return;
    setRenderingThreeViews(true);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedImageModel,
          prompt: `Character Model Sheet, 3-views orthographic turnaround (front view, side view, back view) of ${threeViewsData.characterName}, ${threeViewsData.style}, ${threeViewsData.frontPrompt}, pure white background, consistent character design, 8k resolution`,
          aspectRatio: '16:9',
          count: 1,
          customModels: models,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '三视图生图失败');
      if (data.images && data.images.length > 0) {
        setThreeViewsData((prev) => (prev ? { ...prev, imageUrl: data.images[0] } : null));
        showToast('三视图标准资产图已生成！', 'success');
      }
    } catch (err: any) {
      showToast(err.message || '三视图生图异常', 'error');
    } finally {
      setRenderingThreeViews(false);
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

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-48">
            <AIModelSelector
              models={models}
              selectedModel={selectedTextModel}
              onSelectModel={setSelectedTextModel}
              type="text"
              moduleKey="comic_text"
              label="漫剧剧本模型"
            />
          </div>
          <div className="w-full sm:w-48">
            <AIModelSelector
              models={models}
              selectedModel={selectedImageModel}
              onSelectModel={setSelectedImageModel}
              type="image"
              moduleKey="comic_image"
              label="分镜渲染模型"
            />
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
              <span>{loadingCards ? 'AI 导演正在编排 4 幕分镜...' : '一键生成 AI 漫剧 4 幕分镜卡片流'}</span>
            </button>
          </div>

          {/* Right Card Stream & Deep Dive */}
          <div className="lg:col-span-2 space-y-4">
            {cards.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <Clapperboard className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">填写左侧剧情主题并点击生成，体验 4 阶段黄金漫剧分镜卡片流与原地生图渲染</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 4 Cards Navigation Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {cards.map((card, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => setActiveCardIdx(cIdx)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        activeCardIdx === cIdx
                          ? 'bg-purple-500/20 border-purple-500/60 text-purple-200 shadow-md'
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRenderCardImage(activeCardIdx)}
                          disabled={renderingCardIdx === activeCardIdx}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <ImageIcon className={`w-3.5 h-3.5 ${renderingCardIdx === activeCardIdx ? 'animate-spin' : ''}`} />
                          <span>{renderingCardIdx === activeCardIdx ? '正在渲染画作...' : '🎨 原地生图渲染'}</span>
                        </button>
                        {onSendToVideoStudio && (
                          <button
                            onClick={() => onSendToVideoStudio(cards[activeCardIdx].videoPrompt)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>发送至视频渲染</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rendered Image Preview Box if available */}
                    {cards[activeCardIdx].renderedImageUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 relative bg-slate-900 aspect-video flex items-center justify-center">
                        <img
                          src={cards[activeCardIdx].renderedImageUrl}
                          alt={`第 ${activeCardIdx + 1} 幕分镜画面`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-1.5 bg-slate-950/80 p-1 rounded-lg backdrop-blur-sm">
                          <a
                            href={cards[activeCardIdx].renderedImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={`storyboard_scene_${activeCardIdx + 1}.png`}
                            className="p-1 text-slate-300 hover:text-white"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

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

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          onSaveAsset?.({
                            id: `comic_${Date.now()}`,
                            title: `漫剧分镜 - ${theme.slice(0, 20)}`,
                            type: 'comic',
                            content: JSON.stringify(cards, null, 2),
                            mediaUrl: cards[activeCardIdx].renderedImageUrl,
                            tags: ['AI漫剧', '分镜卡片流', 'FABE带货'],
                            createdAt: new Date().toLocaleString(),
                          });
                          showToast('全套漫剧分镜卡片已保存至数字资产库！', 'success');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>归档全套分镜至资产库</span>
                      </button>
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
                <option value="赛博朋克霓虹光影 + 高反光材质">赛博朋克现代视觉 (年轻潮流)</option>
                <option value="水墨新中式概念设计 + 宣纸肌理">水墨新中式 (文化底蕴高)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">锁定核心视觉特征 (跨镜头一致性)</label>
              <textarea
                value={charFeatures}
                onChange={(e) => setCharFeatures(e.target.value)}
                rows={3}
                placeholder="发型、服装颜色材质、标志性挂饰或商品包装特有纹理..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleGenerateThreeViews}
              disabled={loadingThreeViews}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${loadingThreeViews ? 'animate-spin' : ''}`} />
              <span>{loadingThreeViews ? '正在生成三视图指令...' : '一键生成标准化三视图生成指令'}</span>
            </button>
          </div>

          {/* Three Views Result */}
          <div className="lg:col-span-2 space-y-4">
            {!threeViewsData ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <Camera className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">定义角色特征后生成【正面、侧面、背面】三视图一致性生图 Prompt 与 Seed 锁定码</p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan">三视图一致性资产</Badge>
                    <span className="font-bold text-sm text-slate-100">{threeViewsData.characterName}</span>
                  </div>

                  <button
                    onClick={handleRenderThreeViewImage}
                    disabled={renderingThreeViews}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon className={`w-3.5 h-3.5 ${renderingThreeViews ? 'animate-spin' : ''}`} />
                    <span>{renderingThreeViews ? '正在渲染三视图...' : '🎨 一键渲染三视图标准大图'}</span>
                  </button>
                </div>

                {threeViewsData.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950 aspect-video flex items-center justify-center">
                    <img
                      src={threeViewsData.imageUrl}
                      alt={threeViewsData.characterName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">1. 正面视角 (Front)</span>
                      <button onClick={() => copyText(threeViewsData.frontPrompt, 'front')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'front' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed line-clamp-4">{threeViewsData.frontPrompt}</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">2. 侧面视角 (Side)</span>
                      <button onClick={() => copyText(threeViewsData.sidePrompt, 'side')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'side' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed line-clamp-4">{threeViewsData.sidePrompt}</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">3. 背面视角 (Back)</span>
                      <button onClick={() => copyText(threeViewsData.backPrompt, 'back')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'back' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed line-clamp-4">{threeViewsData.backPrompt}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Seed / 特征锁定描述片段: </span>
                    <span className="font-mono text-indigo-300">{threeViewsData.seedCode || 'consistent face, exact costume pattern'}</span>
                  </div>
                  <button
                    onClick={() => {
                      onSaveAsset?.({
                        id: `threeviews_${Date.now()}`,
                        title: `三视图资产 - ${threeViewsData.characterName}`,
                        type: 'comic',
                        content: JSON.stringify(threeViewsData, null, 2),
                        mediaUrl: threeViewsData.imageUrl,
                        tags: ['三视图', '一致性', threeViewsData.characterName],
                        createdAt: new Date().toLocaleString(),
                      });
                      showToast('三视图资产已保存！', 'success');
                    }}
                    className="flex items-center gap-1 text-slate-300 hover:text-white font-medium cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>保存资产</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
