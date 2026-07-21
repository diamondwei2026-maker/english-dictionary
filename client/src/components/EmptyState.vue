<template>
  <!-- Ported from figma-prototype — EmptyState pattern (HomeView.tsx:87-90, AdminView.tsx:296-298) -->
  <view class="empty-state">
    <slot name="icon">
      <text v-if="icon" class="iconfont empty-state__icon">{{ icon }}</text>
    </slot>
    <text class="empty-state__message">{{ message }}</text>
    <text v-if="hint" class="empty-state__hint">{{ hint }}</text>
    <slot name="action" />
  </view>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
  hint?: string;
  icon?: string;
}>();
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;       /* Phase1(src): HomeView.tsx:87 — 40px 0 → 80rpx 0 */
  color: #9CA3AF;

  &__icon {
    font-size: 64rpx;     /* 32px → 64rpx */
    margin-bottom: 24rpx; /* 12px → 24rpx */
    opacity: 0.3;
  }

  &__message {
    font-size: 30rpx;     /* 15px → 30rpx */
  }

  &__hint {
    font-size: 26rpx;     /* 13px → 26rpx */
    margin-top: 12rpx;    /* 6px → 12rpx */
  }
}
</style>
