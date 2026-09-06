import type { NetworkResult } from '../../bibliometrics/network';
import { NetworkGraph } from './NetworkGraph';

export function KeywordCooccurrenceNetwork({ data }: { data: NetworkResult }) {
  return <NetworkGraph title="Jaringan Co-word Kata Kunci" data={data} filenameBase="jaringan-kata-kunci" />;
}
