import { AppError } from "../utils/errors.js";
import { PHYSICAL_IMAGE_TYPES, PART_OF_SPEECH_TYPES, DIFFICULTY_LEVELS } from "../models/index.js";

// === 输入类型 ===

export interface ExtendedMeaningInput {
  evolutionDescription: string;
  meaning: string;
  partOfSpeech: string;
  exampleEn: string;
  exampleZh: string;
}

export interface CreateWordInput {
  word: string;
  wordbankId: string;
  phonetic?: string;
  coreMeaning: string;
  coreExampleEn: string;
  coreExampleZh: string;
  physicalImageType?: string;
  physicalImageDescription?: string;
  coreImageSvg?: string;
  extendedMeanings?: ExtendedMeaningInput[];
  collocations?: string[];
  difficulty?: string;
}

export interface UpdateWordInput {
  word?: string;
  phonetic?: string;
  coreMeaning?: string;
  coreExampleEn?: string;
  coreExampleZh?: string;
  physicalImageType?: string;
  physicalImageDescription?: string;
  coreImageSvg?: string;
  extendedMeanings?: ExtendedMeaningInput[];
  collocations?: string[];
  difficulty?: string;
}

// === 辅助类型 ===

interface FieldError {
  field: string;
  message: string;
}

function collect(errs: FieldError[], field: string, message: string): void {
  errs.push({ field, message });
}

// === ObjectId 格式简单校验 ===

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// === ExtendedMeaning 校验 ===

function validateExtendedMeaning(
  obj: unknown,
  index: number
): ExtendedMeaningInput {
  const errs: FieldError[] = [];
  const prefix = `extendedMeanings[${index}]`;

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    collect(errs, `extendedMeanings[${index}]`, "格式不正确，必须为对象");
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  const { evolutionDescription, meaning, partOfSpeech, exampleEn, exampleZh } =
    obj as Record<string, unknown>;

  // evolutionDescription
  if (!evolutionDescription) {
    collect(errs, `${prefix}.evolutionDescription`, "逻辑演化描述为必填项");
  } else if (typeof evolutionDescription !== "string") {
    collect(errs, `${prefix}.evolutionDescription`, "逻辑演化描述格式不正确");
  } else if (
    evolutionDescription.length < 1 ||
    evolutionDescription.length > 500
  ) {
    collect(
      errs,
      `${prefix}.evolutionDescription`,
      "逻辑演化描述长度需在1-500字符之间"
    );
  }

  // meaning
  if (!meaning) {
    collect(errs, `${prefix}.meaning`, "引申义为必填项");
  } else if (typeof meaning !== "string") {
    collect(errs, `${prefix}.meaning`, "引申义格式不正确");
  } else if (meaning.length < 1 || meaning.length > 200) {
    collect(errs, `${prefix}.meaning`, "引申义长度需在1-200字符之间");
  }

  // partOfSpeech
  if (!partOfSpeech) {
    collect(errs, `${prefix}.partOfSpeech`, "词性为必填项");
  } else if (typeof partOfSpeech !== "string") {
    collect(errs, `${prefix}.partOfSpeech`, "词性格式不正确");
  } else if (
    !(PART_OF_SPEECH_TYPES as readonly string[]).includes(partOfSpeech)
  ) {
    collect(
      errs,
      `${prefix}.partOfSpeech`,
      `词性必须为以下之一：${(PART_OF_SPEECH_TYPES as readonly string[]).join(", ")}`
    );
  }

  // exampleEn
  if (!exampleEn) {
    collect(errs, `${prefix}.exampleEn`, "英文例句为必填项");
  } else if (typeof exampleEn !== "string") {
    collect(errs, `${prefix}.exampleEn`, "英文例句格式不正确");
  } else if (exampleEn.length < 1 || exampleEn.length > 1000) {
    collect(errs, `${prefix}.exampleEn`, "英文例句长度需在1-1000字符之间");
  }

  // exampleZh
  if (!exampleZh) {
    collect(errs, `${prefix}.exampleZh`, "中文翻译为必填项");
  } else if (typeof exampleZh !== "string") {
    collect(errs, `${prefix}.exampleZh`, "中文翻译格式不正确");
  } else if (exampleZh.length < 1 || exampleZh.length > 1000) {
    collect(errs, `${prefix}.exampleZh`, "中文翻译长度需在1-1000字符之间");
  }

  if (errs.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  return {
    evolutionDescription: evolutionDescription as string,
    meaning: meaning as string,
    partOfSpeech: partOfSpeech as string,
    exampleEn: exampleEn as string,
    exampleZh: exampleZh as string,
  };
}

// === CreateWordInput 校验 ===

export function validateCreateWordInput(body: unknown): CreateWordInput {
  const errs: FieldError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const {
    word,
    wordbankId,
    phonetic,
    coreMeaning,
    coreExampleEn,
    coreExampleZh,
    physicalImageType,
    physicalImageDescription,
    coreImageSvg,
    extendedMeanings,
    collocations,
    difficulty,
  } = body as Record<string, unknown>;

  // word
  if (!word) {
    collect(errs, "word", "单词名为必填项");
  } else if (typeof word !== "string") {
    collect(errs, "word", "单词名格式不正确");
  } else if (word.length < 1 || word.length > 100) {
    collect(errs, "word", "单词名长度需在1-100字符之间");
  }

  // wordbankId
  if (!wordbankId) {
    collect(errs, "wordbankId", "词库 ID 为必填项");
  } else if (typeof wordbankId !== "string") {
    collect(errs, "wordbankId", "词库 ID 格式不正确");
  } else if (!OBJECT_ID_REGEX.test(wordbankId)) {
    collect(errs, "wordbankId", "词库 ID 格式无效");
  }

  // phonetic (optional)
  if (phonetic !== undefined && phonetic !== null) {
    if (typeof phonetic !== "string") {
      collect(errs, "phonetic", "音标格式不正确");
    } else if (phonetic.length > 100) {
      collect(errs, "phonetic", "音标长度不能超过100字符");
    }
  }

  // coreMeaning
  if (!coreMeaning) {
    collect(errs, "coreMeaning", "核心义为必填项");
  } else if (typeof coreMeaning !== "string") {
    collect(errs, "coreMeaning", "核心义格式不正确");
  } else if (coreMeaning.length < 1 || coreMeaning.length > 500) {
    collect(errs, "coreMeaning", "核心义长度需在1-500字符之间");
  }

  // coreExampleEn
  if (!coreExampleEn) {
    collect(errs, "coreExampleEn", "核心义英文例句为必填项");
  } else if (typeof coreExampleEn !== "string") {
    collect(errs, "coreExampleEn", "核心义英文例句格式不正确");
  } else if (coreExampleEn.length < 1 || coreExampleEn.length > 1000) {
    collect(
      errs,
      "coreExampleEn",
      "核心义英文例句长度需在1-1000字符之间"
    );
  }

  // coreExampleZh
  if (!coreExampleZh) {
    collect(errs, "coreExampleZh", "核心义中文翻译为必填项");
  } else if (typeof coreExampleZh !== "string") {
    collect(errs, "coreExampleZh", "核心义中文翻译格式不正确");
  } else if (coreExampleZh.length < 1 || coreExampleZh.length > 1000) {
    collect(
      errs,
      "coreExampleZh",
      "核心义中文翻译长度需在1-1000字符之间"
    );
  }

  // physicalImageType（可选 — 无物理意象的词可以为空）
  if (physicalImageType !== undefined && physicalImageType !== null && physicalImageType !== "") {
    if (typeof physicalImageType !== "string") {
      collect(errs, "physicalImageType", "物理意象类型格式不正确");
    } else if (
      !(PHYSICAL_IMAGE_TYPES as readonly string[]).includes(physicalImageType)
    ) {
      collect(
        errs,
        "physicalImageType",
        `物理意象类型必须为以下之一：${(PHYSICAL_IMAGE_TYPES as readonly string[]).join(", ")}`
      );
    }
  }

  // physicalImageDescription（可选 — 无物理意象的词可以为空）
  if (
    physicalImageDescription !== undefined &&
    physicalImageDescription !== null &&
    physicalImageDescription !== ""
  ) {
    if (typeof physicalImageDescription !== "string") {
      collect(errs, "physicalImageDescription", "物理意象描述格式不正确");
    } else if (
      physicalImageDescription.length < 1 ||
      physicalImageDescription.length > 500
    ) {
      collect(
        errs,
        "physicalImageDescription",
        "物理意象描述长度需在1-500字符之间"
      );
    }
  }

  // extendedMeanings (optional)
  const parsedExtendedMeanings: ExtendedMeaningInput[] = [];
  if (extendedMeanings !== undefined && extendedMeanings !== null) {
    if (!Array.isArray(extendedMeanings)) {
      collect(errs, "extendedMeanings", "引申义必须为数组");
    } else if (extendedMeanings.length > 50) {
      collect(errs, "extendedMeanings", "引申义数量不能超过50个");
    } else {
      for (let i = 0; i < extendedMeanings.length; i++) {
        try {
          parsedExtendedMeanings.push(
            validateExtendedMeaning(extendedMeanings[i], i)
          );
        } catch (e) {
          if (e instanceof AppError && e.errors) {
            errs.push(...e.errors);
          } else {
            throw e;
          }
        }
      }
    }
  }

  // collocations (optional)
  if (collocations !== undefined && collocations !== null) {
    if (!Array.isArray(collocations)) {
      collect(errs, "collocations", "搭配必须为数组");
    } else if (collocations.length > 100) {
      collect(errs, "collocations", "搭配数量不能超过100个");
    } else {
      for (let i = 0; i < collocations.length; i++) {
        const item = collocations[i];
        if (typeof item !== "string") {
          collect(errs, `collocations[${i}]`, "搭配项格式不正确");
        } else if (item.length < 1 || item.length > 200) {
          collect(
            errs,
            `collocations[${i}]`,
            "搭配项长度需在1-200字符之间"
          );
        }
      }
    }
  }

  // difficulty (optional, default "other")
  let resolvedDifficulty = "other";
  if (difficulty !== undefined && difficulty !== null) {
    if (typeof difficulty !== "string") {
      collect(errs, "difficulty", "难度等级格式不正确");
    } else if (!(DIFFICULTY_LEVELS as readonly string[]).includes(difficulty)) {
      collect(errs, "difficulty", `难度等级必须为以下之一：${(DIFFICULTY_LEVELS as readonly string[]).join(", ")}`);
    } else {
      resolvedDifficulty = difficulty;
    }
  }

  if (errs.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  return {
    word: word as string,
    wordbankId: wordbankId as string,
    phonetic: phonetic as string | undefined,
    coreMeaning: coreMeaning as string,
    coreExampleEn: coreExampleEn as string,
    coreExampleZh: coreExampleZh as string,
    physicalImageType: physicalImageType as string,
    physicalImageDescription: physicalImageDescription as string,
    coreImageSvg: coreImageSvg as string | undefined,
    extendedMeanings: parsedExtendedMeanings,
    collocations: collocations as string[] | undefined,
    difficulty: resolvedDifficulty,
  };
}

// === UpdateWordInput 校验 ===

export function validateUpdateWordInput(body: unknown): UpdateWordInput {
  const errs: FieldError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const {
    word,
    phonetic,
    coreMeaning,
    coreExampleEn,
    coreExampleZh,
    physicalImageType,
    physicalImageDescription,
    coreImageSvg,
    extendedMeanings,
    collocations,
    difficulty,
  } = body as Record<string, unknown>;

  // 检查是否至少有一个字段
  const hasAnyField = [
    word,
    phonetic,
    coreMeaning,
    coreExampleEn,
    coreExampleZh,
    physicalImageType,
    physicalImageDescription,
    coreImageSvg,
    extendedMeanings,
    collocations,
    difficulty,
  ].some((v) => v !== undefined);
  if (!hasAnyField) {
    throw new AppError(400, "VALIDATION_ERROR", "至少需要提供一个更新字段");
  }

  // word (optional)
  if (word !== undefined && word !== null) {
    if (typeof word !== "string") {
      collect(errs, "word", "单词名格式不正确");
    } else if (word.length < 1 || word.length > 100) {
      collect(errs, "word", "单词名长度需在1-100字符之间");
    }
  }

  // phonetic (optional)
  if (phonetic !== undefined && phonetic !== null) {
    if (typeof phonetic !== "string") {
      collect(errs, "phonetic", "音标格式不正确");
    } else if (phonetic.length > 100) {
      collect(errs, "phonetic", "音标长度不能超过100字符");
    }
  }

  // coreMeaning (optional)
  if (coreMeaning !== undefined && coreMeaning !== null) {
    if (typeof coreMeaning !== "string") {
      collect(errs, "coreMeaning", "核心义格式不正确");
    } else if (coreMeaning.length < 1 || coreMeaning.length > 500) {
      collect(errs, "coreMeaning", "核心义长度需在1-500字符之间");
    }
  }

  // coreExampleEn (optional)
  if (coreExampleEn !== undefined && coreExampleEn !== null) {
    if (typeof coreExampleEn !== "string") {
      collect(errs, "coreExampleEn", "核心义英文例句格式不正确");
    } else if (coreExampleEn.length < 1 || coreExampleEn.length > 1000) {
      collect(
        errs,
        "coreExampleEn",
        "核心义英文例句长度需在1-1000字符之间"
      );
    }
  }

  // coreExampleZh (optional)
  if (coreExampleZh !== undefined && coreExampleZh !== null) {
    if (typeof coreExampleZh !== "string") {
      collect(errs, "coreExampleZh", "核心义中文翻译格式不正确");
    } else if (coreExampleZh.length < 1 || coreExampleZh.length > 1000) {
      collect(
        errs,
        "coreExampleZh",
        "核心义中文翻译长度需在1-1000字符之间"
      );
    }
  }

  // physicalImageType (optional — 可置空)
  if (physicalImageType !== undefined && physicalImageType !== null) {
    if (typeof physicalImageType !== "string") {
      collect(errs, "physicalImageType", "物理意象类型格式不正确");
    } else if (
      physicalImageType !== "" &&
      !(PHYSICAL_IMAGE_TYPES as readonly string[]).includes(physicalImageType)
    ) {
      collect(
        errs,
        "physicalImageType",
        `物理意象类型必须为以下之一：${(PHYSICAL_IMAGE_TYPES as readonly string[]).join(", ")}，或为空字符串`
      );
    }
  }

  // physicalImageDescription (optional)
  if (
    physicalImageDescription !== undefined &&
    physicalImageDescription !== null
  ) {
    if (typeof physicalImageDescription !== "string") {
      collect(errs, "physicalImageDescription", "物理意象描述格式不正确");
    } else if (
      physicalImageDescription !== "" &&
      (physicalImageDescription.length < 1 ||
      physicalImageDescription.length > 500)
    ) {
      collect(
        errs,
        "physicalImageDescription",
        "物理意象描述长度需在1-500字符之间"
      );
    }
  }

  // extendedMeanings (optional) — PUT 语义全量替换
  const parsedExtendedMeanings: ExtendedMeaningInput[] = [];
  if (extendedMeanings !== undefined && extendedMeanings !== null) {
    if (!Array.isArray(extendedMeanings)) {
      collect(errs, "extendedMeanings", "引申义必须为数组");
    } else if (extendedMeanings.length > 50) {
      collect(errs, "extendedMeanings", "引申义数量不能超过50个");
    } else {
      for (let i = 0; i < extendedMeanings.length; i++) {
        try {
          parsedExtendedMeanings.push(
            validateExtendedMeaning(extendedMeanings[i], i)
          );
        } catch (e) {
          if (e instanceof AppError && e.errors) {
            errs.push(...e.errors);
          } else {
            throw e;
          }
        }
      }
    }
  }

  // collocations (optional)
  if (collocations !== undefined && collocations !== null) {
    if (!Array.isArray(collocations)) {
      collect(errs, "collocations", "搭配必须为数组");
    } else if (collocations.length > 100) {
      collect(errs, "collocations", "搭配数量不能超过100个");
    } else {
      for (let i = 0; i < collocations.length; i++) {
        const item = collocations[i];
        if (typeof item !== "string") {
          collect(errs, `collocations[${i}]`, "搭配项格式不正确");
        } else if (item.length < 1 || item.length > 200) {
          collect(
            errs,
            `collocations[${i}]`,
            "搭配项长度需在1-200字符之间"
          );
        }
      }
    }
  }

  // difficulty (optional)
  if (difficulty !== undefined && difficulty !== null) {
    if (typeof difficulty !== "string") {
      collect(errs, "difficulty", "难度等级格式不正确");
    } else if (!(DIFFICULTY_LEVELS as readonly string[]).includes(difficulty)) {
      collect(errs, "difficulty", `难度等级必须为以下之一：${(DIFFICULTY_LEVELS as readonly string[]).join(", ")}`);
    }
  }

  if (errs.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  const result: UpdateWordInput = {};

  if (word !== undefined && word !== null) result.word = word as string;
  if (phonetic !== undefined && phonetic !== null)
    result.phonetic = phonetic as string;
  if (coreMeaning !== undefined && coreMeaning !== null)
    result.coreMeaning = coreMeaning as string;
  if (coreExampleEn !== undefined && coreExampleEn !== null)
    result.coreExampleEn = coreExampleEn as string;
  if (coreExampleZh !== undefined && coreExampleZh !== null)
    result.coreExampleZh = coreExampleZh as string;
  if (physicalImageType !== undefined && physicalImageType !== null)
    result.physicalImageType = physicalImageType as string;
  if (
    physicalImageDescription !== undefined &&
    physicalImageDescription !== null
  )
    result.physicalImageDescription = physicalImageDescription as string;
  if (coreImageSvg !== undefined && coreImageSvg !== null)
    result.coreImageSvg = coreImageSvg as string;
  if (
    extendedMeanings !== undefined &&
    extendedMeanings !== null &&
    Array.isArray(extendedMeanings)
  ) {
    result.extendedMeanings = parsedExtendedMeanings;
  }
  if (collocations !== undefined && collocations !== null)
    result.collocations = collocations as string[];
  if (difficulty !== undefined && difficulty !== null)
    result.difficulty = difficulty as string;

  return result;
}
