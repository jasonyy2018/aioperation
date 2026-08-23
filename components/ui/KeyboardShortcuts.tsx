'use client';

import React, { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';

/**
 * Keyboard Shortcuts Info Panel
 */
export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    { keys: '1-9', action: '快速切换到第 N 个导航项' },
    { keys: 'Esc', action: '关闭弹窗 / 下拉菜单' },
    { keys: 'Ctrl+K', action: '全局搜索 (预留)' },
    { keys: 'Ctrl+L', action: '跳转登录页' },
    { keys: 'Ctrl+D', action: '黑暗/明亮模式切换' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] transition-all cursor-pointer border border-slate-700/60"
        title="快捷键帮助"
      >
        <Keyboard className="w-3 h-3" />
        <span>快捷键</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
            <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              快捷键列表
            </h4>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.keys} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{s.action}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3">Ctrl+K 搜索功能开发中...</p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Global keyboard shortcuts hook
 */
export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey && 'Ctrl',
        e.altKey && 'Alt',
        e.metaKey && 'Meta',
        e.shiftKey && 'Shift',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      if (handlers[key]) {
        e.preventDefault();
        handlers[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
