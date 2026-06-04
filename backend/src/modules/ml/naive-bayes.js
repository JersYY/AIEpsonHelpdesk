// Multinomial Naive Bayes text classifier with Laplace smoothing.
// Trains and predicts entirely in-process; the model serializes to plain
// JSON so it can be stored in the database and reloaded after a restart.

import { tokenize } from "./text.util.js";

export class NaiveBayesClassifier {
  constructor(model = null) {
    // model: { classes, vocab, classCounts, wordCounts, classTotals, totalDocs }
    this.model = model;
  }

  static train(samples, { minTokenFreq = 1 } = {}) {
    // samples: [{ text, label }]
    const classCounts = {}; // label -> doc count
    const wordCounts = {}; // label -> { term -> count }
    const classTotals = {}; // label -> total token count
    const vocabSet = new Set();
    let totalDocs = 0;

    const tokenFreq = new Map();
    const tokenizedSamples = samples.map((sample) => {
      const tokens = tokenize(sample.text);
      for (const term of tokens) {
        tokenFreq.set(term, (tokenFreq.get(term) || 0) + 1);
      }
      return { tokens, label: sample.label };
    });

    for (const { tokens, label } of tokenizedSamples) {
      const filtered = tokens.filter((term) => (tokenFreq.get(term) || 0) >= minTokenFreq);
      if (!filtered.length) continue;

      totalDocs += 1;
      classCounts[label] = (classCounts[label] || 0) + 1;
      wordCounts[label] = wordCounts[label] || {};
      classTotals[label] = classTotals[label] || 0;

      for (const term of filtered) {
        vocabSet.add(term);
        wordCounts[label][term] = (wordCounts[label][term] || 0) + 1;
        classTotals[label] += 1;
      }
    }

    const model = {
      classes: Object.keys(classCounts),
      vocab: [...vocabSet],
      vocabSize: vocabSet.size,
      classCounts,
      wordCounts,
      classTotals,
      totalDocs,
    };

    return new NaiveBayesClassifier(model);
  }

  predict(text) {
    if (!this.model || !this.model.classes.length) {
      return { label: null, confidence: 0, scores: {} };
    }

    const { classes, classCounts, wordCounts, classTotals, vocabSize, totalDocs } = this.model;
    const tokens = tokenize(text);

    const logScores = {};
    for (const label of classes) {
      // log prior
      let score = Math.log((classCounts[label] || 0) / totalDocs);
      const denom = (classTotals[label] || 0) + vocabSize;

      for (const term of tokens) {
        const count = (wordCounts[label] && wordCounts[label][term]) || 0;
        // Laplace smoothing
        score += Math.log((count + 1) / denom);
      }
      logScores[label] = score;
    }

    // Softmax over log scores -> probabilities (numerically stable).
    const maxLog = Math.max(...Object.values(logScores));
    let sumExp = 0;
    const probs = {};
    for (const label of classes) {
      const e = Math.exp(logScores[label] - maxLog);
      probs[label] = e;
      sumExp += e;
    }
    for (const label of classes) {
      probs[label] = probs[label] / (sumExp || 1);
    }

    let bestLabel = classes[0];
    for (const label of classes) {
      if (probs[label] > probs[bestLabel]) bestLabel = label;
    }

    return {
      label: bestLabel,
      confidence: Number(probs[bestLabel].toFixed(4)),
      scores: probs,
    };
  }

  toJSON() {
    return this.model;
  }

  static fromJSON(model) {
    return new NaiveBayesClassifier(model);
  }
}

export default NaiveBayesClassifier;
