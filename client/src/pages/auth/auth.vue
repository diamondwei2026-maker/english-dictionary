<template>
  <!-- Ported from figma-prototype/AuthView.tsx -->
  <view class="auth-page">
    <!-- Header with back button -->
    <view class="auth-page__header">
      <view class="auth-page__back-btn" @click="goBack">
        <view class="css-arrow-left auth-page__back-icon" />
        <text>{{ forgotStep > 0 ? '返回登录' : '返回' }}</text>
      </view>
    </view>

    <!-- Body -->
    <view class="auth-page__body">
      <!-- Logo section -->
      <view class="auth-page__logo-section">
        <view class="auth-page__logo-box">
          <text class="auth-page__logo-text">E</text>
        </view>
        <text class="auth-page__title">{{ forgotStep > 0 ? '找回密码' : tab === 'login' ? '欢迎回来' : '创建账号' }}</text>
        <text class="auth-page__subtitle">{{ forgotStep > 0 ? '验证手机号后重置密码' : tab === 'login' ? '登录继续你的认知英语学习' : '开始用物理意象理解英语' }}</text>
      </view>

      <!-- Tab switcher — hidden in forgot mode -->
      <view v-if="forgotStep === 0" class="auth-page__tabs">
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

      <!-- ═══ Forgot password flow ═══ -->
      <template v-if="forgotStep > 0">
        <!-- Step indicator -->
        <view class="auth-page__steps">
          <template v-for="(_, i) in 3" :key="i">
            <view class="auth-page__steps-item">
              <view
                class="auth-page__steps-circle"
                :class="{
                  'auth-page__steps-circle--done': forgotStep > i + 1,
                  'auth-page__steps-circle--active': forgotStep === i + 1,
                }"
              >
                <text v-if="forgotStep > i + 1" class="iconfont auth-page__steps-check">✓</text>
                <text v-else>{{ i + 1 }}</text>
              </view>
            </view>
            <view
              v-if="i < 2"
              class="auth-page__steps-line"
              :class="{ 'auth-page__steps-line--done': forgotStep > i + 1 }"
            />
          </template>
        </view>

        <!-- Step 1: Verify phone -->
        <view v-if="forgotStep === 1" class="auth-page__forgot-form">
          <view class="auth-page__field">
            <text class="auth-page__label">手机号</text>
            <view class="auth-page__input-wrap">
              <text class="auth-page__prefix">+86</text>
              <input
                v-model="forgotPhone"
                class="auth-page__input auth-page__input--phone"
                :class="{ 'auth-page__input--focused': forgotPhoneFocused }"
                type="number"
                placeholder="请输入手机号"
                :maxlength="11"
                @focus="forgotPhoneFocused = true"
                @blur="forgotPhoneFocused = false"
              ></input>
            </view>
          </view>
          <text v-if="error" class="auth-page__error">{{ error }}</text>
          <view class="auth-page__submit-wrap">
            <PrimaryButton :loading="loading" size="lg" @click="handleSendResetCode">
              {{ loading ? '发送中...' : '获取验证码' }}
            </PrimaryButton>
          </view>
        </view>

        <!-- Step 2: Enter code -->
        <view v-if="forgotStep === 2" class="auth-page__forgot-form">
          <view class="auth-page__forgot-hint">
            <text>验证码已发送至 +86 {{ forgotPhone }}（演示：任意 6 位数字）</text>
          </view>
          <view class="auth-page__field">
            <text class="auth-page__label">验证码</text>
            <view class="auth-page__input-wrap">
              <input
                v-model="forgotCode"
                class="auth-page__input"
                :class="{ 'auth-page__input--focused': forgotCodeFocused }"
                type="number"
                placeholder="输入 6 位验证码"
                :maxlength="6"
                @focus="forgotCodeFocused = true"
                @blur="forgotCodeFocused = false"
                @input="forgotCode = forgotCode.replace(/\D/g, '')"
              ></input>
            </view>
          </view>
          <text v-if="error" class="auth-page__error">{{ error }}</text>
          <view class="auth-page__submit-wrap">
            <PrimaryButton :loading="loading" size="lg" @click="handleVerifyResetCode">
              {{ loading ? '验证中...' : '下一步' }}
            </PrimaryButton>
          </view>
        </view>

        <!-- Step 3: Set new password -->
        <view v-if="forgotStep === 3" class="auth-page__forgot-form">
          <view class="auth-page__field">
            <text class="auth-page__label">新密码</text>
            <view class="auth-page__input-wrap">
              <input
                :type="showNewPassword ? 'text' : 'password'"
                v-model="forgotNewPassword"
                class="auth-page__input auth-page__input--password"
                :class="{ 'auth-page__input--focused': forgotNewPasswordFocused }"
                placeholder="至少 6 位"
                @focus="forgotNewPasswordFocused = true"
                @blur="forgotNewPasswordFocused = false"
              ></input>
              <view class="auth-page__eye-btn" @click="showNewPassword = !showNewPassword">
                <image
                v-if="showNewPassword"
                src="\static\images\hide.png"
                mode="scaleToFill"
                />
                <image
                v-else
                src="\static\images\browse.png"
                mode="scaleToFill"
                />
              </view>
            </view>
          </view>
          <view class="auth-page__field">
            <text class="auth-page__label">确认新密码</text>
            <view class="auth-page__input-wrap">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="forgotConfirmPassword"
                class="auth-page__input auth-page__input--password"
                :class="{ 'auth-page__input--focused': forgotConfirmPasswordFocused }"
                placeholder="再次输入新密码"
                @focus="forgotConfirmPasswordFocused = true"
                @blur="forgotConfirmPasswordFocused = false"
              ></input>
              <view class="auth-page__eye-btn" @click="showConfirmPassword = !showConfirmPassword">
                <image
                v-if="showConfirmPassword"
                src="\static\images\hide.png"
                mode="scaleToFill"
                />
                <image
                v-else
                src="\static\images\browse.png"
                mode="scaleToFill"
                />
              </view>
            </view>
          </view>
          <text v-if="error" class="auth-page__error">{{ error }}</text>
          <view class="auth-page__submit-wrap">
            <PrimaryButton :loading="loading" size="lg" @click="handleResetPassword">
              {{ loading ? '提交中...' : '确认修改' }}
            </PrimaryButton>
          </view>
        </view>

        <!-- Success state -->
        <view v-if="resetDone" class="auth-page__reset-done">
          <view class="auth-page__reset-done-circle">
            <text class="iconfont auth-page__reset-done-check">✓</text>
          </view>
          <text class="auth-page__reset-done-title">密码修改成功</text>
          <text class="auth-page__reset-done-sub">正在返回登录...</text>
        </view>
      </template>

      <!-- Login / Register form -->
      <view v-if="forgotStep === 0" class="auth-page__form">
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
          <view class="auth-page__label-row">
            <text class="auth-page__label">密码</text>
            <text
              v-if="tab === 'login'"
              class="auth-page__forgot-link"
              @click="openForgotPassword"
            >忘记密码？</text>
          </view>
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
              <image
              v-if="showPassword"
              src="\static\images\hide.png"
              mode="scaleToFill"
              />
              <image
              v-else
              src="\static\images\browse.png"
              mode="scaleToFill"
              />
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

// ── Forgot password state ──
const forgotStep = ref(0); // 0 = not in forgot, 1/2/3 = steps
const forgotPhone = ref('');
const forgotCode = ref('');
const forgotNewPassword = ref('');
const forgotConfirmPassword = ref('');
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const resetDone = ref(false);

const forgotPhoneFocused = ref(false);
const forgotCodeFocused = ref(false);
const forgotNewPasswordFocused = ref(false);
const forgotConfirmPasswordFocused = ref(false);

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
  if (forgotStep.value > 0) {
    // Return to login from forgot flow
    forgotStep.value = 0;
    resetDone.value = false;
    error.value = '';
  } else {
    uni.navigateBack();
  }
}

function openForgotPassword() {
  forgotStep.value = 1;
  forgotPhone.value = '';
  forgotCode.value = '';
  forgotNewPassword.value = '';
  forgotConfirmPassword.value = '';
  resetDone.value = false;
  error.value = '';
}

function handleSendResetCode() {
  error.value = '';
  const cleanPhone = forgotPhone.value.replace(/\s/g, '');
  if (!isValidPhone(cleanPhone)) {
    error.value = '请输入有效的手机号';
    return;
  }
  loading.value = true;
  // Mock: simulate API call
  setTimeout(() => {
    loading.value = false;
    forgotStep.value = 2;
  }, 600);
}

function handleVerifyResetCode() {
  error.value = '';
  if (!/^\d{6}$/.test(forgotCode.value)) {
    error.value = '请输入 6 位数字验证码';
    return;
  }
  loading.value = true;
  // Mock: simulate API call
  setTimeout(() => {
    loading.value = false;
    forgotStep.value = 3;
  }, 500);
}

function handleResetPassword() {
  error.value = '';
  if (forgotNewPassword.value.length < 6) {
    error.value = '密码至少 6 位';
    return;
  }
  if (forgotNewPassword.value !== forgotConfirmPassword.value) {
    error.value = '两次密码不一致';
    return;
  }
  loading.value = true;
  // Mock: simulate API call
  setTimeout(() => {
    loading.value = false;
    resetDone.value = true;
    // Auto redirect back to login after 1.5s
    setTimeout(() => {
      forgotStep.value = 0;
      resetDone.value = false;
    }, 1500);
  }, 600);
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

  /* ── Label row (for "忘记密码？" link) ── */
  &__label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }

  &__forgot-link {
    font-size: 24rpx;
    color: #2563eb;
    font-weight: 500;
    padding: 0;
    background: none;
    border: none;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  /* ── Forgot password steps indicator ── */
  &__steps {
    display: flex;
    align-items: center;
    margin-bottom: 56rpx;
  }

  &__steps-item {
    display: flex;
    align-items: center;
    flex: 1;
  }

  &__steps-circle {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22rpx;
    font-weight: 700;
    background: #f1f5f9;
    border: 4rpx solid transparent;
    color: #d1d5db;

    &--active {
      background: #eff6ff;
      border-color: #2563eb;
      color: #2563eb;
    }

    &--done {
      background: #2563eb;
      color: #fff;
    }
  }

  &__steps-check {
    font-size: 24rpx;
  }

  &__steps-line {
    flex: 1;
    height: 2rpx;
    background: #e5e7eb;
    margin: 0 8rpx;

    &--done {
      background: #2563eb;
    }
  }

  /* ── Forgot form ── */
  &__forgot-form {
    display: flex;
    flex-direction: column;
    gap: 28rpx;
  }

  &__forgot-hint {
    padding: 24rpx 32rpx;
    background: #eff6ff;
    border-radius: 24rpx;

    text {
      display: block;
      font-size: 26rpx;
      color: #1d4ed8;
    }
  }

  /* ── Reset done ── */
  &__reset-done {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 96rpx 0;
  }

  &__reset-done-circle {
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: #f0fdf4;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
  }

  &__reset-done-check {
    font-size: 56rpx;
    color: #16a34a;
  }

  &__reset-done-title {
    font-size: 34rpx;
    font-weight: 700;
    color: #111827;
    margin: 0 0 12rpx;
    display: block;
  }

  &__reset-done-sub {
    font-size: 26rpx;
    color: #9cafc6;
    display: block;
  }

  /* ── Eye toggle button ── */
  &__eye-btn {
    position: absolute;
    right: 1rem;                /* 16px × 2 */
    top: 50%;
    transform: translateY(-50%);
    margin-top: 4rpx;
    background: none;
    border: none;
    padding: 0;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
    image{
      width: 36rpx;
      height: 36rpx;
    }
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
