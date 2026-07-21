<template>
  <!-- Ported from figma-prototype — SectionLabel (SLabel in AdminView.tsx:105-107) -->
  <view class="section-label">
    <slot />
  </view>
</template>

<script setup lang="ts">
// Pure display component — no props needed beyond default slot
</script>

<style scoped lang="scss">
.section-label {
  font-size: 22rpx;       /* Phase1(src): AdminView.tsx:48-50 — 11px → 22rpx */
  font-weight: 600;
  color: #9CA3AF;
  letter-spacing: 4rpx;   /* 2px → 4rpx */
  text-transform: uppercase;
  margin: 0 0 24rpx;      /* 12px → 24rpx */
}
</style>
