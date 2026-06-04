// Shared text preprocessing for the local ML models.
// Pure JS, no external dependencies, no network calls.

// Indonesian + English stopwords that carry little classification signal.
const STOPWORDS = new Set([
  "yang", "untuk", "dengan", "dari", "pada", "dan", "atau", "ini", "itu",
  "saya", "anda", "kami", "kita", "mereka", "akan", "sudah", "belum", "tidak",
  "ada", "apa", "apakah", "bagaimana", "kenapa", "mengapa", "kapan", "dimana",
  "ke", "di", "ya", "nya", "juga", "agar", "bisa", "dapat", "mohon", "tolong",
  "the", "a", "an", "is", "are", "to", "of", "and", "or", "in", "on", "for",
  "i", "you", "my", "it", "this", "that", "with", "how", "what", "why",
]);

// Light Indonesian stemming: strip very common affixes so "mencetak",
// "dicetak", "cetakan" collapse toward "cetak".
const PREFIXES = ["meng", "meny", "mem", "men", "me", "peng", "pem", "pen", "di", "ter", "ber", "ke", "se"];
const SUFFIXES = ["kan", "lah", "kah", "nya", "an", "i"];

const stem = (token) => {
  let word = token;

  if (word.length > 6) {
    for (const prefix of PREFIXES) {
      if (word.startsWith(prefix) && word.length - prefix.length >= 3) {
        word = word.slice(prefix.length);
        break;
      }
    }
  }

  if (word.length > 5) {
    for (const suffix of SUFFIXES) {
      if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
        word = word.slice(0, -suffix.length);
        break;
      }
    }
  }

  return word;
};

export const tokenize = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !STOPWORDS.has(token))
    .map(stem);
};

// Build a vocabulary {term -> index} from tokenized documents.
export const buildVocabulary = (tokenizedDocs, { maxFeatures = 2000, minDf = 1 } = {}) => {
  const df = new Map();
  for (const tokens of tokenizedDocs) {
    for (const term of new Set(tokens)) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const terms = [...df.entries()]
    .filter(([, count]) => count >= minDf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxFeatures)
    .map(([term]) => term);

  const vocabulary = {};
  terms.forEach((term, index) => {
    vocabulary[term] = index;
  });

  return vocabulary;
};

// Inverse document frequency per vocabulary term.
export const computeIdf = (tokenizedDocs, vocabulary) => {
  const n = tokenizedDocs.length || 1;
  const df = new Array(Object.keys(vocabulary).length).fill(0);

  for (const tokens of tokenizedDocs) {
    const seen = new Set();
    for (const term of tokens) {
      const idx = vocabulary[term];
      if (idx !== undefined && !seen.has(idx)) {
        df[idx] += 1;
        seen.add(idx);
      }
    }
  }

  return df.map((count) => Math.log((1 + n) / (1 + count)) + 1);
};

// Convert tokens to an L2-normalized TF-IDF sparse vector {index: weight}.
export const toTfidfVector = (tokens, vocabulary, idf) => {
  const tf = new Map();
  for (const term of tokens) {
    const idx = vocabulary[term];
    if (idx !== undefined) {
      tf.set(idx, (tf.get(idx) || 0) + 1);
    }
  }

  const vector = {};
  let norm = 0;
  for (const [idx, count] of tf.entries()) {
    const weight = count * (idf[idx] || 1);
    vector[idx] = weight;
    norm += weight * weight;
  }

  norm = Math.sqrt(norm) || 1;
  for (const idx of Object.keys(vector)) {
    vector[idx] /= norm;
  }

  return vector;
};

export const cosineSparse = (a, b) => {
  let dot = 0;
  const [small, large] = Object.keys(a).length <= Object.keys(b).length ? [a, b] : [b, a];
  for (const idx of Object.keys(small)) {
    if (large[idx] !== undefined) {
      dot += small[idx] * large[idx];
    }
  }
  return dot;
};

export default { tokenize, buildVocabulary, computeIdf, toTfidfVector, cosineSparse };
