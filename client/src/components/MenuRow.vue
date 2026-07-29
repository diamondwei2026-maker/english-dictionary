<template>
  <!-- Ported from figma-prototype ProfileView.tsx MenuRow (lines 217-250) -->
  <view
    class="menu-row"
    :class="{ 'menu-row--clickable': !!$attrs.onClick }"
    @click="$emit('click')"
  >
    <view class="menu-row__left">
      <view
        class="menu-row__icon"
        :style="{ background: bg, color: color }"
      >
        <slot name="icon">
          <text v-if="typeof icon === 'string' && icon.startsWith('&#x')" class="iconfont">{{ icon }}</text>
          <!-- otherwise icon is passed as slot content -->
        </slot>
      </view>
      <view class="menu-row__text">
        <text class="menu-row__label">{{ label }}</text>
        <text v-if="desc" class="menu-row__desc">{{ desc }}</text>
      </view>
    </view>
    <view class="css-arrow menu-row__chevron" />
  </view>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  desc?: string;
  color: string;
  bg: string;
  icon?: string;
}>();

defineEmits<{ click: [] }>();
</script>

<style scoped lang="scss">
.menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 32rpx 40rpx; /* Phase1(src): ProfileView.tsx:232 — 16px 20px → 32rpx 40rpx */
  background: #fff;
  box-sizing: border-box;

  &--clickable {
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 24rpx; /* Phase1(src): ProfileView.tsx:237 — 12px → 24rpx */
  }

  &__icon {
    width: 64rpx;   /* Phase1(src): ProfileView.tsx:238 — 32px → 64rpx */
    height: 64rpx;
    border-radius: 16rpx; /* 8px → 16rpx */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;   /* iconfont size */
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__label {
    font-size: 30rpx;    /* Phase1(src): ProfileView.tsx:244 — 15px → 30rpx */
    color: #374151;
    font-weight: 500;
  }

  &__desc {
    font-size: 24rpx;    /* Phase1(src): ProfileView.tsx:245 — 12px → 24rpx */
    color: #9cafc6;
  }

  &__chevron {
    color: #a0a0a0;
    flex-shrink: 0;
  }
}
</style>
