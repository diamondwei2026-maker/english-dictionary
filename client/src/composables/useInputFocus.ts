// Ported from figma-prototype — input focus/blur state management
// Replaces e.target.style.xxx = '...' DOM manipulation with declarative class binding

import { ref } from 'vue';

export function useInputFocus() {
  const focused = ref(false);

  function onFocus() {
    focused.value = true;
  }

  function onBlur() {
    focused.value = false;
  }

  return { focused, onFocus, onBlur };
}
