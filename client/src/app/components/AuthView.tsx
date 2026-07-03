import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { AuthUser, ViewState } from '../data/types';
import { mockUsers } from '../data/mockData';

interface AuthViewProps {
  mode: 'login' | 'register';
  navigate: (view: ViewState) => void;
  onAuth: (user: AuthUser) => void;
}

function isValidPhone(p: string) {
  return /^1[3-9]\d{9}$/.test(p.replace(/\s/g, ''));
}

export function AuthView({ mode, navigate, onAuth }: AuthViewProps) {
  const [tab, setTab] = useState<'login' | 'register'>(mode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError('');
    const cleanPhone = phone.replace(/\s/g, '');

    if (!cleanPhone || !password) {
      setError('请填写所有必填字段');
      return;
    }
    if (!isValidPhone(cleanPhone)) {
      setError('请输入有效的手机号');
      return;
    }
    if (tab === 'register' && !username.trim()) {
      setError('请填写用户名');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (tab === 'login') {
        const found = mockUsers.find(u => u.phone === cleanPhone);
        if (found && password === '123456') {
          onAuth({ id: found.id, username: found.username, phone: found.phone, role: found.role });
        } else {
          setError('手机号或密码不正确（演示：密码为 123456）');
        }
      } else {
        onAuth({ id: 'new', username: username.trim(), phone: cleanPhone, role: 'user' });
      }
    }, 800);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1.5px solid #E5E7EB',
    background: '#fff',
    fontSize: '16px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#2563EB'; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#E5E7EB'; };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 24px 0' }}>
        <button
          onClick={() => navigate({ name: 'home' })}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6B7280', fontSize: '14px', padding: 0,
          }}
        >
          <ArrowLeft size={18} />
          返回
        </button>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
          }}>
            <span style={{ color: '#fff', fontSize: '22px', fontWeight: 800, fontStyle: 'italic' }}>E</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
            {tab === 'login' ? '欢迎回来' : '创建账号'}
          </h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
            {tab === 'login' ? '登录继续你的认知英语学习' : '开始用物理意象理解英语'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: '#F1F5F9', borderRadius: '12px',
          padding: '4px', marginBottom: '28px',
        }}>
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#111827' : '#9CA3AF',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                用户名
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="输入你的名字"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          )}

          {/* Phone number field */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              手机号
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '15px', color: '#6B7280', fontWeight: 500, userSelect: 'none',
              }}>
                +86
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                style={{ ...inputStyle, paddingLeft: '52px' }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              密码
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'login' ? '输入密码（演示：123456）' : '至少6位密码'}
                style={{ ...inputStyle, paddingRight: '48px' }}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: '10px', margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: '8px' }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? '#93C5FD' : '#2563EB',
                color: '#fff', border: 'none', borderRadius: '16px',
                fontSize: '16px', fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                transition: 'background 0.2s', letterSpacing: '0.3px',
              }}
            >
              {loading ? '处理中...' : tab === 'login' ? '登录' : '创建账号'}
            </button>
          </div>
        </div>

        {/* Demo hint */}
        {tab === 'login' && (
          <div style={{ marginTop: '20px', padding: '14px 16px', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A' }}>
            <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: 1.8 }}>
              演示账号（管理员）：13800000001<br />
              演示账号（普通用户）：13800000002<br />
              密码统一为：123456
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
