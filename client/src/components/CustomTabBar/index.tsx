import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';

export type TabKey = 'home' | 'libraries' | 'profile';

interface TabDef {
  key: TabKey;
  label: string;
  pagePath: string;
}

const TABS: TabDef[] = [
  { key: 'home', label: '搜索', pagePath: '/pages/home/index' },
  { key: 'libraries', label: '词库', pagePath: '/pages/libraries/index' },
  { key: 'profile', label: '我的', pagePath: '/pages/profile/index' },
];

interface CustomTabBarProps {
  activeTab: TabKey;
}

/**
 * 自定义底部导航栏 — 对照 Figma 原型 BottomNav 1:1 移植。
 *
 * Figma 设计特征：
 *  - 毛玻璃背景 rgba(255,255,255,0.88) + backdrop-filter: blur(20px)
 *  - 顶部 1px 分割线 rgba(0,0,0,0.06)
 *  - 高度 60px + env(safe-area-inset-bottom)
 *  - 图标 20px，文字 11px/letter-spacing 0.3px
 *  - 激活态：color #2563EB / fontWeight 600 / strokeWidth 2.5
 *  - 非激活：color #9CA3AF / fontWeight 400 / strokeWidth 1.8
 *  - 颜色过渡 0.2s
 *  - max-width 430px 居中，fixed 于底部
 */
export function CustomTabBar({ activeTab }: CustomTabBarProps) {
  const handleTabChange = (tab: TabDef) => {
    if (tab.key === activeTab) return;
    Taro.redirectTo({ url: tab.pagePath });
  };

  const renderIcon = (tab: TabDef, active: boolean) => {
    const color = active ? '#2563EB' : '#9CA3AF';
    const sw = active ? 2.5 : 1.8;

    switch (tab.key) {
      case 'home':
        // Search icon — 放大镜
        return (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <circle cx="11" cy="11" r="8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          </svg>
        );
      case 'libraries':
        // BookOpen icon — 打开的书籍
        return (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path
              d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
              stroke={color}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
              stroke={color}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'profile':
        // User icon — 人像
        return (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              stroke={color}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="7" r="4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  return (
    <View
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        background: 'rgba(255, 255, 255, 0.88)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 100,
      }}
    >
      {/* 毛玻璃模糊 — H5 生效，小程序降级为纯半透明 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: -1,
        }}
      />

      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '60px',
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <View
              key={tab.key}
              onClick={() => handleTabChange(tab)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '6px 20px',
                color: active ? '#2563EB' : '#9CA3AF',
                transition: 'color 0.2s',
              }}
            >
              {renderIcon(tab, active)}
              <Text
                style={{
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  letterSpacing: '0.3px',
                }}
              >
                {tab.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
