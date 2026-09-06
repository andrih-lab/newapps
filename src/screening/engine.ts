import { tokenize } from './tokenize';
import { rankBySimilarityToQuery } from './tfidfSimilarity';
import { trainNaiveBayes, predictRelevance, type LabeledDoc } from './naiveBayes';

export interface ScreeningDoc {
  id: string;
  judul: string;
  abstrak: string;
}

export interface Keputusan {
  recordId: string;
  keputusan: 'masuk' | 'tolak' | 'ragu';
}

/** Jumlah keputusan manual sebelum active learning mengambil alih (Bagian 4: "20-30 artikel pertama"). */
export const INITIAL_BATCH_SIZE = 25;

export interface EngineResult {
  /** recordId -> skor relevansi terbaru, dipakai untuk mengurutkan antrean skrining (menurun). */
  skor: Map<string, number>;
  modeAktif: 'awal' | 'active_learning';
}

function docTokens(doc: ScreeningDoc): string[] {
  return tokenize(`${doc.judul} ${doc.abstrak}`);
}

/** Hash FNV-1a -> [0,1) yang stabil untuk id yang sama, dipakai sebagai pengganti Math.random()
 * agar urutan "acak" pada batch awal tetap sama walau halaman dimuat ulang (mendukung "lanjutkan nanti"
 * tanpa perlu menyimpan urutan antrean di tabel terpisah). */
function stableRandom(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

/**
 * Hitung ulang skor relevansi seluruh record yang belum diputuskan (Bagian 4, Modul 4b):
 *
 * - Fase "awal" (jumlah keputusan < INITIAL_BATCH_SIZE): separuh urutan berikutnya diambil dari
 *   kemiripan TF-IDF terhadap pertanyaan penelitian + kriteria inklusi, separuh lagi acak (stabil).
 *   Keduanya diselang-seling agar benar-benar tercampur, bukan sekadar dua blok berurutan.
 * - Fase "active learning" (>= INITIAL_BATCH_SIZE keputusan, dan ada contoh "masuk" & "tolak"):
 *   Naive Bayes dilatih ulang dari seluruh keputusan sejauh ini, skor = probabilitas relevan.
 */
export function computeScreeningScores(allDocs: ScreeningDoc[], keputusanList: Keputusan[], queryText: string): EngineResult {
  const decidedIds = new Set(keputusanList.map((k) => k.recordId));
  const undecided = allDocs.filter((d) => !decidedIds.has(d.id));
  const skor = new Map<string, number>();

  if (keputusanList.length >= INITIAL_BATCH_SIZE) {
    const labeled: LabeledDoc[] = keputusanList
      .filter((k) => k.keputusan !== 'ragu')
      .map((k) => {
        const doc = allDocs.find((d) => d.id === k.recordId);
        return { id: k.recordId, tokens: doc ? docTokens(doc) : [], relevan: k.keputusan === 'masuk' };
      });

    const model = trainNaiveBayes(labeled);
    if (model) {
      for (const doc of undecided) {
        skor.set(doc.id, predictRelevance(model, docTokens(doc)));
      }
      return { skor, modeAktif: 'active_learning' };
    }
    // Belum ada contoh di kedua kelas (mis. semua "ragu") — jatuh ke fase awal di bawah.
  }

  const queryTokens = tokenize(queryText);
  const corpusForIdf = allDocs.map((d) => ({ id: d.id, tokens: docTokens(d) }));
  const similarity = queryTokens.length > 0 ? rankBySimilarityToQuery(corpusForIdf, queryTokens) : new Map<string, number>();

  const sisaKuotaAwal = Math.max(0, INITIAL_BATCH_SIZE - keputusanList.length);
  const jumlahMirip = Math.ceil(sisaKuotaAwal / 2);
  const jumlahAcak = sisaKuotaAwal - jumlahMirip;

  const urutanMirip = [...undecided].sort((a, b) => (similarity.get(b.id) ?? 0) - (similarity.get(a.id) ?? 0));
  const kelompokMirip = urutanMirip.slice(0, jumlahMirip);
  const idKelompokMirip = new Set(kelompokMirip.map((d) => d.id));

  const kelompokAcak = undecided
    .filter((d) => !idKelompokMirip.has(d.id))
    .sort((a, b) => stableRandom(b.id) - stableRandom(a.id))
    .slice(0, jumlahAcak);

  const diselang: ScreeningDoc[] = [];
  const maxLen = Math.max(kelompokMirip.length, kelompokAcak.length);
  for (let i = 0; i < maxLen; i++) {
    if (kelompokMirip[i]) diselang.push(kelompokMirip[i]);
    if (kelompokAcak[i]) diselang.push(kelompokAcak[i]);
  }

  diselang.forEach((doc, idx) => {
    // band skor (0, 1], menurun sesuai posisi selang-seling
    skor.set(doc.id, (diselang.length - idx) / diselang.length);
  });

  const idDiselang = new Set(diselang.map((d) => d.id));
  for (const doc of undecided) {
    if (idDiselang.has(doc.id)) continue;
    // band skor [-1, 0): selalu di bawah batch awal yang sedang diselang-seling di atas
    skor.set(doc.id, -1 + (similarity.get(doc.id) ?? 0));
  }

  return { skor, modeAktif: 'awal' };
}
