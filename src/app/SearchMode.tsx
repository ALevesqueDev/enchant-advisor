"use client";

import { useEffect, useMemo, useState } from "react";
import { ENCHANTMENTS, enchantmentById } from "@/lib/enchantments";
import { materialsFor, enchantability, type Material } from "@/lib/materials";
import {
  findBestTableOdds,
  findBestBookOdds,
  slotLevelRange,
  type BestTableCombo,
  type BestBookSlot,
  type EnchantingSlot,
} from "@/lib/tableOdds";
import { treasureOdds, treasureSourceNote, isStructureLootOnly, type TreasureOddsResult } from "@/lib/treasure";
import { rankMethods, type RankableMethod } from "@/lib/bestMethod";
import { rarityFromWeight, rarityLabel, RARITY_VAR } from "@/lib/presentation";
import { enchantmentName, itemName, bareItemName } from "@/lib/i18n";
import { t, slotLabel, methodLabel, expectedAttemptsNote } from "@/lib/strings";
import { readShareParams, patchShareParams } from "@/lib/shareLink";
import { useLocale } from "./LocaleContext";
import type { ItemCategory } from "@/lib/types";

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

const SOURCE_ICON: Record<TreasureOddsResult["source"], string> = {
  fishing: "🎣",
  trading: "📚",
  structure_loot_only: "🗝️",
};

interface Results {
  table: BestTableCombo[] | null;
  book: BestBookSlot[] | null;
  tradeAndFish: TreasureOddsResult[] | null;
}

/** material only applies to the table_item method; slot to both table methods. */
interface MethodDetail {
  material?: string;
  slot?: EnchantingSlot;
}

export default function SearchMode() {
  const { locale } = useLocale();
  const sortedEnchantments = useMemo(
    () => [...ENCHANTMENTS].sort((a, b) => enchantmentName(a.id, locale).localeCompare(enchantmentName(b.id, locale))),
    [locale]
  );

  const [enchantId, setEnchantId] = useState(sortedEnchantments[0].id);
  const enchant = enchantmentById(enchantId);
  const rarity = rarityFromWeight(enchant.weight);
  const [level, setLevel] = useState(enchant.maxLevel);
  const [category, setCategory] = useState<ItemCategory>(enchant.categories[0]);
  const [luckOfTheSea, setLuckOfTheSea] = useState(0);
  // 15 is the standard "full room" setup most guides recommend — a
  // reasonable default for someone who hasn't counted their own yet.
  const [bookshelves, setBookshelves] = useState(15);

  const [results, setResults] = useState<Results | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    // One-time hydration from a shared link — this component only exists
    // while search mode is showing (page.tsx conditionally renders it), so
    // "on mount" already means "just switched into this mode", no extra
    // guard needed. See page.tsx's own hydration effect for the same
    // pattern applied to advisor mode. Every field is validated against
    // the real enchantment/category data before being applied.
    const s = readShareParams(new URLSearchParams(window.location.search)).search;
    if (!s) return;

    const validEnchant = s.enchantId ? ENCHANTMENTS.find((e) => e.id === s.enchantId) : undefined;
    if (validEnchant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnchantId(validEnchant.id);
      const lvl = s.level && s.level >= 1 && s.level <= validEnchant.maxLevel ? s.level : validEnchant.maxLevel;
      setLevel(lvl);
      const cat = s.category && validEnchant.categories.includes(s.category) ? s.category : validEnchant.categories[0];
      setCategory(cat);
    }
    if (s.luckOfTheSea !== undefined && s.luckOfTheSea >= 0 && s.luckOfTheSea <= 3) {
      setLuckOfTheSea(s.luckOfTheSea);
    }
    if (s.bookshelves !== undefined && s.bookshelves >= 0 && s.bookshelves <= 15) {
      setBookshelves(s.bookshelves);
    }
  }, []);

  // Keeps the URL's search-mode params in sync with the live selection —
  // namespaced (e/lv/c/lk/bs) so they coexist with the advisor's own params
  // (it/mt/g/h) written by page.tsx without clobbering each other.
  useEffect(() => {
    patchShareParams({
      e: enchantId,
      lv: String(level),
      c: category,
      lk: luckOfTheSea > 0 ? String(luckOfTheSea) : null,
      bs: bookshelves !== 15 ? String(bookshelves) : null,
    });
  }, [enchantId, level, category, luckOfTheSea, bookshelves]);

  const structureOnly = isStructureLootOnly(enchantId);

  // Ranks every method that has a number at all (a category might have no
  // table odds computed for a treasure enchant, or no trade/fish odds for
  // a structure-only one) by odds per attempt — see bestMethod.ts's header
  // for why this stays a ranking rather than a single verdict.
  const bestMethods = useMemo(() => {
    if (!results) return null;
    const methods: RankableMethod<MethodDetail>[] = [];
    const bestTable = results.table?.[0];
    if (bestTable) {
      methods.push({ kind: "table_item", probability: bestTable.probability, detail: { material: bestTable.material, slot: bestTable.slot } });
    }
    const bestBook = results.book?.[0];
    if (bestBook) {
      methods.push({ kind: "table_book", probability: bestBook.probability, detail: { slot: bestBook.slot } });
    }
    for (const r of results.tradeAndFish ?? []) {
      if (r.source === "trading") methods.push({ kind: "trading", probability: r.probability });
      if (r.source === "fishing") methods.push({ kind: "fishing", probability: r.probability });
    }
    return methods.length > 0 ? rankMethods(methods) : null;
  }, [results]);

  function changeEnchant(id: string) {
    const e = enchantmentById(id);
    setEnchantId(id);
    setLevel(e.maxLevel);
    setCategory(e.categories[0]);
    setResults(null);
  }

  function calculate() {
    setCalculating(true);
    setResults(null);
    // Let the "calculating" state paint before the synchronous simulation runs.
    setTimeout(() => {
      const next: Results = { table: null, book: null, tradeAndFish: null };

      if (!enchant.treasureOnly) {
        const materials = materialsFor(category);
        const materialInputs =
          materials.length > 0
            ? materials.map((m) => ({ id: m, enchantability: enchantability(category, m) }))
            : [{ id: "—", enchantability: enchantability(category) }];
        next.table = findBestTableOdds(category, enchantId, level, materialInputs, bookshelves);
        next.book = findBestBookOdds(enchantId, level, bookshelves);
      }

      if (!structureOnly) {
        next.tradeAndFish = treasureOdds(enchantId, level, luckOfTheSea);
      }

      setResults(next);
      setCalculating(false);
    }, 10);
  }

  return (
    <div className="mt-8">
      <section className="panel p-4">
        <label htmlFor="search-enchant-select" className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("searchEnchantmentLabel", locale)}
        </label>
        <div className="mt-2 flex items-center gap-2">
          {/* Purely decorative here — the rarity is already spelled out in
              visible text right below (unlike page.tsx's RarityDot, which
              has no such text nearby and needs its own accessible name). */}
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: `var(${RARITY_VAR[rarity]})`, boxShadow: `0 0 8px var(${RARITY_VAR[rarity]})` }}
          />
          <select
            id="search-enchant-select"
            value={enchantId}
            onChange={(e) => changeEnchant(e.target.value)}
            className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-2 text-sm"
          >
            {sortedEnchantments.map((e) => (
              <option key={e.id} value={e.id}>
                {enchantmentName(e.id, locale)} {e.treasureOnly ? t("treasureTag", locale) : ""}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1.5 text-xs text-muted">{rarityLabel(rarity, locale)}</p>
      </section>

      <section className="panel mt-4 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label htmlFor="search-level-select" className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("searchLevelLabel", locale)}
          </label>
          <select
            id="search-level-select"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="mt-1.5 block rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
          >
            {Array.from({ length: enchant.maxLevel }, (_, i) => i + 1).map((lvl) => (
              <option key={lvl} value={lvl}>
                {t("levelPrefix", locale)} {lvl}
              </option>
            ))}
          </select>
        </div>

        {!enchant.treasureOnly && (
          <div>
            <label htmlFor="search-item-select" className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("searchItemLabel", locale)}
            </label>
            <select
              id="search-item-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="mt-1.5 block rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
            >
              {enchant.categories.map((c) => (
                <option key={c} value={c}>
                  {bareItemName(c, locale)}
                </option>
              ))}
            </select>
          </div>
        )}

        {!enchant.treasureOnly && (
          <div>
            <label htmlFor="search-bookshelves-select" className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("searchBookshelvesLabel", locale)}
            </label>
            <select
              id="search-bookshelves-select"
              value={bookshelves}
              onChange={(e) => setBookshelves(Number(e.target.value))}
              className="mt-1.5 block rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
            >
              {Array.from({ length: 16 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        {!structureOnly && (
          <div>
            <label htmlFor="search-luck-select" className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("searchLuckOfSeaLabel", locale)}
            </label>
            <select
              id="search-luck-select"
              value={luckOfTheSea}
              onChange={(e) => setLuckOfTheSea(Number(e.target.value))}
              className="mt-1.5 block rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
            >
              {[0, 1, 2, 3].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {t("levelPrefix", locale)} {lvl}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={calculate}
          disabled={calculating}
          className="no-print glint accent-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
        >
          {calculating ? t("searchCalculating", locale) : t("searchCalculate", locale)}
        </button>
      </section>

      {enchant.treasureOnly && (
        <p className="mt-3 text-xs text-muted">
          {enchantmentName(enchantId, locale)} {t("searchTreasureOnlyNote", locale)}
        </p>
      )}
      {!enchant.treasureOnly && <p className="mt-3 text-xs text-muted">{t("searchBookshelvesNote", locale)}</p>}

      {bestMethods && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("searchBestMethodHeader", locale)}
          </h3>
          <div className="mt-3 space-y-2">
            {bestMethods.map((m, i) => (
              <div
                key={m.kind}
                className={`panel flex items-center gap-3 p-3 ${i === 0 ? "glint ring-1 ring-[var(--accent-solid)]" : ""}`}
              >
                {/* Decorative — rank is already conveyed by list order and the % shown right after. */}
                <span aria-hidden="true" className="w-6 shrink-0 text-center text-base">
                  {RANK_MEDAL[i] ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {methodLabel(m.kind, locale)}
                      {m.kind === "table_item" && m.detail?.slot && (
                        <>
                          {" "}
                          · {itemName(category, m.detail.material as Material, locale)} · {slotLabel(m.detail.slot, locale)}
                        </>
                      )}
                      {m.kind === "table_book" && m.detail?.slot && <> · {slotLabel(m.detail.slot, locale)}</>}
                    </span>
                    <span className="font-display shrink-0 text-sm font-bold accent-text">
                      {(m.probability * 100).toFixed(m.kind === "trading" || m.kind === "fishing" ? 3 : 1)}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{expectedAttemptsNote(m.expectedAttempts, locale)}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">{t("searchBestMethodCaveat", locale)}</p>
        </section>
      )}

      {results?.table && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("searchBestCombosPrefix", locale)} {bareItemName(category, locale)}
          </h3>
          <div className="mt-3 space-y-2">
            {results.table.slice(0, 8).map((r, i) => {
              const range = slotLevelRange(r.slot, bookshelves);
              return (
                <div
                  key={`${r.material}-${r.slot}`}
                  className={`panel flex items-center gap-3 p-3 ${i === 0 ? "glint ring-1 ring-[var(--accent-solid)]" : ""}`}
                >
                  {/* Decorative — rank is already conveyed by list order and the % shown right after. */}
                  <span aria-hidden="true" className="w-6 shrink-0 text-center text-base">
                    {RANK_MEDAL[i] ?? i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {itemName(category, r.material as Material, locale)} · {slotLabel(r.slot, locale)} (
                        {t("levelPrefix", locale)} {range.min}
                        {range.min !== range.max ? `–${range.max}` : ""})
                      </span>
                      <span className="font-display shrink-0 text-sm font-bold accent-text">
                        {(r.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-raised)]">
                      <div
                        className="accent-gradient h-full rounded-full"
                        style={{ width: `${Math.min(100, r.probability * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">{t("searchMonteCarloNoteItem", locale)}</p>
        </section>
      )}

      {results?.book && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("searchBestCombosPrefix", locale)} {t("enchantedBook", locale)}
          </h3>
          <p className="mt-1 text-xs text-muted">{t("searchBookNote", locale)}</p>
          <div className="mt-3 space-y-2">
            {results.book.slice(0, 8).map((r, i) => {
              const range = slotLevelRange(r.slot, bookshelves);
              return (
                <div
                  key={r.slot}
                  className={`panel flex items-center gap-3 p-3 ${i === 0 ? "glint ring-1 ring-[var(--accent-solid)]" : ""}`}
                >
                  {/* Decorative — rank is already conveyed by list order and the % shown right after. */}
                  <span aria-hidden="true" className="w-6 shrink-0 text-center text-base">
                    {RANK_MEDAL[i] ?? i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {slotLabel(r.slot, locale)} ({t("levelPrefix", locale)} {range.min}
                        {range.min !== range.max ? `–${range.max}` : ""})
                      </span>
                      <span className="font-display shrink-0 text-sm font-bold accent-text">
                        {(r.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-raised)]">
                      <div
                        className="accent-gradient h-full rounded-full"
                        style={{ width: `${Math.min(100, r.probability * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">{t("searchMonteCarloNoteBook", locale)}</p>
        </section>
      )}

      {results?.tradeAndFish && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("searchSourcesHeader", locale)}
          </h3>
          <div className="mt-3 space-y-2">
            {results.tradeAndFish.map((r) => (
              <div key={r.source} className="panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span aria-hidden="true" className="text-base">
                      {SOURCE_ICON[r.source]}
                    </span>
                    {r.source === "fishing" && t("sourceFishing", locale)}
                    {r.source === "trading" && t("sourceTrading", locale)}
                    {r.source === "structure_loot_only" && t("sourceStructureOnly", locale)}
                  </span>
                  {r.source !== "structure_loot_only" && (
                    <span className="font-display text-sm font-bold accent-text">
                      {(r.probability * 100).toFixed(3)}%
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted">{treasureSourceNote(r, enchantId, locale)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
