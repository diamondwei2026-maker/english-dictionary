import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import type { AuthUser } from '../data/types';

/**
 * 全局认证状态管理 — 从 login/index.tsx 提取，供所有页面共享登录态。
 *
 * Figma 原始设计中 login/register 共用单一 AuthView 组件 + useState 切换 tab，
 * Taro Client 原拆为两个独立页面并触发 Taro.redirectTo 整页跳转。
 * 现已合并为 pages/auth/index.tsx（?mode=login|register），内部用 useState 切换。
 */

// 全局单例状态
let globalUser: AuthUser | null = null;
const listeners: Set<(u: AuthUser | null) => void> = new Set();

export function getGlobalUser(): AuthUser | null {
  return globalUser;
}

export function setGlobalUser(u: AuthUser | null): void {
  globalUser = u;
  listeners.forEach(fn => fn(u));
}

export function onUserChange(fn: (u: AuthUser | null) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** React hook：订阅全局用户状态变化 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getGlobalUser());

  useEffect(() => {
    const unsub = onUserChange((u) => setUser(u));
    return unsub;
  }, []);

  return user;
}

// ============================================================
// Token 持久化工具
// ============================================================

const TOKEN_KEY = 'auth_token';

export { TOKEN_KEY };

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // 静默失败
  }
}

/** 退出登录：清除 Token + 用户状态 + 跳转登录页 */
export function logout(): void {
  removeToken();
  setGlobalUser(null);
  Taro.redirectTo({ url: '/pages/auth/index?mode=login' });
}
