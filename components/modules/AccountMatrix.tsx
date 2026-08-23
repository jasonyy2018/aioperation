'use client';

import React, { useState } from 'react';
import {
  Users2,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { SocialAccount } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/utils';

interface AccountMatrixProps {
  accounts: SocialAccount[];
  onAddAccount: (acc: SocialAccount) => void;
  onUpdateAccount: (acc: SocialAccount) => void;
  onDeleteAccount: (id: string) => void;
}

const PLATFORM_LABELS: Record<string, { name: string; color: string }> = {
  douyin: { name: '抖音', color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  kuaishou: { name: '快手', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  xiaohongshu: { name: '小红书', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  wechat: { name: '微信公众号', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  shipinhao: { name: '视频号', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  bilibili: { name: 'B站', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  zhihu: { name: '知乎', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  weibo: { name: '微博', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export function AccountMatrix({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}: AccountMatrixProps) {
  const { showToast } = useToast();
  const [search, setSearch] = useState<string>('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    platform: SocialAccount['platform'];
    accountName: string;
    accountId: string;
    followers: number;
    category: string;
    status: SocialAccount['status'];
    notes: string;
  }>({
    platform: 'douyin',
    accountName: '',
    accountId: '',
    followers: 0,
    category: 'AI科技与实操',
    status: 'active',
    notes: '',
  });

  const totalFans = accounts.reduce((sum, a) => sum + (a.followers || 0), 0);
  const activeAccountsCount = accounts.filter((a) => a.status === 'active').length;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      platform: 'douyin',
      accountName: '',
      accountId: '',
      followers: 0,
      category: 'AI自媒体',
      status: 'active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: SocialAccount) => {
    setEditingId(acc.id);
    setFormData({
      platform: acc.platform,
      accountName: acc.accountName,
      accountId: acc.accountId,
      followers: acc.followers,
      category: acc.category,
      status: acc.status,
      notes: acc.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.accountName.trim()) {
      showToast('请输入账号名称', 'warning');
      return;
    }

    if (editingId) {
      onUpdateAccount({
        id: editingId,
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      showToast('账号信息已更新', 'success');
    } else {
      onAddAccount({
        id: Math.random().toString(36).substring(2, 9),
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      showToast('已新增矩阵账号', 'success');
    }
    setIsModalOpen(false);
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchSearch =
      a.accountName.toLowerCase().includes(search.toLowerCase()) ||
      a.accountId.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchPlat = filterPlatform === 'all' || a.platform === filterPlatform;
    return matchSearch && matchPlat;
  });

  const getStatusBadge = (status: SocialAccount['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3" /> 正常运营</Badge>;
      case 'review':
        return <Badge variant="warning"><Clock className="w-3 h-3" /> 审核中</Badge>;
      case 'banned':
        return <Badge variant="danger"><AlertCircle className="w-3 h-3" /> 限制/封禁</Badge>;
      default:
        return <Badge variant="neutral">闲置观察</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">总矩阵账号数</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{accounts.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">全网粉丝总量</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{formatNumber(totalFans)}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">健康运营占比</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">
              {accounts.length > 0 ? Math.round((activeAccountsCount / accounts.length) * 100) : 100}%
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索账号名、ID 或定位类目..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">全部平台</option>
            {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>添加自媒体账号</span>
        </button>
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Users2 className="w-12 h-12 mx-auto opacity-30 text-blue-400" />
          <p className="text-xs">暂无矩阵账号，点击右上角“添加自媒体账号”建立你的全网运营矩阵</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const plat = PLATFORM_LABELS[acc.platform] || { name: acc.platform, color: 'bg-slate-800 text-slate-300' };
            return (
              <div
                key={acc.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${plat.color}`}>
                      {plat.name}
                    </span>
                    <h4 className="font-semibold text-slate-100 text-sm">{acc.accountName}</h4>
                    <p className="text-[11px] font-mono text-slate-500">ID: {acc.accountId || '未设置'}</p>
                  </div>
                  {getStatusBadge(acc.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px]">粉丝数量</span>
                    <p className="font-bold text-slate-200 mt-0.5">{formatNumber(acc.followers)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">类目定位</span>
                    <p className="font-medium text-slate-300 mt-0.5 truncate">{acc.category || '通用'}</p>
                  </div>
                </div>

                {acc.notes && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{acc.notes}</p>}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="编辑"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确认删除账号“${acc.accountName}”？`)) {
                        onDeleteAccount(acc.id);
                        showToast('账号已移除', 'info');
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? '编辑矩阵账号' : '新增自媒体矩阵账号'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">所属平台</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">账号状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="active">正常运营</option>
                <option value="review">审核维护中</option>
                <option value="banned">受限/封禁</option>
                <option value="idle">闲置备用</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">账号名称</label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="例如：AI老司机说科技"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">平台 UID / 账号 ID</label>
              <input
                type="text"
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                placeholder="例如：ai_tech_2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">粉丝数量</label>
              <input
                type="number"
                value={formData.followers}
                onChange={(e) => setFormData({ ...formData, followers: parseInt(e.target.value || '0', 10) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">定位类目</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="例如：商业实战 / AI变现 / 生活种草"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">运营备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="记录账号人设、变现路径或主理人信息..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
            >
              保存账号
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
