import rawCatalog from '../../shared/sourceCatalog.json';
import type { SourceMetadata } from '../types/job';

export const sourceCatalog = rawCatalog as SourceMetadata[];

export const sourceCatalogByUrl = new Map(
  sourceCatalog.map((source) => [source.url, source] as const)
);

export function getSourceMetadata(url: string): SourceMetadata {
  return (
    sourceCatalogByUrl.get(url) ?? {
      url,
      institution: 'Unknown source',
      countryName: 'Unknown',
      countryCode: 'unknown',
      platform: 'Direct careers page',
      tags: [],
    }
  );
}
