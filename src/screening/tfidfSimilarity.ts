export interface CorpusDoc {
  id: string;
  tokens: string[];
}

type SparseVector = Map<string, number>;

/**
 * IDF ternormalisasi ala scikit-learn (smooth idf):
 *   idf(t) = ln((N + 1) / (df(t) + 1)) + 1
 * dengan N = jumlah dokumen, df(t) = jumlah dokumen yang memuat term t.
 * Konstanta +1 di pembilang/penyebut mencegah pembagian nol dan menghindari
 * idf negatif; +1 di luar log memastikan term yang muncul di semua dokumen
 * tetap punya bobot positif kecil, bukan nol.
 */
export function buildIdf(docs: CorpusDoc[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of new Set(doc.tokens)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const n = docs.length;
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
  }
  return idf;
}

/** Vektor TF-IDF (bobot = frekuensi term * idf), dinormalisasi ke panjang satuan. */
function tfidfVector(tokens: string[], idf: Map<string, number>): SparseVector {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);

  const vec: SparseVector = new Map();
  let normSq = 0;
  for (const [term, count] of tf) {
    const weight = count * (idf.get(term) ?? 0);
    if (weight === 0) continue;
    vec.set(term, weight);
    normSq += weight * weight;
  }
  const norm = Math.sqrt(normSq) || 1;
  for (const [term, w] of vec) vec.set(term, w / norm);
  return vec;
}

/** Dot product dua vektor unit-length = cosine similarity. */
function dotProduct(a: SparseVector, b: SparseVector): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other) dot += weight * other;
  }
  return dot;
}

/**
 * Ranking kemiripan tiap dokumen korpus terhadap sebuah teks query (mis.
 * pertanyaan penelitian + kriteria inklusi), dipakai untuk menyusun separuh
 * dari 20-30 artikel pertama pada active learning (Bagian 4, Modul 4b).
 */
export function rankBySimilarityToQuery(docs: CorpusDoc[], queryTokens: string[]): Map<string, number> {
  const idf = buildIdf(docs);
  const queryVec = tfidfVector(queryTokens, idf);
  const scores = new Map<string, number>();
  for (const doc of docs) {
    scores.set(doc.id, dotProduct(queryVec, tfidfVector(doc.tokens, idf)));
  }
  return scores;
}
