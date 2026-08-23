'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserProfile } from '@/types';
import { DEFAULT_USERS } from '@/lib/constants/users';

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  logout: () => void;
  register: (user: UserProfile) => Promise<{ success: boolean; message: string }>;
  updateUser: (updated: UserProfile) => void;
  getUsers: () => UserProfile[];
  updateUsers: (users: UserProfile[]) => void;
}

const STORAGE_KEYS = {
  USER: 'automedia_current_user',
  LOGGED_IN: 'automedia_is_logged_in',
  USERS: 'automedia_users',
  ATTEMPTS: 'automedia_login_attempts',
  LOCKOUT: 'automedia_login_lockout',
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const defaultState: AuthState = {
  user: null,
  isLoggedIn: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | null>(null);

function loadUsers(): UserProfile[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return DEFAULT_USERS;
}

function saveUsers(users: UserProfile[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch { /* ignore */ }
}

function loadUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { return null; }
    }
  } catch { return null; }
  return null;
}

function isLockedOut(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const lockoutEnd = localStorage.getItem(STORAGE_KEYS.LOCKOUT);
    if (lockoutEnd) {
      return Date.now() < parseInt(lockoutEnd, 10);
    }
  } catch { return false; }
  return false;
}

function getAttemptCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '{}');
    if (data.lastReset && Date.now() - parseInt(data.lastReset, 10) > 15 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
      return 0;
    }
    return data.count || 0;
  } catch { return 0; }
}

function incrementAttempts() {
  if (typeof window === 'undefined') return;
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '{}');
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify({
      count: (data.count || 0) + 1,
      lastReset: Date.now().toString(),
    }));
  } catch { /* ignore */ }
}

function clearAttempts() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(defaultState);

  // Initialize from localStorage
  useEffect(() => {
    const user = loadUser();
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === 'true';
    if (user && isLoggedIn && user.status === 'active') {
      setState({ user, isLoggedIn: true, isLoading: false });
    } else {
      setState({ ...defaultState, isLoading: false });
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    // Rate limiting check
    if (isLockedOut()) {
      return { success: false, message: '账号暂时锁定，请稍后再试' };
    }

    const attempts = getAttemptCount();
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(STORAGE_KEYS.LOCKOUT, (Date.now() + LOCKOUT_DURATION_MS).toString());
      return { success: false, message: '登录尝试过多，账号已锁定 5 分钟' };
    }

    const users = loadUsers();
    const matched = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === username.toLowerCase()) ||
        (u.phone && u.phone === username)
    );

    if (!matched) {
      incrementAttempts();
      return { success: false, message: '账号不存在' };
    }

    if (matched.password && matched.password !== password) {
      incrementAttempts();
      const remaining = MAX_ATTEMPTS - getAttemptCount();
      return { success: false, message: `密码错误${remaining > 0 ? `（还剩 ${remaining} 次尝试）` : ''}` };
    }

    if (matched.status === 'pending_approval') {
      return { success: false, message: '账号正在等待审核，请联系管理员' };
    }

    if (matched.status === 'disabled') {
      return { success: false, message: '账号已被禁用' };
    }

    if (matched.status === 'rejected') {
      return { success: false, message: '注册申请已被拒绝' };
    }

    // Login success - clear attempts
    clearAttempts();
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT);

    const loggedInUser = { ...matched, lastLoginAt: '刚刚' };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedInUser));
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');

    setState({ user: loggedInUser, isLoggedIn: true, isLoading: false });
    return { success: true, message: `欢迎回来，${loggedInUser.name}！`, user: loggedInUser };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'false');
    clearAttempts();
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT);
    setState({ ...defaultState });
  }, []);

  const register = useCallback((user: UserProfile): Promise<{ success: boolean; message: string }> => {
    const users = loadUsers();

    // Check duplicates
    const trimmedUsername = user.username?.trim().toLowerCase() || '';
    const duplicateUser = users.find(
      (u) => u.username?.toLowerCase() === trimmedUsername
    );
    if (duplicateUser) {
      return Promise.resolve({ success: false, message: '用户名已被占用' });
    }

    if (user.phone && users.some((u) => u.phone === user.phone)) {
      return Promise.resolve({ success: false, message: '手机号已被注册' });
    }

    const updated = [...users, user];
    saveUsers(updated);
    return Promise.resolve({ success: true, message: '注册申请已提交，等待管理员审核' });
  }, []);

  const updateUser = useCallback((updated: UserProfile) => {
    const users = loadUsers();
    const updatedUsers = users.map((u) => (u.id === updated.id ? updated : u));
    saveUsers(updatedUsers);

    // Update current user if needed
    if (state.user && state.user.id === updated.id) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      setState((prev) => ({ ...prev, user: updated }));
    }
  }, [state.user]);

  const getUsers = useCallback(() => loadUsers(), []);
  const updateUsers = useCallback((users: UserProfile[]) => saveUsers(users), []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register, updateUser, getUsers, updateUsers }}>
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
