'use client';

import React from 'react';
import {
  Flame,
  FileText,
  Video,
  Image as ImageIcon,
  Film,
  MessageSquareShare,
  BotMessageSquare,
  Users2,
  FolderArchive,
  Globe,
  Settings2,
  Cpu,
  Sparkles,
  Compass,
  Clapperboard,
  Camera,
  Radio,
  Award,
  BookOpen,
} from 'lucide-react';

export type NavTabId =
  | 'hotspot'
  | 'mandala'
  | 'comic'
  | 'photo'
  | 'article'
  | 'video'
  | 'image'
  | 'video-create'
  | 'live'
  | 'comment'
  | 'smart-reply'
  | 'accounts'
  | 'assets'
  | 'training'
  | 'ip-stats'
  | 'prompts'
  | 'models';

interface SidebarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  accountCount?: number;
  assetCount?: number;
}

export function Sidebar({ activeTab, onTabChange, accountCount = 0, assetCount = 0 }: SidebarProps) {
  const navItems = [
    {
      group: '🚀 实战创作工作台',
      items: [
        { id: 'mandala', label: '曼陀罗选题与IP', icon: Compass, badge: '核心', color: 'text-rose-400' },
        { id: 'comic', label: 'AI漫剧与三视图', icon: Clapperboard, badge: '漫剧', color: 'text-purple-400' },
        { id: 'photo', label: '商业虚拟影棚', icon: Camera, badge: '出片', color: 'text-cyan-400' },
        { id: 'hotspot', label: '全网热点雷达', icon: Flame, color: 'text-orange-400' },
        { id: 'article', label: '多平台爆款图文', icon: FileText, color: 'text-indigo-400' },
        { id: 'video', label: '短视频分镜脚本', icon: Video, color: 'text-pink-400' },
        { id: 'image', label: 'AI 商业生图', icon: ImageIcon, color: 'text-sky-400' },
        { id: 'video-create', label: 'AI 视频运镜渲染', icon: Film, color: 'text-purple-400' },
      ],
    },
    {
      group: '🎙️ 直播与运营中枢',
      items: [
        { id: 'live', label: '智能直播操盘中枢', icon: Radio, badge: '带货', color: 'text-red-400' },
        { id: 'comment', label: '热门评论衍生', icon: MessageSquareShare, color: 'text-emerald-400' },
        { id: 'smart-reply', label: '棘手评论回复', icon: BotMessageSquare, color: 'text-amber-400' },
        {
          id: 'accounts',
          label: '全网矩阵账号',
          icon: Users2,
          badge: accountCount > 0 ? `${accountCount}` : undefined,
          color: 'text-blue-400',
        },
        {
          id: 'assets',
          label: '自媒体数字资产',
          icon: FolderArchive,
          badge: assetCount > 0 ? `${assetCount}` : undefined,
          color: 'text-teal-400',
        },
      ],
    },
    {
      group: '🎓 实训教学与孵化',
      items: [
        { id: 'training', label: '18课时通关打卡', icon: Award, badge: '黄浦', color: 'text-amber-400' },
        { id: 'ip-stats', label: '访客地域与统计', icon: Globe, color: 'text-cyan-400' },
      ],
    },
    {
      group: '⚙️ 系统配置与底座',
      items: [
        { id: 'models', label: '大模型引擎配置', icon: Cpu, badge: '识别', color: 'text-rose-400' },
        { id: 'prompts', label: '提示词与人设', icon: Settings2, color: 'text-slate-400' },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full select-none z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-rose-600/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
              AI 赋能直播网创平台
            </h1>
            <p className="text-[10px] text-rose-400 font-mono">LiveOps OS v2.0</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {group.group}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id as NavTabId)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-500/15 to-purple-500/15 text-white border border-rose-500/30 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-rose-400' : item.color || 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom User / Info Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            星光
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">黄浦实训 · 官方工作台</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              全链路引擎就绪
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
