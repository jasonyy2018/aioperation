'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserProfile } from '@/types';

/**
 * 认证上下文 v2 — 服务端 Session
 * - 登录/注册/登出全部走服务端 API
 * - 会话凭据存于 httpOnly Cookie（前端 JS 不可读取，防 XSS 窃取）
 * - 页面刷新时通过 /api/auth/me 恢复登录态
 */

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<{ success: boolean; message: string }>;
}

export interface RegisterInput {
  username: string;
  name: string;
  password: string;
  role?: string;
  organization?: string;
  phone?: string;
  applyReason?: string;
}

const defaultState: AuthState = {
  user: null,
  isLoggedIn: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | null>(null);

/** 服务端 SafeUser → 前端 UserProfile 形状适配 */
function adaptUser(safe: any): UserProfile {
  return {
    id: safe.id,
    username: safe.username,
    name: safe.name,
    role: safe.role,
    organization: safe.organization,
    email: safe.email,
    phone: safe.phone,
    status: (safe.status as UserProfile['status']) || 'active',
    createdAt: safe.createdAt || '',
    lastLoginAt: safe.lastLoginAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(defaultState);

  // Restore session from server on mount
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data.isLoggedIn && data.user) {
          setState({
            user: adaptUser(data.user),
            isLoggedIn: true,
            isLoading: false,
          });
          return;
        }
      } catch { /* network error → treat as logged out */ }
      if (!cancelled) setState({ ...defaultState, isLoading: false });
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        // 无论状态码如何，先尝试解析 JSON 拿到服务端返回的真实错误信息
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // 响应不是 JSON（如网关 502 HTML 错误页）
          return { success: false, message: `服务异常 (HTTP ${res.status})，请查看服务器日志` };
        }
        if (!data) {
          return { success: false, message: `服务异常 (HTTP ${res.status})` };
        }

        if (data.success && data.user) {
          setState({
            user: adaptUser(data.user),
            isLoggedIn: true,
            isLoading: false,
          });
        }
        return { success: !!data.success, message: data.message || data.error || '' };
      } catch {
        // fetch 本身抛错 = 请求根本没到达服务器
        return { success: false, message: '无法连接到服务器，请检查服务是否运行中' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } catch { /* ignore */ }
    setState({ ...defaultState, isLoading: false });
  }, []);

  const register = useCallback(
    async (input: RegisterInput): Promise<{ success: boolean; message: string }> => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        return { success: !!data.success, message: data.message || '' };
      } catch {
        return { success: false, message: '网络错误，请稍后重试' };
      }
    },
    []
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
