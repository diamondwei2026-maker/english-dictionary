export { login, register } from "./auth";
export type { LoginParams, RegisterParams, LoginResult, RegisterResult } from "./auth";
export { request, getToken, setToken, removeToken, TOKEN_KEY, ApiRequestError } from "./request";
export type { ApiError, RequestOptions } from "./request";

export {
  fetchWords,
  fetchWordById,
  createWord,
  updateWord,
  deleteWord,
} from "./words";
export type { CreateWordInput, UpdateWordInput } from "./words";

export {
  fetchWordbanks,
  fetchWordbankById,
  fetchWordsByWordbank,
  createWordbank,
  updateWordbank,
  deleteWordbank,
} from "./wordbanks";

export { fetchUsers, fetchCurrentUser } from "./users";

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
