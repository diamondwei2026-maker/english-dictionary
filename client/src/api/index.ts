export { login, register } from "./auth";
export type { LoginParams, RegisterParams, LoginResult, RegisterResult } from "./auth";
export { request, getToken, setToken, removeToken, TOKEN_KEY, ApiRequestError } from "./request";
export type { ApiError, RequestOptions } from "./request";

export {
  fetchWords,
  fetchWordById,
  fetchWordDetail,
  createWord,
  updateWord,
  deleteWord,
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

export { generateWord, generateWordStream } from "./ai";
export type { GenerateWordStreamCallbacks } from "./ai";

export { recordLearn, fetchLearningRecords, fetchUserStats } from "./learning";
export type { UserStats } from "./learning";

export { favoriteWord, unfavoriteWord, fetchFavorites } from "./favorites";

export { fetchDailyWord } from "./daily-word";
export type { DailyWordResponse } from "./daily-word";
export { fetchDashboard } from "./dashboard";
export type { DashboardResponse } from "./dashboard";

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
