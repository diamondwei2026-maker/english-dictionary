import { AppError } from "../utils/errors.js";

// ============================================================
// validateGetQuestionsQuery — GET /quiz/questions 参数校验
// ============================================================

const VALID_DIRECTIONS = ["zh2en", "en2zh"] as const;

export function validateGetQuestionsQuery(query: unknown): {
  direction: string;
  wordId?: string;
} {
  if (!query || typeof query !== "object") {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "缺少必填参数 direction（可选值：zh2en / en2zh）",
    );
  }

  const q = query as Record<string, unknown>;
  const direction = q.direction;

  if (!direction || typeof direction !== "string") {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "缺少必填参数 direction（可选值：zh2en / en2zh）",
    );
  }

  if (!VALID_DIRECTIONS.includes(direction as "zh2en" | "en2zh")) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `direction 参数值非法: "${direction}"，仅支持 zh2en / en2zh`,
    );
  }

  const wordId = q.wordId;
  if (wordId !== undefined && (typeof wordId !== "string" || wordId.length === 0)) {
    throw new AppError(400, "VALIDATION_ERROR", "wordId 参数格式不正确");
  }

  return {
    direction: direction as string,
    wordId: wordId as string | undefined,
  };
}

// ============================================================
// validateGenerateBody — POST /quiz/generate 请求体校验
// ============================================================

export function validateGenerateBody(body: unknown): {
  wordbankId: string;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const b = body as Record<string, unknown>;
  const wordbankId = b.wordbankId;

  if (!wordbankId || typeof wordbankId !== "string" || wordbankId.trim().length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "wordbankId 为必填项");
  }

  return { wordbankId: wordbankId.trim() };
}

// ============================================================
// validateSubmitAnswerBody — POST /quiz/submit 请求体校验
// ============================================================

export function validateSubmitAnswerBody(body: unknown): {
  questionId: string;
  userInput: string;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const b = body as Record<string, unknown>;
  const errors: Array<{ field: string; message: string }> = [];

  // questionId
  const questionId = b.questionId;
  if (!questionId) {
    errors.push({ field: "questionId", message: "questionId 为必填项" });
  } else if (typeof questionId !== "string" || questionId.trim().length === 0) {
    errors.push({ field: "questionId", message: "questionId 格式不正确" });
  }

  // userInput
  const userInput = b.userInput;
  if (userInput === undefined || userInput === null) {
    errors.push({ field: "userInput", message: "userInput 为必填项" });
  } else if (typeof userInput !== "string") {
    errors.push({ field: "userInput", message: "userInput 格式不正确" });
  } else {
    const trimmed = userInput.trim();
    if (trimmed.length === 0) {
      errors.push({ field: "userInput", message: "userInput 不能为空" });
    } else if (trimmed.length > 2000) {
      errors.push({
        field: "userInput",
        message: `userInput 长度不能超过 2000 字（当前 ${trimmed.length} 字）`,
      });
    }
  }

  if (errors.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errors);
  }

  return {
    questionId: (questionId as string).trim(),
    userInput: userInput as string,
  };
}

// ============================================================
// validateHistoryQuery — GET /quiz/history 参数校验
// ============================================================

export function validateHistoryQuery(query: unknown): {
  page: number;
  limit: number;
} {
  const page = 1;
  const limit = 20;

  if (!query || typeof query !== "object") {
    return { page, limit };
  }

  const q = query as Record<string, unknown>;

  const parsePositiveInt = (
    value: unknown,
    fieldName: string,
    defaultValue: number,
  ): number => {
    if (value === undefined || value === null) return defaultValue;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        `${fieldName} 必须为正整数，当前值: ${value}`,
      );
    }
    return parsed;
  };

  return {
    page: parsePositiveInt(q.page, "page", 1),
    limit: parsePositiveInt(q.limit, "limit", 20),
  };
}
