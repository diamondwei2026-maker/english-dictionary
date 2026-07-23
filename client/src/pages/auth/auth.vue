<template>
  <!-- Ported from figma-prototype/AuthView.tsx -->
  <view class="auth-page">
    <!-- Header with back button -->
    <view class="auth-page__header">
      <view class="auth-page__back-btn" @click="goBack">
        <view class="css-arrow-left auth-page__back-icon" />
        <text>返回</text>
      </view>
    </view>

    <!-- Body -->
    <view class="auth-page__body">
      <!-- Logo section -->
      <view class="auth-page__logo-section">
        <view class="auth-page__logo-box">
          <text class="auth-page__logo-text">E</text>
        </view>
        <text class="auth-page__title">{{ tab === 'login' ? '欢迎回来' : '创建账号' }}</text>
        <text class="auth-page__subtitle">{{ tab === 'login' ? '登录继续你的认知英语学习' : '开始用物理意象理解英语' }}</text>
      </view>

      <!-- Tab switcher -->
      <view class="auth-page__tabs">
        <view
          class="auth-page__tab"
          :class="{ 'auth-page__tab--active': tab === 'login' }"
          @click="switchTab('login')"
        >
          <text>登录</text>
        </view>
        <view
          class="auth-page__tab"
          :class="{ 'auth-page__tab--active': tab === 'register' }"
          @click="switchTab('register')"
        >
          <text>注册</text>
        </view>
      </view>

      <!-- Form -->
      <view class="auth-page__form">
        <!-- Username field (register only) -->
        <view v-if="tab === 'register'" class="auth-page__field">
          <text class="auth-page__label">用户名</text>
          <view class="auth-page__input-wrap">
            <input
              v-model="username"
              class="auth-page__input"
              :class="{ 'auth-page__input--focused': usernameFocused }"
              type="text"
              placeholder="输入你的名字"
              @focus="usernameFocused = true"
              @blur="usernameFocused = false"
              @confirm="handleSubmit"
            ></input>
          </view>
        </view>

        <!-- Phone field -->
        <view class="auth-page__field">
          <text class="auth-page__label">手机号</text>
          <view class="auth-page__input-wrap">
            <text class="auth-page__prefix">+86</text>
            <input
              v-model="phone"
              class="auth-page__input auth-page__input--phone"
              :class="{ 'auth-page__input--focused': phoneFocused }"
              type="number"
              placeholder="请输入手机号"
              :maxlength="11"
              @focus="phoneFocused = true"
              @blur="phoneFocused = false"
              @confirm="handleSubmit"
            ></input>
          </view>
        </view>

        <!-- Password field -->
        <view class="auth-page__field">
          <text class="auth-page__label">密码</text>
          <view class="auth-page__input-wrap">
            <input
              v-model="password"
              class="auth-page__input auth-page__input--password"
              :class="{ 'auth-page__input--focused': passwordFocused }"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="tab === 'login' ? '输入密码' : '至少6位密码'"
              @focus="passwordFocused = true"
              @blur="passwordFocused = false"
              @confirm="handleSubmit"
            ></input>
            <view class="auth-page__eye-btn" @click="showPassword = !showPassword">
              <text class="iconfont" v-if="showPassword">&#xe00a;</text>
              <text class="iconfont" v-else>&#xe009;</text>
            </view>
          </view>
        </view>

        <!-- Error message -->
        <text v-if="error" class="auth-page__error">{{ error }}</text>

        <!-- Submit button -->
        <view class="auth-page__submit-wrap">
          <PrimaryButton
            :loading="loading"
            size="lg"
            @click="handleSubmit"
          >
            {{ loading ? '处理中...' : tab === 'login' ? '登录' : '创建账号' }}
          </PrimaryButton>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { isValidPhone } from '@/utils/helpers';
import { userStore, login as doLogin } from '@/store/user';
import { apiLogin, apiRegister } from '@/api/auth';
import type { AuthUser } from '@/data/types';
import PrimaryButton from '@/components/PrimaryButton.vue';

const tab = ref<'login' | 'register'>('login');
const phone = ref('');
const password = ref('');
const username = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

const phoneFocused = ref(false);
const passwordFocused = ref(false);
const usernameFocused = ref(false);

onLoad((options: any) => {
  if (options?.mode === 'register') {
    tab.value = 'register';
  }
});

function switchTab(t: 'login' | 'register') {
  tab.value = t;
  error.value = '';
}

function goBack() {
  uni.navigateBack();
}

async function handleSubmit() {
  error.value = '';
  const cleanPhone = phone.value.replace(/\s/g, '');

  if (!cleanPhone || !password.value) {
    error.value = '请填写所有必填字段';
    return;
  }
  if (!isValidPhone(cleanPhone)) {
    error.value = '请输入有效的手机号';
    return;
  }
  if (tab.value === 'register' && !username.value.trim()) {
    error.value = '请填写用户名';
    return;
  }

  loading.value = true;
  try {
    if (tab.value === 'login') {
      const result = await apiLogin({ phone: cleanPhone, password: password.value });
      const authUser: AuthUser = {
        id: result.id,
        username: result.username,
        phone: result.phone,
        role: result.role,
      };
      doLogin(authUser, result.token);
      if (authUser.role === 'admin') {
        uni.redirectTo({ url: '/pages/admin/overview' });
      } else {
        uni.switchTab({ url: '/pages/home/home' });
      }
    } else {
      await apiRegister({
        phone: cleanPhone,
        password: password.value,
        username: username.value.trim(),
      });
      // 注册成功跳转登录
      tab.value = 'login';
      error.value = '';
      uni.showToast({ title: '注册成功，请登录', icon: 'success' });
    }
  } catch (err: any) {
    error.value = err?.message || '操作失败，请检查网络连接';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  background: #F7F9FC;
  display: flex;
  flex-direction: column;

  /* ── Header ── */
  &__header {
    padding: 104rpx 48rpx 0;    /* 52px 24px 0 */
  }

  &__back-btn {
    display: flex;
    align-items: center;
    gap: 12rpx;                  /* 6px × 2 */
    background: none;
    border: none;
    font-size: 28rpx;            /* 14px × 2 */
    color: #6B7280;
    padding: 0;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  &__back-icon {
    flex-shrink: 0;
  }

  /* ── Body ── */
  &__body {
    flex: 1;
    padding: 64rpx 48rpx;        /* 32px 24px × 2 */
    display: flex;
    flex-direction: column;
  }

  /* ── Logo section ── */
  &__logo-section {
    margin-bottom: 72rpx;        /* 36px × 2 */
  }

  &__logo-box {
    width: 104rpx;               /* 52px × 2 */
    height: 104rpx;              /* 52px × 2 */
    border-radius: 28rpx;        /* 14px × 2 */
    background: linear-gradient(135deg, #1D4ED8, #3B82F6);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;        /* 16px × 2 */
    box-shadow: 0 8rpx 32rpx rgba(37, 99, 235, 0.3);  /* 0 4px 16px × 2 */
  }

  &__logo-text {
    color: #fff;
    font-size: 44rpx;            /* 22px × 2 */
    font-weight: 800;
    font-style: italic;
  }

  &__title {
    display: block;
    font-size: 52rpx;            /* 26px × 2 */
    font-weight: 800;
    color: #111827;
    margin: 0 0 12rpx;           /* 0 0 6px × 2 */
  }

  &__subtitle {
    display: block;
    font-size: 28rpx;            /* 14px × 2 */
    color: #9CA3AF;
    margin: 0;
    line-height: 1.6;
  }

  /* ── Tab switcher ── */
  &__tabs {
    display: flex;
    background: #F1F5F9;
    border-radius: 24rpx;        /* 12px × 2 */
    padding: 8rpx;               /* 4px × 2 */
    margin-bottom: 56rpx;        /* 28px × 2 */
  }

  &__tab {
    flex: 1;
    padding: 20rpx;              /* 10px × 2 */
    border-radius: 20rpx;        /* 10px × 2 */
    border: none;
    font-size: 28rpx;            /* 14px × 2 */
    font-weight: 600;
    text-align: center;
    background: transparent;
    color: #9CA3AF;
    /* #ifdef H5 */
    cursor: pointer;
    transition: all 0.2s;
    /* #endif */

    &--active {
      background: #fff;
      color: #111827;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);  /* 0 1px 4px × 2 */
      /* #ifdef H5 */
      cursor: default;
      /* #endif */
    }
  }

  /* ── Form ── */
  &__form {
    display: flex;
    flex-direction: column;
    gap: 28rpx;                  /* 14px × 2 */
  }

  &__label {
    display: block;
    font-size: 26rpx;            /* 13px × 2 */
    font-weight: 600;
    color: #374151;
    margin-bottom: 16rpx;        /* 8px × 2 */
  }

  &__input-wrap {
    position: relative;
    min-height: 104rpx;          /* NC-06 */
  }

  &__input {
    width: 100%;
    height: 104rpx;              /* NC-01: 52px × 2 */
    padding: 28rpx 32rpx;        /* 14px 16px × 2 */
    border-radius: 28rpx;        /* 14px × 2 */
    border: 3rpx solid #E5E7EB;  /* 1.5px × 2 */
    background: #fff;
    font-size: 32rpx;            /* 16px × 2 */
    color: #111827;
    outline: none;
    box-sizing: border-box;
    /* #ifdef H5 */
    transition: border-color 0.2s;
    /* #endif */

    &--focused {
      border-color: #2563EB;
    }

    &--phone {
      padding-left: 104rpx;      /* 52px × 2 */
    }

    &--password {
      padding-right: 96rpx;      /* 48px × 2 */
    }
  }

  /* ── +86 Prefix ── */
  &__prefix {
    position: absolute;
    left: 32rpx;                 /* 16px × 2 */
    top: 50%;
    transform: translateY(-50%);
    font-size: 30rpx;            /* 15px × 2 */
    color: #6B7280;
    font-weight: 500;
  }

  /* ── Eye toggle button ── */
  &__eye-btn {
    position: absolute;
    right: 32rpx;                /* 16px × 2 */
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 0;
    color: #9CA3AF;
    font-size: 36rpx;            /* 18px × 2 */
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  /* ── Error message ── */
  &__error {
    display: block;              /* NC-14: <p> → display: block */
    font-size: 26rpx;            /* 13px × 2 */
    color: #DC2626;
    background: #FEF2F2;
    padding: 20rpx 28rpx;        /* 10px 14px × 2 */
    border-radius: 20rpx;        /* 10px × 2 */
    margin: 0;
  }

  /* ── Submit button wrapper ── */
  &__submit-wrap {
    margin-top: 16rpx;           /* 8px × 2 */
  }

  /* ── Demo hint ── */
  &__demo {
    margin-top: 40rpx;           /* 20px × 2 */
    padding: 28rpx 32rpx;        /* 14px 16px × 2 */
    background: #FFFBEB;
    border-radius: 24rpx;        /* 12px × 2 */
    border: 2rpx solid #FDE68A;  /* 1px × 2 */
  }

  &__demo-text {
    display: block;              /* NC-14: <p> → display: block */
    font-size: 24rpx;            /* 12px × 2 */
    color: #92400E;
    margin: 0;
    line-height: 1.8;
    white-space: pre-line;       /* NC-12: \n in text */
  }
}
</style>
