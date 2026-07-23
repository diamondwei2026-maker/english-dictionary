<template>
  <!-- Ported from figma-prototype AdminView.tsx:328-683 — WordManager + WordEditForm -->
  <view class="admin-words">
    <!-- Edit form view -->
    <template v-if="editWord !== null">
      <PageHeader
        :title="editWord.word ? `编辑：${editWord.word}` : '新增单词'"
        show-back
        back-label="单词列表"
        bg-type="admin"
        :padding-top="104"
        @back="cancelEdit"
      />
      <view class="admin-words__form">
        <!-- AI Generate card -->
        <view class="admin-words__section">
          <SectionLabel>AI 生成</SectionLabel>
          <view class="admin-words__ai-card">
            <text class="admin-words__label">单词</text>
            <input
              v-model="form.word"
              class="admin-words__input"
              :class="{ 'admin-words__input--focused': inputFocus.focused.value }"
              placeholder="输入英文单词，例：flow"
              @focus="inputFocus.onFocus"
              @blur="inputFocus.onBlur"
              @input="onWordChange"
            ></input>
            <view
              class="admin-words__ai-btn"
              :class="{
                'admin-words__ai-btn--loading': aiLoading,
                'admin-words__ai-btn--done': aiDone,
              }"
              @click="handleAI"
            >
              <view v-if="aiLoading" class="admin-words__spinner" />
              <text v-else-if="aiDone" class="iconfont admin-words__ai-btn-icon">√</text>
              <text>{{ aiLoading ? '正在生成...' : aiDone ? '已生成，可继续编辑' : 'AI 自动生成词条' }}</text>
            </view>
          </view>
        </view>

        <!-- Basic info -->
        <view class="admin-words__section">
          <SectionLabel>基本信息</SectionLabel>
          <view class="admin-words__card">
            <view class="admin-words__field">
              <text class="admin-words__label">所属词库</text>
              <AdaptiveSelect
                v-model="form.libraryId"
                :options="libraryOptions"
                placeholder="选择词库"
              />
            </view>
            <view class="admin-words__field">
              <text class="admin-words__label">音标</text>
              <input
                v-model="form.phonetic"
                class="admin-words__input"
                placeholder="/fləʊ/"
                @focus="onFieldFocus"
                @blur="onFieldBlur"
              ></input>
            </view>
          </view>
        </view>

        <!-- Core meaning -->
        <view class="admin-words__section">
          <SectionLabel>核心义</SectionLabel>
          <view class="admin-words__card">
            <view class="admin-words__field">
              <text class="admin-words__label">核心义描述</text>
              <textarea
                v-model="form.coreMeaning"
                class="admin-words__textarea"
                placeholder="从物理感知出发，描述词的核心物理意义..."
                auto-height
                @focus="onFieldFocus"
                @blur="onFieldBlur"
              ></textarea>
            </view>
            <view class="admin-words__field">
              <text class="admin-words__label">核心意象描述</text>
              <textarea
                v-model="form.coreImageDescription"
                class="admin-words__textarea admin-words__textarea--short"
                placeholder="描述物理意象图的场景..."
                auto-height
                @focus="onFieldFocus"
                @blur="onFieldBlur"
              ></textarea>
            </view>
            <view class="admin-words__field">
              <text class="admin-words__label">核心义例句</text>
              <textarea
                v-model="form.coreExampleSentence"
                class="admin-words__textarea admin-words__textarea--short"
                placeholder="English example sentence..."
                auto-height
                @focus="onFieldFocus"
                @blur="onFieldBlur"
              ></textarea>
            </view>
            <view class="admin-words__field">
              <text class="admin-words__label">例句中文翻译</text>
              <textarea
                v-model="form.coreExampleTranslation"
                class="admin-words__textarea admin-words__textarea--short"
                placeholder="中文翻译..."
                auto-height
                @focus="onFieldFocus"
                @blur="onFieldBlur"
              ></textarea>
            </view>
          </view>
        </view>

        <!-- Physical image -->
        <view class="admin-words__section">
          <SectionLabel>核心义图（物理意象）</SectionLabel>
          <view class="admin-words__card">
            <view class="admin-words__image-preview">
              <PhysicalImage :type="form.coreImageType" />
            </view>
            <view class="admin-words__regen-btn" @click="handleRegenImg">
              <text class="iconfont admin-words__regen-btn-icon">&#xe010;</text>
              <text>重新生成</text>
            </view>
          </view>
        </view>

        <!-- Extended meanings -->
        <view class="admin-words__section">
          <SectionLabel>引申义{{ isNew ? '（由 AI 生成后自动填充）' : '' }}</SectionLabel>
          <EmptyState
            v-if="form.extendedMeanings.length === 0 && isNew"
            message="点击上方「AI 自动生成词条」后自动填充"
          />
          <view v-else class="admin-words__ext-list">
            <view v-for="(ext, i) in form.extendedMeanings" :key="ext.id" class="admin-words__card">
              <view class="admin-words__ext-header">
                <text class="admin-words__ext-header-label">引申义 {{ i + 1 }}</text>
                <view v-if="!isNew" class="admin-words__ext-remove" @click="removeExt(i)">
                  <text class="iconfont">&#xe006;</text>
                </view>
              </view>
              <view class="admin-words__field">
                <text class="admin-words__label">逻辑演化描述</text>
                <input
                  v-model="ext.logicalEvolution"
                  class="admin-words__input"
                  placeholder="物理感知 → 抽象延伸..."
                  @focus="onFieldFocus"
                  @blur="onFieldBlur"
                ></input>
              </view>
              <view class="admin-words__ext-row">
                <view class="admin-words__field admin-words__field--grow">
                  <text class="admin-words__label">引申义</text>
                  <input
                    v-model="ext.meaning"
                    class="admin-words__input"
                    placeholder="中文引申义"
                    @focus="onFieldFocus"
                    @blur="onFieldBlur"
                  ></input>
                </view>
                <view class="admin-words__field admin-words__field--pos">
                  <text class="admin-words__label">词性</text>
                  <AdaptiveSelect
                    v-model="ext.partOfSpeech"
                    :options="posOptions"
                    placeholder="选择"
                  />
                </view>
              </view>
              <view class="admin-words__field">
                <text class="admin-words__label">英文例句</text>
                <textarea
                  v-model="ext.exampleSentence"
                  class="admin-words__textarea admin-words__textarea--short"
                  placeholder="English example..."
                  auto-height
                  @focus="onFieldFocus"
                  @blur="onFieldBlur"
                ></textarea>
              </view>
              <view class="admin-words__field">
                <text class="admin-words__label">例句中文翻译</text>
                <textarea
                  v-model="ext.exampleTranslation"
                  class="admin-words__textarea admin-words__textarea--short"
                  placeholder="中文翻译..."
                  auto-height
                  @focus="onFieldFocus"
                  @blur="onFieldBlur"
                ></textarea>
              </view>
            </view>
            <view v-if="!isNew" class="admin-words__add-ext-btn" @click="addExt">
              <text class="iconfont admin-words__add-ext-btn-icon">&#xe008;</text>
              <text>添加引申义</text>
            </view>
          </view>
        </view>

        <!-- Collocations -->
        <view class="admin-words__section">
          <SectionLabel>常见搭配</SectionLabel>
          <view class="admin-words__card">
            <text class="admin-words__label">用顿号或逗号分隔多个搭配</text>
            <textarea
              v-model="colInput"
              class="admin-words__textarea admin-words__textarea--short"
              placeholder="flow freely、cash flow、go with the flow..."
              auto-height
              @focus="onFieldFocus"
              @blur="onFieldBlur"
            ></textarea>
          </view>
        </view>

        <!-- Save/Cancel -->
        <view class="admin-words__form-actions">
          <PrimaryButton :disabled="!form.word || !form.libraryId || saving" :loading="saving" @click="handleSave">
            {{ saving ? '保存中...' : '保存单词' }}
          </PrimaryButton>
          <PrimaryButton v-if="!isNew" ghost @click="cancelEdit">取消</PrimaryButton>
        </view>
      </view>
    </template>

    <!-- List view -->
    <template v-else>
      <PageHeader
        title="单词管理"
        show-back
        back-label="返回"
        bg-type="admin"
        :padding-top="104"
        @back="goBack"
      >
        <template #right>
          <view class="admin-words__add-btn" @click="openNew">
            <text class="iconfont admin-words__add-btn-icon">+</text>
            <text>新增</text>
          </view>
        </template>
      </PageHeader>

      <view class="admin-words__body">
        <SearchBar v-model="query" placeholder="搜索单词或含义..." :clearable="true" />

        <SectionLabel>共 {{ filteredWords.length }} 个单词</SectionLabel>

        <view v-if="loading" class="admin-words__loading">
          <text>加载中...</text>
        </view>
        <EmptyState v-else-if="filteredWords.length === 0" message="暂无单词" />

        <view v-else class="admin-words__list">
          <view v-for="w in filteredWords" :key="w.id" class="admin-words__list-card">
            <view class="admin-words__list-card-left">
              <view class="admin-words__list-card-word-row">
                <text class="admin-words__list-card-word">{{ w.word }}</text>
                <text class="admin-words__list-card-phonetic">{{ w.phonetic }}</text>
              </view>
              <text class="admin-words__list-card-meaning">{{ w.coreMeaning }}</text>
              <view class="admin-words__list-card-badges">
                <text v-if="getLibName(w.libraryId)" class="admin-words__list-card-badge admin-words__list-card-badge--lib">{{ getLibName(w.libraryId) }}</text>
                <text class="admin-words__list-card-badge">{{ w.extendedMeanings.length }} 个引申义</text>
              </view>
            </view>
            <view class="admin-words__list-card-actions">
              <view class="admin-words__list-card-action admin-words__list-card-action--edit" @click="openEdit(w)">编辑</view>
              <view class="admin-words__list-card-action admin-words__list-card-action--delete" @click="handleDelete(w.id)">删除</view>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { Word, WordLibrary, ExtendedMeaning } from '@/data/types';
import {
  fetchWords,
  fetchWordbanks,
  createWord,
  updateWord,
  deleteWord,
  generateWord,
  mapPosToBackend,
} from '@/api';
import type { CreateWordInput } from '@/api';
import { genId, IMAGE_TYPES, POS_OPTIONS } from '@/utils/helpers';
import { useInputFocus } from '@/composables/useInputFocus';
import PageHeader from '@/components/PageHeader.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import EmptyState from '@/components/EmptyState.vue';
import SearchBar from '@/components/SearchBar.vue';
import PhysicalImage from '@/components/PhysicalImage.vue';
import AdaptiveSelect from '@/components/AdaptiveSelect.vue';

// Libraries (loaded for dropdown options)
const libraryMap = ref<Record<string, string>>({});
const libraryOptions = ref<Array<{ label: string; value: string }>>([]);
const posOptions = computed(() => POS_OPTIONS.map(p => ({ label: p, value: p })));

// Word list state
const words = ref<Word[]>([]);
const query = ref('');
const loading = ref(true);

const filteredWords = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return words.value;
  return words.value.filter(w =>
    w.word.toLowerCase().includes(q) ||
    w.coreMeaning.includes(query.value.trim())
  );
});

async function loadWords() {
  loading.value = true;
  try {
    const result = await fetchWords({ pageSize: 200 });
    words.value = result.words;
  } catch {
    words.value = [];
  }
  loading.value = false;
}

async function loadLibraries() {
  try {
    const result = await fetchWordbanks({ pageSize: 50 });
    libraryOptions.value = result.libraries.map(l => ({ label: l.name, value: l.id }));
    const map: Record<string, string> = {};
    result.libraries.forEach(l => { map[l.id] = l.name; });
    libraryMap.value = map;
  } catch {
    // keep defaults
  }
}

onShow(() => {
  if (editWord.value === null) {
    loadWords();
    loadLibraries();
  }
});

function getLibName(libId: string): string {
  return libraryMap.value[libId] || '';
}

// ── Edit form state ──

const editWord = ref<Partial<Word> | null>(null);
const isNew = ref(false);

interface EditForm {
  id: string;
  word: string;
  libraryId: string;
  phonetic: string;
  coreMeaning: string;
  coreImageType: string;
  coreImageDescription: string;
  coreExampleSentence: string;
  coreExampleTranslation: string;
  extendedMeanings: ExtendedMeaning[];
  collocations: string[];
}

const form = reactive<EditForm>({
  id: '',
  word: '',
  libraryId: '',
  phonetic: '',
  coreMeaning: '',
  coreImageType: 'flow',
  coreImageDescription: '',
  coreExampleSentence: '',
  coreExampleTranslation: '',
  extendedMeanings: [],
  collocations: [],
});

const colInput = ref('');
const aiLoading = ref(false);
const aiDone = ref(false);
const saving = ref(false);

const inputFocus = useInputFocus();

function resetForm() {
  form.id = '';
  form.word = '';
  form.libraryId = libraryOptions.value[0]?.value || '';
  form.phonetic = '';
  form.coreMeaning = '';
  form.coreImageType = 'flow';
  form.coreImageDescription = '';
  form.coreExampleSentence = '';
  form.coreExampleTranslation = '';
  form.extendedMeanings = [];
  form.collocations = [];
  colInput.value = '';
  aiDone.value = false;
}

function openNew() {
  resetForm();
  form.id = genId();
  editWord.value = {};
  isNew.value = true;
}

function openEdit(w: Word) {
  editWord.value = w;
  isNew.value = false;
  form.id = w.id;
  form.word = w.word;
  form.libraryId = w.libraryId;
  form.phonetic = w.phonetic;
  form.coreMeaning = w.coreMeaning;
  form.coreImageType = w.coreImageType;
  form.coreImageDescription = w.coreImageDescription || '';
  form.coreExampleSentence = w.coreExampleSentence;
  form.coreExampleTranslation = w.coreExampleTranslation;
  form.extendedMeanings = [...w.extendedMeanings];
  form.collocations = [...w.collocations];
  colInput.value = w.collocations.join('、');
  aiDone.value = true;
}

function cancelEdit() {
  editWord.value = null;
}

function onWordChange() {
  aiDone.value = false;
}

// ── AI Generation ──

async function handleAI() {
  if (!form.word || !form.libraryId) {
    uni.showToast({ title: '请先输入单词并选择词库', icon: 'none' });
    return;
  }
  aiLoading.value = true;
  aiDone.value = false;
  try {
    const generated = await generateWord(form.word, form.libraryId);
    form.phonetic = generated.phonetic;
    form.coreMeaning = generated.coreMeaning;
    form.coreImageType = generated.coreImageType;
    form.coreImageDescription = generated.coreImageDescription;
    form.coreExampleSentence = generated.coreExampleSentence;
    form.coreExampleTranslation = generated.coreExampleTranslation;
    form.extendedMeanings = generated.extendedMeanings;
    form.collocations = generated.collocations;
    colInput.value = generated.collocations.join('、');
    aiDone.value = true;
  } catch (err: any) {
    uni.showToast({ title: err?.message || 'AI 生成失败', icon: 'none' });
  } finally {
    aiLoading.value = false;
  }
}

function handleRegenImg() {
  const cur = form.coreImageType || 'flow';
  form.coreImageType = IMAGE_TYPES[(IMAGE_TYPES.indexOf(cur) + 1) % IMAGE_TYPES.length];
}

// ── Extended meanings ──

function addExt() {
  form.extendedMeanings.push({
    id: genId(), logicalEvolution: '', meaning: '', partOfSpeech: 'v.',
    exampleSentence: '', exampleTranslation: '',
  });
}

function removeExt(i: number) {
  form.extendedMeanings.splice(i, 1);
}

// ── Field focus ──

function onFieldFocus(e: any) {
  if (e.target) {
    e.target.style.borderColor = '#2563EB';
    e.target.style.background = '#fff';
  }
}

function onFieldBlur(e: any) {
  if (e.target) {
    e.target.style.borderColor = 'transparent';
    e.target.style.background = '#F1F5F9';
  }
}

// ── Save / Delete ──

async function handleSave() {
  if (!form.word || !form.libraryId) return;
  const collocations = colInput.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  saving.value = true;

  const wordData: CreateWordInput = {
    word: form.word,
    wordbankId: form.libraryId,
    phonetic: form.phonetic,
    coreMeaning: form.coreMeaning,
    coreExampleEn: form.coreExampleSentence,
    coreExampleZh: form.coreExampleTranslation,
    physicalImageType: form.coreImageType,
    physicalImageDescription: form.coreImageDescription,
    extendedMeanings: form.extendedMeanings.map(ext => ({
      evolutionDescription: ext.logicalEvolution,
      meaning: ext.meaning,
      partOfSpeech: mapPosToBackend(ext.partOfSpeech),
      exampleEn: ext.exampleSentence,
      exampleZh: ext.exampleTranslation,
    })),
    collocations,
  };

  try {
    if (isNew.value) {
      await createWord(wordData);
    } else {
      await updateWord(form.id, wordData);
    }
    editWord.value = null;
    await loadWords();
  } catch (err: any) {
    uni.showToast({ title: err?.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '确认删除该单词？',
    success: async (res: any) => {
      if (res.confirm) {
        try {
          await deleteWord(id);
          await loadWords();
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
.admin-words {
  min-height: 100vh;
  background: #F7F9FC;
  color: #fff;

  &__add-btn {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 16rpx 32rpx;
    background: #2563EB;
 
    border: none;
    border-radius: 40rpx;
    font-size: 26rpx;
    font-weight: 600;

    &-icon { font-size: 28rpx; }
  }

  /* ── Form ── */
  &__form {
    padding: 16rpx 48rpx 80rpx;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__section { margin-bottom: 40rpx; }

  &__card {
    background: #fff;
    border-radius: 40rpx;
    padding: 40rpx;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 28rpx;
  }

  &__field {
    &--grow { flex: 1; }
    &--pos { width: 160rpx; }
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

    &--focused { border-color: #2563EB; background: #fff; }
  }

  &__textarea {
    width: 100%;
    min-height: 144rpx;
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

    &--short { min-height: 96rpx; }
    &--focused { border-color: #2563EB; background: #fff; }
  }

  /* ── AI card ── */
  &__ai-card {
    background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
    border: 2rpx solid #BFDBFE;
    border-radius: 40rpx;
    padding: 40rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }

  &__ai-btn {
    width: 100%;
    padding: 28rpx;
    border-radius: 28rpx;
    border: none;
    background: #2563EB;
    color: #fff;
    font-size: 30rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    box-sizing: border-box;
    /* #ifdef H5 */
    transition: background 0.25s;
    /* #endif */

    &--loading { background: #93C5FD; }
    &--done { background: #059669; }
    &-icon { font-size: 30rpx; }
  }

  &__spinner {
    width: 30rpx; height: 30rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* ── Image preview ── */
  &__image-preview {
    border-radius: 32rpx;
    overflow: hidden;
    margin-bottom: 24rpx;
  }

  &__regen-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 22rpx;
    background: #F1F5F9;
    border: none;
    border-radius: 28rpx;
    color: #374151;
    font-size: 26rpx;
    font-weight: 500;
    box-sizing: border-box;

    &-icon { font-size: 26rpx; }
  }

  /* ── Extended meanings ── */
  &__ext-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }

  &__ext-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;

    &-label {
      font-size: 24rpx;
      font-weight: 600;
      color: #9CA3AF;
      letter-spacing: 2rpx;
      text-transform: uppercase;
    }
  }

  &__ext-remove {
    background: #FEF2F2;
    border: none;
    border-radius: 16rpx;
    color: #DC2626;
    padding: 10rpx 14rpx;
    display: flex;

    .iconfont { font-size: 28rpx; }
  }

  &__ext-row {
    display: grid;
    grid-template-columns: 1fr 160rpx;
    gap: 20rpx;
  }

  &__add-ext-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 28rpx;
    background: #fff;
    border: 3rpx dashed #D1D5DB;
    border-radius: 32rpx;
    color: #6B7280;
    font-size: 28rpx;
    font-weight: 500;

    &-icon { font-size: 32rpx; }
  }

  /* ── Form actions ── */
  &__form-actions {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin-top: 48rpx;
  }

  /* ── List view ── */
  &__body { padding: 16rpx 48rpx 80rpx; }

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

  &__list-card {
    display: flex;
    align-items: flex-start;
    gap: 20rpx;
    background: #fff;
    border-radius: 40rpx;
    padding: 32rpx 40rpx;
    box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.05);

    &-left { flex: 1; min-width: 0; }
    &-word-row { display: flex; align-items: baseline; gap: 20rpx; margin-bottom: 8rpx; }
    &-word { font-size: 36rpx; font-weight: 700; color: #111827; }
    &-phonetic { font-size: 24rpx; color: #9CA3AF; }
    &-meaning {
      display: block; font-size: 24rpx; color: #6B7280;
      margin: 0 0 16rpx; line-height: 1.5;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    &-badges { display: flex; gap: 12rpx; flex-wrap: wrap; }

    &-badge {
      font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 40rpx;
      background: #F3F4F6; color: #6B7280;
      &--lib { color: #2563EB; background: #EFF6FF; }
    }

    &-actions { display: flex; gap: 16rpx; flex-shrink: 0; }

    &-action {
      padding: 14rpx 28rpx; border-radius: 40rpx; font-size: 26rpx; font-weight: 500;
      &--edit { background: #F1F5F9; color: #374151; }
      &--delete { background: #FEF2F2; color: #DC2626; }
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
