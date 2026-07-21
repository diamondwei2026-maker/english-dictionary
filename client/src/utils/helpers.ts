// Utility functions
import type { Word } from '@/data/types';

/** 客户端侧单词过滤（对已获取的列表做快速搜索，避免每次击键都请求 API） */
export function filterWords(query: string, words: Word[]): Word[] {
  const q = query.trim().toLowerCase();
  if (!q) return words;
  return words.filter(w =>
    w.word.toLowerCase().includes(q) ||
    w.coreMeaning.includes(query.trim())
  );
}

export const POS_COLORS: Record<string, { bg: string; text: string }> = {
  'n.': { bg: '#EFF6FF', text: '#1D4ED8' },
  'v.': { bg: '#F0FDF4', text: '#166534' },
  'adj.': { bg: '#FFF7ED', text: '#C2410C' },
  'adv.': { bg: '#FAF5FF', text: '#7E22CE' },
  'v./n.': { bg: '#ECFDF5', text: '#065F46' },
  'adj./adv.': { bg: '#FFF1F2', text: '#9F1239' },
};

export function getPosColor(pos: string): { bg: string; text: string } {
  return POS_COLORS[pos] || { bg: '#F3F4F6', text: '#6B7280' };
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function isValidPhone(p: string): boolean {
  return /^1[3-9]\d{9}$/.test(p.replace(/\s/g, ''));
}

export const IMAGE_TYPES = ['flow', 'grasp', 'break', 'bear', 'drive', 'light', 'leverage', 'yield'];
export const POS_OPTIONS = ['n.', 'v.', 'adj.', 'adv.', 'v./n.', 'adj./adv.', 'prep.'];
