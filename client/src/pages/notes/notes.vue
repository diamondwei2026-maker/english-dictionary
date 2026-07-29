<template>
  <!-- Ported from figma-prototype/NotesView.tsx — two-level navigation -->
  <view class="notes-page">
    <!-- ═══ Level 2: notes for a specific word ═══ -->
    <template v-if="selectedWordId !== null">
      <view class="notes-page__header">
        <view class="notes-page__back" @click="selectedWordId = null">
          <view class="css-arrow-left notes-page__back-icon" />
          <text>笔记列表</text>
        </view>
        <text class="notes-page__word-title">{{
          wordMap[selectedWordId] || selectedWordId
        }}</text>
      </view>

      <view class="notes-page__body">
        <view class="notes-page__note-list">
          <view
            v-for="note in currentWordNotes"
            :key="note.id"
            class="notes-page__note-card"
          >
            <view class="notes-page__note-card-content">
              <text class="notes-page__note-text">{{ note.content }}</text>
              <text class="notes-page__note-date">{{ note.createdAt }}</text>
            </view>
            <view
              class="notes-page__note-delete"
              @click="handleDeleteNote(note.id)"
            >
              <image src="\static\images\ashbin.png" mode="scaleToFill" />
            </view>
          </view>
        </view>

        <view class="notes-page__detail-btn" @click="goWordDetail">
          <text>查看单词详情</text>
        </view>
      </view>
    </template>

    <!-- ═══ Level 1: word list ═══ -->
    <template v-else>
      <view class="notes-page__header">
        <view class="notes-page__back" @click="goBack">
          <view class="css-arrow-left notes-page__back-icon" />
          <text>返回</text>
        </view>
        <text class="notes-page__subtitle">我的</text>
        <text class="notes-page__title">我的笔记</text>
      </view>

      <view class="notes-page__body">
        <!-- Loading -->
        <view v-if="loading" class="notes-page__loading">
          <text>加载中...</text>
        </view>

        <!-- Empty state -->
        <view v-else-if="noteWordIds.length === 0" class="notes-page__empty">
          <text class="iconfont notes-page__empty-icon">&#xe00c;</text>
          <text class="notes-page__empty-text">还没有笔记</text>
          <text class="notes-page__empty-hint"
            >去单词详情页添加你的理解和记忆</text
          >
        </view>

        <!-- Word list -->
        <template v-else>
          <text class="notes-page__section-label"
            >共 {{ noteWordIds.length }} 个单词</text
          >
          <view class="notes-page__word-list">
            <view
              v-for="wordId in noteWordIds"
              :key="wordId"
              class="notes-page__word-card"
              @click="selectedWordId = wordId"
            >
              <text class="notes-page__word-card-name">{{
                wordMap[wordId] || wordId
              }}</text>
              <view class="notes-page__word-card-right">
                <text class="notes-page__word-card-count"
                  >{{ groupedNotes[wordId].length }} 条笔记</text
                >
                <view class="css-arrow notes-page__word-card-arrow" />
              </view>
            </view>
          </view>
        </template>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchMyNotes, deleteNote as apiDeleteNote, fetchWords } from "@/api";
import { TOAST } from "@/utils/helpers";
import type { Note } from "@/data/types";

const notes = ref<Note[]>([]);
const loading = ref(true);
const selectedWordId = ref<string | null>(null);

// 单词名查找表：wordId → word.word
const wordMap = ref<Record<string, string>>({});

async function loadData() {
  loading.value = true;
  try {
    const [noteList, wordResult] = await Promise.all([
      fetchMyNotes(),
      fetchWords({ pageSize: 500 }),
    ]);
    notes.value = noteList;
    // 构建 wordId → word 映射
    const map: Record<string, string> = {};
    wordResult.words.forEach((w) => {
      map[w.id] = w.word;
    });
    wordMap.value = map;
  } catch {
    uni.showToast({ title: TOAST.LOAD_FAILED, icon: "none" });
  }
  loading.value = false;
}

onShow(() => {
  // 每次进入页面刷新数据，但保留 selectedWordId 用于返回时恢复
  loadData();
});

// 按 wordId 分组
const groupedNotes = computed<Record<string, Note[]>>(() => {
  const acc: Record<string, Note[]> = {};
  notes.value.forEach((n) => {
    if (!acc[n.wordId]) acc[n.wordId] = [];
    acc[n.wordId].push(n);
  });
  return acc;
});

// 有笔记的单词 ID 列表
const noteWordIds = computed(() => Object.keys(groupedNotes.value));

// 当前选中单词的笔记
const currentWordNotes = computed(() => {
  if (!selectedWordId.value) return [];
  return groupedNotes.value[selectedWordId.value] || [];
});

async function handleDeleteNote(id: string) {
  try {
    await apiDeleteNote(id);
    notes.value = notes.value.filter((n) => n.id !== id);
    // 如果该单词笔记删完了，回到第一级
    if (
      selectedWordId.value &&
      groupedNotes.value[selectedWordId.value]?.length === 0
    ) {
      selectedWordId.value = null;
    }
  } catch (err: any) {
    uni.showToast({ title: err?.message || TOAST.DELETE_FAILED, icon: "none" });
  }
}

function goWordDetail() {
  if (selectedWordId.value) {
    uni.navigateTo({
      url: `/pages/word-detail/word-detail?wordId=${selectedWordId.value}`,
    });
  }
}

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.notes-page {
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
    background: none;
    border: none;
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

  &__word-title {
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

  /* ── Empty state ── */
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 160rpx 0;

    &-icon {
      font-size: 80rpx;
      color: #e5e7eb;
      margin-bottom: 32rpx;
    }

    &-text {
      font-size: 30rpx;
      color: #9cafc6;
      margin: 0 0 12rpx;
    }

    &-hint {
      font-size: 26rpx;
      color: #d1d5db;
      text-align: center;
      line-height: 1.6;
    }
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

  /* ── Word list (Level 1) ── */
  &__word-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  &__word-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 36rpx 40rpx;
    background: #fff;
    border-radius: 40rpx;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.05);
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */

    &-name {
      font-size: 34rpx;
      font-weight: 700;
      color: #111827;
    }

    &-right {
      display: flex;
      align-items: center;
      gap: 20rpx;
    }

    &-count {
      font-size: 24rpx;
      color: #2563eb;
      background: #eff6ff;
      padding: 6rpx 20rpx;
      border-radius: 40rpx;
      font-weight: 500;
    }

    &-arrow {
      color: #a0a0a0;
      flex-shrink: 0;
    }
  }

  /* ── Note list (Level 2) ── */
  &__note-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin-bottom: 40rpx;
  }

  &__note-card {
    display: flex;
    gap: 24rpx;
    align-items: center;
    padding: 32rpx 36rpx;
    background: #fff;
    border-radius: 32rpx;
    border-left: 6rpx solid #2563eb;
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);
  }

  &__note-card-content {
    flex: 1;
    min-width: 0;
  }

  &__note-text {
    display: block;
    font-size: 28rpx;
    color: #374151;
    margin: 0 0 12rpx;
    line-height: 1.7;
  }

  &__note-date {
    display: block;
    font-size: 22rpx;
    color: #cbd5e1;
  }

  &__note-delete {
    flex-shrink: 0;
    background: #fef2f2;
    border: none;
    border-radius: 16rpx;
    color: #dc2626;
    padding: 12rpx;
    display: flex;
    align-items: center;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */

    image {
      width: 36rpx;
      height: 36rpx;
    }
  }

  /* ── Detail button (Level 2) ── */
  &__detail-btn {
    width: 100%;
    padding: 30rpx;
    border-radius: 32rpx;
    background: #eff6ff;
    color: #2563eb;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }
}
</style>
