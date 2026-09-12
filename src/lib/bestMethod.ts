// Ranks every acquisition method (table on the item, table on a book,
// villager trading, fishing) for a target enchant/level by probability
// per attempt, so search mode can answer "what should I actually do"
// instead of leaving the user to compare four separate sections by eye.
//
// Deliberately just a ranking, not a single "do this" verdict: the four
// methods don't cost the same per attempt (a table roll spends XP levels
// and consumes the item/book; a trade reroll costs a lectern + emeralds;
// a fishing cast only costs time) — see searchBestMethodCaveat in
// strings.ts, shown alongside this in the UI. Pure numbers only, no
// locale-dependent text, same reason as every other computed result in
// this app (see treasure.ts's header for the bug that pattern avoids).

export type MethodKind = "table_item" | "table_book" | "trading" | "fishing";

export interface RankableMethod<T = undefined> {
  kind: MethodKind;
  /** Probability (0-1) of success on a single attempt via this method. */
  probability: number;
  /** Method-specific detail the caller wants back attached to the ranked result (e.g. which material/slot) — opaque to this module. */
  detail?: T;
}

export interface RankedMethod<T = undefined> extends RankableMethod<T> {
  /** 1/probability — how many attempts you'd expect to need on average. Infinity when probability is 0 (never happens via this method at this level). */
  expectedAttempts: number;
}

/** Sorts by probability descending, richest (fewest expected attempts) first. */
export function rankMethods<T = undefined>(methods: RankableMethod<T>[]): RankedMethod<T>[] {
  return methods
    .map((m) => ({ ...m, expectedAttempts: m.probability > 0 ? 1 / m.probability : Infinity }))
    .sort((a, b) => b.probability - a.probability);
}
