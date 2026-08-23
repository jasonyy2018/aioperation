'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Download,
  FolderPlus,
  RefreshCw,
  Layers,
  Wand2,
  Maximize2,
  Check,
  History,
  LayoutTemplate,
  Sliders,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AIModelConfig, PromptTemplate, MediaAsset, GeneratedImage } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface CommercialPhotoStudioProps {
  models: AIModelConfig[];
  prompts: PromptTemplate[];
  onSaveAsset?: (asset: MediaAsset) => void;
}

const PRESET_SCENES = [
  {
    id: 'guochao',
    name: '国潮红金典雅 (老字号/礼盒/非遗)',
    desc: '深朱红背景，微雕金色卷轴光晕，中式古雅木托，温润电影级侧光',
    promptSnippet: 'luxury Chinese traditional aesthetics, crimson red background with delicate gold silk patterns, warm volumetric side lighting, 8k commercial photography, award-winning still life',
  },
  {
    id: 'nordic',
    name: '北欧极简原木 (小红书/生活美学)',
    desc: '极简原木台面，清晨柔和漫射天光，微风绿植虚化，高级侘寂风',
    promptSnippet: 'Nordic minimalist studio, natural oak wood podium, soft morning window light, subtle Monstera plant bokeh, clean aesthetic, organic soft shadows',
  },
  {
    id: 'cyber',
    name: '赛博霓虹科幻 (星光摄影器材/数码)',
    desc: '冷光深灰拉丝金属台，蓝紫双色霓虹边缘光，极具科技质感与锐度',
    promptSnippet: 'cyberpunk tech style, brushed dark metal surface, dual blue and purple neon rim lighting, high-tech vibe, razor-sharp product details',
  },
  {
    id: 'studio-high',
    name: '高奢黑金影棚 (珠宝/高客单爆款)',
    desc: '深邃纯黑哑光悬浮台，单束聚光灯精准打顶，极致高光与倒影',
    promptSnippet: 'ultra luxury black podium, dramatic top spotlight, crisp reflection, matte black background, high-end commercial ad studio shot',
  },
  {
    id: 'sunlight',
    name: '晨光自然静物 (烘焙/轻食/治愈)',
    desc: '阳光穿透百叶窗的斜射光斑，亚麻桌布，温暖治愈的生活烟火气',
    promptSnippet: 'golden hour sunlight through blinds, rustic linen tablecloth, cozy atmosphere, appetizing soft illumination, 8k macro photography',
  },
  {
    id: 'outdoor',
    name: '城市街头纪实 (潮牌/探店/青年)',
    desc: '上海弄堂/外滩复古街景为虚化背景，自然明亮阴天光线，真实街拍感',
    promptSnippet: 'Shanghai vintage architecture street background bokeh, soft overcast day lighting, cinematic street photography, editorial look',
  },
];

export function CommercialPhotoStudio({
  models,
  prompts,
  onSaveAsset,
}: CommercialPhotoStudioProps) {
  const { showToast } = useToast();
  const imageModels = models.filter((m) => m.type === 'image');
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedImageModel, setSelectedImageModel] = useState<string>(imageModels[0]?.id || 'minimax-image');
  const [selectedTextModel, setSelectedTextModel] = useState<string>(textModels[0]?.id || 'minimax-text');

  const [activeTab, setActiveTab] = useState<'scene' | 'restore' | 'cover'>('scene');

  // Scene Switch State
  const [productDesc, setProductDesc] = useState<string>('上海老字号手工鲜肉月饼，外皮金黄酥脆，刚出炉微热');
  const [selectedSceneId, setSelectedSceneId] = useState<string>('guochao');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [generating, setGenerating] = useState<boolean>(false);
  const [resultImages, setResultImages] = useState<GeneratedImage[]>([]);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  // Restore State
  const [oldPhotoDesc, setOldPhotoDesc] = useState<string>('1980年代星光照相馆老师傅手持胶片单反相机的黑白工作照');
  const [restorePrompt, setRestorePrompt] = useState<string>('');
  const [restoring, setRestoring] = useState<boolean>(false);

  // Cover State
  const [coverTitle, setCoverTitle] = useState<string>('普通人别瞎买！摄影器材城老法师亲测这3款二手微单');
  const [coverSubtitle, setCoverSubtitle] = useState<string>('省下5000块不踩坑 · 纯干货');
  const [coverPlatform, setCoverPlatform] = useState<'xiaohongshu' | 'douyin'>('xiaohongshu');

  useEffect(() => {
    if (imageModels.length > 0 && !imageModels.some((m) => m.id === selectedImageModel)) {
      setSelectedImageModel(imageModels[0].id);
    }
    if (textModels.length > 0 && !textModels.some((m) => m.id === selectedTextModel)) {
      setSelectedTextModel(textModels[0].id);
    }
  }, [models]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片尺寸不能超过 5MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      showToast('参考白底图已就绪！', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Generate Commercial Photo
  const handleGenerateCommercialPhoto = async () => {
    if (!productDesc.trim()) {
      showToast('请输入产品特征描述', 'warning');
      return;
    }
    setGenerating(true);
    try {
      const sceneObj = PRESET_SCENES.find((s) => s.id === selectedSceneId);
      const combinedPrompt = `Professional commercial product photography of ${productDesc}. Environment: ${sceneObj?.promptSnippet || 'studio lighting'}. Highly detailed, clean composition, 8k resolution, master commercial ad visual.`;

      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedImageModel,
          prompt: combinedPrompt,
          aspectRatio,
          refImageUrl: uploadedImage || undefined,
          count: 1,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '商业影棚生图失败');

      const newImgs: GeneratedImage[] = (data.images || []).map((url: string) => ({
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url,
        prompt: combinedPrompt,
        model: selectedImageModel,
        aspectRatio,
        createdAt: new Date().toLocaleTimeString(),
      }));

      setResultImages((prev) => [...newImgs, ...prev]);
      showToast('商业虚拟影棚大片已生成！', 'success');
    } catch (err: any) {
      showToast(err.message || '生成失败', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Handle Restore Prompt
  const handleGenerateRestore = async () => {
    if (!oldPhotoDesc.trim()) {
      showToast('请输入老照片内容描述', 'warning');
      return;
    }
    setRestoring(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'photo-studio')?.content || '';
      const userPrompt = `老照片内容：【${oldPhotoDesc}】。\n请生成用于老照片高清修复重绘的高清Prompt与一段讲述老字号品牌的图生视频运镜Prompt。`;

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
      if (res.ok && data.text) {
        setRestorePrompt(data.text);
        showToast('老照片修复与微短片指令已生成！', 'success');
      }
    } catch {
      showToast('生成修复指令失败', 'error');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Model */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('scene')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'scene'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AI 白底图一键置换商业影棚</span>
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'restore'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>老字号老照片修复与微短剧</span>
          </button>
          <button
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cover'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>高点击率 (CTR) 爆款封面工厂</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">渲染生图模型:</span>
          <select
            value={selectedImageModel}
            onChange={(e) => setSelectedImageModel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            {imageModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Scene Switch Tab */}
      {activeTab === 'scene' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Inputs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-slate-100">产品与影棚场景配置</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">商品与核心质感描述</label>
              <textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                rows={2}
                placeholder="例如：传统古法鲜肉月饼，金黄酥皮微焦，上面有红色印章"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Reference Image Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">垫图/手机白底原图 (可选)</label>
              <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer bg-slate-950/60 transition-colors">
                {uploadedImage ? (
                  <div className="relative w-full h-24 flex items-center justify-center">
                    <img src={uploadedImage} alt="ref" className="h-full object-contain rounded-lg" />
                    <span className="absolute bottom-1 right-1 text-[10px] bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded">
                      点击更换
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-xs">上传产品手机实拍/白底图 (≤5MB)</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            {/* Scenes Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">选择商业影棚光影场景</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {PRESET_SCENES.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedSceneId(sc.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedSceneId === sc.id
                        ? 'bg-rose-500/15 border-rose-500/60 text-rose-100'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-semibold block">{sc.name}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{sc.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">画幅比例</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1:1', label: '1:1 方形' },
                  { id: '3:4', label: '3:4 小红书' },
                  { id: '16:9', label: '16:9 封面' },
                ].map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateCommercialPhoto}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? '商业影棚正在打光渲染...' : '生成商业级场景大片'}</span>
            </button>
          </div>

          {/* Right Showcase Gallery */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-400" />
                <span>商业影棚成片画廊 {resultImages.length > 0 && `(${resultImages.length} 张)`}</span>
              </h3>
            </div>

            {resultImages.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <Camera className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">
                  无需搭建万元影棚与打光，选择场景后点击生成，一键为商品拍摄商用级大片
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                {resultImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img
                        src={img.url}
                        alt="generated"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => setPreviewImage(img)}
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-3 space-y-2">
                      <p className="text-[11px] text-slate-400 line-clamp-1">{img.prompt}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <a
                          href={img.url}
                          download={`photo_${img.id}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>下载</span>
                        </a>

                        <button
                          onClick={() => {
                            onSaveAsset?.({
                              id: img.id,
                              title: `商业大片 - ${productDesc.slice(0, 12)}`,
                              type: 'image',
                              content: img.prompt,
                              mediaUrl: img.url,
                              tags: ['商业影棚', '大片', selectedSceneId],
                              createdAt: new Date().toLocaleString(),
                            });
                            showToast('已保存至资产库！', 'success');
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>归档</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Old Photo Restore Tab */}
      {activeTab === 'restore' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-100">老字号老照片修复与微短剧</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">老照片历史背景与人物道具</label>
              <textarea
                value={oldPhotoDesc}
                onChange={(e) => setOldPhotoDesc(e.target.value)}
                rows={4}
                placeholder="例如：1985年黄浦区南京东路老店门口，排队买第一批鲜肉月饼的顾客人群"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleGenerateRestore}
              disabled={restoring}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${restoring ? 'animate-spin' : ''}`} />
              <span>{restoring ? '正在设计修复与动态短片方案...' : '生成修复与微短片指令'}</span>
            </button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <span>老照片动态化历史故事方案</span>
            </h3>

            {!restorePrompt ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <History className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">输入老照片历史背景，AI 将输出超清修复 Prompt 与图生视频运镜方案</p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-indigo-400">老字号动态短剧渲染 Prompt</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(restorePrompt);
                      showToast('已复制修复指令', 'success');
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    复制全部
                  </button>
                </div>
                <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  {restorePrompt}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Cover CTR Studio */}
      {activeTab === 'cover' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-cyan-400" />
              <span>小红书 / 抖音 双列瀑布流高 CTR 爆款封面工厂</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              双列瀑布流点击率取决于：反差色大字标题 + 痛点标签 + 吸睛视觉中心点
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">主标题 (大字吸睛核心)</label>
                <input
                  type="text"
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">副标题 / 信任背书标签</label>
                <input
                  type="text"
                  value={coverSubtitle}
                  onChange={(e) => setCoverSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Visual Live Mockup */}
            <div className="flex items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="relative w-56 aspect-[3/4] bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-4 flex flex-col justify-between border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/20">
                <div className="space-y-1.5">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-md">
                    🔥 必看排坑
                  </span>
                  <h4 className="text-base font-black text-amber-300 leading-snug drop-shadow-md">
                    {coverTitle}
                  </h4>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-sm p-2 rounded-xl border border-slate-700/80">
                  <p className="text-[11px] font-semibold text-slate-200 truncate">{coverSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title="商业大片高清预览"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="relative aspect-square max-h-[70vh] mx-auto overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
              <img src={previewImage.url} alt="preview" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
              {previewImage.prompt}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
