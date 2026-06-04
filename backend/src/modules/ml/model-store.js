// Persists trained ML model artifacts in the MlModel table and caches them
// in memory so predictions don't hit the database on every request.

import { prisma } from "../../config/prisma.js";

const cache = new Map(); // name -> { payload, metrics, version, sampleCount }

export const ModelStore = {
  async save(name, payload, { metrics = null, sampleCount = 0 } = {}) {
    const existing = await prisma.mlModel.findUnique({ where: { name } });

    const record = existing
      ? await prisma.mlModel.update({
          where: { name },
          data: {
            payload,
            metrics,
            sampleCount,
            version: existing.version + 1,
            trainedAt: new Date(),
          },
        })
      : await prisma.mlModel.create({
          data: { name, payload, metrics, sampleCount },
        });

    cache.set(name, {
      payload: record.payload,
      metrics: record.metrics,
      version: record.version,
      sampleCount: record.sampleCount,
      trainedAt: record.trainedAt,
    });

    return record;
  },

  async load(name) {
    if (cache.has(name)) {
      return cache.get(name);
    }

    const record = await prisma.mlModel.findUnique({ where: { name } });
    if (!record) return null;

    const entry = {
      payload: record.payload,
      metrics: record.metrics,
      version: record.version,
      sampleCount: record.sampleCount,
      trainedAt: record.trainedAt,
    };
    cache.set(name, entry);
    return entry;
  },

  invalidate(name) {
    cache.delete(name);
  },

  clearCache() {
    cache.clear();
  },
};

export default ModelStore;
