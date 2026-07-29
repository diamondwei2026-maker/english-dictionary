<template>
  <!-- Ported from figma-prototype HomeView.tsx:184-226 + LibraryWordsView.tsx:154-183 -->
  <!-- Cross-validated: default variant (home/list) and compact variant (library-words) -->
  <view
    class="word-card"
    :class="`word-card--${variant}`"
    @click="$emit('click')"
  >
    <view
      class="word-card__main"
      :class="{ 'word-card__main--flex': variant === 'default' }"
    >
      <view class="word-card__info">
        <view class="word-card__word-row">
          <text class="word-card__word">{{ word.word }}</text>
          <text class="word-card__phonetic">{{ word.phonetic }}</text>
        </view>
        <text
          class="word-card__meaning"
          :class="{ 'word-card__meaning--truncate': variant === 'default' }"
          >{{ word.coreMeaning }}</text
        >
        <text v-if="showLibrary && libraryName" class="word-card__badge">{{
          libraryName
        }}</text>
      </view>
      <!-- ArrowRight icon (default variant) or custom actions slot (favorites) -->
      <view v-if="variant === 'default'" class="css-arrow word-card__arrow" />
      <slot name="actions" />
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Word } from "@/data/types";

defineProps<{
  word: Word;
  libraryName?: string;
  showLibrary?: boolean;
  variant?: "default" | "compact";
}>();

defineEmits<{ click: [] }>();
</script>

<style scoped lang="scss">
.word-card {
  background: #fff;
  border-radius: 32rpx; /* Phase1(src): HomeView.tsx:193 — 16px → 32rpx */
  border: none;
  width: 100%;
  box-sizing: border-box;
  /* #ifdef H5 */
  cursor: pointer;
  /* #endif */

  &--default {
    padding: 32rpx 40rpx; /* Phase1(src): HomeView.tsx:191 — 16px 20px → 32rpx 40rpx */
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04); /* Phase1(src): HomeView.tsx:197 — 0 2px 12px rgba(0,0,0,0.04) → rpx×2 */
  }

  &--compact {
    padding: 32rpx 40rpx; /* Phase1(src): HomeView.tsx:98 — search result card padding same */
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.05); /* Phase1(src): HomeView.tsx:106 — 0 2px 16px rgba(0,0,0,0.05) → rpx×2 */
  }

  &__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    width: 100%;

    &--flex {
      // default variant — flex row with arrow
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__word-row {
    display: flex;
    align-items: baseline;
    gap: 20rpx; /* 10px → 20rpx */
    margin-bottom: 8rpx; /* 4px → 8rpx */
  }

  &__word {
    font-size: 34rpx; /* Phase1(src): HomeView.tsx:203 — 17px → 34rpx (default) */
    font-weight: 700;
    color: #111827;

    .word-card--compact & {
      font-size: 36rpx; /* Phase1(src): search result: 18px → 36rpx. HomeView.tsx:113 */
    }
  }

  &__phonetic {
    font-size: 24rpx; /* Phase1(src): HomeView.tsx:204 — 12px → 24rpx */
    color: #9ca3af;
  }

  &__meaning {
    font-size: 26rpx; /* Phase1(src): HomeView.tsx:117 — 13px → 26rpx */
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
    display: block; /* NC-14: <text> default inline → block for proper width */

    &--truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .word-card--compact & {
      font-size: 24rpx; /* Phase1(src): HomeView.tsx:207 — 12px → 24rpx (compact) */
    }
  }

  &__badge {
    display: inline-block; /* Source: <span style="display:inline-block"> — NOT block! NC-14 reverse trap (PM-M8) */
    margin-top: 12rpx; /* 6px → 12rpx */
    font-size: 22rpx; /* 11px → 22rpx */
    color: #2563eb;
    background: #eff6ff;
    padding: 4rpx 16rpx; /* 2px 8px → 4rpx 16rpx */
    border-radius: 12rpx; /* 6px → 12rpx */
  }

  &__arrow {
    color: #a0a0a0; // 0.71 × 255 ≈ 181
    flex-shrink: 0;
    margin-left: 24rpx; /* 12px → 24rpx */
  }
}
</style>
