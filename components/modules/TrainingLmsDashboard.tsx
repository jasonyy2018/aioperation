'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  BookOpen,
  FileCheck,
  Building2,
  FolderPlus,
  Users,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AIModelConfig, PromptTemplate, TrainingMission } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface TrainingLmsDashboardProps {
  models: AIModelConfig[];
  prompts: PromptTemplate[];
}

const DEFAULT_MISSIONS: TrainingMission[] = [
  {
    id: 'm1',
    dayNumber: 1,
    periodRange: '第 1-3 课时',
    title: '关卡一：账号商业定位与视觉四件套搭建',
    target: '完成 1 个精准赛道定位与 AI 辅助四件套（昵称、头像、简介、背景图）',
    taskRequirement: '在“曼陀罗选题与IP”模块生成人设四件套，并在目标平台（抖音/小红书）完成主页配置，提交个人简介与头像生图Prompt。',
    deliverableType: 'profile',
    status: 'approved',
    submissionContent: '【昵称】老谢讲老字号网创\n【简介】20年IT老兵 ✖️ AI落地实战专家。带你用AI把黄浦老字号做出千万爆款！关注领《50套带货Prompt秘籍》',
    aiScore: 92,
    aiFeedback: '定位清晰，身份背书与关注钩子极强，符合算法初始权重推荐标准！',
    mentorFeedback: '通过。简介排版非常规整，建议背景图加上星光色谷基地认证标识。',
  },
  {
    id: 'm2',
    dayNumber: 2,
    periodRange: '第 4-9 课时',
    title: '关卡二：AI 漫剧分镜设计与图生视频实操',
    target: '完成 1 条 4 阶段带货脚本 + 角色商品三视图 + 1 条图生视频短片',
    taskRequirement: '在“AI 漫剧导演”模块设计 4 幕分镜，提炼 FABE 卖点，生成角色三视图，并在剪映完成图生视频剪辑。',
    deliverableType: 'script-video',
    status: 'submitted',
    submissionContent: '剧本《老字号月饼秘方被偷，学徒靠AI破局》。已完成苏师傅三视图，前3秒钩子为特写镜头切入并配合反常识台词。',
    aiScore: 88,
    aiFeedback: '前3秒戏剧冲突强烈，FABE卖点突围自然，符合高完播率算法模型。',
  },
  {
    id: 'm3',
    dayNumber: 3,
    periodRange: '第 10-12 课时',
    title: '关卡三：数据化选品策略与公私域引流钩子',
    target: '完成 1 套引流/爆款/利润品排品清单 + 3 套全域引流话术',
    taskRequirement: '根据自身企业或带货赛道，规划直播排品矩阵，并设计置顶评论与私信自动回复钩子。',
    deliverableType: 'matrix',
    status: 'pending',
  },
  {
    id: 'm4',
    dayNumber: 3,
    periodRange: '第 13-18 课时',
    title: '关卡四：直播间开播演练与 6 大数据复盘',
    target: '完成 1 次 15 分钟实战开播模拟 + 提交数据复盘报告',
    taskRequirement: '利用“智能直播操盘”模块演练 7 分钟起号与倒计时逼单话术，模拟弹幕场控并输出复盘诊断。',
    deliverableType: 'live-sop',
    status: 'pending',
  },
];

export function TrainingLmsDashboard({
  models,
  prompts,
}: TrainingLmsDashboardProps) {
  const { showToast } = useToast();
  const textModels = models.filter((m) => m.type === 'text');
  const [selectedModel, setSelectedModel] = useState<string>(textModels[0]?.id || 'minimax-text');

  const [missions, setMissions] = useState<TrainingMission[]>(DEFAULT_MISSIONS);
  const [activeMissionId, setActiveMissionId] = useState<string>('m2');
  const [submissionText, setSubmissionText] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const activeMission = missions.find((m) => m.id === activeMissionId) || missions[0];

  useEffect(() => {
    if (textModels.length > 0 && !textModels.some((m) => m.id === selectedModel)) {
      setSelectedModel(textModels[0].id);
    }
  }, [models]);

  useEffect(() => {
    if (activeMission.submissionContent) {
      setSubmissionText(activeMission.submissionContent);
    } else {
      setSubmissionText('');
    }
    setEvaluationResult(null);
  }, [activeMissionId]);

  // AI Evaluate Mission Submission
  const handleEvaluateSubmission = async () => {
    if (!submissionText.trim()) {
      showToast('请输入作业提交内容', 'warning');
      return;
    }
    setEvaluating(true);
    try {
      const promptContent = prompts.find((p) => p.id === 'lms-eval')?.content || '';
      const userPrompt = `实训关卡：【${activeMission.title}】。\n学员提交作业：\n${submissionText}\n请给出多维度打分与修改改进建议。`;

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
      if (!res.ok || data.error) throw new Error(data.error || '评审失败');

      let text = data.text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const parsed = JSON.parse(text.trim());
      setEvaluationResult(parsed);

      setMissions((prev) =>
        prev.map((m) =>
          m.id === activeMission.id
            ? {
                ...m,
                status: 'submitted',
                submissionContent: submissionText,
                aiScore: parsed.totalScore,
                aiFeedback: parsed.aiSummary,
              }
            : m
        )
      );

      showToast(`AI 智能初审完成！得分：${parsed.totalScore}分`, 'success');
    } catch (err: any) {
      showToast(err.message || '作业评审异常', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
              黄浦区就业促进中心 & 星光色谷老字号公共创业实训载体
            </span>
            <span className="text-xs text-slate-400">联合认证</span>
          </div>
          <h2 className="text-xl font-black text-slate-100 tracking-wide">
            AI 赋能直播网创实战训练营 · 18课时通关打卡中枢
          </h2>
          <p className="text-xs text-slate-300">
            20% 理论 + 80% 实操 · 完成全部 4 大关卡即可获颁结业认证并入库老字号创业孵化扶持池
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">通关进度</span>
            <span className="text-lg font-black text-emerald-400">
              {missions.filter((m) => m.status === 'approved' || m.status === 'submitted').length} / {missions.length}
            </span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">综合均分</span>
            <span className="text-lg font-black text-rose-400">90.0</span>
          </div>
        </div>
      </div>

      {/* Main LMS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Missions Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>18 课时阶梯式实战关卡</span>
            </h3>
          </div>

          {missions.map((mission, idx) => {
            const isSelected = activeMissionId === mission.id;
            return (
              <div
                key={mission.id}
                onClick={() => setActiveMissionId(mission.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? 'bg-indigo-500/15 border-indigo-500/60 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">{mission.periodRange}</span>
                  {mission.status === 'approved' ? (
                    <Badge variant="success">已通过</Badge>
                  ) : mission.status === 'submitted' ? (
                    <Badge variant="primary">已提交 ({mission.aiScore}分)</Badge>
                  ) : (
                    <Badge variant="neutral">待通关</Badge>
                  )}
                </div>

                <h4 className="font-bold text-xs text-slate-100">{mission.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-1">{mission.target}</p>
              </div>
            );
          })}

          {/* Yellow River / Huangpu Policy Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>黄浦区老字号与初创企业扶持直通车</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              结营优秀个人与老字号企业可申请入驻星光摄影器材城老字号孵化空间，享受政策补贴咨询与 1v1 商业化导师陪跑。
            </p>
          </div>
        </div>

        {/* Right Submission & AI Review Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-indigo-400 font-mono font-semibold">{activeMission.periodRange}</span>
              <h3 className="font-bold text-base text-slate-100 mt-0.5">{activeMission.title}</h3>
            </div>
            <Badge variant="purple">交付目标: {activeMission.target}</Badge>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="text-rose-400 font-semibold block text-[11px]">任务具体要求:</span>
            <p className="leading-relaxed">{activeMission.taskRequirement}</p>
          </div>

          {/* Submission Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">作业内容提交 / 成果文案 / 视频链接</label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={5}
              placeholder="在此粘贴您在各个模块生成的四件套文案、漫剧分镜脚本、三视图生图指令、直播排品SOP或发布链接..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">评审模型:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {textModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleEvaluateSubmission}
              disabled={evaluating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
              <span>{evaluating ? 'AI 导师正在多维评审...' : '提交作业并进行 AI 智能初审'}</span>
            </button>
          </div>

          {/* AI Evaluation Report Result */}
          {evaluationResult && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>AI 智能导师初审报告</span>
                </h4>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">综合得分:</span>
                  <span className="text-lg font-black text-rose-400">{evaluationResult.totalScore}</span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </div>

              {/* Sub Scores */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block">前3秒吸睛度</span>
                  <span className="text-base font-bold text-indigo-300">{evaluationResult.hookScore}分</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block">商业转化度</span>
                  <span className="text-base font-bold text-purple-300">{evaluationResult.monetizeScore}分</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block">合规风控</span>
                  <span className="text-xs font-bold text-emerald-400 block mt-1">{evaluationResult.compliance}</span>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="font-bold text-emerald-400 block text-[11px]">✨ 优秀亮点:</span>
                  <ul className="text-slate-300 space-y-1 list-disc list-inside">
                    {evaluationResult.strengths?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="font-bold text-amber-400 block text-[11px]">💡 优化建议:</span>
                  <ul className="text-slate-300 space-y-1 list-disc list-inside">
                    {evaluationResult.improvements?.map((imp: string, i: number) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                <strong>导师总结：</strong>{evaluationResult.aiSummary}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
