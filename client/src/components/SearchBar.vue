<template>
  <!-- Ported from figma-prototype HomeView.tsx:55-79 + AdminView.tsx:619-637 -->
  <view class="search-bar" :class="{ 'search-bar--focused': focused }">
        <image
        class="iconfont search-bar__icon"
      src="/static/images/tab-home.png"
      mode="scaleToFill"
    />
    <input
      class="search-bar__input"
      :class="{ 'search-bar__input--focused': focused }"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    ></input>
    <view v-if="modelValue && clearable" class="search-bar__clear" @click="onClear">
      <text class="iconfont">&#xe006;</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// AFx: useInputFocus — must destructure { focused, onFocus, onBlur } (AF1)
import { useInputFocus } from '@/composables/useInputFocus';

const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  clearable?: boolean;
}>(), {
  placeholder: '搜索...',
  clearable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { focused, onFocus, onBlur } = useInputFocus();

function onInput(e: any) {
  const val = e.detail?.value ?? e.target?.value ?? '';
  emit('update:modelValue', val);
}

function onClear() {
  emit('update:modelValue', '');
}
</script>

<style scoped lang="scss">
.search-bar {
  position: relative;
  width: 100%;

  &__icon {
    position: absolute;
    left: 32rpx;             /* Phase1(src): HomeView.tsx:49 — 16px → 32rpx */
    top: 50%;
    transform: translateY(-50%);
    // font-size: 36rpx;        /* Search size 18 → 36rpx */
    // color: #9CA3AF;
    z-index: 1;
    pointer-events: none;
    width: 40rpx;
    height: 40rpx;
  }

  &__input {
    width: 100%;
    height: 104rpx;          /* NC-01: 14px+30rpx×1.5+14px → calc: padding 28rpx top+bottom, 30rpx font, 1.5 lh = 28+45+28=101 ≈104rpx */
    padding: 28rpx 32rpx 28rpx 92rpx; /* Phase1(src): HomeView.tsx:61 — 14px 16px 14px 46px → rpx×2 */
    border-radius: 32rpx;    /* Phase1(src): HomeView.tsx:62 — 16px → 32rpx */
    border: 3rpx solid transparent; /* Phase1(src): HomeView.tsx:63 — 1.5px → 3rpx */
    background: #F1F5F9;     /* INPUT-A pattern: blur bg */
    font-size: 32rpx;        /* Phase1(src): HomeView.tsx:66 — 16px → 32rpx */
    color: #111827;
    outline: none;
    box-sizing: border-box;
    /* #ifdef H5 */
    transition: border-color 0.2s, background 0.2s;
    /* #endif */

    &--focused {
      border-color: #2563EB;
      background: #fff;
    }
  }

  &__clear {
    position: absolute;
    right: 24rpx;            /* 12px → 24rpx */
    top: 50%;
    transform: translateY(-50%);
    color: #9CA3AF;
    font-size: 30rpx;
    padding: 4rpx;
    display: flex;
    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }
}
</style>
