import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { AuthUser } from '../../data/types';
import { getGlobalUser, onUserChange, setGlobalUser } from '../../hooks/useAuth';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(getGlobalUser());

  useEffect(() => {
    const unsub = onUserChange((u) => setUser(u));
    return unsub;
  }, []);

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          setGlobalUser(null);
          Taro.showToast({ title: '已退出', icon: 'success' });
        }
      },
    });
  };

  // Not logged in
  if (!user) {
    return (
      <View style={{ minHeight: '100vh', background: '#F7F9FC' }}>
        <PageHeader subtitle="我的" title="个人中心" />

        <View style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <View style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <Icon name="user" size={36} color="#CBD5E1" />
          </View>
          <Text style={{ fontSize: '20px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
            登录后开始学习
          </Text>
          <Text style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center', lineHeight: '1.6', display: 'block', marginBottom: '36px' }}>
            登录账号，追踪学习进度{'\n'}解锁完整词库内容
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
            <View
              onClick={() => Taro.navigateTo({ url: '/pages/auth/index?mode=login' })}
              style={{
                width: '100%', padding: '16px', background: '#2563EB', color: '#fff',
                borderRadius: '16px', fontSize: '16px', fontWeight: '600', textAlign: 'center',
              }}
            >
              <Text style={{ color: '#fff' }}>登录</Text>
            </View>
            <View
              onClick={() => Taro.navigateTo({ url: '/pages/auth/index?mode=register' })}
              style={{
                width: '100%', padding: '16px', background: '#fff', color: '#2563EB',
                border: '1.5px solid #BFDBFE', borderRadius: '16px', fontSize: '16px', fontWeight: '600', textAlign: 'center',
              }}
            >
              <Text style={{ color: '#2563EB' }}>注册新账号</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <View style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      <PageHeader subtitle="我的" title="个人中心" />

      <View style={{ padding: '20px 24px' }}>
        {/* User card */}
        <View style={{
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
          <View style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <View style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="user" size={24} color="#fff" />
            </View>
            <View>
              <Text style={{ fontSize: '18px', fontWeight: '700', color: '#fff', display: 'block', marginBottom: '4px' }}>{user.username}</Text>
              <Text style={{ fontSize: '13px', opacity: '0.75', color: '#fff', display: 'block' }}>{user.phone}</Text>
              <Text style={{
                display: 'inline-block', marginTop: '6px', fontSize: '11px',
                background: 'rgba(255,255,255,0.2)', padding: '3px 10px',
                borderRadius: '20px', letterSpacing: '0.5px', color: '#fff',
              }}>
                {isAdmin ? '管理员' : '普通用户'}
              </Text>
            </View>
          </View>
        </View>

        {/* Admin entry or user stats */}
        {isAdmin ? (
          <View style={{ marginBottom: '16px' }}>
            <View
              onClick={() => Taro.navigateTo({ url: '/pages/admin/index?tab=overview' })}
              style={{
                width: '100%', padding: '20px 24px',
                background: '#fff', borderRadius: '20px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <View style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <View style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="shield" size={20} color="#7C3AED" />
                </View>
                <View>
                  <Text style={{ fontSize: '16px', fontWeight: '600', color: '#111827', display: 'block', marginBottom: '2px' }}>管理后台</Text>
                  <Text style={{ fontSize: '12px', color: '#9CA3AF', display: 'block' }}>词库、单词与用户管理</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#D1D5DB" />
            </View>
          </View>
        ) : (
          <View style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { icon: 'book', label: '已学单词', value: '156 个', color: '#2563EB', bg: '#EFF6FF' },
              { icon: 'target', label: '今日目标', value: '3/5 个', color: '#16A34A', bg: '#F0FDF4' },
            ].map((item, i) => (
              <View key={i} style={{
                background: '#fff', borderRadius: '20px', padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <View style={{
                  width: '36px', height: '36px', borderRadius: '10px', background: item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '10px',
                }}>
                  <Icon name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>{item.label}</Text>
                <Text style={{ fontSize: '15px', fontWeight: '600', color: '#111827', display: 'block' }}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Settings */}
        <View style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <View style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '16px 20px',
          }}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <View style={{
                width: '32px', height: '32px', borderRadius: '8px', background: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="settings" size={16} />
              </View>
              <Text style={{ fontSize: '15px', color: '#374151', fontWeight: '500' }}>设置</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#D1D5DB" />
          </View>
        </View>

        {/* Logout */}
        <View
          onClick={handleLogout}
          style={{
            width: '100%', padding: '16px', background: '#FEF2F2', color: '#DC2626',
            borderRadius: '16px', fontSize: '15px', fontWeight: '600',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <Icon name="logout" size={16} color="#DC2626" />
          <Text style={{ color: '#DC2626' }}>退出登录</Text>
        </View>
      </View>
    </View>
  );
}
