import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
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

type Screen = 'login' | 'register' | 'forgot';

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

// ─── Forgot Password ──────────────────────────────────────────────────────────
function ForgotView({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const cleanPhone = phone.replace(/\s/g, '');

  const handleSendCode = () => {
    setError('');
    if (!isValidPhone(cleanPhone)) { setError('请输入有效的手机号'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 600);
  };

  const handleVerifyCode = () => {
    setError('');
    if (!/^\d{6}$/.test(code)) { setError('请输入 6 位数字验证码'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(3); }, 500);
  };

  const handleReset = () => {
    setError('');
    if (newPassword.length < 6) { setError('密码至少 6 位'); return; }
    if (newPassword !== confirmPassword) { setError('两次密码不一致'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(onBack, 1500);
    }, 600);
  };

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <Check size={28} color="#16A34A" />
        </div>
        <p style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>密码修改成功</p>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>正在返回登录...</p>
      </div>
    );
  }

  const stepLabels = ['验证手机号', '输入验证码', '设置新密码'];

  return (
    <>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
        {stepLabels.map((_, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const isActive = step === n;
          const isDone = step > n;
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : undefined }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? '#2563EB' : isActive ? '#EFF6FF' : '#F1F5F9',
                border: isActive ? '2px solid #2563EB' : '2px solid transparent',
                fontSize: '11px', fontWeight: 700,
                color: isDone ? '#fff' : isActive ? '#2563EB' : '#D1D5DB',
              }}>
                {isDone ? <Check size={12} /> : n}
              </div>
              {n < 3 && <div style={{ flex: 1, height: '1px', background: isDone ? '#2563EB' : '#E5E7EB', margin: '0 4px' }} />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>手机号</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#6B7280', fontWeight: 500, userSelect: 'none' }}>
                +86
              </span>
              <input
                type="tel" inputMode="numeric"
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="请输入手机号" maxLength={11}
                style={{ ...inputStyle, paddingLeft: '52px' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>
          {error && <p style={{ fontSize: '13px', color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: '10px', margin: 0 }}>{error}</p>}
          <button
            onClick={handleSendCode} disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? '发送中...' : '获取验证码'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '12px 16px', background: '#EFF6FF', borderRadius: '12px' }}>
            <p style={{ fontSize: '13px', color: '#1D4ED8', margin: 0 }}>
              验证码已发送至 +86 {cleanPhone}（演示：任意 6 位数字）
            </p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>验证码</label>
            <input
              type="tel" inputMode="numeric"
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="输入 6 位验证码"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>
          {error && <p style={{ fontSize: '13px', color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: '10px', margin: 0 }}>{error}</p>}
          <button
            onClick={handleVerifyCode} disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? '验证中...' : '下一步'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>新密码</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="至少 6 位"
                style={{ ...inputStyle, paddingRight: '48px' }} onFocus={onFocus} onBlur={onBlur}
              />
              <button onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>确认新密码</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                style={{ ...inputStyle, paddingRight: '48px' }} onFocus={onFocus} onBlur={onBlur}
              />
              <button onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p style={{ fontSize: '13px', color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: '10px', margin: 0 }}>{error}</p>}
          <button
            onClick={handleReset} disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? '提交中...' : '确认修改'}
          </button>
        </div>
      )}
    </>
  );
}

// ─── Main Auth View ───────────────────────────────────────────────────────────
export function AuthView({ mode, navigate, onAuth }: AuthViewProps) {
  const [screen, setScreen] = useState<Screen>(mode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError('');
    const cleanPhone = phone.replace(/\s/g, '');

    if (!cleanPhone || !password) { setError('请填写所有必填字段'); return; }
    if (!isValidPhone(cleanPhone)) { setError('请输入有效的手机号'); return; }
    if (screen === 'register' && !username.trim()) { setError('请填写用户名'); return; }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (screen === 'login') {
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

  const isForgot = screen === 'forgot';

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 24px 0' }}>
        <button
          onClick={() => isForgot ? setScreen('login') : navigate({ name: 'home' })}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px', padding: 0 }}
        >
          <ArrowLeft size={18} />
          {isForgot ? '返回登录' : '返回'}
        </button>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* Logo + title */}
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
            {isForgot ? '找回密码' : screen === 'login' ? '欢迎回来' : '创建账号'}
          </h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
            {isForgot ? '验证手机号后重置密码' : screen === 'login' ? '登录继续你的认知英语学习' : '开始用物理意象理解英语'}
          </p>
        </div>

        {/* Tab switcher — hidden in forgot mode */}
        {!isForgot && (
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '12px', padding: '4px', marginBottom: '28px' }}>
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setScreen(t); setError(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: screen === t ? '#fff' : 'transparent',
                  color: screen === t ? '#111827' : '#9CA3AF',
                  boxShadow: screen === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>
        )}

        {/* Forgot password flow */}
        {isForgot && <ForgotView onBack={() => setScreen('login')} />}

        {/* Login / Register form */}
        {!isForgot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {screen === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>用户名</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="输入你的名字" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>手机号</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#6B7280', fontWeight: 500, userSelect: 'none' }}>
                  +86
                </span>
                <input
                  type="tel" inputMode="numeric"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="请输入手机号" maxLength={11}
                  style={{ ...inputStyle, paddingLeft: '52px' }}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>密码</label>
                {screen === 'login' && (
                  <button
                    onClick={() => { setScreen('forgot'); setError(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#2563EB', padding: 0, fontWeight: 500 }}
                  >
                    忘记密码？
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={screen === 'login' ? '输入密码（演示：123456）' : '至少6位密码'}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={onFocus} onBlur={onBlur}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: '10px', margin: 0 }}>{error}</p>
            )}

            <div style={{ marginTop: '8px' }}>
              <button
                onClick={handleSubmit} disabled={loading}
                style={{ width: '100%', padding: '16px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s', letterSpacing: '0.3px' }}
              >
                {loading ? '处理中...' : screen === 'login' ? '登录' : '创建账号'}
              </button>
            </div>
          </div>
        )}

        {/* Demo hint */}
        {screen === 'login' && (
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
