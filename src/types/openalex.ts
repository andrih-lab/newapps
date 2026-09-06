/** Subset tipe respons OpenAlex Works API yang dipakai aplikasi ini. */

export interface OpenAlexAuthorship {
  author: {
    id: string;
    display_name: string;
  };
  institutions: Array<{
    id: string;
    display_name: string;
    country_code: string | null;
  }>;
  countries?: string[];
}

export interface OpenAlexLocation {
  source: {
    id: string;
    display_name: string;
    host_organization_name?: string | null;
  } | null;
}

export interface OpenAlexWork {
  id: string;
  doi: string | null;
  title: string | null;
  display_name: string | null;
  publication_year: number | null;
  cited_by_count: number;
  type: string | null;
  language: string | null;
  authorships: OpenAlexAuthorship[];
  primary_location: OpenAlexLocation | null;
  keywords?: Array<{ display_name: string }>;
  concepts?: Array<{ display_name: string }>;
  abstract_inverted_index: Record<string, number[]> | null;
}

export interface OpenAlexWorksResponse {
  meta: {
    count: number;
    next_cursor: string | null;
  };
  results: OpenAlexWork[];
}

export interface OpenAlexSearchParams {
  query: string;
  tahunMulai?: number;
  tahunAkhir?: number;
  jenisDokumen?: string[];
  bahasa?: string[];
  perPage?: number;
}
