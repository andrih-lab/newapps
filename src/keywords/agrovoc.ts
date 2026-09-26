/**
 * Klien AGROVOC (tesaurus FAO untuk pertanian, perikanan, kehutanan, dan
 * lingkungan) lewat REST API Skosmos. Dipanggil langsung dari peramban —
 * CORS AGROVOC terbuka dan tidak memerlukan kunci API.
 *
 * AGROVOC tidak memiliki label bahasa Indonesia; label bahasa Melayu (ms)
 * diambil sebagai petunjuk padanan Indonesia saja.
 */

const BASE = 'https://agrovoc.fao.org/browse/rest/v1';

export interface KonsepAgrovoc {
  uri: string;
  /** Istilah yang akhirnya cocok di AGROVOC (bisa lebih pendek dari yang dicari). */
  cocok: string;
  label: string;
  sinonim: string[];
  terkait: string[];
  lebihSempit: string[];
  labelMelayu: string[];
}

interface LabelJsonLd {
  lang?: string;
  value?: string;
}

interface SimpulGraf {
  uri?: string;
  prefLabel?: LabelJsonLd | LabelJsonLd[];
  altLabel?: LabelJsonLd | LabelJsonLd[];
  related?: { uri: string } | Array<{ uri: string }>;
  narrower?: { uri: string } | Array<{ uri: string }>;
}

const cache = new Map<string, KonsepAgrovoc | null>();

function sebagaiLarik<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function labelBahasa(v: SimpulGraf['prefLabel'], bahasa: string): string[] {
  return sebagaiLarik(v)
    .filter((l) => l.lang === bahasa && l.value)
    .map((l) => l.value as string);
}

/**
 * Cari URI konsep. Bila frasa utuh tidak dikenal, coba bentuk jamak/tunggal,
 * lalu frasa yang lebih pendek ("blue carbon stocks" → "blue carbon").
 * Mengembalikan juga istilah yang akhirnya cocok, untuk keterangan.
 */
async function cariUri(istilah: string, signal?: AbortSignal): Promise<{ uri: string; cocok: string } | null> {
  const kata = istilah.split(' ');
  const percobaan = [istilah, /s$/i.test(istilah) ? istilah.replace(/s$/i, '') : `${istilah}s`];
  // Frasa ≥ 3 kata: coba juga tanpa kata terakhir/pertama. Frasa 2 kata tidak dipotong
  // karena satu kata sisanya biasanya terlalu umum ("carbon", "knowledge").
  if (kata.length >= 3) percobaan.push(kata.slice(0, -1).join(' '), kata.slice(1).join(' '));

  for (const q of percobaan) {
    const url = new URL(`${BASE}/search`);
    url.searchParams.set('query', q);
    url.searchParams.set('lang', 'en');
    url.searchParams.set('vocab', 'agrovoc');
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`AGROVOC mengembalikan status ${res.status}`);
    const data = (await res.json()) as { results?: Array<{ uri: string }> };
    if (data.results && data.results.length > 0) return { uri: data.results[0].uri, cocok: q };
  }
  return null;
}

/** Cari konsep AGROVOC yang cocok dengan istilah; null bila tidak ada padanan. */
export async function lookupAgrovoc(istilah: string, signal?: AbortSignal): Promise<KonsepAgrovoc | null> {
  const kunci = istilah.trim().toLowerCase();
  if (cache.has(kunci)) return cache.get(kunci) ?? null;

  const hasilCari = await cariUri(kunci, signal);
  if (!hasilCari) {
    cache.set(kunci, null);
    return null;
  }
  const { uri, cocok } = hasilCari;

  const url = new URL(`${BASE}/agrovoc/data`);
  url.searchParams.set('uri', uri);
  url.searchParams.set('format', 'application/json');
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`AGROVOC mengembalikan status ${res.status}`);
  const data = (await res.json()) as { graph?: SimpulGraf[] };
  const graf = new Map((data.graph ?? []).filter((g) => g.uri).map((g) => [g.uri as string, g]));
  const simpul = graf.get(uri);
  if (!simpul) {
    cache.set(kunci, null);
    return null;
  }

  const labelDari = (refs: SimpulGraf['related']) =>
    sebagaiLarik(refs)
      .map((r) => labelBahasa(graf.get(r.uri)?.prefLabel, 'en')[0])
      .filter((x): x is string => !!x);

  const konsep: KonsepAgrovoc = {
    uri,
    cocok,
    label: labelBahasa(simpul.prefLabel, 'en')[0] ?? istilah,
    sinonim: labelBahasa(simpul.altLabel, 'en'),
    terkait: labelDari(simpul.related),
    lebihSempit: labelDari(simpul.narrower),
    labelMelayu: [...labelBahasa(simpul.prefLabel, 'ms'), ...labelBahasa(simpul.altLabel, 'ms')],
  };
  cache.set(kunci, konsep);
  return konsep;
}
