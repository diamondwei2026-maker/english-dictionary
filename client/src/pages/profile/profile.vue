<template>
  <!-- Ported from figma-prototype/ProfileView.tsx -->
  <view class="profile-page">
    <!-- Header -->
    <view class="profile-page__header">
      <text class="profile-page__subtitle">我的</text>
      <text class="profile-page__title">个人中心</text>
    </view>

    <!-- Not logged in -->
    <view v-if="!user" class="profile-page__unauth">
      <view class="profile-page__unauth-avatar">
        <text class="iconfont">&#xe004;</text>
      </view>
      <text class="profile-page__unauth-title">登录后开始学习</text>
      <text class="profile-page__unauth-desc">登录账号，追踪学习进度\n解锁完整词库内容</text>
      <view class="profile-page__unauth-btns">
        <PrimaryButton @click="goLogin">登录</PrimaryButton>
        <PrimaryButton ghost @click="goRegister">注册新账号</PrimaryButton>
      </view>
    </view>

    <!-- Logged in -->
    <view v-else class="profile-page__content">
      <!-- User card -->
      <view class="profile-page__user-card" :class="{ 'profile-page__user-card--admin': isAdmin }">
        <view class="profile-page__user-card-inner">
          <view class="profile-page__user-card-avatar">
            <text class="iconfont">&#xe004;</text>
          </view>
          <view class="profile-page__user-card-info">
            <text class="profile-page__user-card-name">{{ user.username }}</text>
            <text class="profile-page__user-card-phone">{{ user.phone }}</text>
            <text class="profile-page__user-card-role">{{ isAdmin ? '管理员' : '普通用户' }}</text>
          </view>
        </view>
      </view>

      <!-- Admin: management entry -->
      <view v-if="isAdmin" class="profile-page__admin-entry">
        <view class="profile-page__menu-item" @click="goAdmin">
          <view class="profile-page__menu-item-left">
            <view class="profile-page__menu-item-icon profile-page__menu-item-icon--purple">
              <text class="iconfont">&#xe00d;</text>
            </view>
            <view>
              <text class="profile-page__menu-item-label">管理后台</text>
              <text class="profile-page__menu-item-desc">词库、单词与用户管理</text>
            </view>
          </view>
          <text class="iconfont profile-page__menu-item-chevron">&#xe002;</text>
        </view>
      </view>

      <!-- Regular user: learning stats -->
      <view v-else class="profile-page__stats">
        <view class="profile-page__stat">
          <view class="profile-page__stat-icon profile-page__stat-icon--blue">
            <text class="iconfont">&#xe00b;</text>
          </view>
          <text class="profile-page__stat-label">已学单词</text>
          <text class="profile-page__stat-value">{{ stats.totalWordsLearned }} 个</text>
        </view>
        <view class="profile-page__stat">
          <view class="profile-page__stat-icon profile-page__stat-icon--green">
            <text class="iconfont">&#xe00e;</text>
          </view>
          <text class="profile-page__stat-label">今日目标</text>
          <text class="profile-page__stat-value">{{ stats.todayLearnedCount }}/5 个</text>
        </view>
      </view>

      <!-- Settings -->
      <view class="profile-page__settings">
        <view class="profile-page__menu-item">
          <view class="profile-page__menu-item-left">
            <view class="profile-page__menu-item-icon profile-page__menu-item-icon--gray">
              <text class="iconfont">&#xe005;</text>
            </view>
            <text class="profile-page__menu-item-label">设置</text>
          </view>
          <text class="iconfont profile-page__menu-item-chevron">&#xe002;</text>
        </view>
      </view>

      <!-- Logout -->
      <view class="profile-page__logout" @click="handleLogout">
        <text class="iconfont profile-page__logout-icon">&#xe00f;</text>
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { userStore, logout } from '@/store/user';
import { fetchUserStats } from '@/api';
import PrimaryButton from '@/components/PrimaryButton.vue';

const user = computed(() => userStore.user);
const isAdmin = computed(() => user.value?.role === 'admin');

const stats = ref({ totalWordsLearned: 0, totalLearningDays: 0, todayLearnedCount: 0 });

onShow(async () => {
  if (user.value && !isAdmin.value) {
    try {
      const result = await fetchUserStats();
      stats.value = result;
    } catch {
      // API 不可用时保留默认值
    }
  }
});

function goLogin() {
  uni.navigateTo({ url: '/pages/auth/auth?mode=login' });
}

function goRegister() {
  uni.navigateTo({ url: '/pages/auth/auth?mode=register' });
}

function goAdmin() {
  uni.navigateTo({ url: '/pages/admin/overview' });
}

function handleLogout() {
  logout();
  // logout() 内部已处理 redirectTo login
}
</script>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  padding-bottom: 132rpx;
  background: #F7F9FC;

  &__header {
    padding: 104rpx 48rpx 40rpx;
    background: rgba(255, 255, 255, 0.9);
    /* #ifdef H5 */
    backdrop-filter: blur(32rpx);
    -webkit-backdrop-filter: blur(32rpx);
    /* #endif */
  }

  &__subtitle {
    display: block;
    font-size: 24rpx;
    color: #9CA3AF;
    letter-spacing: 4rpx;
    text-transform: uppercase;
    margin-bottom: 12rpx;
  }

  &__title {
    display: block;
    font-size: 52rpx;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  /* ── Not logged in ── */
  &__unauth {
    padding: 80rpx 48rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    &-avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      background: #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 48rpx;
      font-size: 72rpx;
      color: #CBD5E1;
    }

    &-title {
      font-size: 40rpx;
      font-weight: 600;
      color: #374151;
      margin: 0 0 16rpx;
    }

    &-desc {
      font-size: 28rpx;
      color: #9CA3AF;
      text-align: center;
      line-height: 1.6;
      margin: 0 0 72rpx;
      white-space: pre-line;
    }

    &-btns {
      display: flex;
      flex-direction: column;
      gap: 24rpx;
      width: 100%;
      max-width: 560rpx;
    }
  }

  /* ── Logged in ── */
  &__content {
    padding: 40rpx 48rpx;
  }

  &__user-card {
    border-radius: 48rpx;
    padding: 48rpx;
    margin-bottom: 40rpx;
    color: #fff;
    background: linear-gradient(135deg, #1D4ED8, #2563EB);
    box-shadow: 0 16rpx 64rpx rgba(37, 99, 235, 0.25);

    &--admin {
      background: linear-gradient(135deg, #4C1D95, #7C3AED);
      box-shadow: 0 16rpx 64rpx rgba(124, 58, 237, 0.25);
    }

    &-inner {
      display: flex;
      align-items: center;
      gap: 32rpx;
    }

    &-avatar {
      width: 104rpx;
      height: 104rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 48rpx;
    }

    &-name {
      font-size: 36rpx;
      font-weight: 700;
      margin: 0 0 8rpx;
      display: block;
    }

    &-phone {
      font-size: 26rpx;
      opacity: 0.75;
      display: block;
    }

    &-role {
      display: inline-block;
      margin-top: 12rpx;
      font-size: 22rpx;
      background: rgba(255, 255, 255, 0.2);
      padding: 6rpx 20rpx;
      border-radius: 40rpx;
      letter-spacing: 1rpx;
    }
  }

  /* ── Stats (regular user) ── */
  &__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24rpx;
    margin-bottom: 32rpx;
  }

  &__stat {
    background: #fff;
    border-radius: 40rpx;
    padding: 40rpx;
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);

    &-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20rpx;
      font-size: 36rpx;

      &--blue { background: #EFF6FF; color: #2563EB; }
      &--green { background: #F0FDF4; color: #16A34A; }
    }

    &-label {
      font-size: 24rpx;
      color: #9CA3AF;
      margin: 0 0 8rpx;
      display: block;
    }

    &-value {
      font-size: 30rpx;
      font-weight: 600;
      color: #111827;
    }
  }

  /* ── Admin entry ── */
  &__admin-entry {
    margin-bottom: 32rpx;
  }

  /* ── Menu rows ── */
  &__menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 32rpx 40rpx;
    background: #fff;

    &-left {
      display: flex;
      align-items: center;
      gap: 24rpx;
    }

    &-icon {
      width: 64rpx;
      height: 64rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      flex-shrink: 0;

      &--purple { background: #FAF5FF; color: #7C3AED; }
      &--gray { background: #F3F4F6; color: #6B7280; }
    }

    &-label {
      font-size: 30rpx;
      color: #374151;
      font-weight: 500;
    }

    &-desc {
      font-size: 24rpx;
      color: #9CA3AF;
      margin: 0 0 2px;
    }

    &-chevron {
      font-size: 32rpx;
      color: #D1D5DB;
    }
  }

  &__settings {
    background: #fff;
    border-radius: 40rpx;
    overflow: hidden;
    margin-bottom: 28rpx;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.04);
  }

  /* ── Logout ── */
  &__logout {
    width: 100%;
    padding: 32rpx;
    background: #FEF2F2;
    color: #DC2626;
    border: none;
    border-radius: 32rpx;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    box-sizing: border-box;

    &-icon {
      font-size: 32rpx;
    }
  }
}
</style>
