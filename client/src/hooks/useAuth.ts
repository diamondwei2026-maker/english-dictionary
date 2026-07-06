import { useState, useEffect } from 'react';
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
