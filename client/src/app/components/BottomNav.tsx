import { Search, BookOpen, User } from 'lucide-react';

type Tab = 'home' | 'libraries' | 'profile';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; Icon: typeof Search }[] = [
  { id: 'home', label: '搜索', Icon: Search },
  { id: 'libraries', label: '词库', Icon: BookOpen },
  { id: 'profile', label: '我的', Icon: User },
];

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '60px' }}>
        {tabs.map(({ id, label, Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 20px',
                color: active ? '#2563EB' : '#9CA3AF',
                transition: 'color 0.2s',
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400, letterSpacing: '0.3px' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
