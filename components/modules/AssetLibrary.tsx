'use client';

import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  Trash2,
  Download,
  Copy,
  Eye,
  FileText,
  Video,
  Image as ImageIcon,
  Film,
  MessageSquare,
  Sparkles,
  Compass,
  Clapperboard,
  Camera,
  Radio,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { MediaAsset } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

interface AssetLibraryProps {
  assets: MediaAsset[];
  onDeleteAsset: (id: string) => void;
  onClearAll?: () => void;
}

export function AssetLibrary({ assets, onDeleteAsset, onClearAll }: AssetLibraryProps) {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  const typeTabs = [
    { id: 'all', label: '全部资产' },
    { id: 'mandala', label: '曼陀罗/IP', icon: Compass },
    { id: 'comic', label: '漫剧/三视图', icon: Clapperboard },
    { id: 'photo', label: '商业大片', icon: Camera },
    { id: 'live', label: '直播剧本', icon: Radio },
    { id: 'article', label: '图文文章', icon: FileText },
    { id: 'script', label: '短视频脚本', icon: Video },
    { id: 'image', label: 'AI 生图', icon: ImageIcon },
    { id: 'video', label: '渲染视频', icon: Film },
    { id: 'comment', label: '评论话术', icon: MessageSquare },
  ];

  const filteredAssets = assets.filter((a) => {
    const matchType = filterType === 'all' || a.type === filterType;
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      (a.tags && a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    return matchType && matchSearch;
  });

  const handleCopyContent = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.content);
    showToast('内容已复制到剪贴板', 'success');
  };

  const handleDownloadAsset = (asset: MediaAsset) => {
    if (asset.mediaUrl) {
      const a = document.createElement('a');
      a.href = asset.mediaUrl;
      a.download = `${asset.title}.${asset.type === 'video' ? 'mp4' : 'png'}`;
      a.target = '_blank';
      a.click();
      showToast('开始下载媒体文件', 'success');
    } else {
      const blob = new Blob([asset.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('已导出文本文件', 'success');
    }
  };

  const getTypeIcon = (type: MediaAsset['type']) => {
    switch (type) {
      case 'mandala':
        return <Compass className="w-4 h-4 text-rose-400" />;
      case 'comic':
        return <Clapperboard className="w-4 h-4 text-purple-400" />;
      case 'photo':
        return <Camera className="w-4 h-4 text-cyan-400" />;
      case 'live':
        return <Radio className="w-4 h-4 text-red-400" />;
      case 'article':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'script':
        return <Video className="w-4 h-4 text-pink-400" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-sky-400" />;
      case 'video':
        return <Film className="w-4 h-4 text-purple-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索标题、内容或标签..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">共 {filteredAssets.length} 项资产</span>
        </div>

        {assets.length > 0 && onClearAll && (
          <button
            onClick={() => {
              if (confirm('确定要清空所有资产记录吗？此操作无法恢复。')) {
                onClearAll();
                showToast('资产库已清空', 'info');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空资产库</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.id === 'all'
              ? assets.length
              : assets.filter((a) => a.type === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <FolderArchive className="w-12 h-12 text-slate-700 stroke-[1.5]" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-slate-400">暂无符合条件的自媒体资产</h4>
            <p className="text-xs">在创作工坊、漫剧分镜、虚拟影棚或直播中枢生成的成果可一键归档至此处</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(asset.type)}
                    <Badge variant="purple">{asset.type}</Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatDate(asset.createdAt)}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                  {asset.title}
                </h4>

                {/* Media Preview Thumbnail */}
                {asset.mediaUrl && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    {asset.type === 'video' ? (
                      <video src={asset.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={asset.mediaUrl} alt={asset.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans">
                  {asset.content}
                </p>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {asset.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <button
                  onClick={() => setPreviewAsset(asset)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>查看详情</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyContent(asset)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                    title="复制内容"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownloadAsset(asset)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                    title="下载资产"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定要删除资产“${asset.title}”吗？`)) {
                        onDeleteAsset(asset.id);
                        showToast('资产已删除', 'info');
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors"
                    title="删除资产"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <Modal
          isOpen={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
          title={`资产详情 - ${previewAsset.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant="purple">{previewAsset.type}</Badge>
                <span className="text-xs text-slate-400 font-mono">创建时间: {previewAsset.createdAt}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyContent(previewAsset)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制内容</span>
                </button>
                <button
                  onClick={() => handleDownloadAsset(previewAsset)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出文件</span>
                </button>
              </div>
            </div>

            {previewAsset.mediaUrl && (
              <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                {previewAsset.type === 'video' ? (
                  <video src={previewAsset.mediaUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={previewAsset.mediaUrl} alt={previewAsset.title} className="w-full h-full object-contain" />
                )}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                {previewAsset.content}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
