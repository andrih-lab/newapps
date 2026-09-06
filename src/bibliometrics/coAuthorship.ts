import type { RecordItem } from '../types/record';
import { buildCooccurrenceNetwork, type NetworkResult } from './network';

/** Jaringan co-authorship penulis (Bagian 4, Modul 3). */
export function computeCoAuthorshipAuthors(records: RecordItem[], topN = 50): NetworkResult {
  return buildCooccurrenceNetwork(records, (r) => r.penulis, topN);
}

/** Jaringan co-authorship negara (Bagian 4, Modul 3). */
export function computeCoAuthorshipCountries(records: RecordItem[], topN = 50): NetworkResult {
  return buildCooccurrenceNetwork(records, (r) => r.negara, topN);
}
