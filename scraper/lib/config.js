import payload from '../payload.json' with { type: 'json' };
import sourceCatalog from '../../shared/sourceCatalog.json' with { type: 'json' };

export const MAX_LOAD_MORE_CLICKS_PER_PAGE = 25;
export const MAX_PAGES_PER_SITE = 50;
export const WAIT_AFTER_CLICK_MS = 900;

export const careerPages = payload.careerPages;
export const keywords = payload.keywords;
export const sourceCatalogByUrl = new Map(sourceCatalog.map((source) => [source.url, source]));
