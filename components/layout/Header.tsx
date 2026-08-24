'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Activity,
  User,
  LogOut,
  Shield,
  ChevronDown,
  RefreshCw,
  Menu,
} from 'lucide-react';
import { UserProfile } from '@/types';
import { ROLE_DEFINITIONS } from '@/lib/constants/users';

interface HeaderProps {
  title: string;
  subtitle: string;
  actionButton?: React.ReactNode;
  currentUser?: UserProfile;
  onLogout?: () => void;
  onOpenUsers?: () => void;
  /** 移动端打开侧边抽屉 */
  onOpenSidebarMobile?: () => void;
}

export function Header({
  title,
  subtitle,
  actionButton,
  currentUser,
  onLogout,
  onOpenUsers,
  onOpenSidebarMobile,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleDef = currentUser ? ROLE_DEFINITIONS[currentUser.role] : ROLE_DEFINITIONS.admin;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {/* 移动端汉堡按钮 */}
        {onOpenSidebarMobile && (
          <button
            onClick={onOpenSidebarMobile}
            className="lg:hidden p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0"
            title="打开导航菜单"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-slate-100 flex items-center gap-2 truncate">
            {title}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actionButton}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>全引擎就绪</span>
        </div>

        {/* User Profile Dropdown Menu */}
        {currentUser && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-600 via-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {currentUser.name?.slice(0, 1) || '用'}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-bold text-slate-200 block leading-none">
                  {currentUser.name}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-semibold inline-block mt-0.5 ${roleDef.badgeColor}`}>
                  {roleDef.name}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl">
                <div className="p-2.5 border-b border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">{currentUser.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono block">@{currentUser.username}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{currentUser.organization || '无所属机构'}</span>
                </div>

                {onOpenUsers && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenUsers();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>用户与权限管理</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>退出登录 / 切换账号</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
