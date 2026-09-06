import Dexie, { type EntityTable } from 'dexie';
import type { Project, SearchQuery } from '../types/project';
import type { Criterion, Extraction, RecordItem, ScreeningLog } from '../types/record';
import { DB_NAME, DB_SCHEMA_V1 } from './schema';

export class SlrDatabase extends Dexie {
  project!: EntityTable<Project, 'id'>;
  searchQuery!: EntityTable<SearchQuery, 'id'>;
  record!: EntityTable<RecordItem, 'id'>;
  criterion!: EntityTable<Criterion, 'id'>;
  extraction!: EntityTable<Extraction, 'id'>;
  screeningLog!: EntityTable<ScreeningLog, 'id'>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores(DB_SCHEMA_V1);
  }
}

export const db = new SlrDatabase();
