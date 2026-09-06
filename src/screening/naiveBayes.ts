export interface LabeledDoc {
  id: string;
  tokens: string[];
  /** true = keputusan pengguna "masuk", false = "tolak". Dokumen "ragu" tidak dipakai untuk melatih. */
  relevan: boolean;
}

export interface NaiveBayesModel {
  logPriorRelevan: number;
  logPriorTidakRelevan: number;
  logLikelihoodRelevan: Map<string, number>;
  logLikelihoodTidakRelevan: Map<string, number>;
}

const LAPLACE_ALPHA = 1;

/**
 * Naive Bayes multinomial (bag-of-words) sesuai Bagian 4, Modul 4b — meniru
 * pendekatan ASReview tanpa model bahasa. Dilatih ulang setiap ada keputusan
 * baru dari pengguna.
 *
 * P(term | kelas) = (jumlah_kemunculan_term_di_kelas + alpha) /
 *                   (total_token_di_kelas + alpha * |vocab|)
 *
 * Laplace smoothing (alpha=1) mencegah probabilitas nol untuk term yang
 * belum pernah muncul di salah satu kelas.
 */
export function trainNaiveBayes(docs: LabeledDoc[]): NaiveBayesModel | null {
  const relevan = docs.filter((d) => d.relevan);
  const tidakRelevan = docs.filter((d) => !d.relevan);
  if (relevan.length === 0 || tidakRelevan.length === 0) return null;

  const vocab = new Set<string>();
  const countRelevan = new Map<string, number>();
  const countTidakRelevan = new Map<string, number>();
  let totalTokenRelevan = 0;
  let totalTokenTidakRelevan = 0;

  for (const doc of relevan) {
    for (const t of doc.tokens) {
      vocab.add(t);
      countRelevan.set(t, (countRelevan.get(t) ?? 0) + 1);
      totalTokenRelevan++;
    }
  }
  for (const doc of tidakRelevan) {
    for (const t of doc.tokens) {
      vocab.add(t);
      countTidakRelevan.set(t, (countTidakRelevan.get(t) ?? 0) + 1);
      totalTokenTidakRelevan++;
    }
  }

  const v = vocab.size;
  const logLikelihoodRelevan = new Map<string, number>();
  const logLikelihoodTidakRelevan = new Map<string, number>();
  for (const term of vocab) {
    const cr = countRelevan.get(term) ?? 0;
    const ci = countTidakRelevan.get(term) ?? 0;
    logLikelihoodRelevan.set(term, Math.log((cr + LAPLACE_ALPHA) / (totalTokenRelevan + LAPLACE_ALPHA * v)));
    logLikelihoodTidakRelevan.set(term, Math.log((ci + LAPLACE_ALPHA) / (totalTokenTidakRelevan + LAPLACE_ALPHA * v)));
  }

  const total = docs.length;
  return {
    logPriorRelevan: Math.log(relevan.length / total),
    logPriorTidakRelevan: Math.log(tidakRelevan.length / total),
    logLikelihoodRelevan,
    logLikelihoodTidakRelevan,
  };
}

/**
 * Probabilitas dokumen relevan (0..1). Term yang tak pernah muncul di data
 * latih (di kelas mana pun) dilewati — tidak menambah informasi.
 */
export function predictRelevance(model: NaiveBayesModel, tokens: string[]): number {
  let logRelevan = model.logPriorRelevan;
  let logTidakRelevan = model.logPriorTidakRelevan;

  for (const t of tokens) {
    const lr = model.logLikelihoodRelevan.get(t);
    const ltr = model.logLikelihoodTidakRelevan.get(t);
    if (lr === undefined || ltr === undefined) continue;
    logRelevan += lr;
    logTidakRelevan += ltr;
  }

  const maxLog = Math.max(logRelevan, logTidakRelevan);
  const expRelevan = Math.exp(logRelevan - maxLog);
  const expTidakRelevan = Math.exp(logTidakRelevan - maxLog);
  return expRelevan / (expRelevan + expTidakRelevan);
}
