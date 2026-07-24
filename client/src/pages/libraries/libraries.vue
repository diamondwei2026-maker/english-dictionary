<template>
  <!-- Ported from figma-prototype/LibrariesView.tsx -->
  <view class="libraries-page">
    <view class="libraries-page__header">
      <text class="libraries-page__subtitle">词库</text>
      <text class="libraries-page__title">选择词库</text>
    </view>

    <view class="libraries-page__list">
      <view
        v-for="(lib, index) in libraries"
        :key="lib.id"
        class="libraries-page__card"
        :class="`libraries-page__card--${index % 4}`"
        @click="goLibraryWords(lib.id)"
      >
        <view class="libraries-page__card-top">
          <!-- <view class="libraries-page__card-icon-wrap">
            <text class="iconfont libraries-page__card-icon">{{
              lib.name[0]
            }}</text>
          </view> -->
          <text class="libraries-page__card-name">{{ lib.name }}</text>
        </view>
        <text class="libraries-page__card-desc">{{ lib.description }}</text>
        <view class="libraries-page__card-bottom">
          <view class="libraries-page__card-stats">
            <text class="libraries-page__card-count"
              >{{ lib.wordCount }} 个单词</text
            >
            <text
              v-if="lib.wordCount > 0"
              class="libraries-page__card-recorded"
            >
              已收录 {{ lib.wordCount }} 个
            </text>
          </view>
          <view class="css-arrow libraries-page__card-arrow" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchWordbanks } from "@/api";
import type { WordLibrary } from "@/data/types";

const libraries = ref<WordLibrary[]>([]);
const loading = ref(true);

onShow(async () => {
  try {
    const result = await fetchWordbanks({ pageSize: 50 });
    libraries.value = result.libraries;
  } catch {
    uni.showToast({ title: "加载失败，请检查网络", icon: "none" });
  }
  loading.value = false;
});

function goLibraryWords(libId: string) {
  uni.navigateTo({
    url: `/pages/library-words/library-words?libraryId=${libId}`,
  });
}
</script>

<style scoped lang="scss">
.libraries-page {
  min-height: 100vh;
  padding-bottom: 132rpx;
  background: #f7f9fc;

  &__header {
    padding: 104rpx 48rpx 40rpx; /* Phase1(src): LibrariesView.tsx:20-21 — 52px 24px 20px → rpx×2 */
    background: rgba(
      255,
      255,
      255,
      0.9
    ); /* Phase1(src): LibrariesView.tsx:22 */
    /* #ifdef H5 */
    backdrop-filter: blur(
      32rpx
    ); /* Phase1(src): LibrariesView.tsx:23 — 16px → 32rpx */
    -webkit-backdrop-filter: blur(32rpx);
    /* #endif */
  }

  &__subtitle {
    display: block;
    font-size: 24rpx; /* Phase1(src): LibrariesView.tsx:26 — 12px → 24rpx */
    color: #9ca3af;
    letter-spacing: 4rpx; /* 2px → 4rpx */
    text-transform: uppercase;
    margin-bottom: 12rpx; /* 6px → 12rpx */
  }

  &__title {
    display: block;
    font-size: 52rpx; /* Phase1(src): LibrariesView.tsx:29 — 26px → 52rpx */
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  &__list {
    padding: 40rpx 48rpx; /* Phase1(src): LibrariesView.tsx:34 — 20px 24px → rpx×2 */
    display: flex;
    flex-direction: column;
    gap: 28rpx; /* Phase1(src): LibrariesView.tsx:35 — 14px → 28rpx */
  }

  &__card {
    border-radius: 48rpx; /* Phase1(src): LibrariesView.tsx:47 — 24px → 48rpx */
    padding: 48rpx; /* Phase1(src): LibrariesView.tsx:48 — 24px → 48rpx */
    text-align: left;
    width: 100%;
    box-sizing: border-box;
    border: 2rpx solid;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.04); /* Phase1(src): LibrariesView.tsx:52 — 0 2px 16px rgba(0,0,0,0.04) → rpx×2 */

    // Per-card accent colors (source: LibrariesView.tsx:10-14 libraryColors[].accent)
    $accent-0: #2563eb;
    $accent-1: #16a34a;
    $accent-2: #d97706;
    $accent-3: #7c3aed;

    &--0 {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border-color: #bfdbfe;
      .libraries-page__card-count {
        color: $accent-0;
      }
      .libraries-page__card-icon {
        color: $accent-0;
      }
      .libraries-page__card-arrow {
        color: $accent-0;
      }
    }
    &--1 {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-color: #bbf7d0;
      .libraries-page__card-count {
        color: $accent-1;
      }
      .libraries-page__card-icon {
        color: $accent-1;
      }
      .libraries-page__card-arrow {
        color: $accent-1;
      }
    }
    &--2 {
      background: linear-gradient(135deg, #fff7ed, #fed7aa);
      border-color: #fde68a;
      .libraries-page__card-count {
        color: $accent-2;
      }
      .libraries-page__card-icon {
        color: $accent-2;
      }
      .libraries-page__card-arrow {
        color: $accent-2;
      }
    }
    &--3 {
      background: linear-gradient(135deg, #faf5ff, #ede9fe);
      border-color: #ddd6fe;
      .libraries-page__card-count {
        color: $accent-3;
      }
      .libraries-page__card-icon {
        color: $accent-3;
      }
      .libraries-page__card-arrow {
        color: $accent-3;
      }
    }

    &-top {
      display: flex;
      align-items: center;
      gap: 20rpx; /* 10px → 20rpx */
      margin-bottom: 20rpx; /* 10px → 20rpx */
    }

    &-icon-wrap {
      width: 72rpx; /* 36px → 72rpx */
      height: 72rpx;
      border-radius: 20rpx; /* 10px → 20rpx */
      background: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &-icon {
      font-size: 36rpx; /* BookOpen size 18 → 36rpx */
    }

    &-name {
      font-size: 34rpx; /* 17px → 34rpx */
      font-weight: 700;
      color: #111827;
    }

    &-desc {
      font-size: 26rpx; /* Phase1(src): LibrariesView.tsx:73 — 13px → 26rpx */
      color: #6b7280;
      margin: 0 0 32rpx; /* 16px → 32rpx */
      line-height: 1.6;
      display: block;
    }

    &-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &-stats {
      display: flex;
      gap: 32rpx; /* 16px → 32rpx */
    }

    &-count {
      font-size: 24rpx; /* 12px → 24rpx */
      font-weight: 600;
    }

    &-recorded {
      font-size: 24rpx; /* 12px → 24rpx */
      color: #9ca3af;
    }

    &-arrow {
      --arrow-chevron: 12rpx;
      // color 继承自 --0/--1/--2/--3 变体，与 card-count 同色
    }
  }
}
</style>
