import { computeScreeningScores, type EngineResult, type Keputusan, type ScreeningDoc } from '../screening';
import { handleWorkerRequests } from './workerClient';

export interface ScreeningWorkerRequest {
  docs: ScreeningDoc[];
  keputusan: Keputusan[];
  queryText: string;
}

export interface ScreeningWorkerResponse {
  skor: Array<[string, number]>;
  modeAktif: EngineResult['modeAktif'];
}

handleWorkerRequests<ScreeningWorkerRequest, ScreeningWorkerResponse>((payload) => {
  const { skor, modeAktif } = computeScreeningScores(payload.docs, payload.keputusan, payload.queryText);
  return { skor: Array.from(skor.entries()), modeAktif };
});
