'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  MapPin,
  Wifi,
  Clock,
  Trash2,
  RefreshCw,
  Activity,
  Shield,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { IpStatsSummary, VisitorLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function VisitorAnalytics() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<IpStatsSummary>({
    totalVisits: 0,
    uniqueIps: 0,
    todayVisits: 0,
    topCities: [],
    topIsps: [],
    recentLogs: [],
  });
  const [clientIp, setClientIp] = useState<string>('127.0.0.1');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ip_stats');
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      }
      if (data.clientIp) {
        setClientIp(data.clientIp);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Record current visitor visit
    const recordVisit = async () => {
      try {
        // Try public IP lookup API for richer geo info
        let geo = { ip: '', country: '中国', city: '未知', isp: '电信/联通/移动' };
        try {
          const ipRes = await fetch('https://ipapi.co/json/', { mode: 'cors' }).catch(() => null);
          if (ipRes && ipRes.ok) {
            const ipData = await ipRes.json();
            geo = {
              ip: ipData.ip || '',
              country: ipData.country_name || '中国',
              city: ipData.city || '未知',
              isp: ipData.org || '宽带网络',
            };
          }
        } catch {
          // fallback
        }

        await fetch('/api/ip_stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...geo,
            path: window.location.pathname || '/',
          }),
        });
      } catch (err) {
        console.error('Record visit error:', err);
      } finally {
        fetchStats();
      }
    };

    recordVisit();
  }, []);

  const handleClearLogs = async () => {
    if (!confirm('确定清空所有访问记录吗？')) return;
    try {
      await fetch('/api/ip_stats', { method: 'DELETE' });
      showToast('访客统计记录已重置', 'success');
      fetchStats();
    } catch (err: any) {
      showToast('清空失败', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">累计访问量 (PV)</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{summary.totalVisits}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">独立访客 IP (UV)</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{summary.uniqueIps}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">今日实时访问</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{summary.todayVisits}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">当前客户端 IP</p>
            <h3 className="text-sm font-mono font-bold text-cyan-300 mt-1 truncate max-w-[140px]">
              {clientIp}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top Cities */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-slate-200">访客城市地域分布 Top 10</h4>
            </div>
          </div>

          {summary.topCities.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">暂无地域数据</p>
          ) : (
            <div className="space-y-2.5">
              {summary.topCities.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-4 font-mono text-slate-500">{idx + 1}.</span>
                    {item.city}
                  </span>
                  <span className="font-semibold text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">
                    {item.count} 次
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top ISPs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-semibold text-slate-200">网络服务运营商分布 (ISP)</h4>
            </div>
          </div>

          {summary.topIsps.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">暂无运营商数据</p>
          ) : (
            <div className="space-y-2.5">
              {summary.topIsps.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-2 truncate max-w-[220px]">
                    <span className="w-4 font-mono text-slate-500">{idx + 1}.</span>
                    {item.isp}
                  </span>
                  <span className="font-semibold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                    {item.count} 次
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Visit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-200">最新访问流水日志 (最近 50 条)</h4>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空记录</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950/40">
                <th className="py-3 px-4">访问时间</th>
                <th className="py-3 px-4">IP 地址</th>
                <th className="py-3 px-4">归属地理位置</th>
                <th className="py-3 px-4">运营商</th>
                <th className="py-3 px-4">访问路径</th>
                <th className="py-3 px-4">客户端 UA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {summary.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    暂无访问记录
                  </td>
                </tr>
              ) : (
                summary.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{formatDate(log.timestamp)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-300">{log.ip}</td>
                    <td className="py-3 px-4">
                      {log.city && log.city !== '未知' ? `${log.country} · ${log.city}` : log.country}
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[140px]">{log.isp}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{log.path}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]" title={log.userAgent}>
                      {log.userAgent}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
