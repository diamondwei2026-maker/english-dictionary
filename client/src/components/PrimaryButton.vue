<template>
  <!-- Ported from figma-prototype — PrimaryButton (AdminView.tsx:109-133: PrimaryBtn) -->
  <view
    class="primary-btn"
    :class="{
      'primary-btn--disabled': disabled || loading,
      'primary-btn--ghost': ghost,
      'primary-btn--sm': size === 'sm',
      'primary-btn--lg': size === 'lg',
    }"
    @click="handleClick"
  >
    <view v-if="loading" class="primary-btn__spinner" />
    <slot />
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  loading?: boolean;
  disabled?: boolean;
  ghost?: boolean;
  size?: 'sm' | 'md' | 'lg';
}>();

const emit = defineEmits<{ click: [] }>();

function handleClick() {
  if (!props.disabled && !props.loading) {
    emit('click');
  }
}
</script>

<style scoped lang="scss">
.primary-btn {
  width: 100%;
  padding: 30rpx;           /* Phase1(src): AdminView.tsx:122 — 15px → 30rpx (md default) */
  border-radius: 32rpx;     /* 16px → 32rpx */
  border: none;
  background: #2563EB;
  color: #fff;
  font-size: 30rpx;         /* 15px → 30rpx (md default) */
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  /* #ifdef H5 */
  cursor: pointer;
  /* #endif */

  &--disabled {
    background: #93C5FD;
    /* #ifdef H5 */
    cursor: default;
    /* #endif */
  }

  &--ghost {
    background: #fff;
    color: #2563EB;
    border: 3rpx solid #BFDBFE;
  }

  &--sm {
    padding: 28rpx;         /* Phase1(src): AdminView.tsx:419 — 14px → 28rpx */
    font-size: 28rpx;       /* 14px → 28rpx (AI btn) */
  }

  &--lg {
    padding: 32rpx;         /* Phase1(src): AuthView.tsx:214 — 16px → 32rpx */
    font-size: 32rpx;       /* 16px → 32rpx (auth) */
  }

  &__spinner {
    width: 30rpx;
    height: 30rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
