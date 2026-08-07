<template>
  <!-- Ported from figma-prototype AdminView.tsx:224-326 — LibraryManager sub-module -->
  <view class="admin-libs">
    <!-- 添加单词到词库子视图（全库搜索） — AdminView.tsx:251-337 -->
    <template v-if="addingToLibId !== null">
      <PageHeader
        :title="'添加单词'"
        show-back
        :back-label="addingLib?.name || ''"
        bg-type="admin"
        :padding-top="104"
        @back="cancelAddingToLib"
      />
      <view class="admin-libs__body">
        <view class="admin-libs__search-wrap">
          <input
            v-model="wordSearch"
            class="admin-libs__search-input"
            :class="{ 'admin-libs__input--focused': searchFocused.focused.value }"
            placeholder="搜索单词名称或核心义..."
            @focus="searchFocused.onFocus"
            @blur="searchFocused.onBlur"
          />
        </view>
        <template v-if="!wordSearch.trim()">
          <view class="admin-libs__empty-hint">
            <text class="admin-libs__empty-hint-text">输入关键词搜索全库单词</text>
          </view>
        </template>
        <template v-else-if="addingSearchResults.length === 0">
          <EmptyState message="未找到匹配的单词" />
        </template>
        <template v-else>
          <SectionLabel>找到 {{ addingSearchResults.length }} 个单词</SectionLabel>
          <view class="admin-libs__word-list">
            <view v-for="word in addingSearchResults" :key="word.id" class="admin-libs__word-card">
              <view class="admin-libs__word-info">
                <view class="admin-libs__word-head">
                  <text class="admin-libs__word-name">{{ word.word }}</text>
                  <text class="admin-libs__word-phonetic">{{ word.phonetic }}</text>
                </view>
                <text class="admin-libs__word-meaning">{{ word.coreMeaning }}</text>
              </view>
              <view v-if="addingLib?.wordIds?.includes(word.id)" class="admin-libs__word-added">
                <text>已收录</text>
              </view>
              <view v-else class="admin-libs__word-add-btn" @click="handleAddWordToLib(word.id)">
                <text>+ 添加</text>
              </view>
            </view>
          </view>
        </template>
      </view>
    </template>

    <!-- 词库详情子视图（已收录单词列表） — AdminView.tsx:339-438 -->
    <template v-if="managingLibId !== null && addingToLibId === null">
      <PageHeader
        :title="managingLib?.name || ''"
        show-back
        back-label="词库列表"
        bg-type="admin"
        :padding-top="104"
        :subtitle="'已收录 ' + (managingLib?.wordIds?.length || 0) + ' 个单词'"
        @back="cancelManagingLib"
      >
        <template #right>
          <view class="admin-libs__add-btn" @click="openAddingToLib(managingLib!.id)">
            <text class="admin-libs__add-btn-icon">+</text>
            <text>添加单词</text>
          </view>
        </template>
      </PageHeader>
      <view class="admin-libs__body">
        <template v-if="managingAddedWords.length > 0">
          <view class="admin-libs__search-wrap">
            <input
              v-model="wordSearch"
              class="admin-libs__search-input"
              :class="{ 'admin-libs__input--focused': searchFocused.focused.value }"
              placeholder="搜索已收录单词..."
              @focus="searchFocused.onFocus"
              @blur="searchFocused.onBlur"
            />
          </view>
        </template>
        <SectionLabel>
          <template v-if="wordSearch.trim()">搜索结果 {{ managingDisplayedWords.length }} 个</template>
          <template v-else>已收录 {{ managingAddedWords.length }} 个</template>
        </SectionLabel>
        <template v-if="managingAddedWords.length === 0">
          <view class="admin-libs__empty-manage">
            <text class="admin-libs__empty-manage-text">暂无收录单词</text>
            <PrimaryButton @click="openAddingToLib(managingLib!.id)">+ 添加单词</PrimaryButton>
          </view>
        </template>
        <template v-else-if="managingDisplayedWords.length === 0">
          <EmptyState message="未找到匹配的单词" />
        </template>
        <template v-else>
          <view class="admin-libs__word-list">
            <view v-for="word in managingDisplayedWords" :key="word.id" class="admin-libs__word-card">
              <view class="admin-libs__word-info">
                <view class="admin-libs__word-head">
                  <text class="admin-libs__word-name">{{ word.word }}</text>
                  <text class="admin-libs__word-phonetic">{{ word.phonetic }}</text>
                </view>
                <text class="admin-libs__word-meaning">{{ word.coreMeaning }}</text>
              </view>
              <view class="admin-libs__word-remove-btn" @click="handleRemoveWordFromLib(word.id)">
                <text>移除</text>
              </view>
            </view>
          </view>
        </template>
      </view>
    </template>

    <!-- Edit form view -->
    <template v-if="editTarget !== null">
      <PageHeader
        :title="isNew ? '新增词库' : '编辑词库'"
        show-back
        back-label="词库列表"
        bg-type="admin"
        :padding-top="104"
        @back="cancelEdit"
      />
      <view class="admin-libs__form">
        <view class="admin-libs__field">
          <text class="admin-libs__label">词库名称</text>
          <input
            v-model="name"
            class="admin-libs__input"
            :class="{ 'admin-libs__input--focused': nameFocused.focused.value }"
            placeholder="输入词库名称"
            @focus="nameFocused.onFocus"
            @blur="nameFocused.onBlur"
          ></input>
        </view>
        <view class="admin-libs__field">
          <text class="admin-libs__label">词库描述</text>
          <textarea
            v-model="desc"
            class="admin-libs__textarea"
            :class="{ 'admin-libs__input--focused': descFocused.focused.value }"
            placeholder="简要描述该词库的内容和适用人群..."
            auto-height
            @focus="descFocused.onFocus"
            @blur="descFocused.onBlur"
          ></textarea>
        </view>
        <PrimaryButton :disabled="!name.trim() || saving" :loading="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存' }}
        </PrimaryButton>
        <PrimaryButton ghost @click="cancelEdit">取消</PrimaryButton>
      </view>
    </template>

    <!-- List view -->
    <template v-else>
      <PageHeader
        title="词库管理"
        show-back
        back-label="返回"
        bg-type="admin"
        :padding-top="104"
        @back="goBack"
      >
        <template #right>
          <view class="admin-libs__add-btn" @click="openNew">
            <text class="iconfont admin-libs__add-btn-icon">+</text>
            <text>新增</text>
          </view>
        </template>
      </PageHeader>

      <view class="admin-libs__body">
        <SectionLabel>共 {{ libraries.length }} 个词库</SectionLabel>
        <view v-if="loading" class="admin-libs__loading">
          <text>加载中...</text>
        </view>
        <EmptyState
          v-else-if="libraries.length === 0"
          message="暂无词库，点击右上角新增"
        />
        <view v-else class="admin-libs__list">
          <view v-for="lib in libraries" :key="lib.id" class="admin-libs__card">
            <text class="admin-libs__card-name">{{ lib.name }}</text>
            <text class="admin-libs__card-desc">{{ lib.description }}</text>
            <view class="admin-libs__card-bottom">
              <text class="admin-libs__card-count">{{ lib.wordIds?.length || 0 }} 个单词</text>
              <view class="admin-libs__card-actions">
                <view class="admin-libs__card-action admin-libs__card-action--manage" @click="openManagingLib(lib.id)">管理单词</view>
                <view class="admin-libs__card-action admin-libs__card-action--edit" @click="openEdit(lib)">编辑</view>
                <view class="admin-libs__card-action admin-libs__card-action--delete" @click="handleDelete(lib.id)">删除</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  fetchWordbanks,
  createWordbank,
  updateWordbank,
  deleteWordbank,
  fetchWords,
} from '@/api';
import { useInputFocus } from '@/composables/useInputFocus';
import type { Word, WordLibrary } from '@/data/types';
import PageHeader from '@/components/PageHeader.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import EmptyState from '@/components/EmptyState.vue';

const libraries = ref<WordLibrary[]>([]);
const loading = ref(true);

// Form state
const editTarget = ref<WordLibrary | 'new' | null>(null);
const name = ref('');
const desc = ref('');
const saving = ref(false);

const nameFocused = useInputFocus();
const descFocused = useInputFocus();
const searchFocused = useInputFocus();

// ── 管理单词状态 ──
const managingLibId = ref<string | null>(null);
const addingToLibId = ref<string | null>(null);
const wordSearch = ref('');
const allWords = ref<Word[]>([]);

const managingLib = computed(() =>
  managingLibId.value ? libraries.value.find(l => l.id === managingLibId.value) : null
);
const addingLib = computed(() =>
  addingToLibId.value ? libraries.value.find(l => l.id === addingToLibId.value) : null
);

// 词库中已收录的单词
const managingAddedWords = computed(() => {
  if (!managingLib.value) return [];
  return allWords.value.filter(w => managingLib.value!.wordIds?.includes(w.id));
});

// 在管理视图中搜索过滤后的已收录单词
const managingDisplayedWords = computed(() => {
  const q = wordSearch.value.trim().toLowerCase();
  if (!q) return managingAddedWords.value;
  return managingAddedWords.value.filter(
    w => w.word.toLowerCase().includes(q) || w.coreMeaning.includes(wordSearch.value.trim())
  );
});

// 在添加视图中搜索全库单词
const addingSearchResults = computed(() => {
  const q = wordSearch.value.trim();
  if (!q) return [] as Word[];
  return allWords.value.filter(
    w => w.word.toLowerCase().includes(q.toLowerCase()) || w.coreMeaning.includes(q)
  );
});

const isNew = ref(false);

async function loadLibraries() {
  loading.value = true;
  try {
    const result = await fetchWordbanks({ pageSize: 50 });
    libraries.value = result.libraries;
  } catch {
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' });
  }
  loading.value = false;
}

async function loadAllWords() {
  try {
    const result = await fetchWords({ pageSize: 500 });
    allWords.value = result.words;
  } catch {
    // 静默失败 — 单词列表非关键路径
  }
}

onShow(() => {
  if (editTarget.value === null && managingLibId.value === null && addingToLibId.value === null) {
    loadLibraries();
  }
  // 每次进入管理子视图时刷新全库单词
  if (managingLibId.value !== null || addingToLibId.value !== null) {
    loadAllWords();
  }
});

function openNew() {
  name.value = '';
  desc.value = '';
  editTarget.value = 'new';
  isNew.value = true;
}

function openEdit(lib: WordLibrary) {
  name.value = lib.name;
  desc.value = lib.description;
  editTarget.value = lib;
  isNew.value = false;
}

function cancelEdit() {
  editTarget.value = null;
}

async function handleSave() {
  if (!name.value.trim()) return;
  saving.value = true;
  try {
    if (editTarget.value === 'new') {
      await createWordbank({ name: name.value, description: desc.value });
    } else if (editTarget.value) {
      const lib = editTarget.value as WordLibrary;
      await updateWordbank(lib.id, { name: name.value, description: desc.value });
    }
    editTarget.value = null;
    await loadLibraries();
  } catch (err: any) {
    uni.showToast({ title: err?.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '确认删除该词库？',
    success: async (res: any) => {
      if (res.confirm) {
        try {
          await deleteWordbank(id);
          await loadLibraries();
        } catch (err: any) {
          uni.showToast({ title: err?.message || '删除失败', icon: 'none' });
        }
      }
    },
  });
}

// ── 管理单词操作 ──
function openManagingLib(libId: string) {
  managingLibId.value = libId;
  addingToLibId.value = null;
  wordSearch.value = '';
  loadAllWords();
}

function cancelManagingLib() {
  managingLibId.value = null;
  wordSearch.value = '';
}

function openAddingToLib(libId: string) {
  addingToLibId.value = libId;
  wordSearch.value = '';
  loadAllWords();
}

function cancelAddingToLib() {
  addingToLibId.value = null;
  wordSearch.value = '';
}

function handleAddWordToLib(wordId: string) {
  const lib = addingLib.value;
  if (!lib) return;
  const ids = lib.wordIds || [];
  if (ids.includes(wordId)) return;
  lib.wordIds = [...ids, wordId];
  // 同步更新 libraries 引用以确保响应式
  const idx = libraries.value.findIndex(l => l.id === lib.id);
  if (idx !== -1) {
    libraries.value[idx] = { ...lib };
  }
}

function handleRemoveWordFromLib(wordId: string) {
  const lib = managingLib.value;
  if (!lib) return;
  const ids = lib.wordIds || [];
  lib.wordIds = ids.filter(id => id !== wordId);
  const idx = libraries.value.findIndex(l => l.id === lib.id);
  if (idx !== -1) {
    libraries.value[idx] = { ...lib };
  }
}

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.admin-libs {
  min-height: 100vh;
  background: #F7F9FC;

  /* ── Add button ── */
  &__add-btn {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 16rpx 32rpx;
    background: #2563EB;
    color: #fff;
    border: none;
    border-radius: 40rpx;
    font-size: 26rpx;
    font-weight: 600;

    &-icon {
      font-size: 28rpx;
    }
  }

  /* ── Form ── */
  &__form {
    padding: 16rpx 48rpx 80rpx;
    display: flex;
    flex-direction: column;
    gap: 28rpx;
  }

  &__field {
    // field wrapper
  }

  &__label {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16rpx;
  }

  &__input {
    width: 100%;
    height: 97rpx;
    padding: 26rpx 28rpx;
    border-radius: 28rpx;
    border: 3rpx solid transparent;
    background: #F1F5F9;
    font-size: 30rpx;
    color: #111827;
    outline: none;
    box-sizing: border-box;
    line-height: 1.5;
    /* #ifdef H5 */
    transition: border-color 0.2s, background 0.2s;
    /* #endif */

    &--focused {
      border-color: #2563EB;
      background: #fff;
    }
  }

  &__textarea {
    width: 100%;
    min-height: 176rpx;
    padding: 26rpx 28rpx;
    border-radius: 28rpx;
    border: 3rpx solid transparent;
    background: #F1F5F9;
    font-size: 30rpx;
    color: #111827;
    outline: none;
    box-sizing: border-box;
    line-height: 1.5;
    /* #ifdef H5 */
    transition: border-color 0.2s, background 0.2s;
    /* #endif */

    &--focused {
      border-color: #2563EB;
      background: #fff;
    }
  }

  /* ── List ── */
  &__body {
    padding: 16rpx 48rpx 80rpx;
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
    gap: 24rpx;
  }

  &__card {
    background: #fff;
    border-radius: 40rpx;
    padding: 40rpx;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.05);

    &-name {
      display: block;
      font-size: 32rpx;
      font-weight: 700;
      color: #111827;
      margin: 0 0 12rpx;
    }

    &-desc {
      display: block;
      font-size: 26rpx;
      color: #6B7280;
      margin: 0 0 28rpx;
      line-height: 1.6;
    }

    &-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &-count {
      font-size: 24rpx;
      color: #2563EB;
      background: #EFF6FF;
      padding: 6rpx 20rpx;
      border-radius: 40rpx;
    }

    &-actions {
      display: flex;
      gap: 16rpx;
    }

    &-action {
      padding: 14rpx 32rpx;
      border-radius: 40rpx;
      font-size: 26rpx;
      font-weight: 500;

      &--manage {
        background: #EFF6FF;
        color: #2563EB;
      }

      &--edit {
        background: #F1F5F9;
        color: #374151;
      }

      &--delete {
        background: #FEF2F2;
        color: #DC2626;
      }
    }
  }

  /* ── 管理单词子视图 ── AdminView.tsx:251-438 */
  &__header-count {
    font-size: 26rpx;
    color: #9CA3AF;
  }

  &__search-wrap {
    margin-bottom: 32rpx;
  }

  &__search-input {
    width: 100%;
    height: 97rpx;
    padding: 26rpx 28rpx;
    border-radius: 28rpx;
    border: 3rpx solid transparent;
    background: #F1F5F9;
    font-size: 30rpx;
    color: #111827;
    outline: none;
    box-sizing: border-box;
    line-height: 1.5;
    /* #ifdef H5 */
    transition: border-color 0.2s, background 0.2s;
    /* #endif */
  }

  &__empty-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 64rpx 0;
    color: #9CA3AF;
  }

  &__empty-hint-text {
    font-size: 28rpx;
  }

  &__empty-manage {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 64rpx 0;
    gap: 32rpx;

    &-text {
      font-size: 28rpx;
      color: #9CA3AF;
    }
  }

  &__word-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  &__word-card {
    background: #fff;
    border-radius: 40rpx;
    padding: 28rpx 36rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.05);
  }

  &__word-info {
    flex: 1;
    min-width: 0;
  }

  &__word-head {
    display: flex;
    align-items: baseline;
    gap: 16rpx;
    margin-bottom: 4rpx;
  }

  &__word-name {
    font-size: 32rpx;
    font-weight: 700;
    color: #111827;
  }

  &__word-phonetic {
    font-size: 24rpx;
    color: #9CA3AF;
  }

  &__word-meaning {
    font-size: 24rpx;
    color: #6B7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  &__word-added {
    font-size: 22rpx;
    color: #059669;
    background: #ECFDF5;
    padding: 8rpx 20rpx;
    border-radius: 40rpx;
    font-weight: 500;
    flex-shrink: 0;
  }

  &__word-add-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 28rpx;
    background: #2563EB;
    border-radius: 40rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }

  &__word-remove-btn {
    padding: 10rpx 24rpx;
    background: #FEF2F2;
    border-radius: 40rpx;
    font-size: 24rpx;
    font-weight: 500;
    color: #DC2626;
    flex-shrink: 0;
  }
}
</style>
