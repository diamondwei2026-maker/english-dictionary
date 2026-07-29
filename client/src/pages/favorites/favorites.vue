<template>
  <!-- Ported from figma-prototype/FavoritesView.tsx -->
  <view class="favorites-page">
    <!-- sticky header -->
    <view class="favorites-page__header">
      <view class="favorites-page__back" @click="goBack">
        <view class="css-arrow-left favorites-page__back-icon" />
        <text>返回</text>
      </view>
      <text class="favorites-page__subtitle">我的</text>
      <text class="favorites-page__title">我的收藏</text>
    </view>

    <view class="favorites-page__body">
      <!-- Loading -->
      <view v-if="loading" class="favorites-page__loading">
        <text>加载中...</text>
      </view>

      <!-- Empty state — uses shared EmptyState component -->
      <EmptyState
        v-else-if="words.length === 0"
        message="还没有收藏单词"
        hint="在单词详情页点击收藏按钮，保存需要复习的单词"
      >
        <template #icon>
          <BookmarkIcon :size="40" :stroke-width="1.5" stroke-color="#E5E7EB" />
        </template>
      </EmptyState>

      <!-- Word list — uses shared WordCard component -->
      <template v-else>
        <text class="favorites-page__section-label"
          >共 {{ words.length }} 个单词</text
        >
        <view class="favorites-page__list">
          <WordCard
            v-for="word in words"
            :key="word.id"
            :word="word"
            variant="compact"
            @click="goWordDetail(word.id)"
          >
            <template #actions>
              <view
                class="favorites-page__unfav"
                @click.stop="handleUnfavorite(word.id)"
              >
                <BookmarkIcon :size="16" filled filled-color="#2563EB" />
              </view>
            </template>
          </WordCard>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchFavorites, unfavoriteWord } from "@/api";
import { TOAST } from "@/utils/helpers";
import type { Word } from "@/data/types";
import WordCard from "@/components/WordCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import BookmarkIcon from "@/components/icons/BookmarkIcon.vue";

const words = ref<Word[]>([]);
const loading = ref(true);

onShow(async () => {
  await loadFavorites();
});

async function loadFavorites() {
  loading.value = true;
  try {
    const result = await fetchFavorites({ pageSize: 200 });
    words.value = result.data;
  } catch {
    uni.showToast({ title: TOAST.LOAD_FAILED, icon: "none" });
  }
  loading.value = false;
}

async function handleUnfavorite(wordId: string) {
  try {
    await unfavoriteWord(wordId);
    words.value = words.value.filter((w) => w.id !== wordId);
  } catch {
    uni.showToast({ title: TOAST.OP_FAILED, icon: "none" });
  }
}

function goWordDetail(wordId: string) {
  uni.navigateTo({
    url: `/pages/word-detail/word-detail?wordId=${wordId}`,
  });
}

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.favorites-page {
  min-height: 100vh;
  background: #f7f9fc;

  /* ── Sticky header ── */
  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 104rpx 48rpx 32rpx;
    background: rgba(247, 249, 252, 0.94);
    /* #ifdef H5 */
    backdrop-filter: blur(32rpx);
    -webkit-backdrop-filter: blur(32rpx);
    /* #endif */
  }

  &__back {
    display: flex;
    align-items: center;
    gap: 12rpx;
    color: #6b7280;
    font-size: 28rpx;
    padding: 12rpx 0;
    margin-bottom: 24rpx;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  &__back-icon {
    flex-shrink: 0;
  }

  &__subtitle {
    display: block;
    font-size: 24rpx;
    color: #9cafc6;
    letter-spacing: 4rpx;
    text-transform: uppercase;
    margin: 0 0 8rpx;
  }

  &__title {
    display: block;
    font-size: 52rpx;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  /* ── Body ── */
  &__body {
    padding: 32rpx 48rpx 80rpx;
  }

  /* ── Loading ── */
  &__loading {
    display: flex;
    justify-content: center;
    padding: 80rpx 0;
    font-size: 28rpx;
    color: #9cafc6;
  }

  /* ── Section label ── */
  &__section-label {
    display: block;
    font-size: 22rpx;
    font-weight: 600;
    color: #9cafc6;
    letter-spacing: 4rpx;
    text-transform: uppercase;
    margin: 0 0 24rpx;
  }

  /* ── Word list ── */
  &__list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  /* ── Unfavorite button (inside WordCard #actions slot) ── */
  &__unfav {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20rpx;
    border: none;
    background: #eff6ff;
    flex-shrink: 0;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }
}
</style>
