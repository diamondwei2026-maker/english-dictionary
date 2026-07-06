import { View, Text } from '@tarojs/components';
import { navigateBack } from '../hooks/useNavigate';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  backLabel?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
  /** 是否使用 sticky 定位（WordDetailView 需要） */
  sticky?: boolean;
}

/**
 * 通用页面 Header 组件 — 毛玻璃统一降级版
 *
 * 原始代码使用 backdropFilter: 'blur(16px)'，小程序不支持，
 * 统一降级为：background: rgba(255,255,255,0.93) + borderBottom: 0.5px solid rgba(0,0,0,0.05)
 *
 * 影响范围（7 处）：
 *   HomeView / WordDetailView / LibrariesView / LibraryWordsView
 *   ProfileView / AuthView / AdminView
 */
export function PageHeader({
  title,
  subtitle,
  backLabel = '返回',
  showBack = false,
  onBack,
  right,
  children,
  sticky = false,
}: PageHeaderProps) {
  const handleBack = onBack || (() => navigateBack());

  return (
    <View
      style={{
        padding: '52px 24px 16px',
        background: 'rgba(255,255,255,0.93)', // 毛玻璃统一降级
        borderBottom: '0.5px solid rgba(0,0,0,0.05)', // 毛玻璃统一降级
        ...(sticky ? { position: 'sticky', top: 0, zIndex: 10 } : {}),
      }}
    >
      {/* Top row: back button + right slot */}
      <View style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: children || subtitle || title ? '12px' : '0',
      }}>
        {showBack ? (
          <View
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#6B7280',
              fontSize: '14px',
              padding: '6px 0',
            }}
          >
            <Text>←</Text>
            <Text>{backLabel}</Text>
          </View>
        ) : <View />}
        {right}
      </View>

      {/* Subtitle — small uppercase label */}
      {subtitle && (
        <Text style={{
          fontSize: '12px',
          color: '#9CA3AF',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: '6px',
        }}>
          {subtitle}
        </Text>
      )}

      {/* Title — large heading */}
      {title && (
        <Text style={{
          fontSize: '26px',
          fontWeight: '700',
          color: '#111827',
          display: 'block',
        }}>
          {title}
        </Text>
      )}

      {/* Custom children (e.g. search bar or count text) */}
      {children}
    </View>
  );
}
