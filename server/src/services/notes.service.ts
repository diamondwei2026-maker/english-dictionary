import mongoose from "mongoose";
import { Note, INote } from "../models/Note.js";
import { AppError } from "../utils/errors.js";

// ============================================================
// 笔记服务
// ============================================================

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * 获取当前用户的所有笔记，按更新时间降序。
 */
export async function getMyNotes(userId: string): Promise<INote[]> {
  return Note.find({ userId }).sort({ updatedAt: -1 }).lean();
}

/**
 * 获取当前用户在某单词下的所有笔记，按更新时间降序。
 */
export async function getNotesByWord(
  userId: string,
  wordId: string,
): Promise<INote[]> {
  if (!isValidObjectId(wordId)) {
    throw new AppError(400, "INVALID_ID", "无效的单词 ID");
  }
  return Note.find({ userId, wordId }).sort({ updatedAt: -1 }).lean();
}

/**
 * 创建一条笔记。
 */
export async function createNote(
  userId: string,
  wordId: string,
  content: string,
): Promise<INote> {
  if (!isValidObjectId(wordId)) {
    throw new AppError(400, "INVALID_ID", "无效的单词 ID");
  }
  if (!content || !content.trim()) {
    throw new AppError(400, "EMPTY_CONTENT", "笔记内容不能为空");
  }
  if (content.length > 5000) {
    throw new AppError(400, "CONTENT_TOO_LONG", "笔记内容不能超过 5000 字");
  }

  const note = await Note.create({
    userId,
    wordId,
    content: content.trim(),
  });

  return note;
}

/**
 * 删除一条笔记。只有笔记所有者才能删除。
 */
export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<void> {
  if (!isValidObjectId(noteId)) {
    throw new AppError(400, "INVALID_ID", "无效的笔记 ID");
  }

  const note = await Note.findById(noteId);
  if (!note) {
    throw new AppError(404, "NOT_FOUND", "笔记不存在");
  }
  if (note.userId.toString() !== userId) {
    throw new AppError(403, "FORBIDDEN", "无权删除他人的笔记");
  }

  await Note.findByIdAndDelete(noteId);
}

/**
 * 获取某单词下所有用户的笔记（公开），按点赞数降序。
 * 使用 populate 获取 authorName。
 */
export async function getPublicNotesByWord(
  wordId: string,
): Promise<any[]> {
  if (!isValidObjectId(wordId)) {
    throw new AppError(400, "INVALID_ID", "无效的单词 ID");
  }
  const notes = await Note.find({ wordId })
    .populate("userId", "username")
    .lean();
  // 按 likedBy 长度降序
  notes.sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0));
  return notes.map((n: any) => ({
    _id: n._id,
    wordId: n.wordId,
    userId: n.userId?._id || n.userId,
    authorName: n.userId?.username || "",
    content: n.content,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    likedBy: (n.likedBy || []).map((id: any) => id.toString()),
  }));
}

/**
 * 点赞/取消点赞切换。
 * 返回更新后的 likedBy 数组和点赞数。
 */
export async function toggleLike(
  userId: string,
  noteId: string,
): Promise<{ likedBy: string[]; likeCount: number }> {
  if (!isValidObjectId(noteId)) {
    throw new AppError(400, "INVALID_ID", "无效的笔记 ID");
  }
  const note = await Note.findById(noteId);
  if (!note) {
    throw new AppError(404, "NOT_FOUND", "笔记不存在");
  }

  const idx = note.likedBy.findIndex(
    (id) => id.toString() === userId,
  );
  if (idx === -1) {
    note.likedBy.push(new mongoose.Types.ObjectId(userId));
  } else {
    note.likedBy.splice(idx, 1);
  }
  await note.save();
  return {
    likedBy: note.likedBy.map((id) => id.toString()),
    likeCount: note.likedBy.length,
  };
}
