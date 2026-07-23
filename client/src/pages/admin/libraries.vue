<template>
  <!-- Ported from figma-prototype AdminView.tsx:224-326 — LibraryManager sub-module -->
  <view class="admin-libs">
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
              <text class="admin-libs__card-count">{{ lib.wordCount }} 个单词</text>
              <view class="admin-libs__card-actions">
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
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  fetchWordbanks,
  createWordbank,
  updateWordbank,
  deleteWordbank,
} from '@/api';
import { useInputFocus } from '@/composables/useInputFocus';
import type { WordLibrary } from '@/data/types';
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

onShow(() => {
  if (editTarget.value === null) {
    loadLibraries();
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
}
</style>
