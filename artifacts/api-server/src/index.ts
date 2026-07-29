import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { connectDB, ConfigModel } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedDefaultConfig() {
  const defaults = [
    { key: "premium_price", value: "10000 FCFA" },
    { key: "free_limit", value: "5" },
  ];
  for (const entry of defaults) {
    await ConfigModel.findOneAndUpdate(
      { key: entry.key },
      { $setOnInsert: { key: entry.key, value: entry.value, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

connectDB()
  .then(async () => {
    logger.info("Connected to MongoDB");
    await seedDefaultConfig();
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to MongoDB");
    process.exit(1);
  });
