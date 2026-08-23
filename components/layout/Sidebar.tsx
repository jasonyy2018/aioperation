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
  Shield,
  UserCheck,
} from 'lucide-react';
import { UserProfile, PermissionKey } from '@/types';
import { ROLE_DEFINITIONS, hasPermission } from '@/lib/constants/users';

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
  | 'models'
  | 'users';

interface SidebarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  accountCount?: number;
  assetCount?: number;
  currentUser?: UserProfile;
}

export function Sidebar({
  activeTab,
  onTabChange,
  accountCount = 0,
  assetCount = 0,
  currentUser,
}: SidebarProps) {
  const roleDef = currentUser ? ROLE_DEFINITIONS[currentUser.role] : ROLE_DEFINITIONS.admin;

  const navGroups: {
    group: string;
    items: {
      id: NavTabId;
      label: string;
      icon: any;
      badge?: string;
      color?: string;
      permission?: PermissionKey;
    }[];
  }[] = [
    {
      group: '🚀 实战创作工作台',
      items: [
        { id: 'mandala', label: '曼陀罗选题与IP', icon: Compass, badge: '核心', color: 'text-rose-400', permission: 'create_content' },
        { id: 'comic', label: 'AI漫剧与三视图', icon: Clapperboard, badge: '漫剧', color: 'text-purple-400', permission: 'create_content' },
        { id: 'photo', label: '商业虚拟影棚', icon: Camera, badge: '出片', color: 'text-cyan-400', permission: 'create_content' },
        { id: 'hotspot', label: '全网热点雷达', icon: Flame, color: 'text-orange-400', permission: 'create_content' },
        { id: 'article', label: '多平台爆款图文', icon: FileText, color: 'text-indigo-400', permission: 'create_content' },
        { id: 'video', label: '短视频分镜脚本', icon: Video, color: 'text-pink-400', permission: 'create_content' },
        { id: 'image', label: 'AI 商业生图', icon: ImageIcon, color: 'text-sky-400', permission: 'create_content' },
        { id: 'video-create', label: 'AI 视频运镜渲染', icon: Film, color: 'text-purple-400', permission: 'create_content' },
      ],
    },
    {
      group: '🎙️ 直播与运营中枢',
      items: [
        { id: 'live', label: '智能直播操盘中枢', icon: Radio, badge: '带货', color: 'text-red-400', permission: 'live_cockpit' },
        { id: 'comment', label: '热门评论衍生', icon: MessageSquareShare, color: 'text-emerald-400', permission: 'create_content' },
        { id: 'smart-reply', label: '棘手评论回复', icon: BotMessageSquare, color: 'text-amber-400', permission: 'create_content' },
        {
          id: 'accounts',
          label: '全网矩阵账号',
          icon: Users2,
          badge: accountCount > 0 ? `${accountCount}` : undefined,
          color: 'text-blue-400',
          permission: 'account_matrix',
        },
        {
          id: 'assets',
          label: '自媒体数字资产',
          icon: FolderArchive,
          badge: assetCount > 0 ? `${assetCount}` : undefined,
          color: 'text-teal-400',
          permission: 'manage_assets',
        },
      ],
    },
    {
      group: '🎓 实训教学与孵化',
      items: [
        { id: 'training', label: '18课时通关打卡', icon: Award, badge: '黄浦', color: 'text-amber-400', permission: 'lms_submit' },
        { id: 'ip-stats', label: '访客地域与统计', icon: Globe, color: 'text-cyan-400', permission: 'view_analytics' },
      ],
    },
    {
      group: '⚙️ 系统配置与权限底座',
      items: [
        { id: 'users', label: '用户与角色权限', icon: Shield, badge: 'RBAC', color: 'text-emerald-400', permission: 'manage_users' },
        { id: 'models', label: '大模型引擎配置', icon: Cpu, badge: '识别', color: 'text-rose-400', permission: 'manage_models' },
        { id: 'prompts', label: '提示词与人设', icon: Settings2, color: 'text-slate-400', permission: 'manage_prompts' },
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
        {navGroups.map((group, gIdx) => {
          // Filter items based on current user permissions
          const visibleItems = group.items.filter((item) => {
            if (!item.permission || !currentUser) return true;
            return hasPermission(currentUser, item.permission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {group.group}
              </h3>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
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
          );
        })}
      </div>

      {/* Bottom User / Info Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div
          onClick={() => onTabChange('users')}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all group"
          title="点击进入用户与角色权限管理"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 via-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
            {currentUser?.name?.slice(0, 1) || '谢'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300">
              {currentUser?.name || '超级管理员'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-semibold ${roleDef.badgeColor}`}>
                {roleDef.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
