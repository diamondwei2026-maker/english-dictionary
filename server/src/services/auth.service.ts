import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { User, IUser } from "../models";
import { AppError } from "../utils/errors.js";
import { signToken } from "../utils/jwt.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validator.js";

const SALT_ROUNDS = 10;

function desensitizePhone(phone: string): string {
  return phone.slice(0, 3) + "****" + phone.slice(-4);
}

export async function register(input: RegisterInput): Promise<IUser> {
  // 检查手机号唯一性
  const existing = await User.findOne({ phone: input.phone });
  if (existing) {
    throw new AppError(409, "PHONE_EXISTS", "该手机号已注册");
  }

  // 默认 username：手机号脱敏
  const username = input.username || desensitizePhone(input.phone);

  // bcrypt 加密
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    const user = await User.create({
      phone: input.phone,
      passwordHash,
      username,
      role: "user",
    });
    return user;
  } catch (err) {
    // 竞态保护：MongoDB unique index 兜底，重复手机号 → 409
    if (
      err instanceof mongoose.mongo.MongoServerError &&
      err.code === 11000
    ) {
      throw new AppError(409, "PHONE_EXISTS", "该手机号已注册");
    }
    throw err;
  }
}

export async function login(
  input: LoginInput
): Promise<{ user: IUser; token: string }> {
  const user = await User.findOne({ phone: input.phone });
  if (!user) {
    // 不区分"用户不存在"和"密码错误"，防撞库
    throw new AppError(401, "INVALID_CREDENTIALS", "手机号或密码错误");
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, "INVALID_CREDENTIALS", "手机号或密码错误");
  }

  const token = signToken({ userId: user._id.toString(), role: user.role });
  return { user, token };
}
