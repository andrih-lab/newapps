import { db } from '../db';
import type { FilterPencarian, SearchQuery, SumberData } from '../../types/project';

export async function recordSearchQuery(params: {
  projectId: string;
  sumber: SumberData;
  stringQuery: string;
  filter: FilterPencarian;
  jumlahHasil: number;
}): Promise<SearchQuery> {
  const query: SearchQuery = {
    id: crypto.randomUUID(),
    projectId: params.projectId,
    sumber: params.sumber,
    stringQuery: params.stringQuery,
    filter: params.filter,
    tanggal: new Date().toISOString(),
    jumlahHasil: params.jumlahHasil,
  };
  await db.searchQuery.add(query);
  return query;
}

export function listSearchQueries(projectId: string): Promise<SearchQuery[]> {
  return db.searchQuery.where('projectId').equals(projectId).reverse().sortBy('tanggal');
}
