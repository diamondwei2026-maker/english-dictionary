<template>
  <!-- Bookmark SVG icon — shared across favorites, word-detail, profile -->
  <svg
    :width="size"
    :height="Math.round(size * 1.125)"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="filled ? filledColor : strokeColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="bookmark-icon"
    :class="{ 'bookmark-icon--filled': filled }"
    :style="{ flexShrink: 0 }"
  >
    <path
      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      :fill="filled ? filledColor : 'none'"
      :stroke="filled ? filledColor : strokeColor"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number;
  filled?: boolean;
  strokeWidth?: number;
  filledColor?: string;
  strokeColor?: string;
}>(), {
  size: 16,
  filled: false,
  strokeWidth: 2,
  filledColor: '#2563EB',
  strokeColor: '#9CA3AF',
});
</script>

<style scoped>
.bookmark-icon {
  flex-shrink: 0;
}
</style>
