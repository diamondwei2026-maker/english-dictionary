import { defineConfig } from 'vite';
import uniPlugin from '@dcloudio/vite-plugin-uni';

// PM-5: CJS plugin needs .default extraction (package.json has no "type": "module")
const uni = (uniPlugin as any).default || uniPlugin;

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // 开发环境代理：/api → localhost:3001（与 client/config/dev.ts 保持一致）
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Must use @import (not @use) — @use must precede all other rules
        additionalData: `@import "@/uni.scss";`,
      },
    },
  },
});
