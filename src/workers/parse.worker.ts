import { parseByFormat, type FormatFile } from '../parsers';
import type { CsvColumnMapping } from '../parsers/csvColumnMapping';
import type { ParseResult } from '../parsers/normalize';
import { handleWorkerRequests } from './workerClient';

export interface ParseWorkerRequest {
  format: FormatFile;
  text: string;
  mapping?: CsvColumnMapping;
}

export type ParseWorkerResponse = ParseResult;

handleWorkerRequests<ParseWorkerRequest, ParseWorkerResponse>((payload) => {
  return parseByFormat(payload.format, payload.text, payload.mapping);
});
