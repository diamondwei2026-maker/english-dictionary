<template>
  <!-- Ported from figma-prototype/HomeView.tsx -->
  <view class="home-page">
    <!-- Header with search -->
    <view class="home-page__header">
      <view class="home-page__header-titles">
        <text class="home-page__subtitle">认知英语词典</text>
        <text class="home-page__title">用物理意象\n读懂英语</text>
      </view>
      <SearchBar
        v-model="query"
        placeholder="输入英文单词..."
        :clearable="true"
      />
    </view>

    <!-- Search results -->
    <view v-if="query.trim()" class="home-page__results">
      <EmptyState
        v-if="results.length === 0"
        message="未找到相关单词"
        hint="可在管理后台添加新词汇"
      />
      <view v-else class="home-page__results-list">
        <WordCard
          v-for="word in results"
          :key="word.id"
          :word="word"
          :library-name="getLibraryById(word.libraryId)?.name"
          :show-library="true"
          variant="compact"
          @click="goWordDetail(word.id)"
        />
      </view>
    </view>

    <!-- Default content -->
    <view v-if="!query.trim()" class="home-page__content">
      <!-- Loading state -->
      <view v-if="loading" class="home-page__loading">
        <text>加载中...</text>
      </view>

      <template v-else>
        <!-- Today's word -->
        <view v-if="todayWord" class="home-page__today">
          <view class="home-page__today-label">
            <text class="home-page__today-label-text">今日一词</text>
          </view>
          <view
            class="home-page__today-card"
            @click="goWordDetail(todayWord.id)"
          >
            <text class="home-page__today-card-label">核心物理意象</text>
            <text class="home-page__today-card-word">{{ todayWord.word }}</text>
            <text class="home-page__today-card-phonetic">{{
              todayWord.phonetic
            }}</text>
            <text class="home-page__today-card-meaning">{{
              todayWord.coreMeaning
            }}</text>
            <view class="home-page__today-card-link">
              <text>查看完整解析</text>
              <view class="css-arrow home-page__today-card-arrow" />
            </view>
          </view>
        </view>

        <!-- All words list -->
        <view class="home-page__all-words">
          <view class="home-page__all-words-head">
            <text class="home-page__all-words-head-label">全部词汇</text>
            <text class="home-page__all-words-head-count"
              >{{ allWords.length }} 个</text
            >
          </view>
          <view class="home-page__all-words-list">
            <WordCard
              v-for="word in allWords"
              :key="word.id"
              :word="word"
              :library-name="''"
              :show-library="true"
              variant="default"
              @click="goWordDetail(word.id)"
            />
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { filterWords } from "@/utils/helpers";
import { fetchWords, fetchDailyWord } from "@/api";
import type { Word } from "@/data/types";
import SearchBar from "@/components/SearchBar.vue";
import WordCard from "@/components/WordCard.vue";
import EmptyState from "@/components/EmptyState.vue";

const query = ref("");
const allWords = ref<Word[]>([]);
const loading = ref(true);
const todayWord = ref<Word | null>(null);

onShow(async () => {
  // 并行加载单词列表和今日一词
  try {
    const [wordResult, dailyResult] = await Promise.all([
      fetchWords({ pageSize: 200 }),
      fetchDailyWord(),
    ]);
    allWords.value = wordResult.words;
    if (dailyResult.word) {
      todayWord.value = dailyResult.word;
    }
  } catch {
    uni.showToast({ title: "加载失败，请检查网络", icon: "none" });
  }
  loading.value = false;

  // 如果 daily-word 接口没有返回，回退到本地计算
  if (!todayWord.value && allWords.value.length > 0) {
    const dayIndex = Math.floor(Date.now() / 86400000) % allWords.value.length;
    todayWord.value = allWords.value[dayIndex];
  }
});

const results = computed(() => {
  const q = query.value.trim();
  if (!q) return [];
  // 优先本地过滤；用户在输入时可即时看到结果
  return filterWords(q, allWords.value);
});

function goWordDetail(wordId: string) {
  uni.navigateTo({ url: `/pages/word-detail/word-detail?wordId=${wordId}` });
}
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  padding-bottom: 180rpx;
  background: #f7f9fc; /* Phase1(src): HomeView.tsx:26 */

  &__header {
    padding: 112rpx 48rpx 48rpx; /* Phase1(src): HomeView.tsx:29-30 — 56px 24px 24px → rpx×2 */
    background: rgba(255, 255, 255, 0.9); /* Phase1(src): HomeView.tsx:30 */
    /* #ifdef H5 */
    backdrop-filter: blur(
      32rpx
    ); /* Phase1(src): HomeView.tsx:31 — 16px → 32rpx */
    -webkit-backdrop-filter: blur(32rpx);
    /* #endif */
  }

  &__header-titles {
    margin-bottom: 40rpx; /* Phase1(src): HomeView.tsx:35 — 20px → 40rpx */
  }

  &__subtitle {
    display: block;
    font-size: 24rpx; /* Phase1(src): HomeView.tsx:36 — 12px → 24rpx */
    color: #9ca3af;
    letter-spacing: 4rpx; /* 2px → 4rpx */
    text-transform: uppercase;
    margin-bottom: 12rpx; /* 6px → 12rpx */
  }

  &__title {
    display: block;
    font-size: 52rpx; /* Phase1(src): HomeView.tsx:39 — 26px → 52rpx */
    font-weight: 700;
    color: #111827;
    line-height: 1.3;
    margin: 0;
    white-space: pre-line; /* NC-12: \n in <text> */
  }

  &__results {
    padding: 32rpx 48rpx 0; /* Phase1(src): HomeView.tsx:85 — 16px 24px 0 → rpx×2 */
  }

  &__results-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx; /* Phase1(src): HomeView.tsx:92 — 10px → 20rpx */
  }

  &__content {
    padding: 40rpx 48rpx 0; /* Phase1(src): HomeView.tsx:130 — 20px 24px 0 → rpx×2 */
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 80rpx 0;
    font-size: 28rpx;
    color: #9ca3af;
  }

  /* ── Today's word ── */
  &__today {
    margin-bottom: 48rpx; /* Phase1(src): HomeView.tsx:132 — 24px → 48rpx */

    &-label {
      display: flex;
      align-items: center;
      gap: 16rpx; /* 8px → 16rpx */
      margin-bottom: 24rpx; /* 12px → 24rpx */
    }

    &-icon {
      font-size: 28rpx; /* Sparkles size 14 → 28rpx */
      color: #2563eb;
    }

    &-label-text {
      font-size: 24rpx; /* Phase1(src): HomeView.tsx:135 — 12px → 24rpx */
      font-weight: 600;
      color: #2563eb;
      letter-spacing: 3rpx; /* 1.5px → 3rpx */
      text-transform: uppercase;
    }

    &-card {
      width: 100%;
      background: linear-gradient(
        135deg,
        #1d4ed8 0%,
        #2563eb 50%,
        #3b82f6 100%
      ); /* Phase1(src): HomeView.tsx:143 */
      border-radius: 48rpx; /* 24px → 48rpx */
      padding: 56rpx 48rpx; /* Phase1(src): HomeView.tsx:145 — 28px 24px → rpx×2 */
      border: none;
      text-align: left;
      box-shadow: 0 16rpx 64rpx rgba(37, 99, 235, 0.25); /* Phase1(src): HomeView.tsx:149 — 0 8px 32px rgba(37,99,235,0.25) → rpx×2 */
      color: #fff;
      box-sizing: border-box;
    }

    &-card-label {
      display: block; /* NC-14: source <p> → <text> default inline, must restore block */
      font-size: 22rpx; /* Phase1(src): HomeView.tsx:153 — 11px → 22rpx */
      opacity: 0.7;
      letter-spacing: 4rpx; /* 2px → 4rpx */
      margin: 0 0 16rpx; /* 8px → 16rpx */
      text-transform: uppercase;
    }

    &-card-word {
      display: block; /* NC-14: source <h2> → <text> default inline, must restore block */
      font-size: 68rpx; /* Phase1(src): HomeView.tsx:156 — 34px → 68rpx */
      font-weight: 800;
      margin: 0 0 12rpx; /* 6px → 12rpx */
      letter-spacing: -1rpx; /* -0.5px → -1rpx */
    }

    &-card-phonetic {
      display: block; /* NC-14: source <p> → <text> default inline, must restore block */
      font-size: 28rpx; /* Phase1(src): HomeView.tsx:159 — 14px → 28rpx */
      opacity: 0.8;
      margin: 0 0 32rpx; /* 16px → 32rpx */
      font-style: italic;
    }

    &-card-meaning {
      display: block; /* NC-14: source <p> → <text> default inline, must restore block */
      font-size: 28rpx; /* Phase1(src): HomeView.tsx:162 — 14px → 28rpx */
      opacity: 0.9;
      line-height: 1.6;
      margin: 0;
    }

    &-card-link {
      display: flex;
      align-items: center;
      gap: 12rpx; /* 6px → 12rpx */
      margin-top: 40rpx; /* Phase1(src): HomeView.tsx:165 — 20px → 40rpx */
      font-size: 26rpx; /* 13px → 26rpx */
      opacity: 0.8;
    }

    &-card-arrow {
      --arrow-chevron: 12rpx;
      color: #fff;
    }
  }

  /* ── All words list ── */
  &__all-words {
    &-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24rpx; /* Phase1(src): HomeView.tsx:174 — 12px → 24rpx */
    }

    &-head-label {
      font-size: 24rpx; /* Phase1(src): HomeView.tsx:175 — 12px → 24rpx */
      font-weight: 600;
      color: #9ca3af;
      letter-spacing: 3rpx; /* 1.5px → 3rpx */
      text-transform: uppercase;
    }

    &-head-count {
      font-size: 26rpx; /* 13px → 26rpx */
      color: #9ca3af;
    }

    &-list {
      display: flex;
      flex-direction: column;
      gap: 20rpx; /* Phase1(src): HomeView.tsx:180 — 10px → 20rpx */
    }
  }
}
</style>
