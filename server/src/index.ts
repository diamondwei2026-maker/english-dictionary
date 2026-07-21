import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectDatabase } from "./config/database.js";

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });

  // 端口占用处理
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${config.port} is already in use. Please free the port and try again.`
      );
      process.exit(1);
    }
    throw err;
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
