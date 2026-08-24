'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTabId } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LoginPage } from '@/components/auth/LoginPage';
import { HotspotDiscovery } from '@/components/modules/HotspotDiscovery';
import { MandalaTopicPlanner } from '@/components/modules/MandalaTopicPlanner';
import { ComicStoryboardStudio } from '@/components/modules/ComicStoryboardStudio';
import { CommercialPhotoStudio } from '@/components/modules/CommercialPhotoStudio';
import { ArticleGenerator } from '@/components/modules/ArticleGenerator';
import { VideoScriptGenerator } from '@/components/modules/VideoScriptGenerator';
import { ImageStudio } from '@/components/modules/ImageStudio';
import { VideoStudio } from '@/components/modules/VideoStudio';
import { LiveStreamingCockpit } from '@/components/modules/LiveStreamingCockpit';
import { CommentDeriver } from '@/components/modules/CommentDeriver';
import { SmartReply } from '@/components/modules/SmartReply';
import { AccountMatrix } from '@/components/modules/AccountMatrix';
import { AssetLibrary } from '@/components/modules/AssetLibrary';
import { TrainingLmsDashboard } from '@/components/modules/TrainingLmsDashboard';
import { VisitorAnalytics } from '@/components/modules/VisitorAnalytics';
import { PromptManager } from '@/components/modules/PromptManager';
import { ModelManager } from '@/components/modules/ModelManager';
import { UserManager } from '@/components/modules/UserManager';
import { DEFAULT_PROMPTS } from '@/lib/constants/prompts';
import { DEFAULT_MODELS } from '@/lib/constants/models';
import { DEFAULT_USERS } from '@/lib/constants/users';
import { useAuth } from '@/components/auth/AuthContext';
import { ModuleErrorBoundary } from '@/components/ui/ModuleErrorBoundary';
import {
  AIModelConfig,
  PromptTemplate,
  SocialAccount,
  MediaAsset,
  UserProfile,
} from '@/types';
import { safeJsonParse } from '@/lib/utils';

// Tab configurations for error boundaries and headers
const TAB_CONFIG: Record<string, { title: string; subtitle: string; errorName?: string }> = {
  users: { title: '👥 用户与角色权限管理中枢', subtitle: '超级管理员、实训导师、老字号企业与学员 RBAC 角色指派与权限边界管控', errorName: '用户管理' },
  mandala: { title: '🎯 曼陀罗九宫格选题与 IP 策划中枢', subtitle: '核心词 8 维裂变 64 爆款选题 · 账号四件套高权重人设雕琢', errorName: '曼陀罗选题' },
  comic: { title: '🎬 AI 漫剧导演与三视图一致性工作台', subtitle: '角色/商品三视图特征锁定 · 4 阶段无限卡片流分镜', errorName: '漫剧分镜' },
  photo: { title: '📸 AI 商业视觉与老字号虚拟影棚', subtitle: '手机白底图一键置换 12+ 商用影棚场景 · 老照片高清修复', errorName: '商业影棚' },
  live: { title: '📡 智能直播操盘与排品中枢', subtitle: '四维排品看板 · 7 分钟起号全套话术剧本 · 实时弹幕场控', errorName: '直播操盘' },
  training: { title: '🏆 18 课时阶梯式实战通关与孵化看板', subtitle: '黄浦区就业促进中心 & 星光老字号公共实训基地认证', errorName: '实训教学' },
  hotspot: { title: '🔥 热点话题发现与雷达', subtitle: '实时全网抓取 Bing / 百度高热度新闻与自媒体爆款话题', errorName: '热点发现' },
  article: { title: '📝 图文文章生成工坊', subtitle: '公众号 / 抖音 / 快手 / 小红书 多平台调性长文深度撰写', errorName: '图文生成' },
  video: { title: '🎬 短视频分镜脚本生成', subtitle: '前3秒黄金吸睛钩子 · 景别运镜Prompt · 口播台词 · 配乐建议', errorName: '视频脚本' },
  image: { title: '🎨 AI 视觉图片创作', subtitle: 'MiniMax Image-01 / 腾讯混元 / Agnes 2.1 Flash 商业生图与垫图', errorName: '图片创作' },
  'video-create': { title: '🎥 AI 视频创作渲染中心', subtitle: '文生视频 / 图生视频 · 异步任务进度轮询 · 影视级动态渲染', errorName: '视频渲染' },
  comment: { title: '💬 热门评论衍生与引流', subtitle: '裂变对标神评，矩阵化高赞引流与真诚互动话术库', errorName: '评论衍生' },
  'smart-reply': { title: '🤖 棘手评论高情商回复', subtitle: '精准识别质疑/吐槽/咨询/广告意图，输出危机公关化解预案', errorName: '评论回复' },
  accounts: { title: '👥 自媒体全网矩阵账号管理', subtitle: '抖音 / 视频号 / 快手 / 小红书 矩阵管理与广告法违规词自检', errorName: '账号矩阵' },
  assets: { title: '📂 自媒体数字资产库', subtitle: '图文、脚本、漫剧、三视图、影棚大片与直播剧本全模态归档检索', errorName: '资产库' },
  'ip-stats': { title: '🌐 访客 IP 与地域数据统计', subtitle: '实时独立访客 IP、省市地域分布、网络运营商与流水日志', errorName: '访客统计' },
  prompts: { title: '⚙️ 提示词系统配置', subtitle: '全模块 System Prompt 与各平台人设指令调优管理', errorName: '提示词管理' },
  models: { title: '🤖 大模型引擎与 API Key 配置', subtitle: 'MiniMax、火山方舟、混元、Agnes、Seedance 接口与模型自动识别', errorName: '模型配置' },
};

export default function HomePage() {
  const { user: authUser, isLoggedIn, isLoading: authLoading, logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTabId>('mandala');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Persistent States
  const [models, setModels] = useState<AIModelConfig[]>(DEFAULT_MODELS);
  const [prompts, setPrompts] = useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authUser);

  // Cross-module prefill states
  const [articlePrefill, setArticlePrefill] = useState<{ topic: string; summary: string }>({ topic: '', summary: '' });
  const [videoPrefill, setVideoPrefill] = useState<{ theme: string; summary: string }>({ theme: '', summary: '' });
  const [comicPrefill, setComicPrefill] = useState<string>('');
  const [videoStudioPrefill, setVideoStudioPrefill] = useState<string>('');

  // Sync auth user - keep in sync when auth state changes
  useEffect(() => {
    if (authUser) setCurrentUser(authUser);
  }, [authUser]);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedModels = localStorage.getItem('automedia_models');
      if (savedModels) setModels(safeJsonParse(savedModels, DEFAULT_MODELS));

      const savedPrompts = localStorage.getItem('automedia_prompts');
      if (savedPrompts) setPrompts(safeJsonParse(savedPrompts, DEFAULT_PROMPTS));
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Load server-persisted assets after login
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    const loadAssets = async () => {
      try {
        const res = await fetch('/api/data/assets', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.assets)) {
          setAssets(data.assets);
        }
      } catch { /* offline → keep local state */ }
    };
    loadAssets();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // Save helpers
  const saveToStorage = (key: string, data: unknown) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const updateModels = (newModels: AIModelConfig[]) => {
    setModels(newModels);
    saveToStorage('automedia_models', newModels);
  };

  const updatePrompts = (newPrompts: PromptTemplate[]) => {
    setPrompts(newPrompts);
    saveToStorage('automedia_prompts', newPrompts);
  };

  const updateAccounts = (newAccounts: SocialAccount[]) => {
    setAccounts(newAccounts);
  };

  /** Save asset locally + sync to server (fire-and-forget) */
  const handleSaveAsset = (asset: MediaAsset) => {
    setAssets((prev) => [asset, ...prev]);
    fetch('/api/data/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    }).catch(() => { /* silent — local copy still exists */ });
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/data/assets?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleClearAssets = () => {
    setAssets([]);
    fetch('/api/data/assets?id=__all__', { method: 'DELETE' }).catch(() => {});
  };

  // Cross-module navigation handlers
  const handleQuickArticle = (title: string, summary: string) => {
    setArticlePrefill({ topic: title, summary });
    setActiveTab('article');
  };

  const handleQuickVideo = (title: string, summary: string) => {
    setVideoPrefill({ theme: title, summary });
    setActiveTab('video');
  };

  const handleSendToStoryboard = (theme: string) => {
    setComicPrefill(theme);
    setActiveTab('comic');
  };

  const handleSendToVideoStudio = (prompt: string) => {
    setVideoStudioPrefill(prompt);
    setActiveTab('video-create');
  };

  // While reading localStorage on initial client mount
  if (!isHydrated || authLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the login page
  if (!isLoggedIn || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          // No need to manually sync - authUser is synced via useEffect above
          // The component will re-render automatically when auth state changes
        }}
      />
    );
  }

  const handleLogout = () => {
    authLogout();
  };

  // Render modules with error boundaries and keep state persistent in DOM
  const renderModule = (tab: NavTabId, children: React.ReactNode) => (
    <div key={tab} className={activeTab === tab ? 'block' : 'hidden'}>
      <ModuleErrorBoundary moduleName={TAB_CONFIG[tab]?.errorName || tab}>
        {children}
      </ModuleErrorBoundary>
    </div>
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accountCount={accounts.length}
        assetCount={assets.length}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          title={TAB_CONFIG[activeTab]?.title || activeTab}
          subtitle={TAB_CONFIG[activeTab]?.subtitle || ''}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenUsers={() => setActiveTab('users')}
        />

        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto pb-12">
            {renderModule('users',
              <UserManager
                users={users}
                currentUser={currentUser}
                onAddUser={(u) => {
                  setUsers([...users, u]);
                }}
                onUpdateUser={(u) => {
                  setUsers(users.map((item) => (item.id === u.id ? u : item)));
                  if (currentUser.id === u.id) setCurrentUser(u);
                }}
                onDeleteUser={(id) => {
                  setUsers(users.filter((item) => item.id !== id));
                }}
                onSwitchUser={(u) => {
                  setCurrentUser(u);
                  setUsers(users.map((item) => (item.id === u.id ? { ...u, lastLoginAt: '刚刚' } : item)));
                }}
              />
            )}

            {renderModule('mandala',
              <MandalaTopicPlanner
                models={models}
                prompts={prompts}
                onSaveAsset={handleSaveAsset}
                onSendToArticle={handleQuickArticle}
                onSendToStoryboard={handleSendToStoryboard}
              />
            )}

            {renderModule('comic',
              <ComicStoryboardStudio
                models={models}
                prompts={prompts}
                initialTheme={comicPrefill}
                onSaveAsset={handleSaveAsset}
                onSendToVideoStudio={handleSendToVideoStudio}
              />
            )}

            {renderModule('photo',
              <CommercialPhotoStudio
                models={models}
                prompts={prompts}
                onSaveAsset={handleSaveAsset}
              />
            )}

            {renderModule('live',
              <LiveStreamingCockpit
                models={models}
                prompts={prompts}
                onSaveAsset={handleSaveAsset}
              />
            )}

            {renderModule('training',
              <TrainingLmsDashboard models={models} prompts={prompts} assets={assets} />
            )}

            {renderModule('hotspot',
              <HotspotDiscovery
                onQuickGenerateArticle={handleQuickArticle}
                onQuickGenerateVideo={handleQuickVideo}
              />
            )}

            {renderModule('article',
              <ArticleGenerator
                initialTopic={articlePrefill.topic}
                initialSummary={articlePrefill.summary}
                onSaveAsset={handleSaveAsset}
                models={models}
                prompts={prompts}
              />
            )}

            {renderModule('video',
              <VideoScriptGenerator
                initialTheme={videoPrefill.theme}
                initialSummary={videoPrefill.summary}
                onSaveAsset={handleSaveAsset}
                models={models}
                prompts={prompts}
              />
            )}

            {renderModule('image',
              <ImageStudio onSaveAsset={handleSaveAsset} models={models} prompts={prompts} />
            )}

            {renderModule('video-create',
              <VideoStudio onSaveAsset={handleSaveAsset} models={models} prompts={prompts} />
            )}

            {renderModule('comment',
              <CommentDeriver onSaveAsset={handleSaveAsset} models={models} prompts={prompts} />
            )}

            {renderModule('smart-reply',
              <SmartReply models={models} prompts={prompts} />
            )}

            {renderModule('accounts',
              <AccountMatrix
                accounts={accounts}
                onAddAccount={(acc) => updateAccounts([acc, ...accounts])}
                onUpdateAccount={(acc) =>
                  updateAccounts(accounts.map((a) => (a.id === acc.id ? acc : a)))
                }
                onDeleteAccount={(id) => updateAccounts(accounts.filter((a) => a.id !== id))}
                models={models}
                prompts={prompts}
              />
            )}

            {renderModule('assets',
              <AssetLibrary
                assets={assets}
                onDeleteAsset={handleDeleteAsset}
                onClearAll={handleClearAssets}
              />
            )}

            {renderModule('ip-stats', <VisitorAnalytics />)}

            {renderModule('prompts',
              <PromptManager
                prompts={prompts}
                onUpdatePrompt={(prompt) => updatePrompts(prompts.map((p) => (p.id === prompt.id ? prompt : p)))}
                onAddPrompt={(prompt) => updatePrompts([prompt, ...prompts])}
                onDeletePrompt={(id) => updatePrompts(prompts.filter((p) => p.id !== id))}
                onResetDefaults={() => updatePrompts(DEFAULT_PROMPTS)}
              />
            )}

            {renderModule('models',
              <ModelManager
                models={models}
                onUpdateModel={(model) => updateModels(models.map((m) => (m.id === model.id ? model : m)))}
                onAddModel={(model) => updateModels([...models, model])}
                onDeleteModel={(id) => updateModels(models.filter((m) => m.id !== id))}
                onResetDefaults={() => updateModels(DEFAULT_MODELS)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
