"use client";

import { useMemo, useState } from "react";
import { ITEM_CATEGORY_LABELS, enchantmentById, enchantmentsFor } from "@/lib/enchantments";
import { GOALS } from "@/lib/goals";
import { recommend, untouchedCurrentEnchants } from "@/lib/recommend";
import { planAnvilCombines } from "@/lib/anvil";
import { CATEGORY_ICON, rarityFromWeight, rarityLabel, RARITY_VAR } from "@/lib/presentation";
import { enchantmentName, representativeItemName, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { t, blockedByNote, levelTargetNote } from "@/lib/strings";
import { useLocale } from "./LocaleContext";
import type { EnchantSet, ItemCategory } from "@/lib/types";
import SearchMode from "./SearchMode";
import Footer from "./Footer";

const CATEGORIES = Object.keys(ITEM_CATEGORY_LABELS) as ItemCategory[];

function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
      <span className="accent-gradient flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
        {index}
      </span>
      {children}
    </h2>
  );
}

function LocaleToggle({ locale, setLocale }: { locale: Locale; setLocale: (l: Locale) => void }) {
  return (
    <div className="panel inline-flex gap-1 p-1">
      {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-all ${
            l === locale ? "accent-gradient text-white" : "text-muted hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function RarityDot({ weight, locale }: { weight: number; locale: Locale }) {
  const rarity = rarityFromWeight(weight);
  return (
    <span
      title={rarityLabel(rarity, locale)}
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: `var(${RARITY_VAR[rarity]})`, boxShadow: `0 0 6px var(${RARITY_VAR[rarity]})` }}
    />
  );
}

export default function Home() {
  const { locale, setLocale } = useLocale();
  const [mode, setMode] = useState<"advisor" | "search">("advisor");
  const [category, setCategory] = useState<ItemCategory>("pickaxe");
  const [current, setCurrent] = useState<EnchantSet>({});
  const [goalId, setGoalId] = useState<string>(GOALS["pickaxe"][0].id);

  const applicable = useMemo(() => enchantmentsFor(category), [category]);
  const goals = GOALS[category];
  const goal = goals.find((g) => g.id === goalId) ?? goals[0];

  const STATUS_LABEL: Record<string, string> = {
    add: t("statusAdd", locale),
    upgrade: t("statusUpgrade", locale),
    "already-optimal": t("statusOptimal", locale),
    conflict: t("statusConflict", locale),
  };
  const STATUS_STYLE: Record<string, string> = {
    add: "bg-[var(--status-add-bg)] text-[var(--status-add-fg)]",
    upgrade: "bg-[var(--status-upgrade-bg)] text-[var(--status-upgrade-fg)]",
    "already-optimal": "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
    conflict: "bg-[var(--status-conflict-bg)] text-[var(--status-conflict-fg)]",
  };

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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            ✦ Minecraft Java Edition
          </span>
          <h1 className="font-display accent-text mt-4 text-4xl font-bold sm:text-5xl">Enchant Advisor</h1>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">{t("heroTagline", locale)}</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <LocaleToggle locale={locale} setLocale={setLocale} />
        </div>
      </div>

      {/* Mode toggle */}
      <div className="panel mt-8 inline-flex gap-1 p-1">
        <button
          onClick={() => setMode("advisor")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            mode === "advisor" ? "accent-gradient text-white shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          {t("modeAdvisor", locale)}
        </button>
        <button
          onClick={() => setMode("search")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            mode === "search" ? "accent-gradient text-white shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          {t("modeSearch", locale)}
        </button>
      </div>

      {mode === "search" && <SearchMode />}

      {mode === "advisor" && (
        <>
          {/* Step 1: item */}
          <section className="mt-10">
            <SectionLabel index="1">{t("step1Item", locale)}</SectionLabel>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => changeCategory(c)}
                  className={`panel flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-all hover:-translate-y-0.5 ${
                    c === category ? "ring-2 ring-[var(--accent-solid)]" : ""
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICON[c]}</span>
                  {representativeItemName(c, locale)}
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: current enchants */}
          <section className="mt-10">
            <SectionLabel index="2">{t("step2CurrentEnchants", locale)}</SectionLabel>
            <div className="panel mt-3 divide-y divide-[var(--surface-border)]">
              {applicable.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <RarityDot weight={e.weight} locale={locale} />
                    {enchantmentName(e.id, locale)}
                    {e.treasureOnly && <span className="text-xs text-muted">{t("treasureTag", locale)}</span>}
                  </span>
                  <select
                    value={current[e.id] ?? 0}
                    onChange={(ev) => setLevel(e.id, Number(ev.target.value))}
                    className="rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1 text-sm"
                  >
                    <option value={0}>{t("noneOption", locale)}</option>
                    {Array.from({ length: e.maxLevel }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {t("levelPrefix", locale)} {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* Step 3: goal */}
          <section className="mt-10">
            <SectionLabel index="3">{t("step3Goal", locale)}</SectionLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoalId(g.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    g.id === goal.id
                      ? "accent-gradient text-white shadow-sm"
                      : "panel text-muted hover:text-foreground"
                  }`}
                >
                  {g.label[locale]}
                </button>
              ))}
            </div>
          </section>

          {/* Recommendations */}
          <section className="mt-10">
            <SectionLabel index="4">{t("step4Recommendation", locale)}</SectionLabel>
            <div className="panel mt-3 divide-y divide-[var(--surface-border)]">
              {recommendations.map((r) => {
                const e = enchantmentById(r.enchantId);
                return (
                  <div key={r.enchantId} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RarityDot weight={e.weight} locale={locale} />
                      <div>
                        <div className="text-sm font-medium">{enchantmentName(e.id, locale)}</div>
                        <div className="text-xs text-muted">
                          {r.status === "conflict"
                            ? blockedByNote(enchantmentName(r.conflictsWith!, locale), locale)
                            : levelTargetNote(r.currentLevel, r.targetLevel, locale)}
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                );
              })}
            </div>
            {untouched.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                {t("keptNoImpact", locale)} {untouched.map((id) => enchantmentName(id, locale)).join(", ")}.
              </p>
            )}
          </section>

          {/* Anvil plan */}
          {anvilPlan.steps.length > 0 && (
            <section className="mt-10">
              <SectionLabel index="5">{t("step5AnvilCost", locale)}</SectionLabel>
              <p className="mt-2 text-xs text-muted">{t("anvilAssumption", locale)}</p>

              <div className="panel mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted">
                    <tr className="border-b border-[var(--surface-border)]">
                      <th className="px-4 py-2.5 font-medium">{t("anvilStep", locale)}</th>
                      <th className="px-4 py-2.5 font-medium">{t("anvilEnchantment", locale)}</th>
                      <th className="px-4 py-2.5 font-medium text-right">{t("anvilPenalty", locale)}</th>
                      <th className="px-4 py-2.5 font-medium text-right">{t("anvilCost", locale)}</th>
                      <th className="px-4 py-2.5 font-medium text-right">{t("anvilTotal", locale)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--surface-border)]">
                    {anvilPlan.steps.map((s, i) => (
                      <tr key={s.enchantId} className={s.tooExpensive ? "bg-[var(--status-conflict-bg)]" : undefined}>
                        <td className="px-4 py-2.5 text-muted">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          {enchantmentName(s.enchantId, locale)} {s.level}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted">{s.priorWorkPenalty}</td>
                        <td className="px-4 py-2.5 text-right">
                          {s.stepCost} {s.tooExpensive && "⚠"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          {anvilPlan.steps.slice(0, i + 1).reduce((sum, x) => sum + x.stepCost, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel mt-3 flex items-center gap-3 px-4 py-3">
                <span className="accent-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                  XP
                </span>
                <p className="text-sm">
                  <strong className="font-display text-base">{anvilPlan.totalCost}</strong>{" "}
                  {t("anvilXpTotalSuffix", locale)}
                </p>
              </div>

              {anvilPlan.anyTooExpensive && (
                <p className="mt-2 text-sm" style={{ color: "var(--status-conflict-fg)" }}>
                  {t("anvilTooExpensive", locale)}
                </p>
              )}
            </section>
          )}
        </>
      )}

      <Footer locale={locale} />
    </div>
  );
}
