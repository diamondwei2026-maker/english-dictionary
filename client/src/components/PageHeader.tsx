import { View, Text } from '@tarojs/components';
import { navigateBack } from '../hooks/useNavigate';
import { Icon } from './Icon';

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
  /**
   * 头部背景色，用于与页面背景融合。
   * Figma 设计中使用与页面底色接近的半透明色 + backdropFilter 实现毛玻璃融合效果。
   * 小程序不支持 backdropFilter，通过传入与页面背景一致的半透明色来模拟融合。
   * 默认：rgba(255,255,255,0.93)（白色调页面）
   * 示例：rgba(247,249,252,0.92)（#F7F9FC 背景页面，如单词详情、管理后台）
   */
  bgColor?: string;
  /**
   * 紧凑模式 — 水平内边距 20px 而非默认 24px。
   * Figma 单词详情页头部使用 20px 水平内边距，其他页面使用 24px。
   */
  compact?: boolean;
}

/**
 * 通用页面 Header 组件 — 对齐 Figma 原型
 *
 * Figma 设计特征：
 *  - 毛玻璃背景：backdropFilter: blur(16px) + 与页面底色接近的半透明色
 *  - 小程序降级：通过 bgColor prop 传入对应底色 + borderBottom 细线
 *  - 返回按钮：ArrowLeft 图标（18px）+ 文字标签
 *  - 水平内边距：默认 24px，单词详情页 20px（compact 模式）
 *
 * 影响范围（7 处）：
 *   WordDetailView / LibrariesView / LibraryWordsView
 *   ProfileView / AdminView（LibraryManager / WordManager / UserManager）
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
  bgColor = 'rgba(255,255,255,0.93)',
  compact = false,
}: PageHeaderProps) {
  const handleBack = onBack || (() => navigateBack());
  const hPadding = compact ? '52px 20px 16px' : '52px 24px 16px';

  return (
    <View
      style={{
        padding: hPadding,
        background: bgColor,
        borderBottom: '0.5px solid rgba(0,0,0,0.05)',
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
            <Icon name="arrow-left" size={18} color="#6B7280" />
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
