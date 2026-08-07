# Plan: Decouple Words from Libraries + Add-to-Library Search Flow

## Context

Currently `Word` has a `libraryId: string` foreign key, meaning each word belongs to exactly one library at creation time. The user wants:
1. Words to be standalone entities (no library ownership)
2. The "add word" form to drop the "所属词库" selector
3. The flow to become: create library → search words → add words to library (many-to-many)

## Data Model Changes

### `src/app/data/types.ts`
- Remove `libraryId: string` from `Word`
- Add `wordIds: string[]` to `WordLibrary`

```ts
interface Word {
  id: string;
  // libraryId removed
  word: string;
  phonetic: string;
  coreMeaning: string;
  coreImageType: string;
  coreExampleSentence: string;
  coreExampleTranslation: string;
  extendedMeanings: ExtendedMeaning[];
  collocations: string[];
}

interface WordLibrary {
  id: string;
  name: string;
  description: string;
  wordCount: number;   // keep for now, computed from wordIds.length
  wordIds: string[];   // NEW — replaces the FK on Word
  createdAt: string;
}
```

### `src/app/data/mockData.ts`
- Strip `libraryId` from every mock word object
- Add `wordIds: string[]` to each mock library, transferring the existing associations (words that previously had that `libraryId` now appear in the library's `wordIds`)

## Component Changes

### `src/app/components/AdminView.tsx`

**WordEditForm (lines ~329–562)**:
- Remove `libraryId` from `initialForm` state
- Remove the "所属词库" `<select>` field (lines ~440–443)
- Remove `libraryId` from the save guard in `handleSave` (line 388 check)
- `onSave` type signature stays the same but omits `libraryId`

**WordManager**:
- Remove library badge display per word (currently uses `libraries.find(l => l.id === word.libraryId)`)
- Word list is now a flat list of all words, no library filter needed

**LibraryManager** — add "Add Words" sub-flow inside each library's expanded/edit view:
- A search input that filters `words` by `word.word` (English text)
- Filtered results listed with an "+ Add" button per result
- Clicking "+ Add" pushes the word's id into `library.wordIds` (deduped)
- Already-added words show a "✓ Already added" or remove button instead
- This sub-flow lives inside the existing `LibraryManager` component, toggled by a "管理单词" button per library row

**State shape in AdminView**:
- `libraries` state changes from `WordLibrary[]` (old) to `WordLibrary[]` (new, with `wordIds`)
- `addLib` initializer adds `wordIds: []`
- New handler: `addWordToLib(libId: string, wordId: string)` — updates matching library's `wordIds`
- New handler: `removeWordFromLib(libId: string, wordId: string)` — same but filters out

### `src/app/components/LibrariesView.tsx`

**LibraryWordsView** (line ~109):
- Change filter from `mockWords.filter(w => w.libraryId === libraryId)`
- To: look up the library's `wordIds` then `mockWords.filter(w => library.wordIds.includes(w.id))`
- Since `LibrariesView` reads from `mockLibraries` / `mockWords` directly (not admin state), also update `mockLibraries` seed data (covered by mockData.ts change above)

**Word count display** (line ~38):
- Change from `mockWords.filter(w => w.libraryId === lib.id).length`
- To: `lib.wordIds.length`

## File Summary

| File | Change |
|---|---|
| `src/app/data/types.ts` | Remove `libraryId` from Word; add `wordIds` to WordLibrary |
| `src/app/data/mockData.ts` | Strip `libraryId` from words; add `wordIds` arrays to libraries |
| `src/app/components/AdminView.tsx` | Remove library field from WordEditForm; add word-search-and-add UI to LibraryManager |
| `src/app/components/LibrariesView.tsx` | Update word filtering to use `library.wordIds` |

## Verification

1. Open the Admin view → Word Manager → "新增单词" — confirm no "所属词库" field appears
2. Open Admin view → Library Manager → open a library → confirm "管理单词" panel appears with a search input
3. Search a word and add it → confirm the word appears in the library's word list (user-facing)
4. Open the user-facing 词库 view → open a library → confirm words are listed correctly
5. Confirm word count badges on library cards update correctly
