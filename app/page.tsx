'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTabId } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
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
import { DEFAULT_PROMPTS } from '@/lib/constants/prompts';
import { DEFAULT_MODELS } from '@/lib/constants/models';
import { AIModelConfig, PromptTemplate, SocialAccount, MediaAsset } from '@/types';
import { safeJsonParse } from '@/lib/utils';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTabId>('mandala');

  // Persistent States
  const [models, setModels] = useState<AIModelConfig[]>(DEFAULT_MODELS);
  const [prompts, setPrompts] = useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  // Cross-module prefill states
  const [articlePrefill, setArticlePrefill] = useState<{ topic: string; summary: string }>({
    topic: '',
    summary: '',
  });
  const [videoPrefill, setVideoPrefill] = useState<{ theme: string; summary: string }>({
    theme: '',
    summary: '',
  });
  const [comicPrefill, setComicPrefill] = useState<string>('');
  const [videoStudioPrefill, setVideoStudioPrefill] = useState<string>('');

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedModels = localStorage.getItem('automedia_models');
        if (savedModels) {
          setModels(safeJsonParse(savedModels, DEFAULT_MODELS));
        }
        const savedPrompts = localStorage.getItem('automedia_prompts');
        if (savedPrompts) {
          setPrompts(safeJsonParse(savedPrompts, DEFAULT_PROMPTS));
        }
        const savedAccounts = localStorage.getItem('automedia_accounts');
        if (savedAccounts) {
          setAccounts(safeJsonParse(savedAccounts, []));
        }
        const savedAssets = localStorage.getItem('automedia_assets');
        if (savedAssets) {
          setAssets(safeJsonParse(savedAssets, []));
        }
      }
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    }
  }, []);

  // Save to LocalStorage helpers
  const updateModels = (newModels: AIModelConfig[]) => {
    setModels(newModels);
    if (typeof window !== 'undefined') {
      localStorage.setItem('automedia_models', JSON.stringify(newModels));
    }
  };

  const updatePrompts = (newPrompts: PromptTemplate[]) => {
    setPrompts(newPrompts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('automedia_prompts', JSON.stringify(newPrompts));
    }
  };

  const updateAccounts = (newAccounts: SocialAccount[]) => {
    setAccounts(newAccounts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('automedia_accounts', JSON.stringify(newAccounts));
    }
  };

  const updateAssets = (newAssets: MediaAsset[]) => {
    setAssets(newAssets);
    if (typeof window !== 'undefined') {
      localStorage.setItem('automedia_assets', JSON.stringify(newAssets));
    }
  };

  // Cross-module Handlers
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

  const handleSaveAsset = (asset: MediaAsset) => {
    const updated = [asset, ...assets];
    updateAssets(updated);
  };

  // Tab Header Details
  const getTabHeader = () => {
    switch (activeTab) {
      case 'mandala':
        return {
          title: '🎯 曼陀罗九宫格选题与 IP 策划中枢',
          subtitle: '核心词 8 维裂变 64 爆款选题 · 账号四件套高权重人设雕琢 · 老字号实体转型案例',
        };
      case 'comic':
        return {
          title: '🎬 AI 漫剧导演与三视图一致性工作台',
          subtitle: '角色/商品三视图特征锁定 · 4 阶段无限卡片流分镜 · FABE 带货与图生视频运镜',
        };
      case 'photo':
        return {
          title: '📸 AI 商业视觉与老字号虚拟影棚',
          subtitle: '手机白底图一键置换 12+ 商用影棚场景 · 老照片高清修复动态化 · 高 CTR 爆款封面',
        };
      case 'live':
        return {
          title: '📡 智能直播操盘与排品中枢',
          subtitle: '四维排品看板 (引流/爆款/利润/赠品) · 7 分钟起号全套话术剧本 · 实时弹幕场控助手',
        };
      case 'training':
        return {
          title: '🏆 18 课时阶梯式实战通关与孵化看板',
          subtitle: '黄浦区就业促进中心 & 星光老字号公共实训基地认证 · AI 多维智能初审与政策对接',
        };
      case 'hotspot':
        return {
          title: '🔥 热点话题发现与雷达',
          subtitle: '实时全网抓取 Bing / 百度高热度新闻与自媒体爆款话题',
        };
      case 'article':
        return {
          title: '📝 图文文章生成工坊',
          subtitle: '公众号 / 抖音 / 快手 / 小红书 多平台调性长文深度撰写',
        };
      case 'video':
        return {
          title: '🎬 短视频分镜脚本生成',
          subtitle: '前3秒黄金吸睛钩子 · 景别运镜Prompt · 口播台词 · 配乐建议',
        };
      case 'image':
        return {
          title: '🎨 AI 视觉图片创作',
          subtitle: 'MiniMax Image-01 / 腾讯混元 / Agnes 2.1 Flash 商业生图与垫图',
        };
      case 'video-create':
        return {
          title: '🎥 AI 视频创作渲染中心',
          subtitle: '文生视频 / 图生视频 · 异步任务进度轮询 · 影视级动态渲染',
        };
      case 'comment':
        return {
          title: '💬 热门评论衍生与引流',
          subtitle: '裂变对标神评，矩阵化高赞引流与真诚互动话术库',
        };
      case 'smart-reply':
        return {
          title: '🤖 棘手评论高情商回复',
          subtitle: '精准识别质疑/吐槽/咨询/广告意图，输出危机公关化解预案',
        };
      case 'accounts':
        return {
          title: '👥 自媒体全网矩阵账号管理',
          subtitle: '抖音 / 视频号 / 快手 / 小红书 / B站 账号健康度与资产看板',
        };
      case 'assets':
        return {
          title: '📂 自媒体数字资产库',
          subtitle: '图文、脚本、漫剧、三视图、影棚大片与直播剧本统一归档检索',
        };
      case 'ip-stats':
        return {
          title: '🌐 访客 IP 与地域数据统计',
          subtitle: '实时独立访客 IP、省市地域分布、网络运营商与流水日志',
        };
      case 'prompts':
        return {
          title: '⚙️ 提示词系统配置',
          subtitle: '全模块 System Prompt 与各平台人设指令调优管理',
        };
      case 'models':
        return {
          title: '🤖 大模型引擎与 API Key 配置',
          subtitle: 'MiniMax、火山方舟、混元、Agnes、Seedance 接口与模型自动识别',
        };
    }
  };

  const headerInfo = getTabHeader();

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accountCount={accounts.length}
        assetCount={assets.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header title={headerInfo.title} subtitle={headerInfo.subtitle} />

        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto pb-12">
            {/* 1. New Core Engines */}
            {activeTab === 'mandala' && (
              <MandalaTopicPlanner
                models={models}
                prompts={prompts}
                onSaveAsset={handleSaveAsset}
                onSendToArticle={handleQuickArticle}
                onSendToStoryboard={handleSendToStoryboard}
              />
            )}

            {activeTab === 'comic' && (
              <ComicStoryboardStudio
                models={models}
                prompts={prompts}
                initialTheme={comicPrefill}
                onSaveAsset={handleSaveAsset}
                onSendToVideoStudio={handleSendToVideoStudio}
              />
            )}

            {activeTab === 'photo' && (
              <CommercialPhotoStudio
                models={models}
                prompts={prompts}
                onSaveAsset={handleSaveAsset}
              />
            )}

            {activeTab === 'live' && (
              <LiveStreamingCockpit
                models={models}
                prompts={prompts}
                onSaveAsset={handleSaveAsset}
              />
            )}

            {activeTab === 'training' && (
              <TrainingLmsDashboard models={models} prompts={prompts} />
            )}

            {/* 2. Original Creation & Operations Modules */}
            {activeTab === 'hotspot' && (
              <HotspotDiscovery
                onQuickGenerateArticle={handleQuickArticle}
                onQuickGenerateVideo={handleQuickVideo}
              />
            )}

            {activeTab === 'article' && (
              <ArticleGenerator
                initialTopic={articlePrefill.topic}
                initialSummary={articlePrefill.summary}
                onSaveAsset={handleSaveAsset}
                models={models}
                prompts={prompts}
              />
            )}

            {activeTab === 'video' && (
              <VideoScriptGenerator
                initialTheme={videoPrefill.theme}
                initialSummary={videoPrefill.summary}
                onSaveAsset={handleSaveAsset}
                models={models}
                prompts={prompts}
              />
            )}

            {activeTab === 'image' && (
              <ImageStudio onSaveAsset={handleSaveAsset} models={models} prompts={prompts} />
            )}

            {activeTab === 'video-create' && (
              <VideoStudio onSaveAsset={handleSaveAsset} models={models} prompts={prompts} />
            )}

            {activeTab === 'comment' && (
              <CommentDeriver onSaveAsset={handleSaveAsset} models={models} prompts={prompts} />
            )}

            {activeTab === 'smart-reply' && (
              <SmartReply models={models} prompts={prompts} />
            )}

            {activeTab === 'accounts' && (
              <AccountMatrix
                accounts={accounts}
                onAddAccount={(acc) => updateAccounts([acc, ...accounts])}
                onUpdateAccount={(acc) =>
                  updateAccounts(accounts.map((a) => (a.id === acc.id ? acc : a)))
                }
                onDeleteAccount={(id) => updateAccounts(accounts.filter((a) => a.id !== id))}
              />
            )}

            {activeTab === 'assets' && (
              <AssetLibrary
                assets={assets}
                onDeleteAsset={(id) => updateAssets(assets.filter((a) => a.id !== id))}
                onClearAll={() => updateAssets([])}
              />
            )}

            {activeTab === 'ip-stats' && <VisitorAnalytics />}

            {activeTab === 'prompts' && (
              <PromptManager
                prompts={prompts}
                onUpdatePrompt={(prompt) =>
                  updatePrompts(prompts.map((p) => (p.id === prompt.id ? prompt : p)))
                }
                onAddPrompt={(prompt) => updatePrompts([prompt, ...prompts])}
                onDeletePrompt={(id) => updatePrompts(prompts.filter((p) => p.id !== id))}
                onResetDefaults={() => updatePrompts(DEFAULT_PROMPTS)}
              />
            )}

            {activeTab === 'models' && (
              <ModelManager
                models={models}
                onUpdateModel={(model) =>
                  updateModels(models.map((m) => (m.id === model.id ? model : m)))
                }
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
