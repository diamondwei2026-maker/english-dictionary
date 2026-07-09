/**
 * 缓存抽象层
 *
 * 定义 CacheStore 接口并提供基于 Map 的内存实现。
 * 统一为异步接口，便于将来替换为 Redis 等外部缓存。
 */

import { config } from "../config";

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPrefix(prefix: string): Promise<void>;
  clear(): Promise<void>;
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

/**
 * 基于内存 Map 的缓存实现。
 *
 * - 惰性删除：get 时检查过期
 * - 定时清理：每 60 秒扫描并移除过期条目，防止内存泄漏
 */
export class MemoryCache implements CacheStore {
  private store: Map<string, CacheEntry>;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.store = new Map();
    this.startCleanup();
  }

  // ============================================================
  // 公共方法
  // ============================================================

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.store.get(key);
      if (!entry) return null;

      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        return null;
      }

      return entry.data as T;
    } catch {
      // 缓存故障不影响业务，降级返回 null
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      this.store.set(key, {
        data: value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    } catch {
      // 写入失败静默忽略
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.store.delete(key);
    } catch {
      // 删除失败静默忽略
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) {
          this.store.delete(key);
        }
      }
    } catch {
      // 批量删除失败静默忽略
    }
  }

  async clear(): Promise<void> {
    try {
      this.store.clear();
    } catch {
      // 清空失败静默忽略
    }
  }

  // ============================================================
  // 内部方法
  // ============================================================

  /**
   * 启动定时清理器，每 60 秒移除过期条目。
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      try {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
          if (now > entry.expiresAt) {
            this.store.delete(key);
          }
        }
      } catch {
        // 清理失败不影响运行
      }
    }, 60_000);

    // 允许进程退出（不阻止事件循环）
    if (this.cleanupTimer && typeof this.cleanupTimer.unref === "function") {
      this.cleanupTimer.unref();
    }
  }

  /**
   * 停止定时清理器（测试用）。
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// ============================================================
// 单例工厂
// ============================================================

let _instance: CacheStore | null = null;

export function getCache(): CacheStore {
  if (!_instance) {
    _instance = new MemoryCache();
  }
  return _instance;
}

/**
 * 重置单例（测试用）。
 */
export function resetCacheInstance(): void {
  if (_instance instanceof MemoryCache) {
    (_instance as MemoryCache).stopCleanup();
  }
  _instance = null;
}

// ============================================================
// 缓存辅助函数（带降级，供 service 层直接使用）
// ============================================================

/**
 * 安全地从缓存读取，失败返回 null（降级到 DB 查询）。
 */
export async function tryCacheGet<T>(key: string): Promise<T | null> {
  if (!config.cacheEnabled) return null;
  try {
    return await getCache().get<T>(key);
  } catch {
    return null;
  }
}

/**
 * 安全地写入缓存（fire-and-forget），失败静默忽略。
 */
export function tryCacheSet<T>(key: string, value: T, ttl: number): void {
  if (!config.cacheEnabled) return;
  getCache()
    .set(key, value, ttl)
    .catch(() => {
      /* cache write failed — degrade gracefully */
    });
}

/**
 * 安全地删除单个缓存 key（fire-and-forget），失败静默忽略。
 */
export function tryCacheDel(key: string): void {
  if (!config.cacheEnabled) return;
  getCache()
    .del(key)
    .catch(() => {
      /* cache del failed — degrade gracefully */
    });
}

/**
 * 安全地按前缀批量删除缓存（fire-and-forget），失败静默忽略。
 */
export function tryCacheDelByPrefix(prefix: string): void {
  if (!config.cacheEnabled) return;
  getCache()
    .delByPrefix(prefix)
    .catch(() => {
      /* cache delByPrefix failed — degrade gracefully */
    });
}
