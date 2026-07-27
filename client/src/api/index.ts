// ============================================================
// API 模块统一导出
// ============================================================

export { request, ApiRequestError } from "./request";
export type { ApiError, RequestOptions } from "./request";

export { apiLogin, apiRegister } from "./auth";
export type { LoginParams, RegisterParams, LoginResult, RegisterResult } from "./auth";

export {
  fetchWords,
  fetchWordById,
  createWord,
  updateWord,
  deleteWord,
  fetchWordDetail,
} from "./words";
export type { CreateWordInput, UpdateWordInput, WordDetail } from "./words";

export {
  fetchWordbanks,
  fetchWordbankById,
  fetchWordsByWordbank,
  createWordbank,
  updateWordbank,
  deleteWordbank,
} from "./wordbanks";

export { fetchUsers, fetchCurrentUser } from "./users";

export { recordLearn, fetchLearningRecords, fetchUserStats } from "./learning";
export type { UserStats } from "./learning";

export { favoriteWord, unfavoriteWord, fetchFavorites } from "./favorites";

export { fetchDailyWord } from "./daily-word";
export type { DailyWordResponse } from "./daily-word";

export { fetchDashboard } from "./dashboard";
export type { DashboardResponse } from "./dashboard";

export { generateWord, generateWordStream, regenerateImage } from "./ai";
export type { GenerateWordStreamCallbacks } from "./ai";

export { fetchMyNotes, fetchNotesByWord, createNote, deleteNote } from "./notes";

export {
  adaptWord,
  adaptWordList,
  adaptWordbank,
  adaptWordbankList,
  adaptUser,
  adaptUserList,
  mapPosToFront,
  mapPosToBackend,
} from "./adapters";
export type { BackendPagination } from "./adapters";
