// Central ML service: trains and serves the local classifiers used across
// the helpdesk (category, intent, priority) plus escalation-likelihood scoring.
// Everything runs in-process with no external API dependency.

import { prisma } from "../../config/prisma.js";
import { NaiveBayesClassifier } from "./naive-bayes.js";
import { ModelStore } from "./model-store.js";
import {
  CATEGORY_EXAMPLES,
  INTENT_EXAMPLES,
  PRIORITY_EXAMPLES,
} from "./seed-examples.js";

const MODELS = {
  category: "category-classifier",
  intent: "intent-classifier",
  priority: "priority-classifier",
};

// Simple stratified-ish k-fold accuracy estimate for reporting.
const crossValidate = (samples, folds = 5) => {
  if (samples.length < folds * 2) {
    // Not enough data for CV; report train accuracy instead.
    const clf = NaiveBayesClassifier.train(samples);
    let correct = 0;
    for (const s of samples) {
      if (clf.predict(s.text).label === s.label) correct += 1;
    }
    return {
      method: "train",
      accuracy: Number((correct / (samples.length || 1)).toFixed(4)),
    };
  }

  const shuffled = [...samples].sort(() => Math.random() - 0.5);
  const foldSize = Math.floor(shuffled.length / folds);
  let totalCorrect = 0;
  let totalCount = 0;

  for (let f = 0; f < folds; f += 1) {
    const start = f * foldSize;
    const end = f === folds - 1 ? shuffled.length : start + foldSize;
    const test = shuffled.slice(start, end);
    const train = [...shuffled.slice(0, start), ...shuffled.slice(end)];
    if (!train.length || !test.length) continue;

    const clf = NaiveBayesClassifier.train(train);
    for (const s of test) {
      if (clf.predict(s.text).label === s.label) totalCorrect += 1;
      totalCount += 1;
    }
  }

  return {
    method: `${folds}-fold-cv`,
    accuracy: Number((totalCorrect / (totalCount || 1)).toFixed(4)),
  };
};

// Gather training data = built-in seed examples + accumulated real examples.
const gatherSamples = async (task, seedExamples) => {
  const dbExamples = await prisma.trainingExample.findMany({
    where: { task },
    select: { text: true, label: true },
  });

  return [...seedExamples, ...dbExamples];
};

// Map a category name -> id for storing predictions.
const categoryNameToId = async () => {
  const categories = await prisma.issueCategory.findMany({
    select: { id: true, name: true },
  });
  const map = {};
  for (const c of categories) map[c.name] = c.id;
  return map;
};

export const MlService = {
  MODELS,

  async trainAll() {
    const [category, intent, priority] = await Promise.all([
      this.trainModel("category", CATEGORY_EXAMPLES),
      this.trainModel("intent", INTENT_EXAMPLES),
      this.trainModel("priority", PRIORITY_EXAMPLES),
    ]);

    return { category, intent, priority };
  },

  async trainModel(task, seedExamples) {
    const samples = await gatherSamples(task, seedExamples);
    const classifier = NaiveBayesClassifier.train(samples);
    const metrics = crossValidate(samples);

    await ModelStore.save(MODELS[task], classifier.toJSON(), {
      metrics,
      sampleCount: samples.length,
    });

    return {
      task,
      sampleCount: samples.length,
      classes: classifier.model.classes,
      metrics,
    };
  },

  async getClassifier(task, seedExamples) {
    const stored = await ModelStore.load(MODELS[task]);
    if (stored?.payload) {
      return NaiveBayesClassifier.fromJSON(stored.payload);
    }
    // Cold start: train from seed examples on the fly and persist.
    await this.trainModel(task, seedExamples);
    const fresh = await ModelStore.load(MODELS[task]);
    return NaiveBayesClassifier.fromJSON(fresh.payload);
  },

  async predictCategory(text) {
    const clf = await this.getClassifier("category", CATEGORY_EXAMPLES);
    const result = clf.predict(text);
    const map = await categoryNameToId();
    return {
      ...result,
      categoryId: result.label ? map[result.label] || null : null,
    };
  },

  async predictIntent(text) {
    const clf = await this.getClassifier("intent", INTENT_EXAMPLES);
    return clf.predict(text);
  },

  async predictPriority(text) {
    const clf = await this.getClassifier("priority", PRIORITY_EXAMPLES);
    return clf.predict(text);
  },

  // Escalation likelihood: combination of predicted priority and low-confidence
  // signals. Returns probability [0,1] that the conversation needs a human.
  async predictEscalation(text, { aiConfidence = null } = {}) {
    const priority = await this.predictPriority(text);
    const priorityWeight = { HIGH: 0.9, MEDIUM: 0.5, LOW: 0.15 }[priority.label] ?? 0.4;

    // If the AI itself was unsure, nudge escalation likelihood up.
    const confidencePenalty = aiConfidence !== null && aiConfidence < 0.6
      ? (0.6 - aiConfidence)
      : 0;

    const likelihood = Math.min(0.99, priorityWeight + confidencePenalty * 0.5);

    return {
      likelihood: Number(likelihood.toFixed(4)),
      suggestedPriority: priority.label,
      priorityConfidence: priority.confidence,
      recommendEscalation: likelihood >= 0.7,
    };
  },

  async getStatus() {
    const names = Object.values(MODELS);
    const records = await prisma.mlModel.findMany({
      where: { name: { in: names } },
    });

    const trainingCounts = await prisma.trainingExample.groupBy({
      by: ["task"],
      _count: { _all: true },
    });

    return {
      models: records.map((r) => ({
        name: r.name,
        version: r.version,
        sampleCount: r.sampleCount,
        metrics: r.metrics,
        trainedAt: r.trainedAt,
      })),
      accumulatedExamples: trainingCounts.map((t) => ({
        task: t.task,
        count: t._count._all,
      })),
    };
  },
};

export default MlService;
