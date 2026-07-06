import { View, Text } from '@tarojs/components';

interface PrimaryBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/**
 * 可复用的主按钮组件 — 覆盖 AdminView / ProfileView / AuthView 中的重复样式。
 *
 * variant:
 *   primary — 蓝色实心按钮（主操作）
 *   outline — 白色带蓝色边框（次要操作）
 *   danger  — 浅红背景红色字（退出、删除）
 */
export function PrimaryBtn({
  children,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: PrimaryBtnProps) {
  const isDisabled = loading || disabled;

  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '700',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: isDisabled ? '#93C5FD' : '#2563EB',
      color: '#fff',
    },
    outline: {
      background: '#fff',
      border: '1.5px solid #BFDBFE',
      color: '#2563EB',
    },
    danger: {
      background: '#FEF2F2',
      color: '#DC2626',
    },
  };

  return (
    <View
      onClick={isDisabled ? undefined : onClick}
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
    >
      <Text style={{ color: variant === 'primary' ? '#fff' : variantStyles[variant].color as string }}>
        {children}
      </Text>
    </View>
  );
}

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
}

/**
 * 可复用的菜单行组件 — 用于设置页、管理后台入口等。
 * 统一的 icon + label [+ description] + chevron 布局。
 */
export function MenuRow({ icon, label, description, onClick }: MenuRowProps) {
  return (
    <View
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '16px 20px',
      }}
    >
      <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <View style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </View>
        <View>
          <Text style={{ fontSize: '15px', color: '#374151', fontWeight: '500' }}>
            {label}
          </Text>
          {description && (
            <Text style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginTop: '2px' }}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <View style={{ fontSize: '16px', color: '#D1D5DB' }}>
        <Text>›</Text>
      </View>
    </View>
  );
}
