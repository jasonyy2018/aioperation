'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Edit,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Globe,
  Radio,
  Search,
  Check,
  Layers,
  ChevronRight,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AIModelConfig, DiscoveredModel, ModelType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface ModelManagerProps {
  models: AIModelConfig[];
  onUpdateModel: (model: AIModelConfig) => void;
  onAddModel: (model: AIModelConfig) => void;
  onDeleteModel: (id: string) => void;
  onResetDefaults: () => void;
}

export function ModelManager({
  models,
  onUpdateModel,
  onAddModel,
  onDeleteModel,
  onResetDefaults,
}: ModelManagerProps) {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<string>('all');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [editingModel, setEditingModel] = useState<AIModelConfig | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Discovery / Fetch Models state
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [discoveredSearch, setDiscoveredSearch] = useState<string>('');
  const [selectedDiscoveredIds, setSelectedDiscoveredIds] = useState<string[]>([]);
  const [matchedEndpointInfo, setMatchedEndpointInfo] = useState<string>('');

  // New Model state
  const [newModel, setNewModel] = useState<{
    name: string;
    provider: string;
    baseUrl: string;
    protocol: string;
    type: ModelType;
    status: 'active' | 'inactive';
    apiKey: string;
    modelName: string;
    description: string;
  }>({
    name: '',
    provider: '自定义提供商',
    baseUrl: 'https://api.openai.com/v1',
    protocol: 'OpenAI 兼容协议',
    type: 'text',
    status: 'active',
    apiKey: '',
    modelName: '',
    description: '',
  });

  const filteredModels = models.filter((m) => {
    if (filterType === 'all') return true;
    return m.type === filterType;
  });

  const handleTestConnection = async (model: AIModelConfig) => {
    setTestingId(model.id);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [model.id]: { success: data.success, message: data.message },
      }));
      if (data.success) {
        showToast(`${model.name} ${data.message}`, 'success');
      } else {
        showToast(`${model.name} ${data.message}`, 'warning');
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [model.id]: { success: false, message: err.message || '网络连接异常' },
      }));
      showToast('连接测试异常', 'error');
    } finally {
      setTestingId(null);
    }
  };

  // Fetch / Identify all models from API
  const handleFetchModelsFromApi = async (targetBaseUrl: string, targetApiKey: string) => {
    if (!targetBaseUrl.trim()) {
      showToast('请先输入 API Base URL 地址', 'warning');
      return;
    }
    setFetchingModels(true);
    setDiscoveredModels([]);
    setSelectedDiscoveredIds([]);
    setMatchedEndpointInfo('');

    try {
      const res = await fetch('/api/ai/fetch_models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: targetBaseUrl,
          apiKey: targetApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '未能识别到模型');
      }

      setDiscoveredModels(data.models || []);
      setMatchedEndpointInfo(`端点: ${data.matchedEndpoint} (发现 ${data.count} 个模型)`);
      showToast(`成功识别到 ${data.count} 个可用模型！`, 'success');
    } catch (err: any) {
      showToast(err.message || '识别模型失败，请检查 Base URL 和 API Key', 'error');
    } finally {
      setFetchingModels(false);
    }
  };

  // Pick one discovered model
  const handleSelectDiscovered = (dm: DiscoveredModel) => {
    setNewModel((prev) => ({
      ...prev,
      name: dm.id,
      modelName: dm.id,
      type: dm.type,
      description: `${dm.owned_by ? `${dm.owned_by} / ` : ''}${dm.id}`,
    }));
    showToast(`已选中模型: ${dm.id}`, 'info');
  };

  // Toggle selection for batch import
  const handleToggleBatchSelect = (id: string) => {
    setSelectedDiscoveredIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Batch import selected models
  const handleBatchImport = () => {
    if (selectedDiscoveredIds.length === 0) {
      showToast('请先勾选要批量接入的模型', 'warning');
      return;
    }
    const selected = discoveredModels.filter((m) => selectedDiscoveredIds.includes(m.id));
    for (const item of selected) {
      const created: AIModelConfig = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: item.id,
        modelName: item.id,
        provider: newModel.provider || item.owned_by || '自定义',
        baseUrl: newModel.baseUrl,
        protocol: 'OpenAI 兼容协议',
        type: item.type,
        status: 'active',
        apiKey: newModel.apiKey,
        description: `自动接入 ${item.id}`,
      };
      onAddModel(created);
    }
    setIsAddModalOpen(false);
    showToast(`已成功批量接入 ${selected.length} 个大模型！`, 'success');
  };

  const handleSaveEdit = () => {
    if (!editingModel) return;
    onUpdateModel(editingModel);
    setEditingModel(null);
    showToast('大模型配置已保存！', 'success');
  };

  const handleCreateSingleModel = () => {
    if (!newModel.name?.trim() || !newModel.baseUrl?.trim() || !newModel.apiKey?.trim()) {
      showToast('请完整填写模型名称、Base URL 和 API Key', 'warning');
      return;
    }
    const created: AIModelConfig = {
      id: `custom_${Date.now()}`,
      name: newModel.name,
      modelName: newModel.modelName || newModel.name,
      provider: newModel.provider || '自定义',
      baseUrl: newModel.baseUrl,
      protocol: newModel.protocol || 'OpenAI 兼容协议',
      type: newModel.type,
      status: 'active',
      apiKey: newModel.apiKey,
      description: newModel.description || '用户自定义大模型接入点',
    };
    onAddModel(created);
    setIsAddModalOpen(false);
    showToast('已成功接入模型！', 'success');
  };

  const getTypeBadge = (type: AIModelConfig['type']) => {
    switch (type) {
      case 'text':
        return <Badge variant="primary">文案/文本</Badge>;
      case 'image':
        return <Badge variant="cyan">商业生图</Badge>;
      case 'video':
        return <Badge variant="purple">视频渲染</Badge>;
    }
  };

  const filteredDiscovered = discoveredModels.filter(
    (m) =>
      m.id.toLowerCase().includes(discoveredSearch.toLowerCase()) ||
      m.type.toLowerCase().includes(discoveredSearch.toLowerCase()) ||
      (m.owned_by && m.owned_by.toLowerCase().includes(discoveredSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            全部模型 ({models.length})
          </button>
          <button
            onClick={() => setFilterType('text')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === 'text'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            文本生成
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === 'image'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            图片生图
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === 'video'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            视频渲染
          </button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setDiscoveredModels([]);
              setSelectedDiscoveredIds([]);
              setIsAddModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>接入自定义模型 (支持自动识别)</span>
          </button>
          <button
            onClick={() => {
              if (confirm('确定要恢复出厂默认大模型配置吗？')) {
                onResetDefaults();
                showToast('已恢复出厂模型配置', 'success');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认</span>
          </button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModels.map((m) => {
          const testRes = testResults[m.id];
          return (
            <div
              key={m.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(m.type)}
                    <span className="text-[11px] text-slate-400">{m.provider}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      m.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {m.status === 'active' ? '启用中' : '已停用'}
                  </span>
                </div>

                <h4 className="font-semibold text-slate-100 text-sm mb-1 truncate" title={m.name}>
                  {m.name}
                </h4>
                {m.modelName && m.modelName !== m.name && (
                  <p className="text-[11px] font-mono text-indigo-400 mb-1 truncate">ID: {m.modelName}</p>
                )}
                <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                  {m.description || m.protocol}
                </p>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate" title={m.baseUrl}>
                      {m.baseUrl}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-500">
                      {m.apiKey ? `${m.apiKey.slice(0, 8)}...${m.apiKey.slice(-4)}` : '未配置 Key'}
                    </span>
                  </div>
                </div>

                {testRes && (
                  <div
                    className={`p-2 rounded-lg text-xs font-medium mb-3 flex items-center gap-1.5 ${
                      testRes.success
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {testRes.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{testRes.message}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTestConnection(m)}
                  disabled={testingId === m.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingId === m.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === m.id ? '测试中...' : '测试连通'}</span>
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEditingModel(m)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="编辑配置"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {m.id.startsWith('custom_') && (
                    <button
                      onClick={() => {
                        if (confirm(`确定移除模型“${m.name}”？`)) {
                          onDeleteModel(m.id);
                          showToast('模型已移除', 'info');
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Model Modal */}
      {editingModel && (
        <Modal
          isOpen={!!editingModel}
          onClose={() => setEditingModel(null)}
          title={`编辑大模型 - ${editingModel.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">模型显示名称</label>
                <input
                  type="text"
                  value={editingModel.name}
                  onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">实际调用模型 ID (model)</label>
                <input
                  type="text"
                  value={editingModel.modelName || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, modelName: e.target.value })}
                  placeholder="例如：deepseek-chat 或 gpt-4o"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">API 请求端点 (Base URL)</label>
              <input
                type="text"
                value={editingModel.baseUrl}
                onChange={(e) => setEditingModel({ ...editingModel, baseUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">API Key / Token</label>
              <input
                type="text"
                value={editingModel.apiKey}
                onChange={(e) => setEditingModel({ ...editingModel, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">模型类型</label>
                <select
                  value={editingModel.type}
                  onChange={(e) => setEditingModel({ ...editingModel, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="text">文案 / 文本生成</option>
                  <option value="image">商业生图</option>
                  <option value="video">视频渲染</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">状态</label>
                <select
                  value={editingModel.status}
                  onChange={(e) => setEditingModel({ ...editingModel, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingModel(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存配置</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Custom Model Modal with Automatic API Discovery */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="接入自定义模型 (支持手动与自动识别 API 模型列表)"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          {/* Step 1: Base URL and Key */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <span>第 1 步：配置 API 端点与密钥</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">API 基础地址 (Base URL)</label>
                <input
                  type="text"
                  value={newModel.baseUrl}
                  onChange={(e) => setNewModel({ ...newModel, baseUrl: e.target.value })}
                  placeholder="如 https://api.siliconflow.cn/v1 或 https://api.openai.com/v1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">API Key / Token</label>
                <input
                  type="text"
                  value={newModel.apiKey}
                  onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Fetch Button */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-500">
                支持任何 OpenAI 兼容协议接口（如 DeepSeek、SiliconFlow、OpenRouter、OneAPI、Ollama 等）
              </p>
              <button
                onClick={() => handleFetchModelsFromApi(newModel.baseUrl, newModel.apiKey)}
                disabled={fetchingModels}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {fetchingModels ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{fetchingModels ? '正在识别端点模型...' : '🔍 识别/拉取 API 中的所有模型'}</span>
              </button>
            </div>
          </div>

          {/* Step 2: Discovered Models Panel (If fetched) */}
          {discoveredModels.length > 0 && (
            <div className="bg-slate-950/70 p-4 rounded-xl border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>第 2 步：API 已识别模型库 ({discoveredModels.length} 个)</span>
                  </h4>
                  {matchedEndpointInfo && (
                    <p className="text-[10px] font-mono text-slate-500">{matchedEndpointInfo}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={discoveredSearch}
                      onChange={(e) => setDiscoveredSearch(e.target.value)}
                      placeholder="搜索已识别模型..."
                      className="bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                    />
                  </div>

                  {selectedDiscoveredIds.length > 0 && (
                    <button
                      onClick={handleBatchImport}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>批量添加勾选的 ({selectedDiscoveredIds.length}) 个模型</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Models List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {filteredDiscovered.map((dm) => {
                  const isSelected = selectedDiscoveredIds.includes(dm.id);
                  const isSingleFilled = newModel.modelName === dm.id;
                  return (
                    <div
                      key={dm.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
                        isSingleFilled
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-200'
                          : isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleBatchSelect(dm.id)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="font-mono font-medium truncate" title={dm.id}>
                          {dm.id}
                        </span>
                        {dm.owned_by && (
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            ({dm.owned_by})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {dm.type === 'text' && <Badge variant="primary">文本</Badge>}
                        {dm.type === 'image' && <Badge variant="cyan">生图</Badge>}
                        {dm.type === 'video' && <Badge variant="purple">视频</Badge>}

                        <button
                          onClick={() => handleSelectDiscovered(dm)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            isSingleFilled
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300'
                          }`}
                        >
                          {isSingleFilled ? '已选用' : '单选填入'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Specific Model Details */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <span>第 3 步：确认模型详细参数</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">模型显示名称</label>
                <input
                  type="text"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  placeholder="如 DeepSeek V3 或 GPT-4o"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">实际调用模型 ID (model 参数)</label>
                <input
                  type="text"
                  value={newModel.modelName}
                  onChange={(e) => setNewModel({ ...newModel, modelName: e.target.value })}
                  placeholder="如 deepseek-ai/DeepSeek-V3"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">模型类型</label>
                <select
                  value={newModel.type}
                  onChange={(e) => setNewModel({ ...newModel, type: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="text">文案 / 文本生成</option>
                  <option value="image">商业生图</option>
                  <option value="video">视频渲染</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">模型提供商标签</label>
                <input
                  type="text"
                  value={newModel.provider}
                  onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                  placeholder="例如：SiliconFlow / DeepSeek / 自定义中转"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">模型描述与特点</label>
                <input
                  type="text"
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  placeholder="例如：671B 超强推理能力 / 极速生图"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              关闭
            </button>

            <div className="flex gap-2">
              {selectedDiscoveredIds.length > 0 && (
                <button
                  onClick={handleBatchImport}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>批量接入勾选模型 ({selectedDiscoveredIds.length})</span>
                </button>
              )}
              <button
                onClick={handleCreateSingleModel}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md"
              >
                接入此模型
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
