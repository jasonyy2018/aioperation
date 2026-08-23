export type ModelType = 'text' | 'image' | 'video';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  protocol: string;
  type: ModelType;
  status: 'active' | 'inactive';
  apiKey: string;
  modelName?: string;
  description?: string;
}

export interface PromptTemplate {
  id: string;
  module: string;
  name: string;
  content: string;
  isCustom?: boolean;
}

export interface HotspotItem {
  id?: string;
  title: string;
  summary: string;
  cat: 'ai' | 'content' | 'short-video' | 'platform' | 'trend' | 'monetize' | 'all';
  hotness: number;
  source: string;
  url?: string;
  date?: string;
}

export interface ScriptScene {
  id: string;
  timeRange: string;
  sceneDescription: string;
  visualPrompt: string;
  dialogue: string;
  bgm: string;
}

export interface VideoScriptData {
  title: string;
  platform: string;
  theme: string;
  duration: string;
  scenes: ScriptScene[];
  fullText?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  createdAt: string;
}

export interface GeneratedVideo {
  id: string;
  taskId: string;
  url?: string;
  prompt: string;
  model: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  progress?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface DerivedComment {
  id: string;
  text: string;
  angle: string;
  likesEst?: number;
}

export interface SmartReplyResult {
  intent: '咨询' | '夸赞' | '吐槽' | '广告' | '其他';
  analysis: string;
  replies: string[];
}

export interface SocialAccount {
  id: string;
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'wechat' | 'shipinhao' | 'bilibili' | 'zhihu' | 'weibo';
  accountName: string;
  accountId: string;
  avatar?: string;
  followers: number;
  category: string;
  status: 'active' | 'review' | 'banned' | 'idle';
  notes?: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  type: 'article' | 'script' | 'image' | 'video' | 'comment' | 'mandala' | 'comic' | 'photo' | 'live';
  content: string;
  mediaUrl?: string;
  tags: string[];
  platform?: string;
  createdAt: string;
}

export interface VisitorLog {
  id: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  userAgent: string;
  path: string;
  timestamp: string;
}

export interface IpStatsSummary {
  totalVisits: number;
  uniqueIps: number;
  todayVisits: number;
  topCities: { city: string; count: number }[];
  topIsps: { isp: string; count: number }[];
  recentLogs: VisitorLog[];
}

export interface DiscoveredModel {
  id: string;
  name: string;
  type: ModelType;
  owned_by?: string;
}

// === 1. Mandala & IP Topic Types ===
export interface MandalaDimension {
  id: string;
  dimensionName: string;
  description: string;
  topics: {
    title: string;
    hook: string;
    angle: string;
  }[];
}

export interface AccountProfileSet {
  nickname: string;
  slogan: string;
  bio: string;
  avatarPrompt: string;
  bannerPrompt: string;
  targetAudience: string;
  monetizePath: string;
}

// === 2. Comic & 3-Views Storyboard Types ===
export interface ThreeViewsAsset {
  characterName: string;
  gender: string;
  style: string;
  features: string;
  frontPrompt: string;
  sidePrompt: string;
  backPrompt: string;
  seedCode?: string;
  imageUrl?: string;
}

export interface ComicSceneCard {
  id: string;
  stepName: '前3秒黄金钩子' | '痛点剧情展开' | 'FABE卖点突围' | '行动号召转化';
  visualDesc: string;
  cameraMovement: string;
  dialogue: string;
  fabeAnalysis?: string;
  imagePrompt: string;
  videoPrompt: string;
}

// === 3. Commercial Photo Studio Types ===
export interface PhotoStudioItem {
  id: string;
  title: string;
  mode: 'scene-switch' | 'old-photo-restore' | 'cover-ctr';
  originalImage?: string;
  resultImage?: string;
  sceneTheme: string;
  prompt: string;
  createdAt: string;
}

// === 4. Live Streaming Cockpit Types ===
export interface LiveProductItem {
  id: string;
  name: string;
  type: 'hook' | 'burst' | 'profit' | 'gift'; // 引流品 / 爆款品 / 利润品 / 赠品
  originalPrice: number;
  livePrice: number;
  stock: number;
  fabeSellingPoint: string;
  urgencyScript: string;
}

export interface LiveBarrageLog {
  id: string;
  user: string;
  message: string;
  intent: 'price' | 'authenticity' | 'usage' | 'shipping' | 'negative' | 'praise';
  strategy: string;
  recommendedReply: string;
  timestamp: string;
}

// === 5. Training LMS Mission Types ===
export interface TrainingMission {
  id: string;
  dayNumber: 1 | 2 | 3;
  periodRange: string;
  title: string;
  target: string;
  taskRequirement: string;
  deliverableType: 'profile' | 'script-video' | 'live-sop' | 'matrix';
  status: 'pending' | 'submitted' | 'approved';
  submissionContent?: string;
  aiScore?: number;
  aiFeedback?: string;
  mentorFeedback?: string;
}
