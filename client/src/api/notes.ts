// ============================================================
// 笔记 API 模块
// ============================================================

import { request } from "./request";
import type { Note } from "../data/types";

/** 后端笔记响应格式 */
interface BackendNoteResponse {
  _id: string;
  wordId: string;
  userId: string;
  authorName?: string;
  content: string;
  createdAt: string;
  likedBy?: string[];
}

/** 适配后端笔记 → 前端 Note 接口 */
function adaptNote(raw: BackendNoteResponse): Note {
  return {
    id: raw._id,
    wordId: raw.wordId,
    userId: raw.userId,
    authorName: raw.authorName || "",
    content: raw.content,
    createdAt: raw.createdAt?.slice(0, 10) || "",
    likedBy: raw.likedBy || [],
  };
}

function adaptNoteList(rawList: BackendNoteResponse[]): Note[] {
  return rawList.map(adaptNote);
}

/**
 * 获取当前用户的所有笔记。
 * GET /api/v1/notes
 */
export function fetchMyNotes(): Promise<Note[]> {
  return request<BackendNoteResponse[]>("/api/v1/notes").then(adaptNoteList);
}

/**
 * 获取当前用户在某单词下的笔记。
 * GET /api/v1/notes?wordId=xxx
 */
export function fetchNotesByWord(wordId: string): Promise<Note[]> {
  return request<BackendNoteResponse[]>(`/api/v1/notes?wordId=${encodeURIComponent(wordId)}`).then(adaptNoteList);
}

/**
 * 创建一条笔记。
 * POST /api/v1/notes
 */
export function createNote(params: {
  wordId: string;
  content: string;
}): Promise<Note> {
  return request<BackendNoteResponse>("/api/v1/notes", {
    method: "POST",
    data: params as unknown as Record<string, unknown>,
  }).then(adaptNote);
}

/**
 * 删除一条笔记。
 * DELETE /api/v1/notes/:id
 */
export function deleteNote(id: string): Promise<void> {
  return request<void>(`/api/v1/notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * 获取某单词下所有用户的笔记（公开，无需认证），按点赞数降序。
 * GET /api/v1/notes/public?wordId=xxx
 */
export function fetchPublicNotesByWord(wordId: string): Promise<Note[]> {
  return request<BackendNoteResponse[]>(
    `/api/v1/notes/public?wordId=${encodeURIComponent(wordId)}`
  ).then(adaptNoteList);
}

/**
 * 点赞切换（有则取消，无则添加）。
 * POST /api/v1/notes/:id/like
 */
export function toggleLikeNote(
  noteId: string
): Promise<{ likedBy: string[]; likeCount: number }> {
  return request(`/api/v1/notes/${encodeURIComponent(noteId)}/like`, {
    method: "POST",
  });
}
