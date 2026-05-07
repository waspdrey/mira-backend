import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app";
import { logger } from "./lib/logger";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const apiEnvPath = path.resolve(currentDir, "../.env");
const rootEnvPath = path.resolve(currentDir, "../../../.env");

const preservedDecartApiKey = process.env["DECART_API_KEY"];
loadEnv({ path: rootEnvPath });
// Backend-local env should override root env values.
loadEnv({ path: apiEnvPath, override: true });
// But explicit shell env vars should still take highest precedence.
if (preservedDecartApiKey !== undefined) {
  process.env["DECART_API_KEY"] = preservedDecartApiKey;
}

const rawPort = process.env["PORT"] ?? "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
