// ============================================================
// 全局认证状态管理 + Token 持久化
// 与 client/src/hooks/useAuth.ts 保持接口契约一致
// ============================================================

import { reactive } from 'vue';
import type { AuthUser } from '@/data/types';

// ============================================================
// Token 持久化 — 使用 uni.storage（兼容 H5 与微信小程序）
// ============================================================

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  try {
    return uni.getStorageSync(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    uni.setStorageSync(TOKEN_KEY, token);
  } catch {
    // storage 不可用时静默失败
  }
}

export function removeToken(): void {
  try {
    uni.removeStorageSync(TOKEN_KEY);
  } catch {
    // 静默失败
  }
}

// ============================================================
// 用户状态
// ============================================================

interface UserState {
  user: AuthUser | null;
}

export const userStore = reactive<UserState>({
  user: null,
});

/** 登录：存储 token + 设置用户状态 */
export function login(u: AuthUser, token: string): void {
  setToken(token);
  userStore.user = u;
}

/** 退出登录：清除 Token + 用户状态 + 跳转首页 */
export function logout(): void {
  removeToken();
  userStore.user = null;
  uni.switchTab({ url: '/pages/home/home' });
}
