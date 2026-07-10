import { AppError } from "../utils/errors.js";

// slug 格式：小写字母+数字+连字符，不能以连字符开头或结尾
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface CreateWordBankInput {
  name: string;
  slug: string;
  description: string;
  cover_image?: string;
  gradient?: string;
  is_public?: boolean;
}

export interface UpdateWordBankInput {
  name?: string;
  slug?: string;
  description?: string;
  cover_image?: string;
  gradient?: string;
  is_public?: boolean;
}

interface FieldError {
  field: string;
  message: string;
}

function collect(errs: FieldError[], field: string, message: string): void {
  errs.push({ field, message });
}

export function validateCreateWordBankInput(body: unknown): CreateWordBankInput {
  const errs: FieldError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const { name, slug, description, cover_image, gradient, is_public } =
    body as Record<string, unknown>;

  // name
  if (!name) {
    collect(errs, "name", "词库名称为必填项");
  } else if (typeof name !== "string") {
    collect(errs, "name", "词库名称格式不正确");
  } else if (name.length < 1 || name.length > 100) {
    collect(errs, "name", "词库名称长度需在1-100字符之间");
  }

  // slug
  if (!slug) {
    collect(errs, "slug", "slug 为必填项");
  } else if (typeof slug !== "string") {
    collect(errs, "slug", "slug 格式不正确");
  } else {
    const normalized = slug.toLowerCase();
    if (!SLUG_REGEX.test(normalized)) {
      collect(errs, "slug", "slug 格式不正确（小写字母、数字和连字符）");
    }
  }

  // description
  if (!description) {
    collect(errs, "description", "词库描述为必填项");
  } else if (typeof description !== "string") {
    collect(errs, "description", "词库描述格式不正确");
  } else if (description.length < 1 || description.length > 500) {
    collect(errs, "description", "词库描述长度需在1-500字符之间");
  }

  // cover_image (optional)
  if (cover_image !== undefined && cover_image !== null) {
    if (typeof cover_image !== "string") {
      collect(errs, "cover_image", "封面图片格式不正确");
    }
  }

  // gradient (optional)
  if (gradient !== undefined && gradient !== null) {
    if (typeof gradient !== "string") {
      collect(errs, "gradient", "渐变色格式不正确");
    }
  }

  // is_public (optional)
  if (is_public !== undefined && is_public !== null) {
    if (typeof is_public !== "boolean") {
      collect(errs, "is_public", "is_public 字段必须为布尔值");
    }
  }

  if (errs.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  return {
    name: name as string,
    slug: (slug as string).toLowerCase(),
    description: description as string,
    cover_image: cover_image as string | undefined,
    gradient: gradient as string | undefined,
    is_public: is_public as boolean | undefined,
  };
}

export function validateUpdateWordBankInput(body: unknown): UpdateWordBankInput {
  const errs: FieldError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const { name, slug, description, cover_image, gradient, is_public } =
    body as Record<string, unknown>;

  // 检查是否至少有一个字段
  const hasAnyField = [name, slug, description, cover_image, gradient, is_public].some(
    (v) => v !== undefined
  );
  if (!hasAnyField) {
    throw new AppError(400, "VALIDATION_ERROR", "至少需要提供一个更新字段");
  }

  // name (optional)
  if (name !== undefined && name !== null) {
    if (typeof name !== "string") {
      collect(errs, "name", "词库名称格式不正确");
    } else if (name.length < 1 || name.length > 100) {
      collect(errs, "name", "词库名称长度需在1-100字符之间");
    }
  }

  // slug (optional)
  if (slug !== undefined && slug !== null) {
    if (typeof slug !== "string") {
      collect(errs, "slug", "slug 格式不正确");
    } else {
      const normalized = slug.toLowerCase();
      if (!SLUG_REGEX.test(normalized)) {
        collect(errs, "slug", "slug 格式不正确（小写字母、数字和连字符）");
      }
    }
  }

  // description (optional)
  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      collect(errs, "description", "词库描述格式不正确");
    } else if (description.length < 1 || description.length > 500) {
      collect(errs, "description", "词库描述长度需在1-500字符之间");
    }
  }

  // cover_image (optional)
  if (cover_image !== undefined && cover_image !== null) {
    if (typeof cover_image !== "string") {
      collect(errs, "cover_image", "封面图片格式不正确");
    }
  }

  // gradient (optional)
  if (gradient !== undefined && gradient !== null) {
    if (typeof gradient !== "string") {
      collect(errs, "gradient", "渐变色格式不正确");
    }
  }

  // is_public (optional)
  if (is_public !== undefined && is_public !== null) {
    if (typeof is_public !== "boolean") {
      collect(errs, "is_public", "is_public 字段必须为布尔值");
    }
  }

  if (errs.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  const result: UpdateWordBankInput = {};

  if (name !== undefined && name !== null) result.name = name as string;
  if (slug !== undefined && slug !== null) result.slug = (slug as string).toLowerCase();
  if (description !== undefined && description !== null) result.description = description as string;
  if (cover_image !== undefined && cover_image !== null) result.cover_image = cover_image as string;
  if (gradient !== undefined && gradient !== null) result.gradient = gradient as string;
  if (is_public !== undefined && is_public !== null) result.is_public = is_public as boolean;

  return result;
}
