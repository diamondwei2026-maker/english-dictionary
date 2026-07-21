<template>
  <!-- Ported from figma-prototype AdminView.tsx:441,520 — adaptive <select> → <picker> on mini program -->
  <!-- NC-13: Desktop uses <select> native, mobile uses uni-app <picker> with bottom-sheet behavior -->
  <!-- #ifdef H5 -->
  <view class="adaptive-select">
    <select
      class="adaptive-select__native"
      :value="modelValue"
      @change="onNativeChange"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >{{ opt.label }}</option>
    </select>
    <text class="iconfont adaptive-select__chevron">&#xe011;</text>
  </view>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <view class="adaptive-select" @click="openPicker">
    <view class="adaptive-select__display">
      <text>{{ selectedLabel || placeholder }}</text>
      <text class="iconfont adaptive-select__chevron">&#xe011;</text>
    </view>
    <picker
      mode="selector"
      :range="pickerRange"
      :value="pickerIndex"
      @change="onPickerChange"
    />
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface SelectOption {
  label: string;
  value: string;
}

const props = withDefaults(defineProps<{
  modelValue: string;
  options: SelectOption[];
  placeholder?: string;
}>(), {
  placeholder: '请选择',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue);
  return found?.label || '';
});

const pickerRange = computed(() => props.options.map(o => o.label));

const pickerIndex = computed(() => {
  const idx = props.options.findIndex(o => o.value === props.modelValue);
  return idx >= 0 ? idx : 0;
});

function onNativeChange(e: any) {
  emit('update:modelValue', e.target?.value ?? '');
}

function onPickerChange(e: any) {
  const idx = e.detail?.value ?? 0;
  const opt = props.options[idx];
  if (opt) {
    emit('update:modelValue', opt.value);
  }
}

function openPicker() {
  // The <picker> component handles opening natively on tap
}
</script>

<style scoped lang="scss">
.adaptive-select {
  position: relative;
  width: 100%;

  &__native {
    width: 100%;
    height: 97rpx;           /* NC-01: INPUT height formula. Phase1(src): AdminView.tsx:55 — padding 13px+14px, font 15px */
    padding: 26rpx 28rpx;    /* Phase1(src): AdminView.tsx:53 — 13px 14px → rpx×2 */
    border-radius: 28rpx;    /* Phase1(src): AdminView.tsx:53 — 14px → 28rpx */
    border: 3rpx solid transparent; /* INPUT-A pattern */
    background: #F1F5F9;
    font-size: 30rpx;        /* 15px → 30rpx */
    color: #111827;
    outline: none;
    box-sizing: border-box;
    appearance: none;        /* Remove native dropdown arrow */
    line-height: 1.5;
    /* #ifdef H5 */
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    /* #endif */
  }

  &__native:focus {
    border-color: #2563EB;
    background: #fff;
    outline: none;
  }

  &__display {
    width: 100%;
    height: 97rpx;
    padding: 26rpx 56rpx 26rpx 28rpx;
    border-radius: 28rpx;
    border: 3rpx solid transparent;
    background: #F1F5F9;
    font-size: 30rpx;
    color: #111827;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__chevron {
    position: absolute;
    right: 28rpx;
    top: 50%;
    transform: translateY(-50%) rotate(90deg);
    font-size: 28rpx;
    color: #9CA3AF;
    pointer-events: none;
  }
}
</style>
