/**
 * Saran istilah dari Gemini — OPSIONAL dan satu-satunya bagian Telaah yang
 * memakai model bahasa. Dibatasi ketat: hanya mengusulkan istilah pencarian,
 * tidak pernah menulis teks artikel. Setiap usulan masuk tidak tercentang,
 * ditandai "AI", dan sebaiknya diverifikasi dengan jumlah hit OpenAlex.
 *
 * Kunci API milik pengguna sendiri, disimpan hanya di localStorage peramban
 * ini (Telaah dipakai pribadi) dan dikirim langsung ke Google — tidak pernah
 * masuk ke bundle atau server lain.
 */

const KUNCI_LS = 'telaah.ai.gemini';
export const MODEL_BAWAAN = 'gemini-3.6-flash';

export interface PengaturanAi {
  apiKey: string;
  model: string;
}

export function bacaPengaturanAi(): PengaturanAi | null {
  try {
    const raw = localStorage.getItem(KUNCI_LS);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<PengaturanAi>;
    return v.apiKey ? { apiKey: v.apiKey, model: v.model || MODEL_BAWAAN } : null;
  } catch {
    return null;
  }
}

export function simpanPengaturanAi(p: PengaturanAi | null): void {
  try {
    if (p) localStorage.setItem(KUNCI_LS, JSON.stringify(p));
    else localStorage.removeItem(KUNCI_LS);
  } catch {
    // Penyimpanan diblokir (mode privat) — pengaturan hanya berlaku sesi ini.
  }
}

export interface SaranAiBlok {
  nama: string;
  istilah: string[];
  istilahIndonesia: string[];
}

function susunPrompt(topik: string, blok: Array<{ nama: string; istilah: string[] }>): string {
  return `Anda pustakawan riset yang menyusun strategi pencarian systematic review.
Topik: ${topik}

Blok konsep saat ini (istilah dalam blok digabung OR, antar-blok AND):
${blok.map((b, i) => `${i + 1}. ${b.nama}: ${b.istilah.join('; ')}`).join('\n')}

Untuk SETIAP blok, usulkan:
- "istilah": maksimal 10 sinonim/varian bahasa Inggris yang benar-benar dipakai di judul/abstrak artikel ilmiah (bukan istilah yang sudah ada, bukan frasa yang memuat istilah yang sudah ada).
- "istilahIndonesia": maksimal 5 padanan bahasa Indonesia yang lazim di jurnal Indonesia.
Jangan mengarang singkatan. Jangan menambah blok baru.

Jawab HANYA JSON: {"blok":[{"nama":"...","istilah":["..."],"istilahIndonesia":["..."]}]} dengan urutan dan nama blok sama persis.`;
}

export async function mintaSaranAi(
  topik: string,
  blok: Array<{ nama: string; istilah: string[] }>,
  pengaturan: PengaturanAi,
  signal?: AbortSignal,
): Promise<SaranAiBlok[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(pengaturan.model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': pengaturan.apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: susunPrompt(topik, blok) }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  });
  if (!res.ok) {
    const teks = await res.text().catch(() => '');
    if (res.status === 400 || res.status === 403) {
      throw new Error(`Gemini menolak permintaan (${res.status}). Periksa kunci API dan nama model. ${teks.slice(0, 160)}`);
    }
    throw new Error(`Gemini mengembalikan status ${res.status}: ${teks.slice(0, 160)}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const teks = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  let json: unknown;
  try {
    json = JSON.parse(teks);
  } catch {
    throw new Error('Jawaban Gemini bukan JSON yang valid. Coba lagi.');
  }
  const daftar = (json as { blok?: unknown }).blok;
  if (!Array.isArray(daftar)) throw new Error('Format jawaban Gemini tidak dikenali.');

  const teksLarik = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim()) : [];
  return daftar.map((b) => ({
    nama: typeof (b as { nama?: unknown }).nama === 'string' ? (b as { nama: string }).nama : '',
    istilah: teksLarik((b as { istilah?: unknown }).istilah).slice(0, 10),
    istilahIndonesia: teksLarik((b as { istilahIndonesia?: unknown }).istilahIndonesia).slice(0, 5),
  }));
}
