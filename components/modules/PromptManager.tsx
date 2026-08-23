'use client';

import React, { useState } from 'react';
import {
  Settings2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Edit,
  Sparkles,
  Check,
  Search,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { PromptTemplate } from '@/types';
import { DEFAULT_PROMPTS } from '@/lib/constants/prompts';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface PromptManagerProps {
  prompts: PromptTemplate[];
  onUpdatePrompt: (prompt: PromptTemplate) => void;
  onAddPrompt: (prompt: PromptTemplate) => void;
  onDeletePrompt: (id: string) => void;
  onResetDefaults: () => void;
}

export function PromptManager({
  prompts,
  onUpdatePrompt,
  onAddPrompt,
  onDeletePrompt,
  onResetDefaults,
}: PromptManagerProps) {
  const { showToast } = useToast();
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New prompt state
  const [newModule, setNewModule] = useState<string>('自定义模块');
  const [newName, setNewName] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');

  const modules = [
    { id: 'all', label: '全部模块' },
    { id: '热点发现', label: '热点发现' },
    { id: '图文生成', label: '图文生成' },
    { id: '短视频生成', label: '短视频生成' },
    { id: '图片创作', label: '图片创作' },
    { id: '视频创作', label: '视频创作' },
    { id: '评论运营', label: '评论运营' },
    { id: '爆款拆解', label: '爆款拆解' },
  ];

  const filteredPrompts = prompts.filter((p) => {
    const matchModule = selectedModule === 'all' || p.module === selectedModule;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.module.toLowerCase().includes(search.toLowerCase());
    return matchModule && matchSearch;
  });

  const handleSaveEdit = () => {
    if (!editingPrompt) return;
    onUpdatePrompt(editingPrompt);
    setEditingPrompt(null);
    showToast('提示词已更新！', 'success');
  };

  const handleCreatePrompt = () => {
    if (!newName.trim() || !newContent.trim()) {
      showToast('请填写完整的提示词名称和内容', 'warning');
      return;
    }
    const created: PromptTemplate = {
      id: `custom_${Date.now()}`,
      module: newModule,
      name: newName,
      content: newContent,
      isCustom: true,
    };
    onAddPrompt(created);
    setNewName('');
    setNewContent('');
    setIsAddModalOpen(false);
    showToast('已新增自定义提示词模板！', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索提示词名称或 Prompt 内容..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModule(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedModule === m.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增提示词</span>
          </button>
          <button
            onClick={() => {
              if (confirm('确定要恢复所有默认预设提示词吗？自定义修改将被覆盖。')) {
                onResetDefaults();
                showToast('已恢复至出厂默认提示词', 'success');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认</span>
          </button>
        </div>
      </div>

      {/* Prompts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPrompts.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{p.module}</Badge>
                  {p.isCustom && <Badge variant="warning">自定义</Badge>}
                </div>
                <span className="text-[10px] font-mono text-slate-500">ID: {p.id}</span>
              </div>

              <h4 className="font-semibold text-slate-100 text-sm mb-2">{p.name}</h4>

              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {p.content}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingPrompt(p)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>编辑 Prompt</span>
              </button>
              {p.isCustom && (
                <button
                  onClick={() => {
                    if (confirm(`确定删除“${p.name}”？`)) {
                      onDeletePrompt(p.id);
                      showToast('提示词已删除', 'info');
                    }
                  }}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Prompt Modal */}
      {editingPrompt && (
        <Modal
          isOpen={!!editingPrompt}
          onClose={() => setEditingPrompt(null)}
          title={`编辑提示词 - ${editingPrompt.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">所属模块</label>
                <input
                  type="text"
                  value={editingPrompt.module}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, module: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">提示词名称</label>
                <input
                  type="text"
                  value={editingPrompt.name}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Prompt 核心指令内容</label>
              <textarea
                value={editingPrompt.content}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingPrompt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存生效</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Custom Prompt Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="新增自定义提示词模板"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">所属模块</label>
              <input
                type="text"
                value={newModule}
                onChange={(e) => setNewModule(e.target.value)}
                placeholder="例如：短剧脚本 / 爆款标题"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">提示词名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如：反转短剧分镜 System Prompt"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Prompt 提示词内容</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="输入大模型的角色设定、任务要求、约束条件与输出格式规范..."
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              取消
            </button>
            <button
              onClick={handleCreatePrompt}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
            >
              创建提示词
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
