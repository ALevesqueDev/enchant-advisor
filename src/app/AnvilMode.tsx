"use client";

import { useState } from "react";
import { enchantmentById, enchantmentsFor } from "@/lib/enchantments";
import { materialsFor, type Material } from "@/lib/materials";
import { enchantmentName, itemName, bareItemName, type Locale } from "@/lib/i18n";
import { t } from "@/lib/strings";
import { simulateAnvilCombine, type AnvilSlot } from "@/lib/anvilSimulator";
import { useLocale } from "./LocaleContext";
import LabeledSelect from "./LabeledSelect";
import { CATEGORIES } from "./advisorState";
import type { ItemCategory } from "@/lib/types";

/** One "level" for an item that has nothing enchanted -- shared by both slots' "already has" picker. */
const NONE = "none";

/**
 * Book-vs-item toggle for one anvil slot. Real anvil combinations include
 * item+book, book+book, and item+item (e.g. two pickaxes) -- this lets each
 * slot pick its physical form independently, which is what
 * AnvilSlot.isBook then feeds into the cost calculation (see
 * anvilSimulator.ts: an item source costs double a book source).
 */
function SlotKindPicker({
  idPrefix,
  isBook,
  onChange,
  itemLabel,
  locale,
}: {
  idPrefix: string;
  isBook: boolean;
  onChange: (isBook: boolean) => void;
  itemLabel: string;
  locale: Locale;
}) {
  return (
    <fieldset className="mt-3 flex gap-4 text-sm">
      <legend className="sr-only">{t("anvilSlotKindLegend", locale)}</legend>
      <label className="flex items-center gap-1.5" htmlFor={`${idPrefix}-item`}>
        <input
          id={`${idPrefix}-item`}
          type="radio"
          name={idPrefix}
          checked={!isBook}
          onChange={() => onChange(false)}
          className="h-3.5 w-3.5"
        />
        {itemLabel}
      </label>
      <label className="flex items-center gap-1.5" htmlFor={`${idPrefix}-book`}>
        <input
          id={`${idPrefix}-book`}
          type="radio"
          name={idPrefix}
          checked={isBook}
          onChange={() => onChange(true)}
          className="h-3.5 w-3.5"
        />
        {t("anvilSlotKindBook", locale)}
      </label>
    </fieldset>
  );
}

export default function AnvilMode() {
  const { locale } = useLocale();

  const [category, setCategory] = useState<ItemCategory>("pickaxe");
  const [material, setMaterial] = useState<Material | undefined>(materialsFor("pickaxe")[0]);

  const [targetEnchantId, setTargetEnchantId] = useState<string>(NONE);
  const [targetLevel, setTargetLevel] = useState(1);
  const [targetPriorUses, setTargetPriorUses] = useState(0);
  // Which physical thing is in this slot -- the chosen item (e.g. a
  // pickaxe) or a book. Real anvil combinations include item+book,
  // book+book, and item+item (two pickaxes), so each slot picks
  // independently rather than assuming one fixed arrangement.
  const [targetIsBook, setTargetIsBook] = useState(false);

  const [sacrificeEnchantId, setSacrificeEnchantId] = useState<string>(NONE);
  const [sacrificeLevel, setSacrificeLevel] = useState(1);
  const [sacrificePriorUses, setSacrificePriorUses] = useState(0);
  const [sacrificeIsBook, setSacrificeIsBook] = useState(true);

  const [renaming, setRenaming] = useState(false);

  const applicable = enchantmentsFor(category);

  function changeCategory(c: ItemCategory) {
    setCategory(c);
    const materials = materialsFor(c);
    setMaterial(materials.length > 0 ? materials[0] : undefined);
    const stillValid = new Set(enchantmentsFor(c).map((e) => e.id));
    if (!stillValid.has(targetEnchantId)) setTargetEnchantId(NONE);
    if (!stillValid.has(sacrificeEnchantId)) setSacrificeEnchantId(NONE);
  }

  const target: AnvilSlot = {
    enchantId: targetEnchantId === NONE ? null : targetEnchantId,
    level: targetEnchantId === NONE ? 0 : targetLevel,
    priorUses: targetPriorUses,
    isBook: targetIsBook,
  };
  const sacrifice: AnvilSlot = {
    enchantId: sacrificeEnchantId === NONE ? null : sacrificeEnchantId,
    level: sacrificeEnchantId === NONE ? 0 : sacrificeLevel,
    priorUses: sacrificePriorUses,
    isBook: sacrificeIsBook,
  };
  const result = simulateAnvilCombine(target, sacrifice, renaming);

  function slotContent(enchantId: string | null, level: number, isBook: boolean) {
    const kind = isBook ? t("anvilSlotKindBook", locale) : bareItemName(category, locale);
    if (!enchantId) return `${kind} — ${t("anvilSimEmptySlot", locale)}`;
    return `${kind}: ${enchantmentName(enchantId, locale)} ${level}`;
  }

  return (
    <div className="mt-8">
      <p className="text-sm text-muted">{t("anvilSimTagline", locale)}</p>

      <section className="panel mt-6 p-4">
        <div className="flex flex-wrap gap-3">
          <LabeledSelect id="anvil-category-select" label={t("step1Item", locale)} value={category} onChange={(e) => changeCategory(e.target.value as ItemCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {bareItemName(c, locale)}
              </option>
            ))}
          </LabeledSelect>
          {materialsFor(category).length > 0 && (
            <LabeledSelect id="anvil-material-select" label={t("step1Material", locale)} value={material ?? ""} onChange={(e) => setMaterial(e.target.value as Material)}>
              {materialsFor(category).map((m) => (
                <option key={m} value={m}>
                  {itemName(category, m, locale)}
                </option>
              ))}
            </LabeledSelect>
          )}
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
        <div className="mc-slot" title={t("anvilSimTargetLabel", locale)}>
          {slotContent(target.enchantId, target.level, targetIsBook)}
        </div>
        <span aria-hidden="true" className="text-2xl text-muted">
          +
        </span>
        <div className="mc-slot" title={t("anvilSimSacrificeLabel", locale)}>
          {slotContent(sacrifice.enchantId, sacrifice.level, sacrificeIsBook)}
        </div>
        <span aria-hidden="true" className="text-2xl text-muted">
          →
        </span>
        <div className="mc-slot" title={t("anvilSimResultLabel", locale)}>
          {/* The result keeps the TARGET's physical form -- the sacrifice is
              always consumed, whether it was a book or an item. */}
          {result.status === "ok" ? slotContent(result.resultEnchantId || null, result.resultLevel, targetIsBook) : "—"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="panel p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("anvilSimTargetLabel", locale)}</h2>
          <SlotKindPicker
            idPrefix="anvil-target-kind"
            isBook={targetIsBook}
            onChange={setTargetIsBook}
            itemLabel={bareItemName(category, locale)}
            locale={locale}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <LabeledSelect id="anvil-target-enchant-select" label={t("anvilSimExistingEnchantLabel", locale)} value={targetEnchantId} onChange={(e) => setTargetEnchantId(e.target.value)}>
              <option value={NONE}>{t("noneOption", locale)}</option>
              {applicable.map((e) => (
                <option key={e.id} value={e.id}>
                  {enchantmentName(e.id, locale)}
                </option>
              ))}
            </LabeledSelect>
            {targetEnchantId !== NONE && (
              <LabeledSelect id="anvil-target-level-select" label={t("levelPrefix", locale)} value={targetLevel} onChange={(e) => setTargetLevel(Number(e.target.value))}>
                {Array.from({ length: enchantmentById(targetEnchantId).maxLevel }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </LabeledSelect>
            )}
          </div>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="anvil-target-uses">
            {t("anvilSimPriorUsesLabel", locale)}
          </label>
          <input
            id="anvil-target-uses"
            type="number"
            min={0}
            max={10}
            value={targetPriorUses}
            onChange={(e) => setTargetPriorUses(Math.max(0, Number(e.target.value)))}
            className="mt-1.5 w-20 rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
          />
        </section>

        <section className="panel p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("anvilSimSacrificeLabel", locale)}</h2>
          <SlotKindPicker
            idPrefix="anvil-sacrifice-kind"
            isBook={sacrificeIsBook}
            onChange={setSacrificeIsBook}
            itemLabel={bareItemName(category, locale)}
            locale={locale}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <LabeledSelect id="anvil-sacrifice-enchant-select" label={t("anvilSimExistingEnchantLabel", locale)} value={sacrificeEnchantId} onChange={(e) => setSacrificeEnchantId(e.target.value)}>
              <option value={NONE}>{t("noneOption", locale)}</option>
              {applicable.map((e) => (
                <option key={e.id} value={e.id}>
                  {enchantmentName(e.id, locale)}
                </option>
              ))}
            </LabeledSelect>
            {sacrificeEnchantId !== NONE && (
              <LabeledSelect id="anvil-sacrifice-level-select" label={t("levelPrefix", locale)} value={sacrificeLevel} onChange={(e) => setSacrificeLevel(Number(e.target.value))}>
                {Array.from({ length: enchantmentById(sacrificeEnchantId).maxLevel }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </LabeledSelect>
            )}
          </div>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="anvil-sacrifice-uses">
            {t("anvilSimPriorUsesLabel", locale)}
          </label>
          <input
            id="anvil-sacrifice-uses"
            type="number"
            min={0}
            max={10}
            value={sacrificePriorUses}
            onChange={(e) => setSacrificePriorUses(Math.max(0, Number(e.target.value)))}
            className="mt-1.5 w-20 rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm"
          />
        </section>
      </div>

      <section className="panel mt-4 p-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={renaming} onChange={(e) => setRenaming(e.target.checked)} className="h-3.5 w-3.5" />
          {t("anvilSimRenameLabel", locale)}
        </label>

        <div className="mt-3">
          {result.status === "blocked-incompatible" && (
            <>
              <p className="text-sm font-medium" style={{ color: "var(--status-conflict-fg)" }}>
                {t("anvilSimBlocked", locale)}
              </p>
              <p className="mt-1 text-xs text-muted">{t("anvilSimBlockedNote", locale)}</p>
            </>
          )}
          {result.status === "nothing-to-do" && <p className="text-sm text-muted">{t("anvilSimNothingToDo", locale)}</p>}
          {result.status === "ok" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">{t("anvilSimCostLabel", locale)}</span>
              <span id="anvil-sim-cost" className="font-display accent-text text-2xl font-bold">
                {result.cost}
              </span>
              {result.tooExpensive && (
                <span className="text-sm font-medium" style={{ color: "var(--status-conflict-fg)" }}>
                  {t("anvilSimTooExpensiveShort", locale)}
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
