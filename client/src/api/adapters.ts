// ============================================================
// 数据适配器 — 后端 API 响应 → 前端类型
// 从 client/src/api/adapters.ts 移植
// ============================================================

import type { Word, WordLibrary, ExtendedMeaning, User } from "../data/types";

// ---- 后端原始类型（仅在适配器中使用） ----

interface BackendExtendedMeaning {
  _id?: string;
  evolutionDescription: string;
  meaning: string;
  partOfSpeech: string;
  exampleEn: string;
  exampleZh: string;
}

interface BackendWord {
  _id?: string;
  word: string;
  wordbankId: string;
  phonetic?: string;
  coreMeaning: string;
  coreExampleEn: string;
  coreExampleZh: string;
  physicalImageType: string;
  physicalImageDescription: string;
  coreImageSvg?: string;
  extendedMeanings: BackendExtendedMeaning[];
  collocations: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface BackendWordbank {
  _id: string;
  name: string;
  slug: string;
  description: string;
  cover_image: string;
  gradient: string;
  is_public: boolean;
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendUser {
  _id: string;
  username: string;
  phone: string;
  role: "user" | "admin";
  learnedWords: string[];
  favoriteWords: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---- 词性映射 ----

/** 后端词性枚举 → 前端中文缩写 */
export function mapPosToFront(backPos: string): string {
  const map: Record<string, string> = {
    noun: "n.",
    verb: "v.",
    adj: "adj.",
    adv: "adv.",
    prep: "prep.",
    conj: "conj.",
    pron: "pron.",
  };
  return map[backPos] || backPos;
}

/** 前端词性缩写 → 后端枚举 */
export function mapPosToBackend(frontPos: string): string {
  const map: Record<string, string> = {
    "n.": "noun",
    "v.": "verb",
    "adj.": "adj",
    "adv.": "adv",
    "prep.": "prep",
    "conj.": "conj",
    "pron.": "pron",
    "v./n.": "verb", // 复合词性简化取主要
    "adj./adv.": "adj",
  };
  return map[frontPos] || "other";
}

// ---- 适配函数 ----

function adaptExtendedMeaning(be: BackendExtendedMeaning): ExtendedMeaning {
  return {
    id: be._id ? String(be._id) : "",
    logicalEvolution: be.evolutionDescription,
    meaning: be.meaning,
    partOfSpeech: mapPosToFront(be.partOfSpeech),
    exampleSentence: be.exampleEn,
    exampleTranslation: be.exampleZh,
  };
}

export function adaptWord(be: BackendWord): Word {
  return {
    id: be._id ? String(be._id) : "",
    word: be.word,
    phonetic: be.phonetic || "",
    coreMeaning: be.coreMeaning,
    coreImageType: be.physicalImageType,
    coreImageSvg: be.coreImageSvg || "",
    coreImageDescription: be.physicalImageDescription || "",
    coreExampleSentence: be.coreExampleEn,
    coreExampleTranslation: be.coreExampleZh,
    extendedMeanings: (be.extendedMeanings || []).map(adaptExtendedMeaning),
    collocations: be.collocations || [],
  };
}

export function adaptWordList(response: {
  data: BackendWord[];
  pagination: BackendPagination;
}): { words: Word[]; total: number } {
  return {
    words: (response.data || []).map(adaptWord),
    total: response.pagination?.total || 0,
  };
}

export function adaptWordbank(
  be: BackendWordbank,
  wordCount?: number
): WordLibrary {
  return {
    id: String(be._id),
    name: be.name,
    description: be.description,
    wordCount: wordCount ?? be.wordCount ?? 0,
    wordIds: [],
    createdAt: be.createdAt || "",
  };
}

export function adaptWordbankList(response: {
  data: BackendWordbank[];
  pagination: BackendPagination;
}): { libraries: WordLibrary[]; total: number } {
  return {
    libraries: (response.data || []).map((wb) => adaptWordbank(wb)),
    total: response.pagination?.total || 0,
  };
}

export function adaptUser(be: BackendUser): User {
  return {
    id: String(be._id),
    username: be.username,
    phone: be.phone,
    role: be.role,
    joinedAt: be.createdAt || "",
    learnedWords: Array.isArray(be.learnedWords) ? be.learnedWords.length : 0,
  };
}

export function adaptUserList(response: {
  data: BackendUser[];
  pagination?: BackendPagination;
}): User[] {
  return (response.data || []).map(adaptUser);
}
