import { createSSRApp } from 'vue';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  return { app };
}

// Self-mount — DO NOT REMOVE (missing → blank page)
createApp().app.mount('#app');
