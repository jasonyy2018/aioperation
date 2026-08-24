'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Sparkles,
  Copy,
  Download,
  FolderPlus,
  RefreshCw,
  Music,
  Plus,
  Trash2,
  Volume2,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { MediaAsset, AIModelConfig, PromptTemplate, VideoScriptData, ScriptScene } from '@/types';

import { AIModelSelector } from '@/components/ui/AIModelSelector';
import { safeJsonParse, extractJsonFromAIResponse } from '@/lib/utils';

interface VideoScriptGeneratorProps {
  initialTheme?: string;
  initialSummary?: string;
  onSaveAsset?: (asset: MediaAsset) => void;
  models: AIModelConfig[];
  prompts: PromptTemplate[];
}

export function VideoScriptGenerator({
  initialTheme = '',
  initialSummary = '',
  onSaveAsset,
  models,
  prompts,
}: VideoScriptGeneratorProps) {
  const { showToast } = useToast();
  const [platform, setPlatform] = useState<'shipinhao' | 'douyin' | 'kuaishou' | 'xiaohongshu'>('douyin');
  const [theme, setTheme] = useState(initialTheme);
  const [duration, setDuration] = useState('30s');
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedModel, setSelectedModel] = useState<string>(textModels[0]?.id || 'volcengine-plan');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [scenes, setScenes] = useState<ScriptScene[]>([]);
  const [selectedBgm, setSelectedBgm] = useState<string>('轻快科技节奏 (UP Beat Tech)');

  // Restore draft on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('automedia_draft_videoscript');
        if (saved) {
          const parsed = safeJsonParse<any>(saved, null);
          if (parsed) {
            if (!initialTheme && parsed.theme) setTheme(parsed.theme);
            if (parsed.platform) setPlatform(parsed.platform);
            if (parsed.duration) setDuration(parsed.duration);
            if (parsed.selectedBgm) setSelectedBgm(parsed.selectedBgm);
            if (parsed.scenes && Array.isArray(parsed.scenes)) setScenes(parsed.scenes);
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
          'automedia_draft_videoscript',
          JSON.stringify({
            theme,
            platform,
            duration,
            selectedBgm,
            scenes,
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme, platform, duration, selectedBgm, scenes]);

  useEffect(() => {
    if (initialTheme) setTheme(initialTheme);
  }, [initialTheme]);

  const platformList = [
    { id: 'douyin', name: '抖音爆款', promptId: 'video-douyin', badge: '强反转' },
    { id: 'shipinhao', name: '微信视频号', promptId: 'video-shipinhao', badge: '高社交信任' },
    { id: 'kuaishou', name: '快手老铁', promptId: 'video-kuaishou', badge: '接地气实操' },
    { id: 'xiaohongshu', name: '小红书视频', promptId: 'video-xiaohongshu', badge: '精致质感' },
  ];

  const bgmList = [
    '轻快科技节奏 (UP Beat Tech)',
    '悬疑反转氛围 (Deep Suspense)',
    '治愈温暖原声 (Acoustic Warm)',
    '燃系快节奏卡点 (Epic Bass Drop)',
    '国风唯美意境 (Cinematic Oriental)',
  ];

  const handleGenerate = async () => {
    if (!theme.trim()) {
      showToast('请输入短视频主题', 'warning');
      return;
    }

    setLoading(true);
    try {
      const platObj = platformList.find((p) => p.id === platform);
      const matchedPrompt = prompts.find((p) => p.id === platObj?.promptId)?.content || '';

      const systemPrompt = `${matchedPrompt}
你必须严格以合法的 JSON 数组格式返回分镜列表，不要包含任何 markdown 块标记或多余文字。
每个分镜对象包含：
{
  "timeRange": "00:00-00:05",
  "sceneDescription": "分镜画面与景别（如特写、全景、运镜）",
  "visualPrompt": "可用于生图或生视频的高清英文或中文描述词",
  "dialogue": "台词/旁白/配音",
  "bgm": "推荐背景音乐/音效"
}`;

      const userPrompt = `目标视频时长：${duration}。视频主题：${theme}。请设计具有强吸睛前3秒和高完播率的分镜脚本。`;

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
      if (!res.ok || data.error) throw new Error(data.error || '生成分镜失败');

      const rawParsed = extractJsonFromAIResponse<any[]>(data.text, []);
      if (!rawParsed || !Array.isArray(rawParsed) || rawParsed.length === 0) {
        throw new Error('未能正确解析分镜数据');
      }

      const parsed: ScriptScene[] = rawParsed.map((s: any, idx: number) => ({
        id: `scene-${idx + 1}`,
        timeRange: s.timeRange || `00:${idx * 5}-00:${(idx + 1) * 5}`,
        sceneDescription: s.sceneDescription || '',
        visualPrompt: s.visualPrompt || '',
        dialogue: s.dialogue || '',
        bgm: s.bgm || selectedBgm,
      }));

      setScenes(parsed);
      showToast(`已成功拆解生成 ${parsed.length} 个镜头分镜！`, 'success');
    } catch (err: any) {
      // Fallback: create default structured scenes
      const fallbackScenes: ScriptScene[] = [
        {
          id: 'scene-1',
          timeRange: '00:00-00:03',
          sceneDescription: '【前置吸睛钩子】特写镜头，快速推近人物震惊神情，画面上方悬浮大字标红标题。',
          visualPrompt: 'Cinematic close-up, dramatic lighting, intense facial expression, 8k resolution',
          dialogue: '“90%的人做自媒体都踩了这个坑，今天一次性给你讲透！”',
          bgm: '急促重低音音效 + 重击鼓点',
        },
        {
          id: 'scene-2',
          timeRange: '00:03-00:15',
          sceneDescription: '【痛点展开】中景，创作者指着后台数据折线图，屏幕切换真实操作界面。',
          visualPrompt: 'Medium shot, tech workspace, analytics dashboard glow, clean modern aesthetic',
          dialogue: '“为什么你天天日更还是几百播放？核心就在于前3秒没有建立认知反差……”',
          bgm: selectedBgm,
        },
        {
          id: 'scene-3',
          timeRange: '00:15-00:30',
          sceneDescription: '【解决方案与行动召唤】全景，快速展示核心3步工作流，最后定格主页关注引导卡片。',
          visualPrompt: 'High quality studio setting, infographic overlays, smiling host, warm ambient light',
          dialogue: '“第一步抓情绪，第二步给方案，第三步留钩子。点赞收藏，下期直接套用模板！”',
          bgm: selectedBgm,
        },
      ];
      setScenes(fallbackScenes);
      showToast('已生成标准爆款分镜模板', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (scenes.length === 0) return;
    const text = scenes
      .map(
        (s, idx) =>
          `镜头 ${idx + 1} [${s.timeRange}]\n画面：${s.sceneDescription}\n画面Prompt：${s.visualPrompt}\n台词：${s.dialogue}\nBGM/音效：${s.bgm}\n`
      )
      .join('\n----------------------\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('分镜脚本已复制到剪贴板', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToAsset = () => {
    if (scenes.length === 0) {
      showToast('请先生成分镜脚本', 'warning');
      return;
    }
    const content = JSON.stringify({ theme, platform, duration, scenes }, null, 2);
    const newAsset: MediaAsset = {
      id: Math.random().toString(36).substring(2, 9),
      title: `${theme} (短视频分镜脚本)`,
      type: 'script',
      content,
      platform,
      tags: [platform, duration, `${scenes.length}分镜`],
      createdAt: new Date().toISOString(),
    };
    if (onSaveAsset) {
      onSaveAsset(newAsset);
      showToast('已将分镜脚本存入自媒体资产库！', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Setting Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-400" />
            <h3 className="font-semibold text-slate-100 text-sm">短视频爆款脚本策划引擎</h3>
          </div>
          <span className="text-xs text-slate-400">镜头切分 · 视觉Prompt · 台词设计</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Platform */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">目标分发平台</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
            >
              {platformList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.badge})
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">视频目标时长</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
            >
              <option value="15s">15秒 (极速前3秒钩子)</option>
              <option value="30s">30秒 (黄金转化结构)</option>
              <option value="60s">60秒 (深度知识拆解)</option>
              <option value="3min">3分钟 (沉浸式叙事)</option>
            </select>
          </div>

          {/* Model Selector with Set As Default */}
          <AIModelSelector
            models={models}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            type="text"
            moduleKey="video_script"
            label="分镜生成模型"
          />

          {/* BGM recommendation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">推荐配乐调性</label>
            <select
              value={selectedBgm}
              onChange={(e) => setSelectedBgm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
            >
              {bgmList.map((bgm, idx) => (
                <option key={idx} value={bgm}>
                  {bgm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme input & Generate button */}
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="输入短视频策划主题（如：给小白的3个AI变现副业方向）..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-sm shadow-md shadow-pink-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'AI 正在拆解分镜...' : '一键生成分镜脚本'}</span>
          </button>
        </div>
      </div>

      {/* Storyboard Table */}
      {scenes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">分镜脚本清单</span>
              <span className="text-xs bg-pink-500/15 text-pink-400 px-2 py-0.5 rounded-md border border-pink-500/30">
                共 {scenes.length} 个镜头
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制脚本' : '复制全部分镜'}</span>
              </button>

              <button
                onClick={handleSaveToAsset}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>存入资产库</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950/40">
                  <th className="py-3 px-4 w-20">序号/时间</th>
                  <th className="py-3 px-4 w-1/4">画面景别与动作描述</th>
                  <th className="py-3 px-4 w-1/4">视觉生成 Prompt</th>
                  <th className="py-3 px-4">台词 / 口播旁白</th>
                  <th className="py-3 px-4 w-40">BGM / 音效建议</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {scenes.map((scene, idx) => (
                  <tr key={scene.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <span className="font-semibold text-pink-400">#{idx + 1}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{scene.timeRange}</div>
                    </td>
                    <td className="py-3.5 px-4 leading-relaxed font-medium text-slate-200">
                      {scene.sceneDescription}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-300/90 leading-relaxed bg-slate-950/30 rounded">
                      {scene.visualPrompt}
                    </td>
                    <td className="py-3.5 px-4 leading-relaxed text-emerald-300/90">
                      {scene.dialogue}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span>{scene.bgm}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
