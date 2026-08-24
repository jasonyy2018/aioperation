'use client';

import React, { useState, useCallback } from 'react';
import {
  Sparkles,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showRegister, setShowRegister] = useState<boolean>(false);

  // Register form
  const [regUsername, setRegUsername] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regOrg, setRegOrg] = useState<string>('黄浦直播网创实训 1 班');
  const [regReason, setRegReason] = useState<string>('报名参加 9/7 黄浦区老字号实训营第 1 期');
  const [regPassword, setRegPassword] = useState<string>('');
  const [submittedNotice, setSubmittedNotice] = useState<boolean>(false);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('请输入用户名和密码');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    const result = await login(username, password);
    setIsLoading(false);

    if (result.success) {
      showToast(result.message, 'success');
      onLoginSuccess();
    } else {
      setErrorMsg(result.message);
      showToast(result.message, 'error');
    }
  }, [username, password, login, showToast, onLoginSuccess]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regName.trim() || !regPassword.trim()) {
      showToast('请填写完整信息', 'warning');
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(regUsername.trim())) {
      showToast('用户名须为 3-20 位字母、数字或下划线', 'warning');
      return;
    }

    const result = await register({
      username: regUsername.trim(),
      name: regName.trim(),
      password: regPassword.trim(),
      role: 'student',
      applyReason: regReason.trim(),
      organization: regOrg.trim(),
      phone: regPhone.trim() || undefined,
    });
    if (result.success) {
      setSubmittedNotice(true);
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  }, [regUsername, regName, regPassword, regPhone, regOrg, regReason, register, showToast]);

  const handleQuickLogin = useCallback((u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 p-0.5 shadow-2xl shadow-rose-600/30 mb-1">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-rose-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-wide">
            AI 赋能直播网创一体化实战平台
          </h1>
          <p className="text-xs text-slate-400">
            上海市黄浦区就业促进中心 ✖️ 星光色谷老字号公共创业实训载体
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {submittedNotice ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-100">注册申请已提交</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  您的账号已进入后台审核池。审核通过后即可登录使用全部功能！
                </p>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                <p>• 申请账号：<strong className="text-slate-200">@{regUsername}</strong></p>
                <p>• 真实姓名：<strong className="text-slate-200">{regName}</strong></p>
              </div>
              <button
                onClick={() => { setSubmittedNotice(false); setShowRegister(false); }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                返回登录界面
              </button>
            </div>
          ) : !showRegister ? (
            <>
              {/* Toggle */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
                <button
                  onClick={() => setShowRegister(false)}
                  className="py-2 text-xs font-semibold rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm transition-all cursor-pointer"
                >
                  🔑 登录
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  ✨ 注册申请
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>用户名 / 手机号 / 邮箱</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                    placeholder="admin / student_zhang"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>登录密码</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    disabled={isLoading}
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>立即登录</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick login hint */}
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider">快速体验账号</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { u: 'admin', p: 'admin', label: '超级管理员' },
                    { u: 'mentor_li', p: 'mentor', label: '实训导师' },
                    { u: 'laozihao_boss', p: 'boss', label: '老字号企业' },
                    { u: 'student_zhang', p: 'student', label: '实训学员' },
                  ].map(({ u, p, label }) => (
                    <button
                      key={u}
                      onClick={() => handleQuickLogin(u, p)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-slate-100 transition-all cursor-pointer"
                    >
                      <span className="font-mono text-slate-400">@{u.split('_')[0]}</span>
                      <span className="text-slate-500">·</span>
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">注册用户名 *</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="chuangke_01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">真实姓名 *</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="如：陈建国"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">手机号</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="13800000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">设置密码 *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">所属企业 / 门店 / 班级</label>
                <input
                  type="text"
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder="如：上海邵万生食品有限公司"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">申请理由</label>
                <input
                  type="text"
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  placeholder="如：报名参加 9/7 实训营第1期"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                <span>提交实名注册申请</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                ← 返回登录
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-xs text-slate-500">
          <p>© 2026 AI LiveOps OS · 老字号公共创业实训载体技术支持</p>
        </div>
      </div>
    </div>
  );
}
