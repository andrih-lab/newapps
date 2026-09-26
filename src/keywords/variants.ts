import { normalisasi } from './text';

/**
 * Varian istilah yang TIDAK otomatis ditangani mesin pencari: ejaan
 * Inggris-Britania vs Amerika, dan singkatan baku. Bentuk tunggal/jamak
 * sengaja tidak dibuat karena OpenAlex, Scopus, dan WoS sudah mencakupnya.
 */

/** Akhiran yang aman ditukar dua arah (-isation/-ization, -yse/-yze). */
const AKHIRAN: Array<[RegExp, string]> = [
  [/isation\b/g, 'ization'],
  [/ization\b/g, 'isation'],
  [/ise\b/g, 'ize'],
  [/yse\b/g, 'yze'],
  [/yze\b/g, 'yse'],
];

/** Pasangan kata eksplisit — aturan umum "-our → -or" terlalu berisiko (hour, flour, tour). */
const PASANGAN_KATA: Array<[string, string]> = [
  ['colour', 'color'],
  ['behaviour', 'behavior'],
  ['harbour', 'harbor'],
  ['labour', 'labor'],
  ['favour', 'favor'],
  ['modelling', 'modeling'],
  ['fertiliser', 'fertilizer'],
  ['sulphur', 'sulfur'],
  ['centre', 'center'],
  ['programme', 'program'],
  ['defence', 'defense'],
  ['aluminium', 'aluminum'],
];

/** Kata berakhiran -ise yang bukan varian -ize (hindari "rize", "precize"). */
const BUKAN_ISE = new Set(['rise', 'precise', 'concise', 'noise', 'wise', 'otherwise', 'expertise', 'exercise', 'enterprise', 'premise', 'promise', 'surprise', 'franchise', 'compromise', 'advise', 'revise', 'devise', 'supervise', 'televise', 'improvise', 'disguise', 'cruise', 'raise', 'praise', 'poise', 'sea-level rise']);

const AWALAN_SAMBUNG = ['above', 'below', 'co', 'multi', 'non', 'pre', 'post', 're', 'inter', 'intra', 'sub', 'socio', 'eco', 'bio', 'geo', 'agro', 'silvo'];

/**
 * Istilah BERDEKATAN (bukan sinonim persis) — diusulkan tanpa centang karena
 * memasukkannya memperluas cakupan review; peneliti yang memutuskan.
 */
const BERDEKATAN: Record<string, string[]> = {
  'local ecological knowledge': ['local knowledge', 'traditional ecological knowledge', 'TEK', 'indigenous knowledge', 'traditional knowledge', 'ethnoecology', "fishers' knowledge"],
  'traditional ecological knowledge': ['local ecological knowledge', 'LEK', 'indigenous knowledge', 'traditional knowledge', 'ethnoecology'],
  'indigenous knowledge': ['traditional ecological knowledge', 'local ecological knowledge', 'traditional knowledge'],
  'blue carbon': ['carbon stock', 'carbon storage', 'carbon sequestration', 'soil organic carbon', 'coastal wetland carbon'],
  'carbon stock': ['carbon storage', 'blue carbon', 'biomass carbon', 'soil organic carbon'],
  'community ecology': ['species composition', 'species diversity', 'community structure', 'assemblage'],
  'macrobenthos': ['macrobenthic', 'benthic macrofauna', 'macroinvertebrates', 'benthic invertebrates'],
  'mangrove restoration': ['mangrove rehabilitation', 'mangrove planting', 'reforestation', 'afforestation'],
};

/** Singkatan/bentuk alternatif baku di literatur ekologi, pesisir, dan sosial-ekologi. */
const ALTERNATIF: Record<string, string[]> = {
  'local ecological knowledge': ['LEK'],
  'traditional ecological knowledge': ['TEK'],
  'indigenous and local knowledge': ['ILK'],
  'payment for ecosystem services': ['PES'],
  'payments for ecosystem services': ['PES'],
  'soil organic carbon': ['SOC'],
  'aboveground biomass': ['AGB', 'above-ground biomass'],
  'above-ground biomass': ['AGB', 'aboveground biomass'],
  'belowground biomass': ['BGB', 'below-ground biomass'],
  'below-ground biomass': ['BGB', 'belowground biomass'],
  'greenhouse gas': ['GHG'],
  'greenhouse gases': ['GHG'],
  'nature-based solutions': ['NbS'],
  'nature-based solution': ['NbS'],
  'marine protected area': ['MPA'],
  'marine protected areas': ['MPA'],
  'normalized difference vegetation index': ['NDVI'],
  'unmanned aerial vehicle': ['UAV', 'drone'],
  'drone': ['UAV', 'unmanned aerial vehicle'],
  'mangrove': ['mangal'],
  'mangroves': ['mangal'],
};

const PETA_KATA = new Map<string, string>(PASANGAN_KATA.flatMap(([uk, us]) => [[uk, us], [us, uk]] as Array<[string, string]>));

function tukarKata(teks: string): string {
  return teks
    .split(' ')
    .map((kata) => PETA_KATA.get(kata) ?? kata)
    .join(' ');
}

/** Hasilkan varian untuk satu istilah (tidak termasuk istilah itu sendiri). */
export function varianIstilah(teks: string): Array<{ teks: string; keterangan: string; dipilih: boolean }> {
  const asal = normalisasi(teks);
  const hasil = new Map<string, string>();

  const ditukar = tukarKata(asal);
  if (ditukar !== asal) hasil.set(ditukar, 'varian ejaan Inggris/Amerika');

  for (const [pola, ganti] of AKHIRAN) {
    const baru = asal
      .split(' ')
      .map((kata) => (pola.source === 'ise\\b' && BUKAN_ISE.has(kata) ? kata : kata.replace(pola, ganti)))
      .join(' ');
    if (baru !== asal) hasil.set(baru, 'varian ejaan Inggris/Amerika');
  }

  // Hanya awalan yang lazim ditulis menyambung ("above-ground" → "aboveground"), bukan "sea-level" → "sealevel".
  const denganAwalan = asal.replace(new RegExp(`\\b(${AWALAN_SAMBUNG.join('|')})-`, 'g'), '$1');
  if (denganAwalan !== asal) hasil.set(denganAwalan, 'varian penulisan tanda hubung');

  for (const s of ALTERNATIF[asal] ?? []) {
    hasil.set(s, /^[A-Z][A-Za-z]*[A-Z]$/.test(s) ? 'singkatan baku (periksa ambiguitasnya)' : 'bentuk alternatif lazim');
  }

  hasil.delete(asal);
  const keluaran = Array.from(hasil, ([t, keterangan]) => ({ teks: t, keterangan, dipilih: true }));
  for (const t of BERDEKATAN[asal] ?? []) {
    if (!hasil.has(t)) keluaran.push({ teks: t, keterangan: 'istilah berdekatan — bukan sinonim persis, putuskan sendiri', dipilih: false });
  }
  return keluaran;
}
