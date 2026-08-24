'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  Search,
  KeyRound,
  Sparkles,
  Clock,
  UserCheck,
  UserX,
  FileText,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { UserProfile, UserRole } from '@/types';
import { ROLE_DEFINITIONS } from '@/lib/constants/users';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface UserManagerProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
  onSwitchUser?: (user: UserProfile) => void;
  /** 用服务端返回的完整列表替换本地 state（管理员登录后同步） */
  onReplaceUsers?: (users: UserProfile[]) => void;
}

export function UserManager({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  onReplaceUsers,
}: UserManagerProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'matrix'>('users');
  const [search, setSearch] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serverLoaded, setServerLoaded] = useState<boolean>(false);

  // Approval modal state
  const [approvingUser, setApprovingUser] = useState<UserProfile | null>(null);
  const [adjustedRole, setAdjustedRole] = useState<UserRole>('student');

  const [formData, setFormData] = useState<{
    username: string;
    name: string;
    role: UserRole;
    organization: string;
    email: string;
    phone: string;
    status: UserProfile['status'];
  }>({
    username: '',
    name: '',
    role: 'student',
    organization: '黄浦直播网创实训营',
    email: '',
    phone: '',
    status: 'active',
  });

  const pendingApprovals = users.filter((u) => u.status === 'pending_approval');

  /** 服务端用户操作（approve/reject/disable/enable/setRole/delete），成功后同步本地 state */
  const serverUserAction = async (
    action: string,
    target: UserProfile,
    extra?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/data/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || '服务端操作失败', 'error');
        return false;
      }
      // 用服务端返回的权威数据更新本地
      if (data.user) {
        onUpdateUser({
          ...target,
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          role: data.user.role,
          organization: data.user.organization,
          email: data.user.email,
          phone: data.user.phone,
          status: data.user.status,
        });
      }
      return true;
    } catch {
      showToast('网络错误，操作未保存到服务器', 'error');
      return false;
    }
  };

  /** 登录后从服务端拉取最新用户列表 */
  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/data/users', { cache: 'no-store' });
        if (!res.ok) return; // 非管理员或未登录 → 保持本地数据
        const data = await res.json();
        if (!cancelled && Array.isArray(data.users)) {
          setServerLoaded(true);
          onReplaceUsers?.(
            data.users.map((u: any) => ({
              id: u.id,
              username: u.username,
              name: u.name,
              role: u.role,
              organization: u.organization,
              email: u.email,
              phone: u.phone,
              status: u.status,
              createdAt: u.createdAt || '',
              lastLoginAt: u.lastLoginAt,
            }))
          );
        }
      } catch { /* 离线 → 本地数据兜底 */ }
    };
    loadUsers();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.organization && u.organization.toLowerCase().includes(search.toLowerCase()));
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      username: '',
      name: '',
      role: 'student',
      organization: '黄浦直播网创实训营',
      email: '',
      phone: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      organization: user.organization || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = formData.username.trim();
    if (!cleanUsername || !formData.name.trim()) {
      showToast('请填写用户名和姓名', 'warning');
      return;
    }

    // Check duplicate username against other users
    const duplicate = users.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.id !== editingId
    );
    if (duplicate) {
      showToast(`用户名【${cleanUsername}】已被其他用户占用，请使用唯一用户名！`, 'error');
      return;
    }

    if (editingId) {
      const existing = users.find((u) => u.id === editingId);
      if (existing) {
        onUpdateUser({
          ...existing,
          ...formData,
          username: cleanUsername,
        });
        showToast('用户信息与角色已更新', 'success');
      }
    } else {
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        ...formData,
        username: cleanUsername,
        password: 'student',
        createdAt: new Date().toISOString().split('T')[0],
        lastLoginAt: '未登录',
      };
      onAddUser(newUser);
      showToast('已添加新用户并分配角色', 'success');
    }
    setIsModalOpen(false);
  };

  // Direct Approve — 服务端审批
  const handleDirectApprove = async (user: UserProfile) => {
    const ok = await serverUserAction('approve', user);
    if (ok) {
      showToast(`已通过 ${user.name} 的注册申请！角色：${ROLE_DEFINITIONS[user.appliedRole || user.role].name}`, 'success');
    }
  };

  // Open Adjusted Approval Modal
  const handleOpenAdjustApproval = (user: UserProfile) => {
    setApprovingUser(user);
    setAdjustedRole(user.appliedRole || user.role || 'student');
  };

  // Confirm Adjusted Approval — 服务端审批（先调角色再激活）
  const handleConfirmAdjustedApprove = async () => {
    if (!approvingUser) return;
    // 先调整角色，再审批激活
    if (adjustedRole !== approvingUser.appliedRole && adjustedRole !== approvingUser.role) {
      await serverUserAction('setRole', approvingUser, { role: adjustedRole });
    }
    const ok = await serverUserAction('approve', { ...approvingUser, appliedRole: adjustedRole });
    if (ok) {
      showToast(`审批通过！已将 ${approvingUser.name} 的角色调整为：${ROLE_DEFINITIONS[adjustedRole].name}`, 'success');
    }
    setApprovingUser(null);
  };

  // Reject Application — 服务端拒绝
  const handleReject = async (user: UserProfile) => {
    if (confirm(`确定拒绝 ${user.name} 的注册申请吗？`)) {
      const ok = await serverUserAction('reject', user);
      if (ok) {
        showToast(`已拒绝 ${user.name} 的注册申请`, 'info');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
              RBAC 权限安全体系
            </span>
            <span className="text-xs text-slate-400">实名审核与角色调整中枢</span>
          </div>
          <h2 className="text-xl font-black text-slate-100 tracking-wide flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-400" />
            <span>用户管理与注册审批工作台</span>
          </h2>
          <p className="text-xs text-slate-300">
            管理员与实训导师可审核新创客/老字号企业的注册申请、动态调整角色身份与配置权限边界
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>直接录入新用户</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>系统全部用户 ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>待审批申请</span>
          {pendingApprovals.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>角色权限对照表</span>
        </button>
      </div>

      {/* 1. Pending Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>待审核学员与企业注册申请列表 ({pendingApprovals.length} 项)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                导师或管理员通过审核后，学员/企业方可正式登录系统使用对应功能
              </p>
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60" />
              <p className="text-xs font-medium text-slate-400">目前没有待审批的注册申请，全部申请均已处理完毕</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((user) => {
                const appliedRoleDef = ROLE_DEFINITIONS[user.appliedRole || user.role || 'student'];
                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{user.name}</span>
                          <span className="text-xs text-slate-400 font-mono">@{user.username}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${appliedRoleDef.badgeColor}`}>
                            申请身份: {appliedRoleDef.name}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {user.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {user.organization || '自媒体创客'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">申请时间: {user.createdAt}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDirectApprove(user)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>一键通过</span>
                        </button>
                        <button
                          onClick={() => handleOpenAdjustApproval(user)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>调整角色通过</span>
                        </button>
                        <button
                          onClick={() => handleReject(user)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs font-medium border border-slate-800 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>拒绝</span>
                        </button>
                      </div>
                    </div>

                    {user.applyReason && (
                      <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span><strong>申请理由：</strong>{user.applyReason}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. All Users Table Tab */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索用户姓名、账号或机构..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">角色过滤:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">全部角色 ({users.length})</option>
                <option value="admin">超级管理员</option>
                <option value="mentor">实训导师</option>
                <option value="enterprise">老字号企业</option>
                <option value="student">实训学员</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-3">用户 / 账号</th>
                  <th className="pb-3 px-3">当前角色</th>
                  <th className="pb-3 px-3">所属机构 / 门店 / 班级</th>
                  <th className="pb-3 px-3">审核状态</th>
                  <th className="pb-3 px-3">注册时间</th>
                  <th className="pb-3 px-3 text-right">角色调整与操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.student;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-bold text-slate-100 block">{u.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">@{u.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${roleDef.badgeColor}`}>
                          {roleDef.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{u.organization || '-'}</td>
                      <td className="py-3 px-3">
                        {u.status === 'active' ? (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            正常
                          </span>
                        ) : u.status === 'pending_approval' ? (
                          <span className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            待审批
                          </span>
                        ) : u.status === 'rejected' ? (
                          <span className="text-[11px] text-red-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            已拒绝
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            已禁用
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{u.createdAt}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1 text-indigo-400 hover:text-indigo-300 font-medium"
                            title="编辑与调整角色"
                          >
                            调整角色
                          </button>
                          {u.id !== 'user_admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`确定删除用户 ${u.name} 吗？`)) {
                                  onDeleteUser(u.id);
                                  showToast('用户已删除', 'info');
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-red-400"
                              title="删除用户"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Role & Permissions Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>系统角色权限矩阵对照表</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
              <div key={key} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold inline-block ${def.badgeColor}`}>
                  {def.name}
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">{def.description}</p>
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">包含权限项:</span>
                  <ul className="text-[11px] text-slate-300 space-y-0.5">
                    {def.defaultPermissions.map((p, pIdx) => (
                      <li key={pIdx} className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? '编辑用户信息与调整角色身份' : '录入新系统用户'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">用户名 (登录账号)</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="例如：student_2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">用户姓名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：张明"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">分配/调整角色身份</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="student">实训学员 (基础创作 + 18课时通关打卡)</option>
                <option value="enterprise">老字号企业 (漫剧/影棚/直播排品中枢)</option>
                <option value="mentor">实训导师 (作业终审 + 评分指导)</option>
                <option value="admin">超级管理员 (全权限 + 底层引擎配置)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">账号状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="active">正常活跃 (允许登录使用)</option>
                <option value="pending_approval">待审批 (禁止登录)</option>
                <option value="disabled">已禁用</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">所属机构 / 门店 / 班级</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="例如：黄浦老字号网创实训 1 班"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white text-xs font-semibold shadow-md"
              >
                {editingId ? '保存修改' : '确认录入'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust Role & Approve Modal */}
      {approvingUser && (
        <Modal
          isOpen={!!approvingUser}
          onClose={() => setApprovingUser(null)}
          title={`审核申请 - ${approvingUser.name}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p>• 申请账号：<strong className="text-slate-200">@{approvingUser.username}</strong></p>
              <p>• 所属机构：<strong className="text-slate-200">{approvingUser.organization || '-'}</strong></p>
              <p>• 申请理由：<span className="text-slate-300">{approvingUser.applyReason || '实训申请'}</span></p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">调整并分配该用户最终角色身份</label>
              <select
                value={adjustedRole}
                onChange={(e) => setAdjustedRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="student">实训学员 (基础创作 + 18课时通关打卡)</option>
                <option value="enterprise">老字号企业 (漫剧/影棚/直播排品)</option>
                <option value="mentor">实训导师 (学员作业终审 + 点评)</option>
                <option value="admin">超级管理员 (全量系统管理权限)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAdjustedApprove}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-semibold shadow-md"
              >
                确认批准并通过
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
