/**
 * Tokenizer sederhana untuk judul+abstrak: lowercase, buang tanda baca,
 * buang stopword umum Inggris & Indonesia, buang token pendek (<3 karakter).
 * Dipakai bersama oleh TF-IDF (kemiripan query) dan Naive Bayes (Bagian 4,
 * Modul 4b).
 */

const STOPWORDS = new Set([
  // Inggris
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those',
  'with', 'as', 'by', 'at', 'from', 'it', 'its', 'their', 'our', 'we', 'they',
  'has', 'have', 'had', 'not', 'no', 'but', 'which', 'who', 'whom', 'can',
  'will', 'would', 'could', 'should', 'may', 'might', 'also', 'into', 'than',
  'then', 'such', 'both', 'more', 'most', 'other', 'some', 'each', 'all',
  'between', 'among', 'during', 'about', 'through', 'while', 'study',
  'studies', 'paper', 'research', 'results', 'article',
  // Indonesia
  'yang', 'dan', 'atau', 'dari', 'pada', 'untuk', 'dengan', 'ini', 'itu',
  'adalah', 'akan', 'juga', 'tidak', 'bukan', 'dalam', 'oleh', 'ke', 'di',
  'sebagai', 'dapat', 'telah', 'para', 'antara', 'terhadap', 'secara',
  'penelitian', 'studi', 'artikel', 'hasil', 'kajian',
]);

/** Ubah teks bebas menjadi larik token bersih. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9À-ɏ]+/g) ?? []).filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t),
  );
}
