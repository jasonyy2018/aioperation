'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Grid,
  UserCheck,
  Send,
  Copy,
  Check,
  FolderPlus,
  ArrowRight,
  Store,
  Layers,
  ChevronRight,
  Flame,
  HelpCircle,
  Award,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AIModelConfig, PromptTemplate, MediaAsset, MandalaDimension, AccountProfileSet } from '@/types';
import { AIModelSelector } from '@/components/ui/AIModelSelector';
import { useStreamingText } from '@/hooks/useStreamingText';
import { Badge } from '@/components/ui/Badge';
import { safeJsonParse, extractJsonFromAIResponse } from '@/lib/utils';

interface MandalaTopicPlannerProps {
  models: AIModelConfig[];
  prompts: PromptTemplate[];
  onSaveAsset?: (asset: MediaAsset) => void;
  onSendToArticle?: (topic: string, summary: string) => void;
  onSendToStoryboard?: (theme: string) => void;
}

export function MandalaTopicPlanner({
  models,
  prompts,
  onSaveAsset,
  onSendToArticle,
  onSendToStoryboard,
}: MandalaTopicPlannerProps) {
  const { showToast } = useToast();
  const { streamText, stopStream, isStreaming } = useStreamingText();
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedModel, setSelectedModel] = useState<string>(textModels[0]?.id || 'volcengine-plan');
  const [activeSubTab, setActiveSubTab] = useState<'mandala' | 'profile' | 'cases'>('mandala');

  // Mandala state
  const [coreKeyword, setCoreKeyword] = useState<string>('黄浦区老字号糕点与新茶饮网创');
  const [loadingMandala, setLoadingMandala] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<MandalaDimension[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<{ title: string; hook: string; angle: string } | null>(null);

  // Profile state
  const [industry, setIndustry] = useState<string>('传统老字号食品 / 摄影器材实体店');
  const [ipType, setIpType] = useState<string>('创始人讲品牌故事 + 真实工艺揭秘');
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [profileResult, setProfileResult] = useState<AccountProfileSet | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Restore draft on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('automedia_draft_mandala');
        if (saved) {
          const parsed = safeJsonParse<any>(saved, null);
          if (parsed) {
            if (parsed.coreKeyword) setCoreKeyword(parsed.coreKeyword);
            if (parsed.dimensions && Array.isArray(parsed.dimensions)) setDimensions(parsed.dimensions);
            if (parsed.industry) setIndustry(parsed.industry);
            if (parsed.ipType) setIpType(parsed.ipType);
            if (parsed.profileResult) setProfileResult(parsed.profileResult);
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
          'automedia_draft_mandala',
          JSON.stringify({
            coreKeyword,
            dimensions,
            industry,
            ipType,
            profileResult,
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, [coreKeyword, dimensions, industry, ipType, profileResult]);

  // Handle Mandala Generation
  const handleGenerateMandala = async () => {
    if (!coreKeyword.trim()) {
      showToast('请输入核心主题或业务关键词', 'warning');
      return;
    }
    setLoadingMandala(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'mandala-topic')?.content || '';
      const userPrompt = `核心主题/赛道：【${coreKeyword}】。请使用曼陀罗九宫格模型发散8个维度并生成各维度的爆款短视频/直播选题。`;

      // 流式生成
      const fullText = await streamText({
        modelId: selectedModel,
        systemPrompt: promptContent,
        userPrompt,
        customModels: models,
      });
      if (!fullText.trim()) throw new Error('模型未返回内容');

      const parsed = extractJsonFromAIResponse<MandalaDimension[]>(fullText, []);
      if (!parsed || parsed.length === 0) {
        throw new Error('未能正确解析选题矩阵数据，请重试');
      }

      setDimensions(parsed);
      if (parsed[0]?.topics?.[0]) {
        setSelectedTopic(parsed[0].topics[0]);
      }
      showToast(`成功生成曼陀罗 8 维爆款选题矩阵！`, 'success');
    } catch (err: any) {
      showToast(err.message || '解析选题数据异常', 'error');
    } finally {
      setLoadingMandala(false);
    }
  };

  // Handle Profile Generation
  const handleGenerateProfile = async () => {
    if (!industry.trim()) {
      showToast('请输入行业或产品背景', 'warning');
      return;
    }
    setLoadingProfile(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'ip-profile')?.content || '';
      const userPrompt = `行业与产品：【${industry}】。\n期望人设风格：【${ipType}】。\n请输出完整的账号四件套与商业变现定位方案。`;

      // 流式生成
      const fullText = await streamText({
        modelId: selectedModel,
        systemPrompt: promptContent,
        userPrompt,
        customModels: models,
      });
      if (!fullText.trim()) throw new Error('模型未返回内容');

      const parsed = extractJsonFromAIResponse<AccountProfileSet | null>(fullText, null);
      if (!parsed) {
        throw new Error('未能正确解析人设数据，请重试');
      }

      setProfileResult(parsed);
      showToast('账号人设四件套生成成功！', 'success');
    } catch (err: any) {
      showToast(err.message || '生成人设异常', 'error');
    } finally {
      setLoadingProfile(false);
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
      {/* Top Selector & Model Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('mandala')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'mandala'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>曼陀罗九宫格选题矩阵</span>
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>账号四件套与 IP 雕琢</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cases')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'cases'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>老字号与实体转型案例</span>
          </button>
        </div>

        <div className="w-full md:w-64">
          <AIModelSelector
            models={models}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            type="text"
            moduleKey="mandala"
            label="策划大模型"
          />
        </div>
      </div>

      {/* 1. Mandala Tab */}
      {activeSubTab === 'mandala' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Input & Control */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-slate-100">曼陀罗九宫格核心词</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              基于曼陀罗思考法，输入 1 个业务核心词，AI 将向 8 大维度扩散裂变 64 个具有强前 3 秒钩子的爆款选题。
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">核心词 / 品牌赛道</label>
              <input
                type="text"
                value={coreKeyword}
                onChange={(e) => setCoreKeyword(e.target.value)}
                placeholder="例如：上海老字号糕点 / 摄影器材测评 / 零基础AI带货"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                '黄浦区老字号美食',
                '星光摄影器材选购避坑',
                '实体店低成本公域获客',
                'AI短视频带货零粉起号',
              ].map((rec) => (
                <button
                  key={rec}
                  onClick={() => setCoreKeyword(rec)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {rec}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateMandala}
              disabled={loadingMandala}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${loadingMandala ? 'animate-spin' : ''}`} />
              <span>{loadingMandala ? '正在九宫格裂变选题...' : '一键生成曼陀罗选题矩阵'}</span>
            </button>

            {selectedTopic && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-400">已选中选题详情</span>
                  <Badge variant="purple">{selectedTopic.angle}</Badge>
                </div>
                <h4 className="font-semibold text-xs text-slate-100">{selectedTopic.title}</h4>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">前3秒吸睛钩子 (Hook):</span>
                  <p className="text-xs text-indigo-300 font-medium leading-relaxed">
                    “{selectedTopic.hook}”
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onSendToStoryboard && (
                    <button
                      onClick={() => onSendToStoryboard(selectedTopic.title)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
                    >
                      <span>转至 AI 漫剧分镜</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onSendToArticle && (
                    <button
                      onClick={() => onSendToArticle(selectedTopic.title, selectedTopic.hook)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                    >
                      <span>转至图文生成</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Mandala Grid Visualization */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  8 大发散维度选题库 {dimensions.length > 0 && `(${dimensions.length} 个维度)`}
                </h3>
              </div>
              {dimensions.length > 0 && (
                <button
                  onClick={() => {
                    const content = JSON.stringify(dimensions, null, 2);
                    onSaveAsset?.({
                      id: `mandala_${Date.now()}`,
                      title: `曼陀罗选题矩阵 - ${coreKeyword}`,
                      type: 'mandala',
                      content,
                      tags: ['曼陀罗选题', '爆款矩阵', coreKeyword],
                      createdAt: new Date().toLocaleString(),
                    });
                    showToast('已保存至自媒体资产库！', 'success');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>保存至资产库</span>
                </button>
              )}
            </div>

            {dimensions.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <Grid className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">
                  点击左侧“一键生成曼陀罗选题矩阵”，AI 将围绕核心词发散 8 大爆款维度及对应选题
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                {dimensions.map((dim, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {dim.dimensionName}
                      </span>
                      <span className="text-[11px] text-slate-500">{dim.topics?.length || 0} 个选题</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{dim.description}</p>

                    <div className="space-y-2">
                      {dim.topics?.map((topic, tIdx) => {
                        const isSelected = selectedTopic?.title === topic.title;
                        return (
                          <div
                            key={tIdx}
                            onClick={() => setSelectedTopic(topic)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all space-y-1 ${
                              isSelected
                                ? 'bg-indigo-500/15 border-indigo-500/60 text-indigo-100'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-xs truncate flex-1">{topic.title}</h5>
                              <span className="text-[10px] text-slate-500 shrink-0 ml-2">{topic.angle}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">
                              钩子: {topic.hook}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Profile & 4-Set Tab */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-100">账号定位与四件套参数</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">行业 / 产品 / 品牌背景</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="例如：黄浦区非遗老字号糕点 / 摄影器材城二手相机店"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">期望人设调性</label>
              <select
                value={ipType}
                onChange={(e) => setIpType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="创始人讲品牌故事 + 真实工艺揭秘">老字号创始人 / 匠人主理人 (情怀+信任)</option>
                <option value="毒舌内行测评 + 避坑省钱指南">犀利内行测评师 (强信息差+高黏性)</option>
                <option value="保姆级零基础教学 + 实操带货达人">金牌导师 / 实操达人 (高转化+强互动)</option>
                <option value="沉浸式探店打卡 + 视觉美学博主">视觉美学策展人 (小红书种草+精致感)</option>
              </select>
            </div>

            <button
              onClick={handleGenerateProfile}
              disabled={loadingProfile}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${loadingProfile ? 'animate-spin' : ''}`} />
              <span>{loadingProfile ? '正在雕琢人设方案...' : '一键生成账号四件套'}</span>
            </button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>账号视觉四件套与商业变现方案</span>
              </h3>
              {profileResult && (
                <button
                  onClick={() => {
                    onSaveAsset?.({
                      id: `profile_${Date.now()}`,
                      title: `账号四件套 - ${profileResult.nickname}`,
                      type: 'mandala',
                      content: JSON.stringify(profileResult, null, 2),
                      tags: ['账号定位', '四件套', profileResult.nickname],
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

            {!profileResult ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <UserCheck className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">点击左侧生成，获取昵称、金句、简介、头像Prompt与背景图Prompt</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                {/* Nickname & Slogan */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400">1. 账号高权重昵称与 Slogan</span>
                    <button
                      onClick={() => copyText(`${profileResult.nickname} - ${profileResult.slogan}`, 'name')}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-slate-100">{profileResult.nickname}</h4>
                  <p className="text-xs text-rose-300 font-medium">“{profileResult.slogan}”</p>
                </div>

                {/* Bio */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400">2. 主页排版简介 (Bio)</span>
                    <button
                      onClick={() => copyText(profileResult.bio, 'bio')}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'bio' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    {profileResult.bio}
                  </pre>
                </div>

                {/* Visual Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-cyan-400">3. 头像生图 Prompt</span>
                      <button
                        onClick={() => copyText(profileResult.avatarPrompt, 'avatar')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'avatar' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      {profileResult.avatarPrompt}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-400">4. 主页背景图 Prompt</span>
                      <button
                        onClick={() => copyText(profileResult.bannerPrompt, 'banner')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'banner' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      {profileResult.bannerPrompt}
                    </p>
                  </div>
                </div>

                {/* Target Audience & Monetization */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  <span className="text-xs font-semibold text-emerald-400">5. 精准客群画像与商业变现闭环</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">目标客群:</span>
                      <p>{profileResult.targetAudience}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">变现路径:</span>
                      <p>{profileResult.monetizePath}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Cases Tab */}
      {activeSubTab === 'cases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-cyan-400" />
              <span>黄浦老字号与实体门店 AI 赋能转型标杆方案库</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              针对传统实体获客成本高、无专业内容团队的痛点，精选 3 套经过实战验证的 AI 赋能方案
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="danger">老字号美食</Badge>
                <span className="text-xs text-slate-500">经典非遗</span>
              </div>
              <h4 className="font-bold text-sm text-slate-100">「百年匠心微短剧」AI 漫剧焕新</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                利用 AI 漫剧将老字号创始人的学徒故事做成 4 集连续短剧，结合三视图统一角色形象，挂载抖音团购到店套餐，实现单月引流 3000+ 到店核销。
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="cyan">星光摄影器材城</Badge>
                <span className="text-xs text-slate-500">数码零售</span>
              </div>
              <h4 className="font-bold text-sm text-slate-100">「虚拟影棚+避坑清单」全网获客</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                通过手机随手拍二手相机，利用 AI 商业虚拟影棚一键生成日系、赛博风商用海报，配合曼陀罗避坑九宫格选题，私域转化率提升 4.2 倍。
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="purple">传统文创服饰</Badge>
                <span className="text-xs text-slate-500">国潮出海</span>
              </div>
              <h4 className="font-bold text-sm text-slate-100">「AI 虚拟模特+数字人直播」</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                无需签约昂贵模特与摄影师，一键生成多国籍 AI 试衣模特图，搭配 24 小时无人值守数字人直播间与高情商场控，海外与全网带货销量翻倍。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
