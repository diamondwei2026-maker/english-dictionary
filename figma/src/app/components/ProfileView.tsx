import { User, Settings, Shield, LogOut, ChevronRight, BookOpen, Target, FileText, Bookmark } from 'lucide-react';
import type { AuthUser, ViewState, Note } from '../data/types';

interface ProfileViewProps {
  user: AuthUser | null;
  navigate: (view: ViewState) => void;
  onLogout: () => void;
  notes: Note[];
  favorites: string[];
}

export function ProfileView({ user, navigate, onLogout, notes, favorites }: ProfileViewProps) {
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F9FC' }}>
        <div style={{ padding: '52px 24px 20px' }}>
          <p style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
            我的
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
            个人中心
          </h1>
        </div>

        <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <User size={36} color="#CBD5E1" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
            登录后开始学习
          </h2>
          <p style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6, margin: '0 0 36px' }}>
            登录账号，追踪学习进度<br />解锁完整词库内容
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
            <button
              onClick={() => navigate({ name: 'login' })}
              style={{
                width: '100%', padding: '16px', background: '#2563EB', color: '#fff',
                border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              登录
            </button>
            <button
              onClick={() => navigate({ name: 'register' })}
              style={{
                width: '100%', padding: '16px', background: '#fff', color: '#2563EB',
                border: '1.5px solid #BFDBFE', borderRadius: '16px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              注册新账号
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      <div style={{ padding: '52px 24px 20px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)' }}>
        <p style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
          我的
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
          个人中心
        </h1>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* User card */}
        <div style={{
          background: isAdmin
            ? 'linear-gradient(135deg, #4C1D95, #7C3AED)'
            : 'linear-gradient(135deg, #1D4ED8, #2563EB)',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '20px',
          color: '#fff',
          boxShadow: isAdmin
            ? '0 8px 32px rgba(124,58,237,0.25)'
            : '0 8px 32px rgba(37,99,235,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>{user.username}</h2>
              <p style={{ fontSize: '13px', opacity: 0.75, margin: 0 }}>{user.phone}</p>
              <span style={{
                display: 'inline-block', marginTop: '6px', fontSize: '11px',
                background: 'rgba(255,255,255,0.2)', padding: '3px 10px',
                borderRadius: '20px', letterSpacing: '0.5px',
              }}>
                {isAdmin ? '管理员' : '普通用户'}
              </span>
            </div>
          </div>
        </div>

        {/* Admin: entry to admin panel only */}
        {isAdmin ? (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => navigate({ name: 'admin', tab: 'overview' })}
              style={{
                width: '100%', padding: '20px 24px',
                background: '#fff', border: 'none', borderRadius: '20px',
                cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield size={20} color="#7C3AED" />
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>管理后台</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>词库、单词与用户管理</p>
                </div>
              </div>
              <ChevronRight size={18} color="#D1D5DB" />
            </button>
          </div>
        ) : (
          /* Regular user: learning stats */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { icon: <BookOpen size={18} />, label: '已学单词', value: '156 个', color: '#2563EB', bg: '#EFF6FF' },
              { icon: <Target size={18} />, label: '今日目标', value: '3/5 个', color: '#16A34A', bg: '#F0FDF4' },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: '20px', padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', background: item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.color, marginBottom: '10px',
                }}>
                  {item.icon}
                </div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 4px' }}>{item.label}</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Notes entry — regular users only */}
        {user && !isAdmin && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
              <MenuRow
                icon={<FileText size={16} />}
                label="我的笔记"
                sub={`${notes.filter(n => n.userId === user.id).length} 条笔记`}
                color="#2563EB"
                bg="#EFF6FF"
                onClick={() => navigate({ name: 'notes' })}
              />
              <div style={{ height: '1px', background: '#F1F5F9', marginLeft: '64px' }} />
              <MenuRow
                icon={<Bookmark size={16} />}
                label="我的收藏"
                sub={`${favorites.length} 个单词`}
                color="#EA580C"
                bg="#FFF7ED"
                onClick={() => navigate({ name: 'favorites' })}
              />
            </div>
          </div>
        )}

        {/* Settings */}
        <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <MenuRow icon={<Settings size={16} />} label="设置" color="#6B7280" bg="#F3F4F6" />
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '16px', background: '#FEF2F2', color: '#DC2626',
            border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </div>
  );
}

function MenuRow({
  icon, label, sub, color, bg, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  color: string;
  bg: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '16px 20px', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </div>
        <div>
          <span style={{ fontSize: '15px', color: '#374151', fontWeight: 500, display: 'block' }}>{label}</span>
          {sub && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{sub}</span>}
        </div>
      </div>
      <ChevronRight size={16} color="#D1D5DB" />
    </button>
  );
}
