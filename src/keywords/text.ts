/**
 * Utilitas teks untuk Perancang Kata Kunci: normalisasi, kunci stem sederhana
 * (untuk deduplikasi bentuk tunggal/jamak), dan pemberian tanda kutip frasa.
 */

/** Huruf kecil, samakan jenis tanda hubung, rapikan spasi. */
export function normalisasi(teks: string): string {
  return teks
    .toLowerCase()
    .replace(/[‐-―]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stemKata(w: string): string {
  if (w.length <= 3) return w;
  if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`;
  if (/(ss|us|is)$/.test(w)) return w;
  if (/(ches|shes|xes|sses|zes)$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s')) return w.slice(0, -1);
  return w;
}

/**
 * Kunci pembanding: "Mangroves", "mangrove", dan "mangrove-s" dianggap sama.
 * OpenAlex, Scopus, dan WoS sama-sama otomatis mencakup bentuk jamak, jadi
 * menyertakan keduanya di string hanya menambah panjang tanpa menambah hasil.
 */
export function kunciStem(teks: string): string {
  return normalisasi(teks)
    .replace(/[*"]/g, '')
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(stemKata)
    .join(' ');
}

/** Beri tanda kutip bila istilah lebih dari satu kata atau mengandung tanda hubung. */
export function kutip(teks: string): string {
  const s = teks.trim().replace(/"/g, '');
  return /[\s\-']/.test(s) ? `"${s}"` : s;
}

/** Stopword pembatas frasa saat menambang n-gram (Inggris + Indonesia + kata umum artikel ilmiah). */
export const STOPWORD_FRASA = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'is', 'are', 'was', 'were', 'be', 'been',
  'this', 'that', 'these', 'those', 'with', 'as', 'by', 'at', 'from', 'it', 'its', 'their', 'our', 'we',
  'they', 'has', 'have', 'had', 'not', 'no', 'but', 'which', 'who', 'can', 'will', 'would', 'could',
  'should', 'may', 'might', 'also', 'into', 'than', 'then', 'such', 'both', 'more', 'most', 'other',
  'some', 'each', 'all', 'between', 'among', 'during', 'about', 'through', 'while', 'using', 'used',
  'use', 'based', 'case', 'new', 'via', 'its', 'however', 'here', 'there', 'two', 'three', 'one',
  'first', 'high', 'higher', 'low', 'lower', 'different', 'various', 'across', 'within', 'under',
  'over', 'per', 'how', 'what', 'why', 'where', 'when', 'do', 'does', 'did', 'toward', 'towards',
  'study', 'studies', 'paper', 'research', 'results', 'result', 'article', 'review', 'analysis',
  'effect', 'effects', 'impact', 'impacts', 'role', 'approach', 'evidence', 'implications', 'total',
  'found', 'showed', 'show', 'shows', 'significant', 'significantly', 'data', 'method', 'methods',
  'important', 'including', 'include', 'includes', 'provide', 'provides', 'provided', 'identified', 'identify',
  'finding', 'findings', 'understanding', 'support', 'supports', 'factors', 'factor', 'areas', 'area',
  'activities', 'information', 'changes', 'change', 'well', 'particularly', 'respectively', 'several', 'many',
  'current', 'potential', 'key', 'main', 'major', 'given', 'within', 'thus', 'therefore', 'related',
  'future', 'recent', 'overall', 'significance', 'aim', 'aims', 'aimed', 'conducted', 'number',
  'out', 'carried', 'wide', 'range', 'large', 'small', 'level', 'levels', 'mitigating', 'order', 'terms',
  'yang', 'dan', 'atau', 'dari', 'pada', 'untuk', 'dengan', 'ini', 'itu', 'adalah', 'akan', 'juga',
  'tidak', 'dalam', 'oleh', 'ke', 'di', 'sebagai', 'dapat', 'telah', 'antara', 'terhadap', 'secara',
]);
