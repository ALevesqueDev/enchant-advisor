"use client";

import { useState } from "react";
import { ENCHANTMENTS, ITEM_CATEGORY_LABELS, enchantmentById } from "@/lib/enchantments";
import { materialsFor, enchantability, MATERIAL_LABELS, type Material } from "@/lib/materials";
import { findBestTableOdds, type BestTableCombo } from "@/lib/tableOdds";
import { treasureOdds, type TreasureOddsResult } from "@/lib/treasure";
import type { ItemCategory } from "@/lib/types";

const SORTED_ENCHANTMENTS = [...ENCHANTMENTS].sort((a, b) => a.name.localeCompare(b.name));

export default function SearchMode() {
  const [enchantId, setEnchantId] = useState(SORTED_ENCHANTMENTS[0].id);
  const enchant = enchantmentById(enchantId);
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
      <section>
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">Enchantement recherché</h2>
        <select
          value={enchantId}
          onChange={(e) => changeEnchant(e.target.value)}
          className="mt-2 w-full rounded border border-black/10 dark:border-white/15 bg-transparent px-2 py-2 text-sm"
        >
          {SORTED_ENCHANTMENTS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} {e.treasureOnly ? "(trésor)" : ""}
            </option>
          ))}
        </select>
      </section>

      <section className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-sm font-medium text-black/60 dark:text-white/60">Niveau visé</label>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="mt-1 block rounded border border-black/10 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm"
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
            <label className="text-sm font-medium text-black/60 dark:text-white/60">Objet</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="mt-1 block rounded border border-black/10 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm"
            >
              {enchant.categories.map((c) => (
                <option key={c} value={c}>
                  {ITEM_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        )}

        {enchant.treasureOnly && (
          <div>
            <label className="text-sm font-medium text-black/60 dark:text-white/60">Luck of the Sea (pêche)</label>
            <select
              value={luckOfTheSea}
              onChange={(e) => setLuckOfTheSea(Number(e.target.value))}
              className="mt-1 block rounded border border-black/10 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm"
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
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {calculating ? "Calcul en cours…" : "Calculer"}
        </button>
      </section>

      {enchant.treasureOnly && (
        <p className="mt-3 text-xs text-black/50 dark:text-white/50">
          {enchant.name} ne peut jamais sortir de la table d&apos;enchantement — c&apos;est un enchantement trésor.
          Aucun objet, matériau ou niveau n&apos;y change quoi que ce soit.
        </p>
      )}

      {tableResults && (
        <section className="mt-6">
          <h3 className="text-sm font-medium text-black/60 dark:text-white/60">
            Meilleures combinaisons ({ITEM_CATEGORY_LABELS[category]})
          </h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-black/5 dark:bg-white/10 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Rang</th>
                  <th className="px-3 py-2 font-medium">Matériau</th>
                  <th className="px-3 py-2 font-medium">Niveau à la table</th>
                  <th className="px-3 py-2 font-medium text-right">Probabilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {tableResults.slice(0, 8).map((r, i) => (
                  <tr key={`${r.material}-${r.level}`} className={i === 0 ? "bg-emerald-600/10" : undefined}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{MATERIAL_LABELS[r.material as Material] ?? r.material}</td>
                    <td className="px-3 py-2">{r.level}</td>
                    <td className="px-3 py-2 text-right font-medium">{(r.probability * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-black/50 dark:text-white/50">
            Simulation Monte-Carlo de l&apos;algorithme réel du jeu (pas une formule fermée) — voir
            src/lib/tableOdds.ts. Ces probabilités concernent l&apos;objet enchanté directement, pas un livre.
          </p>
        </section>
      )}

      {treasureResults && (
        <section className="mt-6">
          <h3 className="text-sm font-medium text-black/60 dark:text-white/60">Sources et probabilités</h3>
          <div className="mt-2 space-y-3">
            {treasureResults.map((r) => (
              <div key={r.source} className="rounded-lg border border-black/10 dark:border-white/15 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {r.source === "fishing" && "Pêche"}
                    {r.source === "trading" && "Commerce (bibliothécaire)"}
                    {r.source === "structure_loot_only" && "Butin de structure uniquement"}
                  </span>
                  {r.probability !== undefined && (
                    <span className="text-sm font-semibold">{(r.probability * 100).toFixed(3)}%</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-black/50 dark:text-white/50">{r.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
