'use client';

import React, { useEffect } from 'react';
import { Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 text-slate-100 p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
      </div>
      <h1 className="text-4xl font-black text-rose-500 mb-2">404</h1>
      <p className="text-sm text-slate-400 mb-6">您访问的页面不存在或已被移除</p>
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
      >
        <Home className="w-4 h-4" />
        <span>返回工作台首页</span>
      </Link>
    </div>
  );
}
