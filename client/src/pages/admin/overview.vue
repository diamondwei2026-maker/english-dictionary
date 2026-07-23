<template>
  <!-- Ported from figma-prototype AdminView.tsx:137-222 — Overview sub-module -->
  <view class="admin-overview">
    <PageHeader title="数据概览" subtitle="管理后台" bg-type="admin" :padding-top="104" />

    <view class="admin-overview__body">
      <!-- Stats banner -->
      <view class="admin-overview__banner">
        <text class="admin-overview__banner-label">当前数据</text>
        <view class="admin-overview__banner-stats">
          <view v-for="(stat, i) in stats" :key="i" class="admin-overview__banner-stat">
            <text class="admin-overview__banner-stat-value">{{ stat.value }}</text>
            <text class="admin-overview__banner-stat-label">{{ stat.label }}</text>
          </view>
        </view>
      </view>

      <SectionLabel>功能入口</SectionLabel>
      <view class="admin-overview__sections">
        <view
          v-for="s in sections"
          :key="s.id"
          class="admin-overview__section-card"
          @click="goSection(s.id)"
        >
          <view class="admin-overview__section-card-left">
            <view class="admin-overview__section-card-icon" :style="{ background: s.bg, color: s.color }">
              <text class="iconfont">{{ s.icon }}</text>
            </view>
            <view>
              <text class="admin-overview__section-card-label">{{ s.label }}</text>
              <text class="admin-overview__section-card-desc">{{ s.desc }}</text>
            </view>
          </view>
          <view class="css-arrow admin-overview__section-card-arrow" />
        </view>
      </view>

      <!-- Exit admin -->
      <view class="admin-overview__exit" @click="exitAdmin">
        <text>退出管理</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchDashboard } from '@/api';
import { logout } from '@/store/user';
import PageHeader from '@/components/PageHeader.vue';
import SectionLabel from '@/components/SectionLabel.vue';

const stats = ref([
  { label: '词库', value: 0 },
  { label: '单词', value: 0 },
  { label: '用户', value: 0 },
]);

const sections = ref([
  { id: 'libraries', label: '词库管理', desc: '', icon: '', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'words', label: '单词管理', desc: '', icon: '', color: '#16A34A', bg: '#F0FDF4' },
  { id: 'users', label: '用户管理', desc: '', icon: '', color: '#7C3AED', bg: '#FAF5FF' },
]);

onShow(async () => {
  try {
    const dash = await fetchDashboard();
    stats.value = [
      { label: '词库', value: dash.wordbankCount },
      { label: '单词', value: dash.wordCount },
      { label: '用户', value: dash.userCount },
    ];
    sections.value = [
      { id: 'libraries', label: '词库管理', desc: `${dash.wordbankCount} 个词库`, icon: '', color: '#2563EB', bg: '#EFF6FF' },
      { id: 'words', label: '单词管理', desc: `${dash.wordCount} 个单词`, icon: '', color: '#16A34A', bg: '#F0FDF4' },
      { id: 'users', label: '用户管理', desc: `${dash.userCount} 位用户`, icon: '', color: '#7C3AED', bg: '#FAF5FF' },
    ];
  } catch {
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' });
  }
});

function goSection(id: string) {
  uni.navigateTo({ url: `/pages/admin/${id}` });
}

function exitAdmin() {
  logout();
}
</script>

<style scoped lang="scss">
.admin-overview {
  min-height: 100vh;
  background: #F7F9FC;

  &__body {
    padding: 32rpx 48rpx 80rpx;
  }

  /* ── Stats banner ── */
  &__banner {
    background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%);
    border-radius: 48rpx;
    padding: 48rpx;
    margin-bottom: 48rpx;
    box-shadow: 0 16rpx 64rpx rgba(37, 99, 235, 0.22);
    color: #fff;

    &-label {
      display: block;
      font-size: 22rpx;
      opacity: 0.7;
      letter-spacing: 4rpx;
      text-transform: uppercase;
      margin: 0 0 32rpx;
    }

    &-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8rpx;
    }

    &-stat {
      text-align: center;
    }

    &-stat-value {
      display: block;
      font-size: 60rpx;
      font-weight: 800;
      margin: 0 0 4rpx;
      letter-spacing: -1rpx;
    }

    &-stat-label {
      display: block;
      font-size: 24rpx;
      opacity: 0.7;
    }
  }

  /* ── Section cards ── */
  &__sections {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin-bottom: 64rpx;
  }

  &__section-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 36rpx 40rpx;
    background: #fff;
    border-radius: 40rpx;
    border: none;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.05);
    text-align: left;

    &-left {
      display: flex;
      align-items: center;
      gap: 28rpx;
    }

    &-icon {
      width: 88rpx;
      height: 88rpx;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
      flex-shrink: 0;
    }

    &-label {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4rpx;
    }

    &-desc {
      display: block;
      font-size: 26rpx;
      color: #9CA3AF;
    }

    &-arrow {
      color: #a0a0a0;
      flex-shrink: 0;
    }
  }

  /* ── Exit ── */
  &__exit {
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
  }
}
</style>
