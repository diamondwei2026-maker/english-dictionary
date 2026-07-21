<template>
  <!-- Ported from figma-prototype AdminView.tsx:685-730 — UserManager sub-module -->
  <view class="admin-users">
    <PageHeader
      title="用户管理"
      show-back
      back-label="返回"
      bg-type="admin"
      :padding-top="104"
      @back="goBack"
    />

    <view class="admin-users__body">
      <SectionLabel>共 {{ users.length }} 位用户</SectionLabel>
      <view v-if="loading" class="admin-users__loading">
        <text>加载中...</text>
      </view>
      <view v-else class="admin-users__list">
        <view v-for="u in users" :key="u.id" class="admin-users__card">
          <view class="admin-users__avatar" :class="{ 'admin-users__avatar--admin': u.role === 'admin' }">
            <text class="admin-users__avatar-text">{{ u.username[0]?.toUpperCase() || '?' }}</text>
          </view>
          <view class="admin-users__info">
            <view class="admin-users__info-top">
              <text class="admin-users__name">{{ u.username }}</text>
              <text class="admin-users__role" :class="{ 'admin-users__role--admin': u.role === 'admin' }">
                {{ u.role === 'admin' ? '管理员' : '普通用户' }}
              </text>
            </view>
            <text class="admin-users__phone">{{ u.phone }}</text>
          </view>
          <view class="admin-users__stats">
            <text class="admin-users__stats-value">{{ u.learnedWords }}</text>
            <text class="admin-users__stats-label">已学</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchUsers } from '@/api';
import type { User } from '@/data/types';
import PageHeader from '@/components/PageHeader.vue';
import SectionLabel from '@/components/SectionLabel.vue';

const users = ref<User[]>([]);
const loading = ref(true);

onShow(async () => {
  try {
    users.value = await fetchUsers();
  } catch {
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' });
  }
  loading.value = false;
});

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.admin-users {
  min-height: 100vh;
  background: #F7F9FC;

  &__body {
    padding: 16rpx 48rpx 80rpx;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 80rpx 0;
    font-size: 28rpx;
    color: #9CA3AF;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: 28rpx;
    padding: 32rpx 40rpx;
    background: #fff;
    border-radius: 40rpx;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.05);
  }

  &__avatar {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
    flex-shrink: 0;
    background: linear-gradient(135deg, #2563EB, #3B82F6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

    &--admin {
      background: linear-gradient(135deg, #7C3AED, #8B5CF6);
    }

    &-text {
      font-size: 32rpx;
      font-weight: 700;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;

    &-top {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 8rpx;
    }
  }

  &__name {
    font-size: 30rpx;
    font-weight: 600;
    color: #111827;
  }

  &__role {
    font-size: 22rpx;
    padding: 4rpx 16rpx;
    border-radius: 40rpx;
    background: #F3F4F6;
    color: #6B7280;
    font-weight: 500;

    &--admin {
      background: #FAF5FF;
      color: #7C3AED;
    }
  }

  &__phone {
    font-size: 24rpx;
    color: #9CA3AF;
  }

  &__stats {
    text-align: right;
    flex-shrink: 0;

    &-value {
      display: block;
      font-size: 34rpx;
      font-weight: 700;
      color: #2563EB;
      margin: 0 0 4rpx;
    }

    &-label {
      display: block;
      font-size: 22rpx;
      color: #9CA3AF;
    }
  }
}
</style>
