import type { RecordItem } from '../types/record';
import { buildCooccurrenceNetwork, type NetworkResult } from './network';

/** Jaringan co-occurrence kata kunci (Bagian 4, Modul 3). */
export function computeKeywordCooccurrence(records: RecordItem[], topN = 50): NetworkResult {
  return buildCooccurrenceNetwork(records, (r) => r.kataKunci, topN);
}
