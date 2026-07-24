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
      <text class="profile-page__unauth-desc"
        >登录账号，追踪学习进度\n解锁完整词库内容</text
      >
      <view class="profile-page__unauth-btns">
        <PrimaryButton @click="goLogin">登录</PrimaryButton>
        <PrimaryButton ghost @click="goRegister">注册新账号</PrimaryButton>
      </view>
    </view>

    <!-- Logged in -->
    <view v-else class="profile-page__content">
      <!-- User card -->
      <view
        class="profile-page__user-card"
        :class="{ 'profile-page__user-card--admin': isAdmin }"
      >
        <view class="profile-page__user-card-inner">
          <view class="profile-page__user-card-avatar">
            <image src="\static\images\user.png" mode="scaleToFill" />
          </view>
          <view class="profile-page__user-card-info">
            <text class="profile-page__user-card-name">{{
              user.username
            }}</text>
            <text class="profile-page__user-card-phone">{{ user.phone }}</text>
            <text class="profile-page__user-card-role">{{
              isAdmin ? "管理员" : "普通用户"
            }}</text>
          </view>
        </view>
      </view>

      <!-- Admin: management entry -->
      <view v-if="isAdmin" class="profile-page__admin-entry">
        <view class="profile-page__menu-item" @click="goAdmin">
          <view class="profile-page__menu-item-left">
            <view
              class="profile-page__menu-item-icon profile-page__menu-item-icon--purple"
            >
              <text class="iconfont">&#xe00d;</text>
            </view>
            <view>
              <text class="profile-page__menu-item-label">管理后台</text>
              <text class="profile-page__menu-item-desc"
                >词库、单词与用户管理</text
              >
            </view>
          </view>
          <view class="css-arrow profile-page__menu-item-chevron" />
        </view>
      </view>

      <!-- Regular user: learning stats -->
      <view v-else class="profile-page__stats">
        <view class="profile-page__stat">
          <view class="profile-page__stat-icon profile-page__stat-icon--blue">
            <image
              src="/static/images/tab-libraries-active.png"
              mode="scaleToFill"
            />
          </view>
          <text class="profile-page__stat-label">已学单词</text>
          <text class="profile-page__stat-value"
            >{{ stats.totalWordsLearned }} 个</text
          >
        </view>
        <view class="profile-page__stat">
          <view class="profile-page__stat-icon profile-page__stat-icon--green">
            <image src="\static\images\task.png" mode="scaleToFill" />
          </view>
          <text class="profile-page__stat-label">今日目标</text>
          <text class="profile-page__stat-value"
            >{{ stats.todayLearnedCount }}/5 个</text
          >
        </view>
      </view>

      <!-- Notes entry — regular users only -->
      <view v-if="user && !isAdmin" class="profile-page__notes-entry">
        <view class="profile-page__menu-item" @click="goNotes">
          <view class="profile-page__menu-item-left">
            <view
              class="profile-page__menu-item-icon profile-page__menu-item-icon--blue"
            >
              <image src="\static\images\file-blue.png" mode="scaleToFill" />
            </view>
            <view>
              <text class="profile-page__menu-item-label">我的笔记</text>
              <text class="profile-page__menu-item-desc"
                >{{ noteCount }} 条笔记</text
              >
            </view>
          </view>
          <view class="css-arrow profile-page__menu-item-chevron" />
        </view>
      </view>

      <!-- Settings -->
      <view class="profile-page__settings">
        <view class="profile-page__menu-item">
          <view class="profile-page__menu-item-left">
            <view
              class="profile-page__menu-item-icon profile-page__menu-item-icon--gray"
            >
              <image src="/static/images/setting.png" mode="scaleToFill" />
            </view>
            <text class="profile-page__menu-item-label">设置</text>
          </view>
          <view class="css-arrow profile-page__menu-item-chevron" />
        </view>
      </view>

      <!-- Logout -->
      <view class="profile-page__logout" @click="handleLogout">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { userStore, logout } from "@/store/user";
import { fetchUserStats, fetchMyNotes } from "@/api";
import PrimaryButton from "@/components/PrimaryButton.vue";

const user = computed(() => userStore.user);
const isAdmin = computed(() => user.value?.role === "admin");

const stats = ref({
  totalWordsLearned: 0,
  totalLearningDays: 0,
  todayLearnedCount: 0,
});
const noteCount = ref(0);

onShow(async () => {
  if (user.value && !isAdmin.value) {
    try {
      const result = await fetchUserStats();
      stats.value = result;
    } catch {
      // API 不可用时保留默认值
    }
  }
  // 加载笔记计数（登录用户）
  if (user.value) {
    try {
      const notes = await fetchMyNotes();
      noteCount.value = notes.length;
    } catch {
      // API 不可用时保留默认值
    }
  }
});

function goLogin() {
  uni.navigateTo({ url: "/pages/auth/auth?mode=login" });
}

function goRegister() {
  uni.navigateTo({ url: "/pages/auth/auth?mode=register" });
}

function goAdmin() {
  uni.navigateTo({ url: "/pages/admin/overview" });
}

function goNotes() {
  uni.navigateTo({ url: "/pages/notes/notes" });
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
  background: #f7f9fc;
  &__stat-icon {
    image {
      width: 36rpx;
      height: 36rpx;
    }
  }
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
    color: #9ca3af;
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
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 48rpx;
      font-size: 72rpx;
      color: #cbd5e1;
    }

    &-title {
      font-size: 40rpx;
      font-weight: 600;
      color: #374151;
      margin: 0 0 16rpx;
    }

    &-desc {
      font-size: 28rpx;
      color: #9ca3af;
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
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    box-shadow: 0 16rpx 64rpx rgba(37, 99, 235, 0.25);

    &--admin {
      background: linear-gradient(135deg, #4c1d95, #7c3aed);
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
      image {
        width: 72rpx;
        height: 72rpx;
      }
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

      &--blue {
        background: #eff6ff;
        color: #2563eb;
      }
      &--green {
        background: #f0fdf4;
        color: #16a34a;
      }
    }

    &-label {
      font-size: 24rpx;
      color: #9ca3af;
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
      width: 100%;
      & > :nth-child(2) {
        display: flex;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        margin: 0%;
        padding: 0;
      }
      image {
        width: 36rpx;
        height: 36rpx;
      }
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

      &--purple {
        background: #faf5ff;
        color: #7c3aed;
      }
      &--blue {
        background: #eff6ff;
        color: #2563eb;
      }
      &--gray {
        background: #f3f4f6;
        color: #6b7280;
      }
    }

    &-label {
      font-size: 30rpx;
      color: #374151;
      font-weight: 500;
    }

    &-desc {
      font-size: 24rpx;
      color: #9ca3af;
      margin-right: 20rpx;
    }

    &-chevron {
      color: #a0a0a0;
      flex-shrink: 0;
    }
  }

  /* ── Notes entry ── */
  &__notes-entry {
    margin-bottom: 32rpx;
    background: #fff;
    border-radius: 40rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.04);
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
    background: #fef2f2;
    color: #dc2626;
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
