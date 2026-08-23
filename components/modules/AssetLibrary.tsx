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
    { id: 'article', label: '图文文章', icon: FileText },
    { id: 'script', label: '短视频脚本', icon: Video },
    { id: 'image', label: '图片作品', icon: ImageIcon },
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索资产标题、正文关键词或标签..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {typeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterType === tab.id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            共 {filteredAssets.length} 项资产
          </span>
          {assets.length > 0 && onClearAll && (
            <button
              onClick={() => {
                if (confirm('确定要清空全部资产库吗？')) onClearAll();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500 space-y-3">
          <FolderArchive className="w-12 h-12 mx-auto opacity-30 text-teal-400" />
          <p className="text-xs">资产库空空如也，在生成图文、分镜、图片或视频后点击“存入资产库”即可在此永久保存</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {getTypeIcon(asset.type)}
                    </div>
                    <span className="text-xs font-semibold text-slate-300 capitalize">{asset.type}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{formatDate(asset.createdAt)}</span>
                </div>

                {asset.mediaUrl && asset.type === 'image' && (
                  <div className="mb-3 rounded-xl overflow-hidden aspect-video bg-slate-950">
                    <img src={asset.mediaUrl} alt={asset.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {asset.mediaUrl && asset.type === 'video' && (
                  <div className="mb-3 rounded-xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center">
                    <video src={asset.mediaUrl} className="w-full h-full object-cover" />
                  </div>
                )}

                <h4 className="font-semibold text-slate-100 text-sm mb-2 line-clamp-1 group-hover:text-teal-300 transition-colors">
                  {asset.title}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
                  {asset.content}
                </p>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {asset.tags.map((t, idx) => (
                      <Badge key={idx} variant="neutral">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewAsset(asset)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>查看详情</span>
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleCopyContent(asset)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                    title="复制内容"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownloadAsset(asset)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                    title="下载文件"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定删除资产“${asset.title}”？`)) {
                        onDeleteAsset(asset.id);
                        showToast('资产已删除', 'info');
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Preview Modal */}
      {previewAsset && (
        <Modal
          isOpen={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
          title={`资产详情 - ${previewAsset.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {previewAsset.mediaUrl && previewAsset.type === 'image' && (
              <div className="rounded-xl overflow-hidden max-h-96 flex items-center justify-center bg-black/40">
                <img src={previewAsset.mediaUrl} alt={previewAsset.title} className="max-h-96 object-contain rounded-lg" />
              </div>
            )}

            {previewAsset.mediaUrl && previewAsset.type === 'video' && (
              <div className="rounded-xl overflow-hidden aspect-video bg-black/60">
                <video src={previewAsset.mediaUrl} controls className="w-full h-full object-contain" />
              </div>
            )}

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-y-auto max-h-[50vh]">
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {previewAsset.content}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleCopyContent(previewAsset)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>复制正文</span>
              </button>
              <button
                onClick={() => handleDownloadAsset(previewAsset)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载文件</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
