'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Star, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AIModelConfig, ModelType } from '@/types';

interface AIModelSelectorProps {
  models: AIModelConfig[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  type: ModelType;
  moduleKey?: string;
  label?: string;
  className?: string;
}

export function AIModelSelector({
  models,
  selectedModel,
  onSelectModel,
  type,
  moduleKey,
  label = 'AI 驱动引擎',
  className = '',
}: AIModelSelectorProps) {
  const { showToast } = useToast();
  const availableModels = models.filter((m) => m.type === type);
  const [defaultModelId, setDefaultModelId] = useState<string>('');

  const storageKey = moduleKey ? `automedia_default_model_${moduleKey}` : `automedia_default_model_${type}`;

  // Read default model on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey) || localStorage.getItem(`automedia_default_model_${type}`);
        if (saved) {
          setDefaultModelId(saved);
          // If available, auto select it
          if (availableModels.some((m) => m.id === saved)) {
            onSelectModel(saved);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [storageKey, type]);

  const handleSetDefault = () => {
    const current = availableModels.find((m) => m.id === selectedModel);
    if (!current) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, current.id);
        localStorage.setItem(`automedia_default_model_${type}`, current.id);
        setDefaultModelId(current.id);
        showToast(`⭐ 已将【${current.name}】设为默认模型，后续将优先自动加载！`, 'success');
      }
    } catch (e) {
      showToast('设置默认模型失败', 'error');
    }
  };

  const isCurrentDefault = selectedModel === defaultModelId;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={handleSetDefault}
          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
            isCurrentDefault
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
          }`}
          title="点击将当前选中的模型设为默认模型，下次进入本章节时自动加载"
        >
          <Star className={`w-3 h-3 ${isCurrentDefault ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{isCurrentDefault ? '当前为默认模型' : '设为默认模型'}</span>
        </button>
      </div>

      <select
        value={selectedModel}
        onChange={(e) => onSelectModel(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
      >
        {availableModels.map((m) => {
          const isDef = m.id === defaultModelId;
          const statusText = m.status === 'active' ? '🟢' : '⚪';
          return (
            <option key={m.id} value={m.id}>
              {statusText} {m.name} {isDef ? '⭐ (已设为默认)' : ''} ({m.provider})
            </option>
          );
        })}
      </select>
    </div>
  );
}
