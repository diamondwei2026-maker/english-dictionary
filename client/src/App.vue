<template>
  <view class="app-root">
    <router-view />
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>

<style lang="scss">
/* ── Icon Font (unicode glyphs) ── */
.iconfont {
  font-family: "iconfont" !important;
  font-size: inherit;
  font-style: normal;
  /* #ifdef H5 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* #endif */
}

/* ── H5 only: Google Fonts, @font-face, global resets ── */
/* #ifdef H5 */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap");

@font-face {
  font-family: "iconfont";
  src: url("@/static/fonts/iconfont.ttf") format("truetype");
}

* {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

#app {
  height: 100%;
}
/* #endif */

/* ── CSS Arrow ">" — chevron drawn with border + rotate ── */
.css-arrow {
  --arrow-chevron: 16rpx;
  --arrow-stroke: 3rpx;

  display: inline-block;
  width: var(--arrow-chevron);
  height: var(--arrow-chevron);
  border-top: var(--arrow-stroke) solid currentColor;
  border-right: var(--arrow-stroke) solid currentColor;
  transform: rotate(45deg);
  vertical-align: middle;
}

/* ── CSS Arrow "<" — left-pointing chevron drawn with border + rotate ── */
.css-arrow-left {
  --arrow-chevron: 16rpx;
  --arrow-stroke: 3rpx;

  display: inline-block;
  width: var(--arrow-chevron);
  height: var(--arrow-chevron);
  border-top: var(--arrow-stroke) solid currentColor;
  border-left: var(--arrow-stroke) solid currentColor;
  transform: rotate(-45deg);
  vertical-align: middle;
  color: #a0a0a0;
}

/* ── Animations (WXSS supports @keyframes) ── */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<style lang="scss">
/* #ifdef H5 */
.uni-tabbar {
  height: 132rpx !important;
}
/* #endif */

.app-root {
  font-family:
    Inter,
    system-ui,
    -apple-system,
    sans-serif;
  background: #f7f9fc;
  position: relative;

  /* #ifdef H5 */
  min-height: 100vh;
  max-width: 860rpx; /* 430px → 860rpx */
  margin: 0 auto;
  /* #endif */
}
</style>
