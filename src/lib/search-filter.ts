import { defaultFilter } from "cmdk";

// cmdk's fuzzy score over the keywords only, so the id in each item's value never matches.
export function searchFilter(_value: string, search: string, keywords?: string[]): number {
  return defaultFilter(keywords?.join(" ") ?? "", search);
}
