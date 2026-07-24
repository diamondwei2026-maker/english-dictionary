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
