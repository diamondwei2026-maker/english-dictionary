<template>
  <!-- Ported from figma-prototype/LibrariesView.tsx — LibraryWordsView (lines 102-189) -->
  <view class="library-words-page">
    <view class="library-words-page__header">
      <view class="library-words-page__back" @click="goBack">
        <view class="css-arrow-left library-words-page__back-icon" />
        <text>词库列表</text>
      </view>
      <text class="library-words-page__title">{{ library?.name || '加载中...' }}</text>
      <text class="library-words-page__count">{{ words.length }} 个单词</text>
    </view>

    <view class="library-words-page__content">
      <view v-if="loading" class="library-words-page__loading">
        <text>加载中...</text>
      </view>
      <EmptyState
        v-else-if="words.length === 0"
        message="该词库暂无单词"
      />
      <view v-else class="library-words-page__list">
        <WordCard
          v-for="word in words"
          :key="word.id"
          :word="word"
          variant="compact"
          @click="goWordDetail(word.id)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchWordsByWordbank, fetchWordbankById } from '@/api';
import type { Word, WordLibrary } from '@/data/types';
import WordCard from '@/components/WordCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const libraryId = ref('');
const words = ref<Word[]>([]);
const library = ref<WordLibrary | null>(null);
const loading = ref(true);

onLoad(async (options: any) => {
  libraryId.value = options?.libraryId || '';
  try {
    const [libResult, wordResult] = await Promise.all([
      fetchWordbankById(libraryId.value),
      fetchWordsByWordbank(libraryId.value, { pageSize: 200 }),
    ]);
    library.value = libResult;
    words.value = wordResult.words;
  } catch {
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' });
  }
  loading.value = false;
});

function goBack() {
  uni.navigateBack();
}

function goWordDetail(wordId: string) {
  uni.navigateTo({ url: `/pages/word-detail/word-detail?wordId=${wordId}` });
}
</script>

<style scoped lang="scss">
.library-words-page {
  min-height: 100vh;
  background: #F7F9FC;

  &__header {
    padding: 104rpx 48rpx 40rpx;   /* Phase1(src): LibraryWordsView — 52px 24px 20px → rpx×2 */
    background: rgba(255, 255, 255, 0.9);
    /* #ifdef H5 */
    backdrop-filter: blur(32rpx);
    -webkit-backdrop-filter: blur(32rpx);
    /* #endif */
  }

  &__back {
    display: flex;
    align-items: center;
    gap: 12rpx;
    color: #6B7280;
    font-size: 28rpx;
    margin-bottom: 24rpx;
    padding: 0;
  }

  &__back-icon {
    flex-shrink: 0;
  }

  &__title {
    display: block;
    font-size: 44rpx;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8rpx;
  }

  &__count {
    font-size: 26rpx;
    color: #9CA3AF;
  }

  &__content {
    padding: 32rpx 48rpx;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 80rpx 0;
    font-size: 28rpx;
    color: #9CA3AF;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }
}
</style>
