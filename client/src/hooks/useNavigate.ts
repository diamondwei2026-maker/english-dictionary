import Taro from '@tarojs/taro';

/**
 * 封装 Taro 导航 API，提供与原始 navigate 函数兼容的接口。
 *
 * 原始 App.tsx 使用 useState<ViewState> 进行视图切换，
 * Taro 版本改为页面级路由（每个 ViewState → 一个 pages/ 目录）。
 *
 * Admin 内部子页（overview/libraries/words/users）通过 section 参数传递。
 */

export interface NavParams {
  /** 额外查询参数 */
  [key: string]: string | number | undefined;
}

export function navigateToHome() {
  Taro.redirectTo({ url: '/pages/home/index' });
}

export function navigateToWordDetail(wordId: string) {
  Taro.navigateTo({ url: `/pages/word-detail/index?wordId=${wordId}` });
}

export function navigateToLibraries() {
  Taro.redirectTo({ url: '/pages/libraries/index' });
}

export function navigateToLibraryWords(libraryId: string) {
  Taro.navigateTo({ url: `/pages/library-words/index?libraryId=${libraryId}` });
}

export function navigateToProfile() {
  Taro.redirectTo({ url: '/pages/profile/index' });
}

export function navigateToLogin() {
  Taro.navigateTo({ url: '/pages/auth/index?mode=login' });
}

export function navigateToRegister() {
  Taro.navigateTo({ url: '/pages/auth/index?mode=register' });
}

export function navigateToAdmin(tab?: string) {
  const url = tab ? `/pages/admin/index?tab=${tab}` : '/pages/admin/index';
  Taro.navigateTo({ url });
}

/**
 * 智能返回：若页面栈 > 1 则 navigateBack()，否则 redirectTo 到首页。
 * 修复 Figma 中返回按钮始终返回首页的设计意图与 Taro 栈式路由的差异。
 */
export function navigateBack() {
  const pages = Taro.getCurrentPages();
  if (pages.length > 1) {
    Taro.navigateBack();
  } else {
    Taro.redirectTo({ url: '/pages/home/index' });
  }
}
