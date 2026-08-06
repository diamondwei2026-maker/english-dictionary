<template>
  <!-- Ported from figma/QuizView.tsx -->
  <view class="quiz-page">
    <!-- ========== 完成页 ========== -->
    <view v-if="done" class="quiz-page__done">
      <view class="quiz-page__back-btn" @click="goBack">
        <view class="css-arrow-left" />
        <text>返回</text>
      </view>

      <view class="quiz-page__done-card">
        <text class="quiz-page__done-kicker">本轮完成</text>
        <view class="quiz-page__done-score">
          <text class="quiz-page__done-correct">{{ correctCount }}</text>
          <text class="quiz-page__done-total"> / {{ items.length }}</text>
        </view>
        <text class="quiz-page__done-pct"
          >正确率 {{ Math.round((correctCount / items.length) * 100) }}%</text
        >
      </view>

      <!-- 逐题回顾 -->
      <view class="quiz-page__review-toggle" @click="showReview = !showReview">
        <text>逐题回顾</text>
        <view
          class="quiz-page__review-chevron"
          :class="{ 'quiz-page__review-chevron--open': showReview }"
        >
          <view class="css-arrow" style="--arrow-chevron: 18rpx; --arrow-stroke: 3rpx; color: #475569" />
        </view>
      </view>

      <view v-if="showReview" class="quiz-page__review-list">
        <view
          v-for="(answer, i) in answers"
          :key="i"
          class="quiz-page__review-item"
          :class="
            answer.correct
              ? 'quiz-page__review-item--correct'
              : 'quiz-page__review-item--wrong'
          "
        >
          <!-- Check / X icon -->
          <svg
            v-if="answer.correct"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg
            v-else
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <text>第 {{ i + 1 }} 题 · {{ answer.score }} 分</text>
        </view>
      </view>

      <view class="quiz-page__btn-primary" @click="reset">
        <!-- RotateCcw icon -->
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        <text>再来一组</text>
      </view>
    </view>

    <!-- ========== 答题中 ========== -->
    <template v-else>
      <!-- 顶栏 -->
      <view class="quiz-page__topbar">
        <view class="quiz-page__back-btn" @click="goBack">
          <view class="css-arrow-left" />
          <text>返回</text>
        </view>
        <text class="quiz-page__progress-label"
          >{{ index + 1 }} / {{ items.length }}</text
        >
      </view>

      <!-- 进度条 -->
      <view class="quiz-page__progress-bar">
        <view
          class="quiz-page__progress-fill"
          :style="{ width: ((index + 1) / items.length) * 100 + '%' }"
        />
      </view>

      <!-- 题卡 -->
      <view class="quiz-page__question-card">
        <text class="quiz-page__question-label">翻译成英语</text>
        <text class="quiz-page__question-prompt">{{ item.prompt }}</text>
        <text class="quiz-page__question-hint">{{ item.hint }}</text>
      </view>

      <!-- 输入框 -->
      <textarea
        :disabled="!!result"
        :value="input"
        @input="onInput"
        placeholder="输入你的英文表达…"
        class="quiz-page__textarea"
        :class="{ 'quiz-page__textarea--done': !!result }"
      />

      <!-- 判分反馈 -->
      <view
        v-if="result"
        class="quiz-page__feedback"
        :class="
          result.correct
            ? 'quiz-page__feedback--correct'
            : 'quiz-page__feedback--wrong'
        "
      >
        <view class="quiz-page__feedback-head">
          <!-- Check / X icon -->
          <svg
            v-if="result.correct"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <text>{{ result.correct ? '表达正确' : '再调整一下' }}</text>
        </view>
        <text class="quiz-page__feedback-text">{{ result.analysis }}</text>
      </view>

      <!-- 提交/下一题按钮 -->
      <view class="quiz-page__btn-primary" @click="submit">
        <text>{{
          result
            ? index === items.length - 1
              ? '查看结果'
              : '下一题'
            : '提交'
        }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { generateQuiz, judgeAnswer } from "@/data/quizEngine";
import type { QuizDirection, QuizItem, QuizResult } from "@/data/types";

const direction = ref<QuizDirection>("zh2en");
const wordId = ref<string | undefined>(undefined);

// ── State ──
const items = ref<QuizItem[]>([]);
const index = ref(0);
const input = ref("");
const result = ref<QuizResult | null>(null);
const answers = ref<QuizResult[]>([]);
const showReview = ref(false);

// ── Computed ──
const done = computed(() => answers.value.length === items.value.length && items.value.length > 0);
const item = computed(() => items.value[index.value]);
const correctCount = computed(() => answers.value.filter((a) => a.correct).length);

// ── Methods ──
function reset() {
  items.value = generateQuiz(direction.value, wordId.value);
  index.value = 0;
  input.value = "";
  result.value = null;
  answers.value = [];
  showReview.value = false;
}

function goBack() {
  uni.navigateBack();
}

function onInput(e: any) {
  input.value = e.detail.value;
}

function submit() {
  if (!result.value) {
    // 提交判分
    const judged = judgeAnswer(item.value, input.value, direction.value);
    result.value = judged;
  } else {
    // 下一题
    answers.value = [...answers.value, result.value];
    index.value = index.value + 1;
    input.value = "";
    result.value = null;
  }
}

onLoad((options: any) => {
  direction.value = (options?.direction as QuizDirection) || "zh2en";
  wordId.value = options?.wordId || undefined;
  items.value = generateQuiz(direction.value, wordId.value);
});
</script>

<style scoped lang="scss">
.quiz-page {
  min-height: 100vh;
  padding: 96rpx 48rpx 224rpx; /* Phase1(src): QuizView.tsx:12 — 48px 24px 112px → rpx×2 */
  background: #f7f9fc;

  /* ── Back button ── */
  &__back-btn {
    display: inline-flex;
    align-items: center;
    gap: 12rpx; /* Phase1(src): QuizView.tsx:14 — 6px → 12rpx */
    border: 0;
    background: transparent;
    color: #6b7280;
    padding: 0;
    font-size: 28rpx; /* Phase1(src): QuizView.tsx:14 — 14px → 28rpx */
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  /* ── Top bar ── */
  &__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__progress-label {
    font-size: 26rpx; /* Phase1(src): QuizView.tsx:12 — 13px → 26rpx */
    color: #6b7280;
  }

  /* ── Progress bar ── */
  &__progress-bar {
    height: 8rpx; /* Phase1(src): QuizView.tsx:12 — 4px → 8rpx */
    background: #e8edf4;
    border-radius: 18rpx; /* Phase1(src): QuizView.tsx:12 — 9px → 18rpx */
    margin: 36rpx 0 56rpx; /* Phase1(src): QuizView.tsx:12 — 18px 0 28px → rpx×2 */
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: #2563eb;
    border-radius: 18rpx;
    transition: width 0.3s;
  }

  /* ── Question card ── */
  &__question-card {
    background: #fff;
    border-radius: 48rpx; /* Phase1(src): QuizView.tsx:12 — 24px → 48rpx */
    padding: 48rpx; /* Phase1(src): QuizView.tsx:12 — 24px → 48rpx */
    box-shadow: 0 16rpx 56rpx rgba(25, 49, 80, 0.06); /* Phase1(src): QuizView.tsx:12 — 0 8px 28px → rpx×2 */
  }

  &__question-label {
    display: block;
    margin: 0 0 28rpx; /* Phase1(src): QuizView.tsx:12 — 0 0 14px → rpx×2 */
    font-size: 22rpx; /* Phase1(src): QuizView.tsx:12 — 11px → 22rpx */
    font-weight: 700;
    color: #9ca3af;
    letter-spacing: 2.8rpx; /* Phase1(src): QuizView.tsx:12 — 1.4px → 2.8rpx */
  }

  &__question-prompt {
    display: block;
    margin: 0 0 44rpx; /* Phase1(src): QuizView.tsx:12 — 0 0 22px → rpx×2 */
    font-size: 46rpx; /* Phase1(src): QuizView.tsx:12 — 23px → 46rpx */
    line-height: 1.55;
    color: #111827;
    font-weight: 700;
  }

  &__question-hint {
    display: inline-block;
    padding: 12rpx 20rpx; /* Phase1(src): QuizView.tsx:12 — 6px 10px → rpx×2 */
    border-radius: 18rpx; /* Phase1(src): QuizView.tsx:12 — 9px → 18rpx */
    background: #f1f5f9;
    color: #64748b;
    font-size: 24rpx; /* Phase1(src): QuizView.tsx:12 — 12px → 24rpx */
  }

  /* ── Textarea ── */
  &__textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 260rpx; /* Phase1(src): QuizView.tsx:12 — 130px → 260rpx */
    margin-top: 32rpx; /* Phase1(src): QuizView.tsx:12 — 16px → 32rpx */
    border: 3rpx solid #dce3ec; /* Phase1(src): QuizView.tsx:12 — 1.5px → 3rpx */
    border-radius: 32rpx; /* Phase1(src): QuizView.tsx:12 — 16px → 32rpx */
    padding: 32rpx; /* Phase1(src): QuizView.tsx:12 — 16px → 32rpx */
    background: #fff;
    font-family: inherit;
    font-size: 32rpx; /* Phase1(src): QuizView.tsx:12 — 16px → 32rpx */
    line-height: 1.65;
    color: #111827;
    outline: none;
    resize: vertical;

    &--done {
      border-color: #e5e7eb;
      background: #f8fafc;
    }
  }

  /* ── Feedback card ── */
  &__feedback {
    margin-top: 32rpx; /* Phase1(src): QuizView.tsx:12 — 16px → 32rpx */
    border-radius: 36rpx; /* Phase1(src): QuizView.tsx:12 — 18px → 36rpx */
    padding: 36rpx; /* Phase1(src): QuizView.tsx:12 — 18px → 36rpx */
    animation: quiz-feedback-in 0.3s ease;

    &--correct {
      background: #f0fdf4;
      color: #166534;
    }

    &--wrong {
      background: #fff1f2;
      color: #9f1239;
    }
  }

  &__feedback-head {
    display: flex;
    gap: 18rpx; /* Phase1(src): QuizView.tsx:12 — 9px → 18rpx */
    align-items: center;
    font-size: 30rpx; /* Phase1(src): QuizView.tsx:12 — 15px → 30rpx */
    font-weight: 700;
  }

  &__feedback-text {
    display: block;
    margin: 22rpx 0 0; /* Phase1(src): QuizView.tsx:12 — 11px → 22rpx */
    font-size: 26rpx; /* Phase1(src): QuizView.tsx:12 — 13px → 26rpx */
    line-height: 1.7;
  }

  /* ── Primary button ── */
  &__btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx; /* Phase1(src): QuizView.tsx:15 — 8px → 16rpx */
    width: 100%;
    height: 104rpx; /* Phase1(src): QuizView.tsx:15 — 52px → 104rpx */
    margin-top: 40rpx; /* Phase1(src): QuizView.tsx:12 — 20px → 40rpx */
    border: 0;
    border-radius: 32rpx; /* Phase1(src): QuizView.tsx:15 — 16px → 32rpx */
    background: #2563eb;
    color: #fff;
    font-size: 30rpx; /* Phase1(src): QuizView.tsx:15 — 15px → 30rpx */
    font-weight: 650;
    box-shadow: 0 16rpx 36rpx rgba(37, 99, 235, 0.2); /* Phase1(src): QuizView.tsx:15 — 0 8px 18px → rpx×2 */
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  /* ── Done page ── */
  &__done {
    &-card {
      margin-top: 56rpx; /* Phase1(src): QuizView.tsx:10 — 28px → 56rpx */
      background: #fff;
      border-radius: 48rpx; /* Phase1(src): QuizView.tsx:10 — 24px → 48rpx */
      padding: 60rpx 48rpx; /* Phase1(src): QuizView.tsx:10 — 30px 24px → rpx×2 */
      box-shadow: 0 16rpx 56rpx rgba(25, 49, 80, 0.06);
      text-align: center;
    }

    &-kicker {
      display: block;
      margin: 0;
      color: #2563eb;
      font-size: 24rpx;
      font-weight: 700;
      letter-spacing: 3rpx;
    }

    &-score {
      margin: 28rpx 0 8rpx;
      font-size: 96rpx;
      font-weight: 760;
      color: #111827;
      letter-spacing: -2rpx;
    }

    &-correct {
      // inherits
    }

    &-total {
      font-size: 40rpx;
      color: #9ca3af;
      font-weight: 500;
    }

    &-pct {
      display: block;
      margin: 0;
      color: #6b7280;
      font-size: 28rpx;
    }
  }

  /* ── Review toggle ── */
  &__review-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 32rpx;
    background: #fff;
    border-radius: 36rpx;
    padding: 34rpx 36rpx;
    box-shadow: 0 6rpx 28rpx rgba(25, 49, 80, 0.04);
    font-size: 28rpx;
    color: #475569;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  &__review-chevron {
    display: inline-flex;
    transition: transform 0.2s;

    &--open {
      transform: rotate(180deg);
    }
  }

  /* ── Review list ── */
  &__review-list {
    margin-top: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  &__review-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 28rpx 32rpx;
    border-radius: 28rpx;
    font-size: 26rpx;

    &--correct {
      background: #f0fdf4;
      color: #166534;
    }

    &--wrong {
      background: #fff1f2;
      color: #9f1239;
    }
  }
}

/* ── Feedback card animation ── */
@keyframes quiz-feedback-in {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
