"use client";

import { Fragment, useEffect, useMemo, useReducer, useState } from "react";
import { enchantmentById, enchantmentsFor } from "@/lib/enchantments";
import { GOALS } from "@/lib/goals";
import { recommend, untouchedCurrentEnchants } from "@/lib/recommend";
import { planAnvilCombines, planBuildUp, summarizeShoppingList } from "@/lib/anvil";
import { computeBestMethods, type RankedMethod, type MethodDetail } from "@/lib/bestMethod";
import { CATEGORY_ICON, STATUS_STYLE, rarityFromWeight, rarityLabel, RARITY_VAR } from "@/lib/presentation";
import { enchantmentName, itemName, bareItemName, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { materialsFor, type Material } from "@/lib/materials";
import { t, blockedByNote, levelTargetNote, slotLabel, methodLabel, statusLabel, expectedAttemptsNote } from "@/lib/strings";
import { encodeHave, readShareParams, patchShareParams } from "@/lib/shareLink";
import { useLocale } from "./LocaleContext";
import { advisorReducer, initialAdvisorState, CATEGORIES } from "./advisorState";
import SearchMode from "./SearchMode";
import StatsMode from "./StatsMode";
import Footer from "./Footer";
import CopyLinkButton from "./CopyLinkButton";
import OfflineBanner from "./OfflineBanner";

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
    <div className="panel inline-flex gap-1 p-1" role="group" aria-label="Language / Langue">
      {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={l === locale}
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

// This dot is the ONLY place rarity is shown in these list rows (no
// separate text label nearby, unlike SearchMode's single-enchant panel) —
// so it needs a real accessible name, not just a hover-only `title` that a
// screen reader would skip on a nameless <span>.
function RarityDot({ weight, locale }: { weight: number; locale: Locale }) {
  const rarity = rarityFromWeight(weight);
  const label = rarityLabel(rarity, locale);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: `var(${RARITY_VAR[rarity]})`, boxShadow: `0 0 6px var(${RARITY_VAR[rarity]})` }}
    />
  );
}

/**
 * Compact one-line rendering of the single top-ranked acquisition method
 * for one recommendation row — see bestMethod.ts's computeBestMethods().
 * Deliberately just the winner, not a full ranked list (RankedResultsList
 * is for search mode's dedicated section; a whole ranked list per
 * recommendation row would overwhelm this compact list).
 */
function AcquisitionHint({
  method,
  category,
  locale,
}: {
  method: RankedMethod<MethodDetail>;
  category: Parameters<typeof itemName>[0];
  locale: Locale;
}) {
  const probabilityDigits = method.kind === "trading" || method.kind === "fishing" ? 3 : 1;
  return (
    <p className="mt-1 text-xs text-muted">
      {t("advisorAcquisitionBestWay", locale)} {methodLabel(method.kind, locale)}
      {method.kind === "table_item" && method.detail?.slot && (
        <>
          {" "}
          · {itemName(category, method.detail.material as Material, locale)} · {slotLabel(method.detail.slot, locale)}
        </>
      )}
      {method.kind === "table_book" && method.detail?.slot && <> · {slotLabel(method.detail.slot, locale)}</>}
      {" — "}
      {(method.probability * 100).toFixed(probabilityDigits)}% ({expectedAttemptsNote(method.expectedAttempts, locale)})
    </p>
  );
}

export default function Home() {
  const { locale, setLocale } = useLocale();
  const [mode, setMode] = useState<"advisor" | "search" | "stats">("advisor");
  const [advisor, dispatch] = useReducer(advisorReducer, initialAdvisorState("pickaxe"));
  const { category, material, goalId, current } = advisor;

  useEffect(() => {
    // One-time hydration from a shared link, same pattern as
    // LocaleContext's localStorage read: SSR/first render always uses the
    // plain defaults above (there's no request-time way to read the URL a
    // static export was pre-rendered for), then this corrects them
    // client-side once window.location is reachable. advisorReducer's
    // HYDRATE case validates every field against real categories/
    // materials/goals/enchantments — a stale or hand-edited URL just
    // falls back to the defaults instead of crashing or showing garbage.
    const decoded = readShareParams(new URLSearchParams(window.location.search));

    if (decoded.mode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(decoded.mode);
    }
    if (decoded.locale && decoded.locale !== locale) setLocale(decoded.locale);

    dispatch({ type: "HYDRATE", advisor: decoded.advisor });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the URL's query string in sync with the advisor's live selection
  // (mode + locale always; the item/material/goal/current-enchants only
  // while advisor mode is actually showing) so the address bar is always a
  // shareable link — see shareLink.ts's header for why this is a plain
  // history.replaceState() rather than routing.
  useEffect(() => {
    if (mode !== "advisor") {
      patchShareParams({ m: mode === "stats" ? "t" : "s", l: locale });
      return;
    }
    patchShareParams({
      m: "a",
      l: locale,
      it: category,
      mt: material ?? null,
      g: goalId,
      h: encodeHave(current) || null,
    });
  }, [mode, locale, category, material, goalId, current]);

  const applicable = useMemo(() => enchantmentsFor(category), [category]);
  const goals = GOALS[category];
  const goal = goals.find((g) => g.id === goalId) ?? goals[0];

  const materialOptions = materialsFor(category);

  const recommendations = useMemo(() => recommend(current, goal), [current, goal]);
  const untouched = useMemo(() => untouchedCurrentEnchants(current, goal), [current, goal]);

  // Memoized on `recommendations` (not left as a plain per-render
  // computation) specifically so it has a STABLE reference between renders
  // when recommendations itself hasn't changed -- anvilPlan's own useMemo
  // below depends on this array, and an unmemoized filter+map here would
  // silently defeat that memoization by handing it a "new" array (by
  // reference) on every render even when nothing actually changed.
  const anvilTargets = useMemo(
    () => recommendations.filter((r) => r.status === "add" || r.status === "upgrade").map((r) => ({ id: r.enchantId, level: r.targetLevel })),
    [recommendations]
  );
  const anvilPlan = useMemo(() => planAnvilCombines(anvilTargets), [anvilTargets]);
  const currentLevelByEnchant = useMemo(
    () => new Map(recommendations.map((r) => [r.enchantId, r.currentLevel])),
    [recommendations]
  );

  // Computed once here (rather than inline per-row in the JSX below) so
  // the per-row display and the grand-total summary read from the exact
  // same numbers instead of two separate calls that could drift apart.
  const stepsWithBuildUp = useMemo(
    () =>
      anvilPlan.steps.map((s) => {
        const enchant = enchantmentById(s.enchantId);
        const buildUp = planBuildUp(enchant.anvilCost, currentLevelByEnchant.get(s.enchantId) ?? 0, s.level);
        return { step: s, buildUp };
      }),
    [anvilPlan, currentLevelByEnchant]
  );

  // Grand total across every recommended enchantment — the per-row numbers
  // already existed, but there was never a single "here's everything
  // you'll need" summary.
  const shoppingList = useMemo(
    () => summarizeShoppingList(anvilPlan.totalCost, stepsWithBuildUp.map(({ buildUp }) => buildUp)),
    [anvilPlan, stepsWithBuildUp]
  );

  // "How do I get these?" — reuses bestMethod.ts's computeBestMethods (built
  // for search mode) so the advisor can answer that without the user
  // having to switch modes and re-enter each enchant/level by hand. Fixed
  // 15 bookshelves / no Luck of the Sea (search mode is where those get
  // tuned precisely) and a smaller trial count than search mode's own
  // default, since this computes several enchants in one batch instead of
  // just the one the user is actively focused on.
  //
  // Stores which target set it was computed FOR (recommendationsKey)
  // alongside the data, and compares that at render time below, rather
  // than an effect that clears it on every target-set change — React's own
  // guidance is to derive this during render instead of synchronizing
  // state via an Effect (see react-hooks/set-state-in-effect).
  const recommendationsKey = recommendations.map((r) => `${r.enchantId}:${r.status}:${r.targetLevel}`).join(",");
  const [acquisitionMethods, setAcquisitionMethods] = useState<{
    forKey: string;
    data: Record<string, RankedMethod<MethodDetail>[]>;
  } | null>(null);
  const [calculatingAcquisition, setCalculatingAcquisition] = useState(false);
  const currentAcquisition = acquisitionMethods?.forKey === recommendationsKey ? acquisitionMethods.data : null;

  function computeAcquisitionMethods() {
    setCalculatingAcquisition(true);
    setTimeout(() => {
      const next: Record<string, RankedMethod<MethodDetail>[]> = {};
      for (const r of recommendations) {
        if (r.status !== "add" && r.status !== "upgrade") continue;
        const ranked = computeBestMethods({
          category,
          enchantId: r.enchantId,
          level: r.targetLevel,
          bookshelves: 15,
          trialsPerPoint: 1500,
        });
        if (ranked) next[r.enchantId] = ranked;
      }
      setAcquisitionMethods({ forKey: recommendationsKey, data: next });
      setCalculatingAcquisition(false);
    }, 10);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-12 sm:px-6">
      <OfflineBanner locale={locale} />
      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            ✦ Minecraft Java Edition
          </span>
          <h1 className="font-display accent-text mt-4 text-4xl font-bold sm:text-5xl">Enchant Advisor</h1>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">{t("heroTagline", locale)}</p>
        </div>
        <div className="no-print flex flex-col items-center gap-1.5 sm:items-end">
          <div className="flex gap-2">
            <CopyLinkButton locale={locale} />
            <LocaleToggle locale={locale} setLocale={setLocale} />
          </div>
          {/* "Copy link" alone doesn't say what's worth copying about it — the title attribute covers hover, this covers everyone else. */}
          <p className="max-w-[220px] text-center text-[11px] text-muted sm:text-right">
            {t("shareCopyLinkHint", locale)}
          </p>
        </div>
      </div>

      {/* Mode toggle — centered on mobile, left-aligned on wider screens,
          matching the hero title block's own "text-center sm:text-left"
          right above it. Without this, the toggle (an inline-flex pill,
          so it doesn't stretch or center on its own) sat flush left while
          everything above it was centered on mobile — visually
          inconsistent, reported as looking "décentré". */}
      <div className="mt-8 text-center sm:text-left">
        <div
          className="no-print panel inline-flex flex-wrap justify-center gap-1 p-1"
          role="group"
          aria-label="Advisor, Search, or Stats mode / Mode Conseiller, Recherche ou Statistiques"
        >
          <button
            onClick={() => setMode("advisor")}
            aria-pressed={mode === "advisor"}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              mode === "advisor" ? "accent-gradient text-white shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t("modeAdvisor", locale)}
          </button>
          <button
            onClick={() => setMode("search")}
            aria-pressed={mode === "search"}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              mode === "search" ? "accent-gradient text-white shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t("modeSearch", locale)}
          </button>
          <button
            onClick={() => setMode("stats")}
            aria-pressed={mode === "stats"}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              mode === "stats" ? "accent-gradient text-white shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t("modeStats", locale)}
          </button>
        </div>
      </div>

      {mode === "search" && <SearchMode />}
      {mode === "stats" && <StatsMode />}

      {mode === "advisor" && (
        <>
          {/* Step 1: item */}
          <section className="mt-10">
            <SectionLabel index="1">{t("step1Item", locale)}</SectionLabel>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => dispatch({ type: "CHANGE_CATEGORY", category: c })}
                  aria-pressed={c === category}
                  className={`panel flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-all hover:-translate-y-0.5 ${
                    c === category ? "ring-2 ring-[var(--accent-solid)]" : ""
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">
                    {CATEGORY_ICON[c]}
                  </span>
                  {bareItemName(c, locale)}
                </button>
              ))}
            </div>

            {materialOptions.length > 0 && (
              <div className="mt-3">
                <label htmlFor="material-select" className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("step1Material", locale)}
                </label>
                <select
                  id="material-select"
                  value={material}
                  onChange={(ev) => dispatch({ type: "SET_MATERIAL", material: ev.target.value as Material })}
                  className="mt-1.5 block w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm sm:w-auto"
                >
                  {materialOptions.map((m) => (
                    <option key={m} value={m}>
                      {itemName(category, m, locale)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Step 2: current enchants */}
          <section className="mt-10">
            <SectionLabel index="2">{t("step2CurrentEnchants", locale)}</SectionLabel>
            <div className="panel mt-3 divide-y divide-[var(--surface-border)]">
              {applicable.map((e) => (
                <div
                  key={e.id}
                  data-has-level={current[e.id] ? "true" : "false"}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                >
                  <label htmlFor={`current-${e.id}`} className="flex items-center gap-2 text-sm">
                    <RarityDot weight={e.weight} locale={locale} />
                    {enchantmentName(e.id, locale)}
                    {e.treasureOnly && <span className="text-xs text-muted">{t("treasureTag", locale)}</span>}
                  </label>
                  <select
                    id={`current-${e.id}`}
                    value={current[e.id] ?? 0}
                    onChange={(ev) => dispatch({ type: "SET_LEVEL", enchantId: e.id, level: Number(ev.target.value) })}
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
                  onClick={() => dispatch({ type: "SET_GOAL", goalId: g.id })}
                  aria-pressed={g.id === goal.id}
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
                        {currentAcquisition?.[r.enchantId]?.[0] && (
                          <AcquisitionHint method={currentAcquisition[r.enchantId][0]} category={category} locale={locale} />
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                      {statusLabel(r.status, locale)}
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
            {recommendations.some((r) => r.status === "add" || r.status === "upgrade") && !currentAcquisition && (
              <button
                onClick={computeAcquisitionMethods}
                disabled={calculatingAcquisition}
                className="no-print glint accent-gradient mt-3 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
              >
                {calculatingAcquisition ? t("advisorAcquisitionCalculating", locale) : t("advisorAcquisitionButton", locale)}
              </button>
            )}
            {currentAcquisition && <p className="mt-2 text-xs text-muted">{t("advisorAcquisitionNote", locale)}</p>}
          </section>

          {/* Anvil plan */}
          {anvilPlan.steps.length > 0 && (
            <section className="mt-10">
              <SectionLabel index="5">{t("step5AnvilCost", locale)}</SectionLabel>
              <p className="mt-2 text-xs text-muted">{t("anvilAssumption", locale)}</p>

              <div className="panel mt-3 overflow-x-auto">
                <table className="w-full text-sm">
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
                    {stepsWithBuildUp.map(({ step: s, buildUp }, i) => {
                      return (
                        <Fragment key={s.enchantId}>
                          <tr className={s.tooExpensive ? "bg-[var(--status-conflict-bg)]" : undefined}>
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
                          {buildUp && (
                            <tr>
                              <td />
                              <td colSpan={4} className="px-4 pb-2.5 text-xs text-muted">
                                {t("anvilBuildUpNote", locale)} <strong className="text-foreground">{buildUp.totalCost}</strong> XP
                                {buildUp.anyTooExpensive && " ⚠"} — {buildUp.level1BooksNeeded}{" "}
                                {t("anvilBuildUpBooksSuffix", locale)}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
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

              {/* Only worth a separate summary when it actually adds
                  something over the badge above — i.e. at least one
                  enchant needs building up from Level 1 first. */}
              {shoppingList.totalXp > anvilPlan.totalCost && (
                <div className="panel mt-3 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("shoppingListHeader", locale)}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-display text-2xl font-bold accent-text">{shoppingList.level1Books}</div>
                      <div className="text-xs text-muted">{t("shoppingListBooksLabel", locale)}</div>
                    </div>
                    <div>
                      <div className="font-display text-2xl font-bold accent-text">{shoppingList.totalXp}</div>
                      <div className="text-xs text-muted">{t("shoppingListXpLabel", locale)}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted">{t("shoppingListNote", locale)}</p>
                </div>
              )}
            </section>
          )}
        </>
      )}

      <Footer locale={locale} />
    </div>
  );
}
