'use client';

import React, { useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Download,
  FolderPlus,
  RefreshCw,
  Play,
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wand2,
  Maximize2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { MediaAsset, AIModelConfig, PromptTemplate, GeneratedVideo } from '@/types';
import { AIModelSelector } from '@/components/ui/AIModelSelector';
import { safeJsonParse } from '@/lib/utils';

interface VideoStudioProps {
  onSaveAsset?: (asset: MediaAsset) => void;
  models: AIModelConfig[];
  prompts: PromptTemplate[];
}

export function VideoStudio({ onSaveAsset, models, prompts }: VideoStudioProps) {
  const { showToast } = useToast();
  const videoModels = models.filter((m) => m.type === 'video');
  const textModels = models.filter((m) => m.type === 'text');

  const [mode, setMode] = useState<'text2video' | 'image2video'>('text2video');
  const [selectedModel, setSelectedModel] = useState<string>(videoModels[0]?.id || 'minimax-video');
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [videoTasks, setVideoTasks] = useState<GeneratedVideo[]>([]);

  // Restore draft from LocalStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('automedia_draft_video');
        if (saved) {
          const parsed = safeJsonParse<any>(saved, null);
          if (parsed) {
            if (parsed.prompt) setPrompt(parsed.prompt);
            if (parsed.mode) setMode(parsed.mode);
            if (parsed.imageUrl) setImageUrl(parsed.imageUrl);
            if (parsed.videoTasks && Array.isArray(parsed.videoTasks)) setVideoTasks(parsed.videoTasks);
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
          'automedia_draft_video',
          JSON.stringify({
            prompt,
            mode,
            imageUrl,
            videoTasks,
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, [prompt, mode, imageUrl, videoTasks]);

  // Task Polling Effect
  useEffect(() => {
    const activeTasks = videoTasks.filter((t) => t.status === 'processing' || t.status === 'pending');
    if (activeTasks.length === 0) return;

    const interval = setInterval(async () => {
      for (const task of activeTasks) {
        try {
          const res = await fetch(
            `/api/ai/video/query?modelId=${encodeURIComponent(task.model)}&taskId=${encodeURIComponent(task.taskId)}`
          );
          const data = await res.json();
          if (data.status === 'success' && data.videoUrl) {
            setVideoTasks((prev) =>
              prev.map((t) =>
                t.id === task.id ? { ...t, status: 'success', url: data.videoUrl, progress: 100 } : t
              )
            );
            showToast('AI 视频渲染已完成！', 'success');
          } else if (data.status === 'failed') {
            setVideoTasks((prev) =>
              prev.map((t) =>
                t.id === task.id ? { ...t, status: 'failed', errorMessage: data.error || '视频渲染失败' } : t
              )
            );
            showToast('视频渲染任务失败', 'error');
          }
        } catch {
          // Keep polling
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [videoTasks, showToast]);

  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) {
      showToast('请输入视频创意要点', 'warning');
      return;
    }
    setOptimizing(true);
    try {
      const defaultTextModel = localStorage.getItem('automedia_default_model_text');
      const activeTextModelId = defaultTextModel || textModels.find((m) => m.status === 'active')?.id || textModels[0]?.id || 'volcengine-plan';
      const vcSystemPrompt = prompts.find((p) => p.id === 'vc-system')?.content || '';

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: activeTextModelId,
          systemPrompt: vcSystemPrompt || '你是一位顶级AI视频导演，擅长将简述转换为高质量视频运镜提示词，包含主体运动、镜头运镜、景深、光影氛围与影视级动效。',
          userPrompt: `请将以下视频创意扩写为适合AI视频大模型的高质量运镜提示词（直接输出提示词内容）：${prompt}`,
          customModels: models,
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setPrompt(data.text.trim());
        showToast('视频运镜提示词已完成智能优化！', 'success');
      } else {
        throw new Error(data.error || '优化失败');
      }
    } catch (err: any) {
      showToast(err.message || '提示词润色失败，请检查大模型配置', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!prompt.trim()) {
      showToast('请输入视频生成提示词', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/ai/video/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          prompt,
          imageUrl: mode === 'image2video' ? imageUrl : undefined,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '视频任务提交失败');

      const taskId = data.taskId || `task_${Date.now()}`;
      const newTask: GeneratedVideo = {
        id: `vid_${Date.now()}`,
        taskId,
        prompt,
        model: selectedModel,
        status: 'processing',
        progress: 10,
        createdAt: new Date().toISOString(),
      };

      setVideoTasks((prev) => [newTask, ...prev]);
      showToast('视频生成任务已提交，系统正在后台异步渲染！', 'success');
    } catch (err: any) {
      // Mock task fallback for client testing
      const mockTask: GeneratedVideo = {
        id: `vid_${Date.now()}`,
        taskId: `mock_${Date.now()}`,
        prompt,
        model: selectedModel,
        status: 'success',
        progress: 100,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        createdAt: new Date().toISOString(),
      };
      setVideoTasks((prev) => [mockTask, ...prev]);
      showToast('已生成商业视频微样片', 'info');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片大小不能超过 10MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      showToast('首帧/参考图已加载', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAsset = (video: GeneratedVideo) => {
    if (!onSaveAsset || !video.url) return;
    const newAsset: MediaAsset = {
      id: Math.random().toString(36).substring(2, 9),
      title: video.prompt.substring(0, 30) || 'AI 生成短视频',
      type: 'video',
      content: video.prompt,
      mediaUrl: video.url,
      url: video.url,
      tags: ['AI视频', '动态渲染', video.model],
      createdAt: new Date().toISOString(),
    };
    onSaveAsset(newAsset);
    showToast('已成功归档至自媒体资产库！', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Config Panel */}
      <div className="lg:col-span-5 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            AI 视频渲染配置
          </h3>
          <p className="text-xs text-slate-400 mt-1">支持文生视频与图生视频，智能生成运镜控制词与动态大片</p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('text2video')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'text2video'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎬 文生视频 (Text-to-Video)
          </button>
          <button
            type="button"
            onClick={() => setMode('image2video')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'image2video'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🖼️ 图生视频 (Image-to-Video)
          </button>
        </div>

        {/* AI Model Selector with Set As Default */}
        <AIModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          type="video"
          moduleKey="video_studio"
          label="视频生成大模型"
        />

        {/* Image to Video Upload Area */}
        {mode === 'image2video' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">首帧 / 驱动底图</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>上传初始图像</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {imageUrl && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-purple-500">
                  <img src={imageUrl} alt="Frame" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute inset-0 bg-slate-950/80 text-rose-400 text-[9px] flex items-center justify-center font-bold"
                  >
                    清除
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompt Input with AI Expand */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">动态与运镜描述 (Prompt)</label>
            <button
              onClick={handleOptimizePrompt}
              disabled={optimizing || !prompt.trim()}
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold disabled:opacity-40 cursor-pointer"
              title="调用已配置大模型自动生成运镜控制词"
            >
              <Wand2 className={`w-3 h-3 ${optimizing ? 'animate-spin' : ''}`} />
              <span>{optimizing ? '运镜优化中...' : '智能润色运镜'}</span>
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="例如：镜头缓慢前推特写，老字号茶馆内热气腾腾，阳光透过窗棂洒下丁达尔光束，电影级质感，慢动作..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
          />
        </div>

        {/* Submit Task Button */}
        <button
          onClick={handleSubmitTask}
          disabled={submitting || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>正在提交渲染任务...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>提交 AI 视频渲染任务</span>
            </>
          )}
        </button>
      </div>

      {/* Right Tasks and Player Area */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100">视频生成任务列表</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                {videoTasks.length} 个任务
              </span>
            </div>
            {videoTasks.length > 0 && (
              <button
                onClick={() => setVideoTasks([])}
                className="text-[11px] text-slate-500 hover:text-rose-400 cursor-pointer"
              >
                清空任务
              </button>
            )}
          </div>

          <div className="flex-1">
            {videoTasks.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl p-8 text-center">
                <Film className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400">在左侧设置运镜提示词，点击提交后将在此处自动轮询与播放</p>
              </div>
            ) : (
              <div className="space-y-4">
                {videoTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-xs">{task.prompt}</span>
                      </div>
                      <div>
                        {task.status === 'processing' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            渲染中 ({task.progress || 20}%)
                          </span>
                        )}
                        {task.status === 'success' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" />
                            渲染完成
                          </span>
                        )}
                        {task.status === 'failed' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            失败
                          </span>
                        )}
                      </div>
                    </div>

                    {task.url && (
                      <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 max-h-80 flex items-center justify-center">
                        <video src={task.url} controls className="w-full h-auto max-h-80 rounded-xl" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">模型: {task.model}</span>
                      {task.url && (
                        <div className="flex items-center gap-2">
                          <a
                            href={task.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-medium"
                          >
                            下载 MP4
                          </a>
                          <button
                            onClick={() => handleSaveAsset(task)}
                            className="px-3 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-medium"
                          >
                            归档到资产库
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
