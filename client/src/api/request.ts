import Taro from "@tarojs/taro";
import {
  setGlobalUser,
  getToken,
  setToken,
  removeToken,
  TOKEN_KEY,
} from "../hooks/useAuth";

// ============================================================
// 通用请求封装 — 基于 Taro.request，兼容 H5 与微信小程序
// ============================================================

// 从 useAuth.ts 统一导入，此处仅做 re-export
export { getToken, setToken, removeToken, TOKEN_KEY };

/** 后端 API 基路径 */
const BASE_URL = ""; // 开发环境通过 devServer.proxy 代理，生产环境同域部署

/** 后端统一错误响应格式 */
export interface ApiError {
  code: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

/** Taro.request 的简化选项 */
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * 发起 API 请求。
 *
 * - 自动从 localStorage 读取 token 并注入 Authorization Header
 * - 401 响应自动清除 token 并跳转登录页
 * - 非 2xx 响应解析后端 error 格式并 throw
 * - 成功响应直接返回 res.data（Taro 已自动 JSON.parse）
 */
export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = getToken();
  const method = options.method || "GET";

  const header: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    header["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await Taro.request<T>({
      url: `${BASE_URL}${path}`,
      method,
      data: options.data,
      header,
    });

    // Taro.request 在 H5 环境返回 statusCode，小程序环境也类似
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // 防御：当响应体为空/非 JSON 时 Taro 可能返回 null data，
      // 此时应抛出错误而非让上层 adapter 因 null.data 崩溃
      if (res.data == null) {
        throw new ApiRequestError(
          res.statusCode,
          "EMPTY_RESPONSE",
          "服务器返回了空的响应数据，请检查后端服务是否正常运行"
        );
      }
      return res.data;
    }

    // 401 — 全局处理：有 token 说明是会话过期，清除状态并跳转登录页；
    // 无 token（如登录/注册失败）仅抛出错误，由调用方处理。
    if (res.statusCode === 401) {
      if (token) {
        clearAuthAndRedirect();
      }
      const body = res.data as unknown as { error?: ApiError };
      throw new ApiRequestError(
        401,
        body?.error?.code || "UNAUTHORIZED",
        body?.error?.message || "认证失败，请重新登录"
      );
    }

    // 其他错误状态码
    const body = res.data as unknown as { error?: ApiError };
    const apiError = body?.error;
    throw new ApiRequestError(
      res.statusCode,
      apiError?.code || "UNKNOWN_ERROR",
      apiError?.message || `请求失败 (${res.statusCode})`,
      apiError?.errors
    );
  } catch (err) {
    // 网络错误或 Taro.request 本身的异常
    if (err instanceof ApiRequestError) {
      throw err;
    }
    throw new ApiRequestError(
      0,
      "NETWORK_ERROR",
      "网络请求失败，请检查网络连接"
    );
  }
}

// ============================================================
// 内部工具
// ============================================================

/** 清除认证状态并跳转登录页（401 全局拦截） */
function clearAuthAndRedirect(): void {
  removeToken();
  setGlobalUser(null);
  // 延迟跳转，避免与页面自身的 redirectTo 冲突
  setTimeout(() => {
    Taro.redirectTo({ url: "/pages/auth/index?mode=login" });
  }, 100);
}

/** 自定义 API 错误类 */
export class ApiRequestError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}
