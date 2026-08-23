'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  User,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { UserProfile, UserRole } from '@/types';
import { DEFAULT_USERS } from '@/lib/constants/users';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
  onRegisterSubmit: (user: UserProfile) => void;
  registeredUsers?: UserProfile[];
}

export function LoginPage({
  onLogin,
  onRegisterSubmit,
  registeredUsers = DEFAULT_USERS,
}: LoginPageProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('admin');

  // Register form state
  const [regUsername, setRegUsername] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regOrg, setRegOrg] = useState<string>('黄浦直播网创实训 1 班');
  const [regReason, setRegReason] = useState<string>('报名参加 9/7 黄浦区老字号实训营第 1 期，申请通关打卡账号');
  const [regPassword, setRegPassword] = useState<string>('');

  // Register success notice
  const [submittedNotice, setSubmittedNotice] = useState<boolean>(false);

  // Realtime duplicate check
  const trimmedRegUsername = regUsername.trim().toLowerCase();
  const isUsernameTaken =
    trimmedRegUsername.length > 0 &&
    registeredUsers.some((u) => u.username.toLowerCase() === trimmedRegUsername);

  const trimmedPhone = regPhone.trim();
  const isPhoneTaken =
    trimmedPhone.length > 0 &&
    registeredUsers.some((u) => u.phone && u.phone === trimmedPhone);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      showToast('请输入登录账号或用户名', 'warning');
      return;
    }
    if (!loginPassword.trim()) {
      showToast('请输入登录密码', 'warning');
      return;
    }

    const matched = registeredUsers.find(
      (u) =>
        u.username.toLowerCase() === loginUsername.toLowerCase() ||
        (u.email && u.email.toLowerCase() === loginUsername.toLowerCase()) ||
        (u.phone && u.phone === loginUsername)
    );

    if (!matched) {
      showToast('账号不存在，请先提交注册申请或核对用户名', 'error');
      return;
    }

    // Check Password
    if (matched.password && matched.password !== loginPassword) {
      showToast('登录密码错误，请重新输入', 'error');
      return;
    }

    // Check Approval Status
    if (matched.status === 'pending_approval') {
      showToast('⏳ 您的账号正在等待导师或管理员审核审批，请联系导师！', 'warning');
      return;
    }

    if (matched.status === 'disabled') {
      showToast('⛔ 该账号已被系统禁用，请联系平台管理员', 'error');
      return;
    }

    if (matched.status === 'rejected') {
      showToast('❌ 您的注册申请已被拒绝，请重新提交或联系导师', 'error');
      return;
    }

    onLogin({
      ...matched,
      lastLoginAt: '刚刚',
    });
    showToast(`登录成功，欢迎回来 ${matched.name}！`, 'success');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim()) {
      showToast('请输入注册用户名', 'warning');
      return;
    }
    if (!regName.trim()) {
      showToast('请输入真实姓名', 'warning');
      return;
    }
    if (!regPassword.trim()) {
      showToast('请设置登录密码', 'warning');
      return;
    }

    // Strict duplicate prevention
    if (isUsernameTaken) {
      showToast(`用户名【${regUsername.trim()}】已被占用，请更换其他唯一用户名！`, 'error');
      return;
    }

    if (isPhoneTaken) {
      showToast(`手机号【${regPhone.trim()}】已注册过账号，不可重复提交！`, 'error');
      return;
    }

    // Format validation (letters, numbers, underscores)
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(regUsername.trim())) {
      showToast('用户名格式不符合要求：须为 3-20 位字母、数字或下划线', 'warning');
      return;
    }

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      username: regUsername.trim(),
      name: regName.trim(),
      password: regPassword.trim(),
      role: regRole,
      appliedRole: regRole,
      applyReason: regReason.trim() || '学员实训申请',
      organization: regOrg.trim() || '自媒体运营团队',
      phone: regPhone.trim() || undefined,
      status: 'pending_approval', // Need Mentor / Admin approval
      createdAt: new Date().toISOString().split('T')[0],
    };

    onRegisterSubmit(newUser);
    setSubmittedNotice(true);
    showToast('注册申请已提交，等待后台审核！', 'success');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Brand Header */}
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

        {/* Card Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {submittedNotice ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-100">注册申请提交成功</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  您的账号已进入后台审核池。实训导师或管理员将在后台审核您的角色申请，审核通过后即可直接登录！
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                <p>• 申请账号：<strong className="text-slate-200">@{regUsername}</strong></p>
                <p>• 真实姓名：<strong className="text-slate-200">{regName}</strong></p>
                <p>• 申请角色：<strong className="text-indigo-400">{regRole === 'student' ? '实训学员' : regRole === 'enterprise' ? '老字号企业' : '实训导师'}</strong></p>
              </div>

              <button
                onClick={() => {
                  setSubmittedNotice(false);
                  setTab('login');
                  setLoginUsername(regUsername);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                返回登录界面
              </button>
            </div>
          ) : (
            <>
              {/* Navigation Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
                <button
                  onClick={() => setTab('login')}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    tab === 'login'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔑 账号密码登录
                </button>
                <button
                  onClick={() => setTab('register')}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    tab === 'register'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✨ 实名注册与角色申请
                </button>
              </div>

              {/* 1. Standard Login Tab */}
              {tab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>用户名 / 手机号</span>
                    </label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="如：admin 或 student_zhang"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>登录密码</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        初始密码: admin / mentor / boss / student
                      </span>
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <span>立即验证登录</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* 2. Register Tab with Duplicate Prevention */}
              {tab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-300">注册用户名 *</label>
                        {trimmedRegUsername.length > 0 && (
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isUsernameTaken ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isUsernameTaken ? (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>已占用</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>可用</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="如：chuangke_01"
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-colors ${
                          isUsernameTaken
                            ? 'border-rose-500 focus:border-rose-500'
                            : trimmedRegUsername.length >= 3
                            ? 'border-emerald-500/60 focus:border-emerald-500'
                            : 'border-slate-800 focus:border-purple-500'
                        }`}
                      />
                      {isUsernameTaken && (
                        <p className="text-[10px] text-rose-400 leading-tight">
                          ✕ 该用户名已被其他用户占用，请更换
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">真实姓名 / 主理人 *</label>
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
                      <label className="text-xs font-medium text-slate-300">申请角色身份</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="student">实训学员 (18课时通关打卡)</option>
                        <option value="enterprise">老字号企业 (爆款带货策划)</option>
                        <option value="mentor">实训导师 (作业评审指导)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-300">手机号码</label>
                        {trimmedPhone.length > 0 && isPhoneTaken && (
                          <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-0.5">
                            <XCircle className="w-3 h-3" />
                            <span>已注册</span>
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="13800000000"
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-colors ${
                          isPhoneTaken ? 'border-rose-500' : 'border-slate-800 focus:border-purple-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">所属企业 / 门店 / 班级</label>
                    <input
                      type="text"
                      value={regOrg}
                      onChange={(e) => setRegOrg(e.target.value)}
                      placeholder="如：上海邵万生食品有限公司 / 黄浦实训1班"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">申请理由 / 备注说明</label>
                    <input
                      type="text"
                      value={regReason}
                      onChange={(e) => setRegReason(e.target.value)}
                      placeholder="如：报名参加 9/7 实训营第1期，申请通关账号"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">设置登录密码 *</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="•••••••• (至少 6 位密码)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUsernameTaken || isPhoneTaken}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <span>提交实名注册申请 (等待审批)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          <p>© 2026 AI LiveOps OS · 老字号公共创业实训载体技术支持</p>
        </div>
      </div>
    </div>
  );
}
