import mongoose from "mongoose";
import { config } from "./index";

export async function connectDatabase(): Promise<void> {
  // 事件监听器必须在 mongoose.connect() 之前注册，
  // 否则 'connected' 事件在监听器注册前已触发，日志不会输出
  mongoose.connection.on("connected", () => {
    console.log(
      `MongoDB connected — pool: max=${config.dbMaxPoolSize}, idleTimeout=${config.dbIdleTimeoutMs}ms, connectTimeout=${config.dbConnectTimeoutMs}ms`
    );
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
  });

  if (config.nodeEnv === "development") {
    mongoose.set("debug", true);
  }

  try {
    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: config.dbMaxPoolSize,
      maxIdleTimeMS: config.dbIdleTimeoutMs,
      connectTimeoutMS: config.dbConnectTimeoutMs,
    });
  } catch (err) {
    const error = err as Error;
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

/**
 * Get the current mongoose connection instance (singleton pattern).
 * Used by service layer for dependency injection.
 */
export function getDB(): mongoose.Connection {
  return mongoose.connection;
}
