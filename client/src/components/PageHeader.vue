<template>
  <!-- Ported from figma-prototype AdminView.tsx:84-101 + HomeView.tsx:28-31 + WordDetailView.tsx:48-59 -->
  <!-- Cross-validated across 7 source instances -->
  <view
    class="page-header"
    :class="`page-header--${bgType}`"
    :style="{ paddingTop: paddingTop + 'rpx' }"
  >
    <view v-if="showBack || $slots.right" class="page-header__bar">
      <view v-if="showBack" class="page-header__back" @click="$emit('back')">
        <text class="iconfont page-header__back-icon">&#xe003;</text>
        <text class="page-header__back-label">{{ backLabel }}</text>
      </view>
      <view v-else class="page-header__spacer" />
      <slot name="right" />
    </view>
    <!-- Titles — outside bar, at header root level (cross-validated: home/admin/libraries all same position) -->
    <view v-if="title" class="page-header__titles">
      <text v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</text>
      <text class="page-header__title" :style="{ whiteSpace: title.includes('\n') ? 'pre-line' : 'normal' }">{{ title }}</text>
    </view>
    <!-- Default slot — placed as sibling to titles (cross-validated: HomeView search bar is sibling, AdminView children are inline) -->
    <slot />
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  bgType?: 'white' | 'page' | 'admin' | 'none';
  paddingTop?: number;
}>();

defineEmits<{ back: [] }>();
</script>

<style scoped lang="scss">
.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 0 48rpx 32rpx;    /* Phase1(src): padding 24px→48rpx x, 16px→32rpx bottom */
                               /* ⚠️ padding-top is dynamic via :style prop */

  &--white {
    background: rgba(255, 255, 255, 0.9);           /* Phase1(src): HomeView.tsx:30 — background */
  }

  &--page {
    background: rgba(247, 249, 252, 0.94);           /* Phase1(src): AdminView.tsx:88 — background */
  }

  &--admin {
    background: rgba(247, 249, 252, 0.94);           /* Phase1(src): AdminView.tsx:88 — same as page */
  }

  /* #ifdef H5 */
  &--white, &--page, &--admin {
    backdrop-filter: blur(32rpx);                    /* Phase1(src): AdminView.tsx:89 — 16px → 32rpx */
    -webkit-backdrop-filter: blur(32rpx);
  }
  /* #endif */

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;    /* Phase1(src): AdminView.tsx:90 marginBottom children?12px → 24rpx */
  }

  &__back {
    display: flex;
    align-items: center;
    gap: 12rpx;              /* 6px → 12rpx */
    background: none;
    border: none;
    color: #6B7280;
    font-size: 28rpx;        /* 14px → 28rpx */
    padding: 12rpx 0;        /* 6px → 12rpx */
  }

  &__back-icon {
    font-size: 36rpx;        /* 18px → 36rpx */
  }

  &__back-label {
    font-size: 28rpx;        /* 14px → 28rpx */
  }

  &__spacer {
    // Keeps bar flex layout balanced when no back button
  }

  &__titles {
    margin-bottom: 0;        /* titles wrapper — content gap handled by slot margin or children */
  }

  &__subtitle {
    display: block;
    font-size: 24rpx;        /* Phase1(src): HomeView.tsx:36 — 12px → 24rpx */
    color: #9CA3AF;
    letter-spacing: 4rpx;    /* 2px → 4rpx */
    text-transform: uppercase;
    margin-bottom: 12rpx;    /* 6px → 12rpx */
  }

  &__title {
    display: block;
    font-size: 52rpx;        /* Phase1(src): HomeView.tsx:39 — 26px → 52rpx (h1 default) */
    font-weight: 700;
    color: #111827;
    line-height: 1.3;
    margin: 0;
    white-space: pre-line;   /* NC-12: \n in <text> needs white-space:pre-line */
  }
}
</style>
