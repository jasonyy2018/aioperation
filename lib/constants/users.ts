import { UserProfile, UserRole, PermissionKey } from '@/types';

export const ROLE_DEFINITIONS: Record<
  UserRole,
  {
    name: string;
    description: string;
    badgeColor: string;
    defaultPermissions: PermissionKey[];
  }
> = {
  admin: {
    name: '超级管理员',
    description: '拥有全系统 100% 权限，包括大模型 API Key 配置、提示词配置与系统全员管理',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    defaultPermissions: [
      'create_content',
      'live_cockpit',
      'account_matrix',
      'manage_assets',
      'lms_submit',
      'lms_grade',
      'view_analytics',
      'manage_prompts',
      'manage_models',
      'manage_users',
    ],
  },
  mentor: {
    name: '实训导师 / 运营总监',
    description: '拥有全套创作与直播工具，负责 18 课时学员作业终审、导师点评与带货指导',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    defaultPermissions: [
      'create_content',
      'live_cockpit',
      'account_matrix',
      'manage_assets',
      'lms_submit',
      'lms_grade',
      'view_analytics',
      'manage_prompts',
    ],
  },
  enterprise: {
    name: '老字号企业 / 创客操盘手',
    description: '老字号门店团队与初创企业，专注于曼陀罗爆款策划、AI 漫剧、商业影棚与直播带货',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    defaultPermissions: [
      'create_content',
      'live_cockpit',
      'account_matrix',
      'manage_assets',
      'lms_submit',
      'view_analytics',
    ],
  },
  student: {
    name: '实训学员 / 初级创客',
    description: '参与 18 课时实训课程的学员，专注基础创作实操与通关打卡交作业',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    defaultPermissions: [
      'create_content',
      'manage_assets',
      'lms_submit',
    ],
  },
};

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user_admin',
    username: 'admin',
    name: '谢喜明 (超级管理员)',
    password: 'admin',
    role: 'admin',
    organization: '黄浦创业实训基地 & 平台研发中心',
    email: 'admin@liveops.ai',
    status: 'active',
    createdAt: '2026-08-01',
    lastLoginAt: '刚刚',
  },
  {
    id: 'user_mentor',
    username: 'mentor_li',
    name: '李导师 (实训教学总监)',
    password: 'mentor',
    role: 'mentor',
    organization: '星光色谷老字号创业实训基地',
    email: 'mentor@liveops.ai',
    status: 'active',
    createdAt: '2026-08-10',
    lastLoginAt: '10分钟前',
  },
  {
    id: 'user_enterprise',
    username: 'laozihao_boss',
    name: '王总 (老字号品牌主理人)',
    password: 'boss',
    role: 'enterprise',
    organization: '上海老字号传承创新联盟',
    email: 'laozihao@shanghai.com',
    status: 'active',
    createdAt: '2026-08-15',
    lastLoginAt: '1小时前',
  },
  {
    id: 'user_student',
    username: 'student_zhang',
    name: '小张同学 (18课时学员)',
    password: 'student',
    role: 'student',
    organization: 'AI 赋能直播网创第 1 期实训营',
    email: 'student@campus.com',
    status: 'active',
    createdAt: '2026-08-20',
    lastLoginAt: '2小时前',
  },
  {
    id: 'user_pending_1',
    username: 'zhou_student',
    name: '周华 (申请实训学员)',
    password: 'student',
    role: 'student',
    appliedRole: 'student',
    applyReason: '报名参加 9/7 黄浦区老字号实训营第 1 期，申请通关打卡账号',
    organization: '上海立信会计金融学院 / 自媒体创客',
    email: 'zhouhua@univ.edu.cn',
    phone: '13812345678',
    status: 'pending_approval',
    createdAt: '2026-08-23',
  },
  {
    id: 'user_pending_2',
    username: 'shaowansheng_mkt',
    name: '钱经理 (申请老字号企业主理人)',
    password: 'boss',
    role: 'enterprise',
    appliedRole: 'enterprise',
    applyReason: '邵万生食品数字化营销团队，申请 AI 漫剧与直播排品企业权限',
    organization: '上海邵万生食品有限公司电商部',
    email: 'qian@shaowansheng.com',
    phone: '13987654321',
    status: 'pending_approval',
    createdAt: '2026-08-23',
  },
];

export function hasPermission(user: UserProfile, permission: PermissionKey): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.role === 'admin') return true;
  
  // Custom overrides
  if (user.customPermissions && user.customPermissions.includes(permission)) {
    return true;
  }

  const roleDef = ROLE_DEFINITIONS[user.role];
  return roleDef?.defaultPermissions.includes(permission) || false;
}
