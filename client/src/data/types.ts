// Ported from figma-prototype/src/app/data/types.ts

export interface ExtendedMeaning {
  id: string;
  logicalEvolution: string;
  meaning: string;
  partOfSpeech: string;
  exampleSentence: string;
  exampleTranslation: string;
}

export interface Word {
  id: string;
  libraryId: string;
  word: string;
  phonetic: string;
  coreMeaning: string;
  coreImageType: string;
  coreImageSvg?: string;
  coreImageDescription: string;
  coreExampleSentence: string;
  coreExampleTranslation: string;
  extendedMeanings: ExtendedMeaning[];
  collocations: string[];
}

export interface WordLibrary {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  phone: string;
  role: 'admin' | 'user';
  joinedAt: string;
  learnedWords: number;
}

export interface AuthUser {
  id: string;
  username: string;
  phone: string;
  role: 'admin' | 'user';
}

export interface Note {
  id: string;
  wordId: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: string;
  likedBy: string[];
}

export type AdminTab = 'overview' | 'libraries' | 'words' | 'users';

// ============================================================
// Quiz / Training types (ported from figma/src/app/data/types.ts)
// ============================================================

export type QuizDirection = 'zh2en' | 'en2zh';

export interface QuizItem {
  id: string;
  wordId?: string;
  direction: QuizDirection;
  prompt: string;
  hint: string;
  reference: string;
  keywords: string[];
  analysis: string;
}

export interface QuizResult {
  correct: boolean;
  score: number;
  matched: string[];
  missing: string[];
  analysis: string;
}
