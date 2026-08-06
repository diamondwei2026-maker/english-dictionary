<template>
  <!-- Ported from figma/TrainingView.tsx -->
  <view class="training-page">
    <view class="training-page__header">
      <text class="training-page__kicker">语言反应训练</text>
      <text class="training-page__title">训练</text>
      <text class="training-page__subtitle"
        >从核心意象出发，在句子里建立英语的直接反应。</text
      >
    </view>

    <!-- 短句中译英 — 可用 -->
    <view class="training-page__card" @click="goQuiz('zh2en')">
      <view class="training-page__card-top">
        <view class="training-page__card-icon training-page__card-icon--active">
          <!-- Languages icon (lucide) -->
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2563EB"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path
              d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            />
          </svg>
        </view>
        <view class="css-arrow training-page__card-chevron" />
      </view>
      <text class="training-page__card-title">短句中译英</text>
      <text class="training-page__card-desc"
        >10 道短句，练习把中文意图直接组织成英语。</text
      >
    </view>

    <!-- 短句英译中 — 禁用态 -->
    <view class="training-page__card training-page__card--disabled">
      <view class="training-page__coming-soon">即将上线</view>
      <view class="training-page__card-top">
        <view
          class="training-page__card-icon training-page__card-icon--disabled"
        >
          <!-- BookOpenCheck icon (lucide) -->
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 21V7" />
            <path d="m16 12 2 2 4-4" />
            <path
              d="M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3"
            />
          </svg>
        </view>
      </view>
      <text class="training-page__card-title">短句英译中</text>
      <text class="training-page__card-desc"
        >从英语的原生组织方式理解句子的意义。</text
      >
    </view>
  </view>
</template>

<script setup lang="ts">
import type { QuizDirection } from "@/data/types";

function goQuiz(direction: QuizDirection) {
  uni.navigateTo({ url: `/pages/quiz/quiz?direction=${direction}` });
}
</script>

<style scoped lang="scss">
.training-page {
  min-height: 100vh;
  padding: 112rpx 48rpx 224rpx; /* Phase1(src): TrainingView.tsx:4 — 56px 24px 112px → rpx×2 */
  background: #f7f9fc;

  /* ── Header ── */
  &__kicker {
    display: block;
    margin: 0 0 20rpx; /* Phase1(src): TrainingView.tsx:5 — 0 0 10px → rpx×2 */
    color: #2563eb;
    font-size: 22rpx; /* Phase1(src): TrainingView.tsx:5 — 11px → 22rpx */
    font-weight: 700;
    letter-spacing: 4rpx; /* Phase1(src): TrainingView.tsx:5 — 2px → 4rpx */
    text-transform: uppercase;
  }

  &__title {
    display: block;
    margin: 0 0 20rpx; /* Phase1(src): TrainingView.tsx:6 — 0 0 10px → rpx×2 */
    font-size: 64rpx; /* Phase1(src): TrainingView.tsx:6 — 32px → 64rpx */
    line-height: 1.2;
    letter-spacing: -1rpx; /* Phase1(src): TrainingView.tsx:6 — -0.5px → -1rpx */
    color: #111827;
    font-weight: 750;
  }

  &__subtitle {
    display: block;
    margin: 0 0 64rpx; /* Phase1(src): TrainingView.tsx:7 — 0 0 32px → rpx×2 */
    color: #6b7280;
    font-size: 30rpx; /* Phase1(src): TrainingView.tsx:7 — 15px → 30rpx */
    line-height: 1.75;
  }

  /* ── Cards ── */
  &__card {
    width: 100%;
    text-align: left;
    border: 2rpx solid #e6ebf2; /* Phase1(src): TrainingView.tsx:8 — 1px → 2rpx */
    border-radius: 48rpx; /* Phase1(src): TrainingView.tsx:8 — 24px → 48rpx */
    padding: 48rpx; /* Phase1(src): TrainingView.tsx:8 — 24px → 48rpx */
    background: #fff;
    box-shadow: 0 16rpx 52rpx rgba(25, 49, 80, 0.06); /* Phase1(src): TrainingView.tsx:8 — 0 8px 26px → rpx×2 */
    margin-bottom: 32rpx; /* Phase1(src): TrainingView.tsx:8 — 16px → 32rpx */
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */

    &--disabled {
      position: relative;
      opacity: 0.55;
      box-shadow: 0 16rpx 52rpx rgba(25, 49, 80, 0.04);
      /* #ifdef H5 */
      cursor: default;
      /* #endif */
    }
  }

  &__card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__card-icon {
    width: 92rpx; /* Phase1(src): TrainingView.tsx:9 — 46px → 92rpx */
    height: 92rpx; /* Phase1(src): TrainingView.tsx:9 — 46px → 92rpx */
    border-radius: 32rpx; /* Phase1(src): TrainingView.tsx:9 — 16px → 32rpx */
    display: flex;
    align-items: center;
    justify-content: center;

    &--active {
      background: #eff6ff; /* Phase1(src): TrainingView.tsx:9 */
      color: #2563eb;
    }

    &--disabled {
      background: #f8fafc; /* Phase1(src): TrainingView.tsx:13 */
      color: #94a3b8;
    }
  }

  &__card-chevron {
    color: #2563eb;
    margin-top: 14rpx;
    --arrow-chevron: 20rpx;
    --arrow-stroke: 4rpx;
  }

  &__card-title {
    display: block;
    margin: 48rpx 0 16rpx; /* Phase1(src): TrainingView.tsx:10 — 24px 0 8px → rpx×2 */
    font-size: 40rpx; /* Phase1(src): TrainingView.tsx:10 — 20px → 40rpx */
    color: #111827;
    font-weight: 700;
  }

  &__card-desc {
    display: block;
    margin: 0;
    color: #6b7280;
    font-size: 28rpx; /* Phase1(src): TrainingView.tsx:10/14 — 14px → 28rpx */
    line-height: 1.65;
  }

  /* ── Coming soon badge ── */
  &__coming-soon {
    position: absolute;
    right: 40rpx; /* Phase1(src): TrainingView.tsx:13 — 20px → 40rpx */
    top: 40rpx; /* Phase1(src): TrainingView.tsx:13 — 20px → 40rpx */
    padding: 8rpx 20rpx; /* Phase1(src): TrainingView.tsx:13 — 4px 10px → rpx×2 */
    border-radius: 200rpx; /* Phase1(src): TrainingView.tsx:13 — 100px → 200rpx */
    background: #f3f4f6;
    color: #9ca3af;
    font-size: 22rpx; /* Phase1(src): TrainingView.tsx:13 — 11px → 22rpx */
  }
}
</style>
