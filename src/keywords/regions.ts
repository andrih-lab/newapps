import { kunciStem } from './text';

/**
 * Ekspansi wilayah: nama kawasan jarang ditulis di abstrak — penulis biasanya
 * menyebut nama negara/pulau. Tanpa ekspansi ini, blok geografis memotong
 * banyak artikel relevan.
 */

const ASIA_TENGGARA = ['Southeast Asia', 'Indonesia', 'Malaysia', 'Philippines', 'Thailand', 'Vietnam', 'Myanmar', 'Cambodia', 'Singapore', 'Brunei', 'Timor-Leste'];

const WILAYAH: Record<string, string[]> = {
  'southeast asia': ASIA_TENGGARA,
  'south-east asia': ASIA_TENGGARA,
  'asia tenggara': ASIA_TENGGARA,
  asean: ASIA_TENGGARA,
  'coral triangle': ['Coral Triangle', 'Indonesia', 'Malaysia', 'Philippines', 'Papua New Guinea', 'Solomon Islands', 'Timor-Leste'],
  'south asia': ['South Asia', 'India', 'Bangladesh', 'Sri Lanka', 'Pakistan', 'Maldives'],
  'asia selatan': ['South Asia', 'India', 'Bangladesh', 'Sri Lanka', 'Pakistan', 'Maldives'],
  'east asia': ['East Asia', 'China', 'Japan', 'Korea', 'Taiwan'],
  'indo-pacific': ['Indo-Pacific', 'Indonesia', 'Malaysia', 'Philippines', 'Australia', 'Papua New Guinea', 'India', 'Thailand', 'Vietnam'],
  indonesia: ['Indonesia', 'Sumatra', 'Java', 'Kalimantan', 'Borneo', 'Sulawesi', 'Papua', 'Bali', 'Nusa Tenggara', 'Maluku'],
  sumatra: ['Sumatra', 'Sumatera', 'Riau', 'Aceh', 'North Sumatra', 'West Sumatra', 'Jambi', 'South Sumatra', 'Bengkulu', 'Lampung', 'Bangka Belitung', 'Riau Islands'],
  sumatera: ['Sumatra', 'Sumatera', 'Riau', 'Aceh', 'North Sumatra', 'West Sumatra', 'Jambi', 'South Sumatra', 'Bengkulu', 'Lampung', 'Bangka Belitung', 'Riau Islands'],
  'strait of malacca': ['Strait of Malacca', 'Malacca Strait', 'Straits of Malacca', 'Riau', 'Peninsular Malaysia', 'North Sumatra'],
  'selat malaka': ['Strait of Malacca', 'Malacca Strait', 'Straits of Malacca', 'Riau', 'Peninsular Malaysia', 'North Sumatra'],
  'east africa': ['East Africa', 'Kenya', 'Tanzania', 'Mozambique', 'Madagascar', 'Somalia'],
  'west africa': ['West Africa', 'Nigeria', 'Senegal', 'Ghana', 'Guinea-Bissau', 'Sierra Leone', 'Gambia', 'Cameroon', 'Gabon'],
  africa: ['Africa', 'Kenya', 'Tanzania', 'Mozambique', 'Madagascar', 'Nigeria', 'Senegal', 'Ghana', 'Cameroon', 'Gabon', 'South Africa'],
  'latin america': ['Latin America', 'Brazil', 'Mexico', 'Colombia', 'Ecuador', 'Peru', 'Venezuela', 'Panama', 'Costa Rica'],
  caribbean: ['Caribbean', 'Cuba', 'Jamaica', 'Bahamas', 'Puerto Rico', 'Dominican Republic', 'Belize', 'Trinidad'],
  'pacific islands': ['Pacific Islands', 'Fiji', 'Samoa', 'Tonga', 'Vanuatu', 'Solomon Islands', 'Papua New Guinea', 'New Caledonia', 'Micronesia'],
  oceania: ['Oceania', 'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu'],
  'middle east': ['Middle East', 'Arabian Gulf', 'Persian Gulf', 'Red Sea', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Oman', 'Iran', 'Egypt'],
};

const INDEKS = new Map(Object.entries(WILAYAH).map(([k, v]) => [kunciStem(k), v]));

/** Daftar negara/pulau untuk satu nama wilayah, atau null bila tidak dikenal. */
export function ekspansiWilayah(teks: string): string[] | null {
  return INDEKS.get(kunciStem(teks)) ?? null;
}
