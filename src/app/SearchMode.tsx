"use client";

import { useMemo, useState } from "react";
import { ENCHANTMENTS, enchantmentById } from "@/lib/enchantments";
import { materialsFor, enchantability, type Material } from "@/lib/materials";
import { findBestTableOdds, type BestTableCombo } from "@/lib/tableOdds";
import { treasureOdds, type TreasureOddsResult } from "@/lib/treasure";
import { RARITY_LABELS, RARITY_VAR, rarityFromWeight } from "@/lib/presentation";
import { enchantmentName, itemName, representativeItemName } from "@/lib/i18n";
import { useLocale } from "./LocaleContext";
import type { ItemCategory } from "@/lib/types";

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

const SOURCE_ICON: Record<TreasureOddsResult["source"], string> = {
  fishing: "🎣",
  trading: "📚",
  structure_loot_only: "🗝️",
};

const SOURCE_LABEL: Record<TreasureOddsResult["source"], string> = {
  fishing: "Pêche",
  trading: "Commerce (bibliothécaire)",
  structure_loot_only: "Butin de structure uniquement",
};

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

  const [tableResults, setTableResults] = useState<BestTableCombo[] | null>(null);
  const [treasureResults, setTreasureResults] = useState<TreasureOddsResult[] | null>(null);
  const [calculating, setCalculating] = useState(false);

  function changeEnchant(id: string) {
    const e = enchantmentById(id);
    setEnchantId(id);
    setLevel(e.maxLevel);
    setCategory(e.categories[0]);
    setTableResults(null);
    setTreasureResults(null);
  }

  function calculate() {
    setCalculating(true);
    setTableResults(null);
    setTreasureResults(null);
    // Let the "calculating" state paint before the synchronous simulation runs.
    setTimeout(() => {
      if (enchant.treasureOnly) {
        setTreasureResults(treasureOdds(enchantId, level, luckOfTheSea));
      } else {
        const materials = materialsFor(category);
        const materialInputs =
          materials.length > 0
            ? materials.map((m) => ({ id: m, enchantability: enchantability(category, m) }))
            : [{ id: "—", enchantability: enchantability(category) }];
        setTableResults(findBestTableOdds(category, enchantId, level, materialInputs));
      }
      setCalculating(false);
    }, 10);
  }

  return (
    <div className="mt-8">
      <section className="panel p-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">Enchantement recherché</label>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: `var(${RARITY_VAR[rarity]})`, boxShadow: `0 0 8px var(${RARITY_VAR[rarity]})` }}
          />
          <select
            value={enchantId}
            onChange={(e) => changeEnchant(e.target.value)}
            className="w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-2 text-sm"
          >
            {sortedEnchantments.map((e) => (
              <option key={e.id} value={e.id}>
                {enchantmentName(e.id, locale)} {e.treasureOnly ? "(trésor)" : ""}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1.5 text-xs text-muted">{RARITY_LABELS[rarity]}</p>
      </section>

      <section className="panel mt-4 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">Niveau visé</label>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="mt-1.5 block rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
          >
            {Array.from({ length: enchant.maxLevel }, (_, i) => i + 1).map((lvl) => (
              <option key={lvl} value={lvl}>
                Niveau {lvl}
              </option>
            ))}
          </select>
        </div>

        {!enchant.treasureOnly && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Objet</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="mt-1.5 block rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
            >
              {enchant.categories.map((c) => (
                <option key={c} value={c}>
                  {representativeItemName(c, locale)}
                </option>
              ))}
            </select>
          </div>
        )}

        {enchant.treasureOnly && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Luck of the Sea (pêche)
            </label>
            <select
              value={luckOfTheSea}
              onChange={(e) => setLuckOfTheSea(Number(e.target.value))}
              className="mt-1.5 block rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
            >
              {[0, 1, 2, 3].map((lvl) => (
                <option key={lvl} value={lvl}>
                  Niveau {lvl}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={calculate}
          disabled={calculating}
          className="glint accent-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
        >
          {calculating ? "Calcul en cours…" : "✦ Calculer"}
        </button>
      </section>

      {enchant.treasureOnly && (
        <p className="mt-3 text-xs text-muted">
          {enchantmentName(enchantId, locale)} ne peut jamais sortir de la table d&apos;enchantement — c&apos;est un
          enchantement trésor. Aucun objet, matériau ou niveau n&apos;y change quoi que ce soit.
        </p>
      )}

      {tableResults && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Meilleures combinaisons — {representativeItemName(category, locale)}
          </h3>
          <div className="mt-3 space-y-2">
            {tableResults.slice(0, 8).map((r, i) => (
              <div
                key={`${r.material}-${r.level}`}
                className={`panel flex items-center gap-3 p-3 ${i === 0 ? "glint ring-1 ring-[var(--accent-solid)]" : ""}`}
              >
                <span className="w-6 shrink-0 text-center text-base">{RANK_MEDAL[i] ?? i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {itemName(category, r.material as Material, locale)} · Niveau {r.level}
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
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Simulation Monte-Carlo de l&apos;algorithme réel du jeu (pas une formule fermée) — voir
            src/lib/tableOdds.ts. Ces probabilités concernent l&apos;objet enchanté directement, pas un livre.
          </p>
        </section>
      )}

      {treasureResults && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Sources et probabilités</h3>
          <div className="mt-3 space-y-2">
            {treasureResults.map((r) => (
              <div key={r.source} className="panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-base">{SOURCE_ICON[r.source]}</span>
                    {SOURCE_LABEL[r.source]}
                  </span>
                  {r.probability !== undefined && (
                    <span className="font-display text-sm font-bold accent-text">
                      {(r.probability * 100).toFixed(3)}%
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted">{r.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
