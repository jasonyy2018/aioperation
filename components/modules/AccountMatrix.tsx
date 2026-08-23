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
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { SocialAccount, AIModelConfig, PromptTemplate } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/utils';

interface AccountMatrixProps {
  accounts: SocialAccount[];
  onAddAccount: (acc: SocialAccount) => void;
  onUpdateAccount: (acc: SocialAccount) => void;
  onDeleteAccount: (id: string) => void;
  models?: AIModelConfig[];
  prompts?: PromptTemplate[];
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
  models = [],
  prompts = [],
}: AccountMatrixProps) {
  const { showToast } = useToast();
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedModel, setSelectedModel] = useState<string>(textModels[0]?.id || 'minimax-text');

  const [activeTab, setActiveTab] = useState<'matrix' | 'compliance'>('matrix');

  // Matrix State
  const [search, setSearch] = useState<string>('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Compliance State
  const [draftContent, setDraftContent] = useState<string>(
    '我们是全网第一家百年老字号！独家绝版秘方，100%纯天然手工现烤，秒杀市面上所有普通月饼，错过绝对后悔！'
  );
  const [checkingCompliance, setCheckingCompliance] = useState<boolean>(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);

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
    category: '电商带货 / 老字号美食',
    status: 'active',
    notes: '',
  });

  const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followers || 0), 0);
  const activeCount = accounts.filter((a) => a.status === 'active').length;

  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch =
      acc.accountName.toLowerCase().includes(search.toLowerCase()) ||
      acc.accountId.toLowerCase().includes(search.toLowerCase()) ||
      acc.category.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = filterPlatform === 'all' || acc.platform === filterPlatform;
    return matchSearch && matchPlatform;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      platform: 'douyin',
      accountName: '',
      accountId: '',
      followers: 0,
      category: '电商带货 / 老字号美食',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName.trim() || !formData.accountId.trim()) {
      showToast('请填写账号名称和账号ID', 'warning');
      return;
    }

    if (editingId) {
      onUpdateAccount({
        id: editingId,
        ...formData,
        updatedAt: new Date().toLocaleString(),
      });
      showToast('账号信息已更新', 'success');
    } else {
      onAddAccount({
        id: `acc_${Date.now()}`,
        ...formData,
        updatedAt: new Date().toLocaleString(),
      });
      showToast('已添加新矩阵账号', 'success');
    }
    setIsModalOpen(false);
  };

  // Run AI Compliance Check
  const handleCheckCompliance = async () => {
    if (!draftContent.trim()) {
      showToast('请输入待检测文案', 'warning');
      return;
    }
    setCheckingCompliance(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'compliance-check')?.content || '';
      const userPrompt = `待排查文案：\n${draftContent}\n请按规范返回违规词排查与合规改写 JSON。`;

      const res = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          systemPrompt: promptContent,
          userPrompt,
          customModels: models,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '自检失败');

      let text = data.text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const parsed = JSON.parse(text.trim());
      setComplianceResult(parsed);
      showToast('广告法与违规词自检完成！', 'success');
    } catch (err: any) {
      showToast(err.message || '自检异常', 'error');
    } finally {
      setCheckingCompliance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switch */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>全网矩阵账号看板 ({accounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'compliance'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🛡️ 广告法与违规词自检排查仪</span>
          </button>
        </div>

        {activeTab === 'matrix' ? (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>添加矩阵账号</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">检测模型:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              {textModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 1. Matrix Mode */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">全网矩阵账号总数</span>
              <h4 className="text-xl font-bold text-slate-100">{accounts.length} 个</h4>
              <p className="text-[10px] text-slate-400">覆盖主流音视频与图文阵地</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">全网粉丝总量</span>
              <h4 className="text-xl font-bold text-indigo-400">{formatNumber(totalFollowers)}</h4>
              <p className="text-[10px] text-emerald-400">多账号矩阵联动聚流</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">正常活跃中账号</span>
              <h4 className="text-xl font-bold text-emerald-400">{activeCount} 个</h4>
              <p className="text-[10px] text-slate-400">健康度良好，可正常分发</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-medium">平均单号粉丝量</span>
              <h4 className="text-xl font-bold text-purple-400">
                {accounts.length > 0 ? formatNumber(Math.round(totalFollowers / accounts.length)) : 0}
              </h4>
              <p className="text-[10px] text-slate-400">单号垂直精细化运营</p>
            </div>
          </div>

          {/* Accounts Grid */}
          {filteredAccounts.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <Users2 className="w-12 h-12 text-slate-700 stroke-[1.5]" />
              <p className="text-xs">暂无矩阵账号，点击右上角“添加矩阵账号”开始配置</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((acc) => {
                const plat = PLATFORM_LABELS[acc.platform] || { name: acc.platform, color: 'bg-slate-800 text-slate-300' };
                return (
                  <div
                    key={acc.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${plat.color}`}>
                          {plat.name}
                        </span>
                        <Badge variant={acc.status === 'active' ? 'success' : 'danger'}>
                          {acc.status === 'active' ? '正常活跃' : '审核/受限'}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{acc.accountName}</h4>
                        <p className="text-xs text-slate-500 font-mono">ID: {acc.accountId}</p>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-xs text-slate-400">粉丝量:</span>
                        <span className="text-base font-bold text-indigo-400">{formatNumber(acc.followers)}</span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                        <span className="text-slate-500 block text-[10px]">类目定位:</span>
                        {acc.category}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                      <span className="text-[10px] text-slate-500">{acc.updatedAt}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除账号 ${acc.accountName} 吗？`)) {
                              onDeleteAccount(acc.id);
                              showToast('账号已删除', 'info');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Compliance Self-Check Tool Mode */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-slate-100">文案违规敏感词排查</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              发帖或开播前，检测文案中是否存在违反新广告法的极限词（第一、最顶尖）、夸大功效词或导流违规词。
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">待检测发布文案</label>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={7}
                placeholder="在此粘贴要发布的文章标题、短视频文案、商品详情或直播话术..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={handleCheckCompliance}
              disabled={checkingCompliance}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${checkingCompliance ? 'animate-spin' : ''}`} />
              <span>{checkingCompliance ? '正在智能自检排查...' : '🛡️ 一键检测广告法与平台违规词'}</span>
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!complianceResult ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                <p className="text-xs">在左侧输入待发布文案，AI 将自动识别违规词并生成一键合规替换版本</p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={complianceResult.riskLevel === 'safe' ? 'success' : complianceResult.riskLevel === 'medium' ? 'purple' : 'danger'}>
                      风险评级: {complianceResult.riskLevel === 'safe' ? '安全无风险' : complianceResult.riskLevel === 'medium' ? '中等警告' : '高风险违规'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      安全得分: <strong className="text-rose-400 font-mono text-sm">{complianceResult.riskScore || 85}</strong> / 100
                    </span>
                  </div>
                </div>

                {/* Violations List */}
                {complianceResult.violations && complianceResult.violations.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-rose-400 block">⚠️ 检测到的违规/敏感词项:</span>
                    <div className="space-y-2">
                      {complianceResult.violations.map((v: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-rose-500/30 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-300">敏感词：【{v.word}】</span>
                            <span className="text-[11px] text-slate-400">{v.reason}</span>
                          </div>
                          <p className="text-emerald-400 font-medium">💡 建议替换为：{v.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
                    ✅ 未检测到明显违规词，文案符合主流平台风控安全标准！
                  </div>
                )}

                {/* Safe Rewritten Text */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">✨ AI 合规优化后的全新安全文案:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(complianceResult.safeContent);
                        showToast('已复制安全文案！', 'success');
                      }}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制安全文案</span>
                    </button>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
                    {complianceResult.safeContent}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? '编辑矩阵账号' : '添加全网矩阵账号'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">发布阵地平台</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">账号名称</label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="例如：星光老字号带货营"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">平台账号 ID / 唯一号</label>
              <input
                type="text"
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                placeholder="例如：shanghai_laozihao_888"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">当前粉丝数</label>
                <input
                  type="number"
                  value={formData.followers}
                  onChange={(e) => setFormData({ ...formData, followers: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">运营状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="active">正常活跃 (Active)</option>
                  <option value="review">审核中 (Review)</option>
                  <option value="banned">受限/封禁 (Banned)</option>
                  <option value="idle">待养号 (Idle)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">类目定位</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="例如：黄浦老字号 / 美食探店"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white text-xs font-semibold shadow-md"
              >
                {editingId ? '保存修改' : '确认添加'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
