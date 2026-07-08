import { AppError } from "../utils/errors";

// 中国大陆手机号：1 开头，第二位 3-9，共 11 位
const PHONE_REGEX = /^1[3-9]\d{9}$/;

// 密码至少 6 位，且同时包含字母和数字
const PASSWORD_LETTER_NUMBER = /(?=.*[a-zA-Z])(?=.*\d)/;

export interface RegisterInput {
  phone: string;
  password: string;
  username?: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

interface FieldError {
  field: string;
  message: string;
}

function collect(errs: FieldError[], field: string, message: string): void {
  errs.push({ field, message });
}

export function validateRegisterInput(body: unknown): RegisterInput {
  const errs: FieldError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const { phone, password, username } = body as Record<string, unknown>;

  // phone
  if (!phone) {
    collect(errs, "phone", "手机号为必填项");
  } else if (typeof phone !== "string" || !PHONE_REGEX.test(phone)) {
    collect(errs, "phone", "手机号格式不正确（11位中国大陆手机号）");
  }

  // password
  if (!password) {
    collect(errs, "password", "密码为必填项");
  } else if (typeof password !== "string") {
    collect(errs, "password", "密码格式不正确");
  } else {
    if (password.length < 6) {
      collect(errs, "password", "密码长度至少为6位");
    }
    if (!PASSWORD_LETTER_NUMBER.test(password)) {
      collect(errs, "password", "密码必须同时包含字母和数字");
    }
  }

  // username (optional)
  if (username !== undefined && username !== null) {
    if (typeof username !== "string") {
      collect(errs, "username", "昵称格式不正确");
    }
  }

  if (errs.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  return {
    phone: phone as string,
    password: password as string,
    username: username as string | undefined,
  };
}

export function validateLoginInput(body: unknown): LoginInput {
  const errs: FieldError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "请求体格式错误");
  }

  const { phone, password } = body as Record<string, unknown>;

  if (!phone) {
    collect(errs, "phone", "手机号为必填项");
  } else if (typeof phone !== "string" || !PHONE_REGEX.test(phone)) {
    collect(errs, "phone", "手机号格式不正确（11位中国大陆手机号）");
  }

  if (!password) {
    collect(errs, "password", "密码为必填项");
  } else if (typeof password !== "string") {
    collect(errs, "password", "密码格式不正确");
  }

  if (errs.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errs);
  }

  return {
    phone: phone as string,
    password: password as string,
  };
}
