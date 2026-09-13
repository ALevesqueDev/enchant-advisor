// Encodes/decodes the current selection into URL query params so a link
// can be shared without any backend or accounts — just plain
// URLSearchParams, read once on mount and kept in sync via
// history.replaceState() as the user changes things (see page.tsx /
// SearchMode.tsx). Short keys since these end up in a URL someone pastes.

import type { EnchantSet, ItemCategory } from "./types";
import type { Material } from "./materials";
import type { Locale } from "./i18n";

export type Mode = "advisor" | "search" | "stats" | "anvil";

export interface AdvisorShareState {
  category: ItemCategory;
  material?: Material;
  goalId: string;
  current: EnchantSet;
}

export interface SearchShareState {
  enchantId: string;
  level: number;
  category: ItemCategory;
  luckOfTheSea: number;
  bookshelves: number;
}

/**
 * Turns `{efficiency: 5, unbreaking: 3}` into `"efficiency:5,unbreaking:3"`
 * for the `h` param. Exported so page.tsx's write-effect can build that one
 * param without duplicating the format here and there.
 */
export function encodeHave(current: EnchantSet): string {
  return Object.entries(current)
    .filter(([, level]) => level > 0)
    .map(([id, level]) => `${id}:${level}`)
    .join(",");
}

function decodeHave(raw: string | null): EnchantSet {
  if (!raw) return {};
  const result: EnchantSet = {};
  for (const pair of raw.split(",")) {
    const [id, levelStr] = pair.split(":");
    const level = Number(levelStr);
    if (id && Number.isFinite(level) && level > 0) result[id] = level;
  }
  return result;
}

/**
 * Merges `updates` into the CURRENT URL's query string (keeping whatever
 * keys the other mode/component already put there) and swaps it in with
 * replaceState — no navigation, no reload, no history entry per keystroke.
 * `null` deletes a key. No-op outside the browser (SSR has no location).
 */
export function patchShareParams(updates: Record<string, string | null>): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
  window.history.replaceState(null, "", newUrl);
}

export interface DecodedShareState {
  mode: Mode | null;
  locale: Locale | null;
  advisor: Partial<AdvisorShareState> | null;
  search: Partial<SearchShareState> | null;
}

/** Reads whatever was in the URL — every field is optional; the caller falls back to its own defaults for anything missing or invalid. */
export function readShareParams(params: URLSearchParams): DecodedShareState {
  const m = params.get("m");
  const mode: Mode | null = m === "a" ? "advisor" : m === "s" ? "search" : m === "t" ? "stats" : m === "n" ? "anvil" : null;

  const l = params.get("l");
  const locale: Locale | null = l === "en" || l === "fr" ? l : null;

  const hasAdvisorParams = params.has("it") || params.has("g") || params.has("h");
  const advisor: Partial<AdvisorShareState> | null = hasAdvisorParams
    ? {
        category: (params.get("it") as ItemCategory) ?? undefined,
        material: (params.get("mt") as Material) ?? undefined,
        goalId: params.get("g") ?? undefined,
        current: decodeHave(params.get("h")),
      }
    : null;

  const hasSearchParams = params.has("e");
  const search: Partial<SearchShareState> | null = hasSearchParams
    ? {
        enchantId: params.get("e") ?? undefined,
        level: params.has("lv") ? Number(params.get("lv")) : undefined,
        category: (params.get("c") as ItemCategory) ?? undefined,
        luckOfTheSea: params.has("lk") ? Number(params.get("lk")) : 0,
        bookshelves: params.has("bs") ? Number(params.get("bs")) : 15,
      }
    : null;

  return { mode, locale, advisor, search };
}
