<template>
  <!-- Ported from figma-prototype/WordDetailView.tsx -->
  <view v-if="word" class="word-detail-page">
    <!-- Top sticky bar -->
    <view class="word-detail-page__topbar">
      <view class="word-detail-page__topbar-left" @click="goBack">
        <text class="iconfont word-detail-page__back-icon">&#xe003;</text>
        <text class="word-detail-page__back-label">返回</text>
      </view>
      <text v-if="libraryName" class="word-detail-page__library-badge">{{ libraryName }}</text>
    </view>

    <view class="word-detail-page__body">
      <!-- Word heading -->
      <view class="word-detail-page__heading">
        <text class="word-detail-page__word">{{ word.word }}</text>
        <text class="word-detail-page__phonetic">{{ word.phonetic }}</text>
      </view>

      <!-- Physical image -->
      <view class="word-detail-page__section">
        <SectionLabel>物理意象</SectionLabel>
        <view class="word-detail-page__image-wrap">
          <PhysicalImage :type="word.coreImageType" />
        </view>
      </view>

      <!-- Core meaning -->
      <view class="word-detail-page__card">
        <SectionLabel>核心义</SectionLabel>
        <text class="word-detail-page__core-text">{{ word.coreMeaning }}</text>
        <view class="word-detail-page__example-box">
          <text class="word-detail-page__example-sentence">{{ word.coreExampleSentence }}</text>
          <text class="word-detail-page__example-translation">{{ word.coreExampleTranslation }}</text>
        </view>
      </view>

      <!-- Extended meanings -->
      <view class="word-detail-page__section">
        <SectionLabel>引申义演化</SectionLabel>
        <view class="word-detail-page__ext-list">
          <view
            v-for="(ext, index) in word.extendedMeanings"
            :key="ext.id"
            class="word-detail-page__ext-card"
          >
            <!-- Evolution logic -->
            <view class="word-detail-page__ext-logic">
              <text class="word-detail-page__ext-logic-text">
                <text class="word-detail-page__ext-logic-num">{{ index + 1 }}.</text>
                {{ ext.logicalEvolution }}
              </text>
            </view>

            <!-- Evolution arrow -->
            <view class="word-detail-page__ext-arrow">
              <view class="word-detail-page__ext-arrow-line" />
              <text class="iconfont">&#xe002;</text>
            </view>

            <!-- Meaning -->
            <view class="word-detail-page__ext-meaning-row">
              <text class="word-detail-page__ext-meaning">{{ ext.meaning }}</text>
              <text
                class="word-detail-page__ext-pos"
                :style="getPosStyle(ext.partOfSpeech)"
              >{{ ext.partOfSpeech }}</text>
            </view>

            <!-- Example -->
            <view class="word-detail-page__ext-example">
              <text class="word-detail-page__ext-example-sentence">{{ ext.exampleSentence }}</text>
              <text class="word-detail-page__ext-example-translation">{{ ext.exampleTranslation }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Collocations -->
      <view class="word-detail-page__card">
        <SectionLabel>常见搭配</SectionLabel>
        <view class="word-detail-page__coll-list">
          <text
            v-for="(col, i) in word.collocations"
            :key="i"
            class="word-detail-page__coll-tag"
          >{{ col }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- Loading -->
  <view v-else-if="loading" class="word-detail-page__loading">
    <text>加载中...</text>
  </view>

  <!-- Word not found -->
  <view v-else class="word-detail-page__not-found">
    <text>单词不存在</text>
    <view class="word-detail-page__not-found-btn" @click="goBack">返回</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchWordDetail, fetchWordbankById } from '@/api';
import { getPosColor } from '@/utils/helpers';
import type { Word, WordDetail } from '@/api';
import SectionLabel from '@/components/SectionLabel.vue';
import PhysicalImage from '@/components/PhysicalImage.vue';

const wordId = ref('');
const word = ref<Word | WordDetail | null>(null);
const libraryName = ref('');
const loading = ref(true);

onLoad(async (options: any) => {
  wordId.value = options?.wordId || '';
  try {
    const detail = await fetchWordDetail(wordId.value);
    word.value = detail;
    // 查找词库名
    try {
      const lib = await fetchWordbankById(detail.libraryId);
      libraryName.value = lib?.name || '';
    } catch {
      libraryName.value = '';
    }
  } catch {
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' });
  }
  loading.value = false;
});

function getPosStyle(pos: string) {
  const c = getPosColor(pos);
  return { background: c.bg, color: c.text };
}

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.word-detail-page {
  min-height: 100vh;
  background: #F7F9FC;

  /* ── Top bar ── */
  &__topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 104rpx 40rpx 32rpx;
    background: rgba(247, 249, 252, 0.92);
    /* #ifdef H5 */
    backdrop-filter: blur(32rpx);
    -webkit-backdrop-filter: blur(32rpx);
    /* #endif */

    &-left {
      display: flex;
      align-items: center;
      gap: 12rpx;
      color: #6B7280;
      padding: 12rpx 0;
    }

    &-back-icon {
      font-size: 36rpx;
    }

    &-back-label {
      font-size: 28rpx;
    }
  }

  &__library-badge {
    font-size: 22rpx;
    color: #2563EB;
    background: #EFF6FF;
    padding: 8rpx 24rpx;
    border-radius: 40rpx;
    letter-spacing: 0.6rpx;
  }

  /* ── Body ── */
  &__body {
    padding: 16rpx 48rpx 80rpx;
  }

  /* ── Word heading ── */
  &__heading {
    margin-bottom: 48rpx;
  }

  &__word {
    display: block;
    font-size: 84rpx;
    font-weight: 800;
    color: #111827;
    margin: 0 0 8rpx;
    letter-spacing: -2rpx;
    line-height: 1.1;
  }

  &__phonetic {
    display: block;
    font-size: 32rpx;
    color: #9CA3AF;
    letter-spacing: 1rpx;
  }

  /* ── Sections ── */
  &__section {
    margin-bottom: 32rpx;
  }

  &__image-wrap {
    border-radius: 48rpx;
    overflow: hidden;
    box-shadow: 0 8rpx 48rpx rgba(0, 0, 0, 0.07);
  }

  /* ── Card ── */
  &__card {
    background: #fff;
    border-radius: 48rpx;
    padding: 48rpx;
    margin-bottom: 32rpx;
    box-shadow: 0 4rpx 40rpx rgba(0, 0, 0, 0.05);
  }

  &__core-text {
    font-size: 32rpx;
    color: #111827;
    line-height: 1.7;
    margin: 0 0 40rpx;
    font-weight: 500;
    display: block;
  }

  &__example-box {
    padding: 32rpx 36rpx;
    background: #F8FAFC;
    border-radius: 28rpx;
    border-left: 6rpx solid #2563EB;
  }

  &__example-sentence {
    display: block;
    font-size: 30rpx;
    color: #1D4ED8;
    margin: 0 0 12rpx;
    font-style: italic;
    line-height: 1.6;
  }

  &__example-translation {
    display: block;
    font-size: 26rpx;
    color: #6B7280;
    margin: 0;
    line-height: 1.6;
  }

  /* ── Extended meanings ── */
  &__ext-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }

  &__ext-card {
    background: #fff;
    border-radius: 40rpx;
    padding: 40rpx;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.04);
  }

  &__ext-logic {
    padding: 20rpx 28rpx;
    background: #F8FAFC;
    border-radius: 20rpx;
    margin-bottom: 28rpx;

    &-text {
      font-size: 24rpx;
      color: #6B7280;
      line-height: 1.6;
    }

    &-num {
      color: #9CA3AF;
      margin-right: 12rpx;
    }
  }

  &__ext-arrow {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin: 24rpx 0 20rpx;

    &-line {
      height: 2rpx;
      flex: 1;
      background: linear-gradient(to right, #E5E7EB, #2563EB);
    }
    .iconfont {
      font-size: 28rpx;
      color: #2563EB;
    }
  }

  &__ext-meaning-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24rpx;
    margin-bottom: 28rpx;
  }

  &__ext-meaning {
    font-size: 32rpx;
    font-weight: 600;
    color: #111827;
    line-height: 1.5;
    flex: 1;
  }

  &__ext-pos {
    flex-shrink: 0;
    font-size: 22rpx;
    padding: 6rpx 20rpx;
    border-radius: 40rpx;
    font-weight: 500;
  }

  &__ext-example {
    padding: 28rpx 32rpx;
    background: #F8FAFC;
    border-radius: 24rpx;
    border-left: 6rpx solid #10B981;

    &-sentence {
      display: block;
      font-size: 28rpx;
      color: #065F46;
      margin: 0 0 12rpx;
      font-style: italic;
      line-height: 1.6;
    }

    &-translation {
      display: block;
      font-size: 26rpx;
      color: #6B7280;
      margin: 0;
      line-height: 1.6;
    }
  }

  /* ── Collocations ── */
  &__coll-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  &__coll-tag {
    padding: 16rpx 28rpx;
    background: #F1F5F9;
    border-radius: 24rpx;
    font-size: 28rpx;
    color: #374151;
    font-style: italic;
    line-height: 1;
  }

  /* ── Loading ── */
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 28rpx;
    color: #9CA3AF;
  }

  /* ── Not found ── */
  &__not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #6B7280;

    &-btn {
      margin-top: 24rpx;
      color: #2563EB;
    }
  }
}
</style>
