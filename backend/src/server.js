import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { MlService } from "./modules/ml/ml.service.js";

const PORT = env.PORT || 4000;

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Train (or load) the local ML classifiers on startup so the first request
  // already has working category/intent/priority prediction.
  try {
    const result = await MlService.trainAll();
    console.log(
      `[ml] models ready - category:${result.category.metrics.accuracy} `
      + `intent:${result.intent.metrics.accuracy} priority:${result.priority.metrics.accuracy}`,
    );
  } catch (error) {
    console.warn(`[ml] startup training skipped: ${error.message}`);
  }
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
