"use client";

import { useMemo, useState } from "react";
import { ITEM_CATEGORY_LABELS, enchantmentById, enchantmentsFor } from "@/lib/enchantments";
import { GOALS } from "@/lib/goals";
import { recommend, untouchedCurrentEnchants } from "@/lib/recommend";
import { planAnvilCombines } from "@/lib/anvil";
import type { EnchantSet, ItemCategory } from "@/lib/types";

const CATEGORIES = Object.keys(ITEM_CATEGORY_LABELS) as ItemCategory[];

const STATUS_LABEL: Record<string, string> = {
  add: "À ajouter",
  upgrade: "À améliorer",
  "already-optimal": "Déjà optimal",
  conflict: "Conflit",
};

const STATUS_STYLE: Record<string, string> = {
  add: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400",
  upgrade: "bg-amber-600/15 text-amber-700 dark:text-amber-400",
  "already-optimal": "bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60",
  conflict: "bg-red-600/15 text-red-700 dark:text-red-400",
};

export default function Home() {
  const [category, setCategory] = useState<ItemCategory>("pickaxe");
  const [current, setCurrent] = useState<EnchantSet>({});
  const [goalId, setGoalId] = useState<string>(GOALS["pickaxe"][0].id);

  const applicable = useMemo(() => enchantmentsFor(category), [category]);
  const goals = GOALS[category];
  const goal = goals.find((g) => g.id === goalId) ?? goals[0];

  function changeCategory(next: ItemCategory) {
    setCategory(next);
    setCurrent({});
    setGoalId(GOALS[next][0].id);
  }

  function setLevel(enchantId: string, level: number) {
    setCurrent((prev) => {
      const next = { ...prev };
      if (level <= 0) delete next[enchantId];
      else next[enchantId] = level;
      return next;
    });
  }

  const recommendations = useMemo(() => recommend(current, goal), [current, goal]);
  const untouched = useMemo(() => untouchedCurrentEnchants(current, goal), [current, goal]);

  const anvilTargets = recommendations
    .filter((r) => r.status === "add" || r.status === "upgrade")
    .map((r) => ({ id: r.enchantId, level: r.targetLevel }));
  const anvilPlan = useMemo(() => planAnvilCombines(anvilTargets), [anvilTargets]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">Enchant Advisor</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Item + tier + enchantements déjà présents + objectif → ce qu&apos;il faut ajouter, et le coût d&apos;enclume.
        Minecraft Java Edition uniquement.
      </p>

      {/* Step 1: item */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">1. Objet</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => changeCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                c === category
                  ? "border-transparent bg-foreground text-background"
                  : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {ITEM_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: current enchants */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">
          2. Enchantements déjà sur l&apos;objet
        </h2>
        <div className="mt-2 divide-y divide-black/10 dark:divide-white/10 rounded-lg border border-black/10 dark:border-white/15">
          {applicable.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-4 px-3 py-2">
              <span className="text-sm">
                {e.name}
                {e.treasureOnly && (
                  <span className="ml-1.5 text-xs text-black/40 dark:text-white/40">(trésor)</span>
                )}
              </span>
              <select
                value={current[e.id] ?? 0}
                onChange={(ev) => setLevel(e.id, Number(ev.target.value))}
                className="rounded border border-black/10 dark:border-white/15 bg-transparent px-2 py-1 text-sm"
              >
                <option value={0}>—</option>
                {Array.from({ length: e.maxLevel }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Niveau {lvl}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Step 3: goal */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">3. Objectif</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => setGoalId(g.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                g.id === goal.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">Recommandation</h2>
        <div className="mt-2 divide-y divide-black/10 dark:divide-white/10 rounded-lg border border-black/10 dark:border-white/15">
          {recommendations.map((r) => {
            const e = enchantmentById(r.enchantId);
            return (
              <div key={r.enchantId} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{e.name}</div>
                  <div className="text-xs text-black/50 dark:text-white/50">
                    {r.status === "conflict"
                      ? `Bloqué par ${enchantmentById(r.conflictsWith!).name} déjà sur l'objet`
                      : `${r.currentLevel > 0 ? `Niveau ${r.currentLevel} → ` : ""}Niveau ${r.targetLevel} visé`}
                  </div>
                </div>
                <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
            );
          })}
        </div>
        {untouched.length > 0 && (
          <p className="mt-2 text-xs text-black/50 dark:text-white/50">
            Conservés sans impact sur cet objectif : {untouched.map((id) => enchantmentById(id).name).join(", ")}.
          </p>
        )}
      </section>

      {/* Anvil plan */}
      {anvilPlan.steps.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-black/60 dark:text-white/60">Coût d&apos;enclume</h2>
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            En supposant chaque enchantement appliqué via un livre neuf, séparément. Le total ne dépend pas de
            l&apos;ordre — seul le nombre d&apos;opérations précédentes sur l&apos;objet compte pour la pénalité.
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-black/5 dark:bg-white/10 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Étape</th>
                  <th className="px-3 py-2 font-medium">Enchantement</th>
                  <th className="px-3 py-2 font-medium text-right">Pénalité</th>
                  <th className="px-3 py-2 font-medium text-right">Coût</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {anvilPlan.steps.map((s, i) => (
                  <tr key={s.enchantId} className={s.tooExpensive ? "bg-red-600/10" : undefined}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">
                      {enchantmentById(s.enchantId).name} {s.level}
                    </td>
                    <td className="px-3 py-2 text-right">{s.priorWorkPenalty}</td>
                    <td className="px-3 py-2 text-right">
                      {s.stepCost} {s.tooExpensive && "⚠"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {anvilPlan.steps.slice(0, i + 1).reduce((sum, x) => sum + x.stepCost, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm">
            <strong>{anvilPlan.totalCost}</strong> niveaux d&apos;XP au total.
          </p>
          {anvilPlan.anyTooExpensive && (
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              ⚠ Au moins une étape dépasse 39 niveaux — l&apos;enclume refusera l&apos;opération (&quot;Too
              Expensive!&quot;) en survie/aventure. Retire un objectif de moindre priorité, ou termine ce combo en
              mode créatif.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
