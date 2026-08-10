import { AppError } from "../utils/errors.js";


export interface GenerateWordInput {
  wordName: string;
}

interface FieldError {
  field: string;
  message: string;
}

function collect(errs: FieldError[], field: string, message: string): void {
  errs.push({ field, message });
}

/**
 * 校验 AI 词条生成请求体
 */
export function validateGenerateWordInput(body: unknown): GenerateWordInput {
  const errs: FieldError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const { wordName } = body as Record<string, unknown>;

  // wordName
  if (!wordName) {
    collect(errs, "wordName", "单词名为必填项");
  } else if (typeof wordName !== "string") {
    collect(errs, "wordName", "单词名格式不正确");
  } else if (wordName.trim().length === 0) {
    collect(errs, "wordName", "单词名不能为空");
  } else if (wordName.length > 100) {
    collect(errs, "wordName", "单词名长度需在1-100字符之间");
  }

  if (errs.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  return {
    wordName: (wordName as string).trim(),
  };
}
