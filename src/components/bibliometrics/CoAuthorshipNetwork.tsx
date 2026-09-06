import type { NetworkResult } from '../../bibliometrics/network';
import { NetworkGraph } from './NetworkGraph';

export function CoAuthorshipNetwork({ title, data }: { title: string; data: NetworkResult }) {
  const filenameBase = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return <NetworkGraph title={title} data={data} filenameBase={filenameBase || 'co-authorship'} />;
}
