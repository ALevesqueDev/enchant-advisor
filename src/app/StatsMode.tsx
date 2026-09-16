"use client";

import { useEffect, useRef, useState } from "react";
import { enchantmentById, enchantmentsFor } from "@/lib/enchantments";
import { materialsFor, type Material } from "@/lib/materials";
import { enchantmentName, itemName, bareItemName } from "@/lib/i18n";
import { t, blockLabel, damageTypeLabel } from "@/lib/strings";
import {
  weaponBaseStats,
  computeMeleeDamage,
  sweepingEdgeRatio,
  fireAspectSeconds,
  unbreakingSaveChance,
  DAMAGE_ENCHANT_IDS,
  type MeleeWeapon,
} from "@/lib/weaponStats";
import { toolBaseSpeed, efficiencySpeedMultiplier, breakTimeSeconds, REFERENCE_BLOCKS } from "@/lib/miningStats";
import {
  armorPiecePoints,
  totalEpf,
  epfReductionPercent,
  armorReductionTypicalPercent,
  combinedReductionPercent,
  type ArmorSlot,
  type DamageType,
  type ArmorPieceEnchant,
  type ProtectionEnchantId,
} from "@/lib/armorStats";
import { powerBonusDamage, piercingCount, quickChargeReductionSeconds } from "@/lib/rangedStats";
import { useLocale } from "./LocaleContext";
import LabeledSelect from "./LabeledSelect";
import { buildCharacterSkin, type ArmorLoadout } from "./characterSkin";
import type { Locale } from "@/lib/i18n";
import type { ItemCategory } from "@/lib/types";

const USERNAME_STORAGE_KEY = "enchant-advisor-mc-username";

/** Equipment slots not wired up yet -- shown so the full loadout is visible from day one, per the phased plan (each phase adds real stats to a slot already on screen). */
function ComingSoonSlot({ label }: { label: string }) {
  const { locale } = useLocale();
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-[var(--surface-border)] px-3 py-2 opacity-60">
      <span className="text-sm">{label}</span>
      <span className="rounded-full bg-[var(--surface-raised)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {t("statsComingSoonBadge", locale)}
      </span>
    </div>
  );
}

/**
 * One armor slot's material picker -- affects both the 3D character's
 * colors (characterSkin.ts) and its contribution to the armor+toughness
 * damage-reduction stage (armorStats.ts). "None" is a real option, not
 * just a default: an empty slot is a legitimate loadout choice, not an
 * unset field.
 */
function ArmorSlotSelect({
  id,
  category,
  value,
  onChange,
  locale,
}: {
  id: string;
  category: ItemCategory;
  value: Material | undefined;
  onChange: (material: Material | undefined) => void;
  locale: Locale;
}) {
  return (
    <LabeledSelect
      id={id}
      label={bareItemName(category, locale)}
      value={value ?? "none"}
      onChange={(e) => onChange(e.target.value === "none" ? undefined : (e.target.value as Material))}
      fullWidth
    >
      <option value="none">{t("noneOption", locale)}</option>
      {materialsFor(category).map((m) => (
        <option key={m} value={m}>
          {itemName(category, m, locale)}
        </option>
      ))}
    </LabeledSelect>
  );
}

const PROTECTION_ENCHANT_IDS: ProtectionEnchantId[] = ["protection", "fire_protection", "blast_protection", "projectile_protection"];

/** One (enchantment, level) pair inside an EnchantListEditor's list. */
export interface EnchantEntry {
  enchantId: string;
  level: number;
}

/** The level of a specific enchantment within a list, or 0 if it isn't there -- the bridge between the generic list and the specific computed stats (Efficiency, Unbreaking, Protection) that read off of it. */
function findLevel(entries: EnchantEntry[] | undefined, enchantId: string): number {
  return entries?.find((e) => e.enchantId === enchantId)?.level ?? 0;
}

/**
 * A per-item enchantment list -- lets a Tool or Armor piece carry as many
 * simultaneous, mutually-compatible enchantments as the real game allows,
 * instead of a fixed couple of hardcoded fields. Real user report
 * (2026-09-16): "Chaque item outil ou pièce armure... peux avoir plus de 1
 * enchantement" -- the previous design (one Efficiency/Protection field +
 * one Unbreaking field) didn't match that. Reuses exactly the same
 * category-filtered pool and incompatibleWith exclusivity data the anvil
 * simulator already trusts (enchantments.ts's real exclusive_set groups),
 * so e.g. Protection and Fire Protection, or Fortune and Silk Touch, can
 * never both be added to the same item here either.
 */
function EnchantListEditor({
  idPrefix,
  category,
  entries,
  onChange,
  locale,
}: {
  idPrefix: string;
  category: ItemCategory;
  entries: EnchantEntry[];
  onChange: (entries: EnchantEntry[]) => void;
  locale: Locale;
}) {
  const applicable = enchantmentsFor(category);
  const usedIds = new Set(entries.map((e) => e.enchantId));
  const addable = applicable.filter(
    (e) => !usedIds.has(e.id) && !entries.some((entry) => enchantmentById(entry.enchantId).incompatibleWith.includes(e.id))
  );

  function addEntry(enchantId: string) {
    if (!enchantId) return;
    // Defaults to the enchant's own max level -- matches how every other
    // select in this app defaults to a real, non-empty example value.
    onChange([...entries, { enchantId, level: enchantmentById(enchantId).maxLevel }]);
  }
  function removeEntry(enchantId: string) {
    onChange(entries.filter((e) => e.enchantId !== enchantId));
  }
  function updateLevel(enchantId: string, level: number) {
    onChange(entries.map((e) => (e.enchantId === enchantId ? { ...e, level } : e)));
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry) => (
        <div key={entry.enchantId} className="flex items-center gap-1.5 rounded-md bg-[var(--surface-raised)] px-2 py-1.5 text-sm">
          <span className="flex-1 truncate">{enchantmentName(entry.enchantId, locale)}</span>
          <select
            id={`${idPrefix}-${entry.enchantId}-level`}
            value={entry.level}
            onChange={(e) => updateLevel(entry.enchantId, Number(e.target.value))}
            aria-label={`${enchantmentName(entry.enchantId, locale)} — ${t("levelPrefix", locale)}`}
            className="rounded border border-[var(--surface-border)] bg-[var(--background)] px-1 py-0.5 text-xs"
          >
            {Array.from({ length: enchantmentById(entry.enchantId).maxLevel }, (_, i) => i + 1).map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => removeEntry(entry.enchantId)}
            aria-label={`${t("statsRemoveEnchantLabel", locale)} ${enchantmentName(entry.enchantId, locale)}`}
            className="shrink-0 px-1 text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>
      ))}
      {addable.length > 0 && (
        <LabeledSelect id={`${idPrefix}-add-select`} label={t("statsAddEnchantLabel", locale)} value="" onChange={(e) => addEntry(e.target.value)} fullWidth>
          <option value="">{t("statsAddEnchantPlaceholder", locale)}</option>
          {addable.map((e) => (
            <option key={e.id} value={e.id}>
              {enchantmentName(e.id, locale)}
            </option>
          ))}
        </LabeledSelect>
      )}
    </div>
  );
}

export default function StatsMode() {
  const { locale } = useLocale();

  const [weapon, setWeapon] = useState<MeleeWeapon>("sword");
  const [material, setMaterial] = useState<Material>("diamond");
  const [damageEnchantId, setDamageEnchantId] = useState<string>("sharpness");
  const [damageLevel, setDamageLevel] = useState(5);
  const [sweepLevel, setSweepLevel] = useState(0);
  const [fireLevel, setFireLevel] = useState(0);
  const [unbreakingLevel, setUnbreakingLevel] = useState(0);
  const [toolMaterial, setToolMaterial] = useState<Material>("diamond");
  // A real, non-empty starting example (Efficiency V), same as every other
  // section's default -- EnchantListEditor lets more be added on top.
  const [toolEnchants, setToolEnchants] = useState<EnchantEntry[]>([{ enchantId: "efficiency", level: 5 }]);
  const [armor, setArmor] = useState<ArmorLoadout>({});
  // Per-piece, per-item enchant list -- each of the 4 pieces carries its own
  // enchantments independently, so a shared list wouldn't represent a real
  // loadout (e.g. a fresh helmet next to a heavily-enchanted chestplate).
  const [armorEnchants, setArmorEnchants] = useState<Partial<Record<ArmorSlot, EnchantEntry[]>>>({});
  const [powerLevel, setPowerLevel] = useState(0);
  const [infinityOn, setInfinityOn] = useState(false);
  const [piercingLevel, setPiercingLevel] = useState(0);
  const [multishotOn, setMultishotOn] = useState(false);
  const [quickChargeLevel, setQuickChargeLevel] = useState(0);
  const [rangedUnbreakingLevel, setRangedUnbreakingLevel] = useState(0);
  const [username, setUsername] = useState("");
  const [skinCaption, setSkinCaption] = useState<string | null>(null);

  useEffect(() => {
    // One-time hydration of a persisted username, same pattern as
    // LocaleContext's localStorage read -- SSR/first render always shows
    // an empty field, this corrects it client-side once localStorage is
    // reachable.
    try {
      const stored = localStorage.getItem(USERNAME_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setUsername(stored);
    } catch {
      // localStorage unavailable (private browsing, etc.) -- just won't persist.
    }
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<{ dispose: () => void; loadSkin: (url: string) => Promise<void> | void } | null>(null);
  const [skinFailed, setSkinFailed] = useState(false);
  // Once a real skin is showing, the armor-recolor effect below backs off --
  // recoloring someone's actual skin region-by-region wouldn't mean the
  // same thing our own generic construct's colors do.
  const [usingRealSkin, setUsingRealSkin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Dynamic import (not a top-level import) so this browser-only,
    // canvas/WebGL-dependent library never executes during Next.js's
    // server-side render.
    import("skinview3d")
      .then((skinview3d) => {
        if (cancelled || !canvasRef.current) return;
        const created = new skinview3d.SkinViewer({
          canvas: canvasRef.current,
          width: canvasRef.current.clientWidth || 280,
          height: 280,
          skin: buildCharacterSkin(armor),
        });
        try {
          created.autoRotate = true;
          created.autoRotateSpeed = 0.8;
          created.zoom = 0.85;
        } catch {
          // Cosmetic only -- the viewer still works without these.
        }
        viewerRef.current = created;
      })
      .catch(() => {
        if (!cancelled) setSkinFailed(true);
      });
    return () => {
      cancelled = true;
      viewerRef.current?.dispose();
      viewerRef.current = null;
    };
    // Deliberately mount-only -- the effect below keeps the already-created
    // viewer's texture in sync with `armor` instead of recreating the
    // whole viewer (and losing its rotation/camera state) on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (usingRealSkin) return;
    try {
      viewerRef.current?.loadSkin(buildCharacterSkin(armor));
    } catch {
      // Non-fatal -- the character just keeps showing its previous colors.
    }
  }, [armor, usingRealSkin]);

  /**
   * Real skin-by-username lookup. Mojang's own username->UUID and
   * UUID->profile JSON APIs don't send CORS headers (verified directly
   * against the live endpoints while scoping this) -- only the final raw
   * texture file (textures.minecraft.net) is CORS-open, and neither
   * Mojang host is callable straight from a static site's browser JS.
   * mc-heads.net does the same username->UUID->profile resolution
   * server-side and re-serves the raw skin texture with a permissive
   * Access-Control-Allow-Origin, so /skin/<username> can be handed
   * directly to skinview3d without this app needing its own backend --
   * see PROJECT.md for the full sourcing/tradeoff record, including why a
   * Vercel serverless function was considered and not (yet) chosen.
   */
  function loadSkin() {
    try {
      localStorage.setItem(USERNAME_STORAGE_KEY, username);
    } catch {
      // Non-fatal -- the choice just won't persist across visits.
    }

    const trimmed = username.trim();
    if (!trimmed) {
      setUsingRealSkin(false);
      setSkinCaption(t("statsSkinCaptionGeneric", locale));
      return;
    }

    if (!viewerRef.current) {
      setSkinCaption(t("statsSkinCaptionFailed", locale));
      return;
    }

    setSkinCaption(t("statsSkinLoading", locale));
    const skinUrl = `https://mc-heads.net/skin/${encodeURIComponent(trimmed)}`;
    Promise.resolve(viewerRef.current.loadSkin(skinUrl))
      .then(() => {
        setUsingRealSkin(true);
        setSkinCaption(t("statsSkinCaptionReal", locale));
      })
      .catch(() => {
        // Username not found, mc-heads.net unreachable, etc. -- fall back
        // to the generic construct rather than leaving a broken texture
        // or blocking the rest of the page (see the "coming soon" plan's
        // Q15: informative, never blocking).
        setUsingRealSkin(false);
        try {
          viewerRef.current?.loadSkin(buildCharacterSkin(armor));
        } catch {
          // Viewer itself is gone -- nothing more to do.
        }
        setSkinCaption(t("statsSkinCaptionFailed", locale));
      });
  }

  // Real per-enchant category data (enchantments.ts) -- Sweeping Edge is
  // sword-only, Fire Aspect is sword+mace-only, neither works on an axe in
  // the real game. Bug caught by a real user report: switching sword to
  // axe left both selects showing regardless. Damage enchants
  // (Sharpness/Smite/Bane) don't need this check -- all of COMBAT_BLADES
  // (sword/axe/mace/spear) supports them.
  function weaponHas(enchantId: string): boolean {
    return enchantmentById(enchantId).categories.includes(weapon);
  }

  function changeWeapon(w: MeleeWeapon) {
    setWeapon(w);
    // Trident/mace have no material variants (materialsFor returns []) --
    // leave `material` alone rather than setting it to undefined; nothing
    // reads it for a fixed-stat weapon anyway (weaponBaseStats ignores it).
    if (materialsFor(w).length > 0 && !materialsFor(w).includes(material)) setMaterial(materialsFor(w)[0]);
    if (!enchantmentById("sweeping_edge").categories.includes(w)) setSweepLevel(0);
    if (!enchantmentById("fire_aspect").categories.includes(w)) setFireLevel(0);
    if (activeEnchantId && !enchantmentById(activeEnchantId).categories.includes(w)) setDamageEnchantId("none");
  }

  const base = weaponBaseStats(weapon, material);
  const activeEnchantId = damageEnchantId === "none" ? null : damageEnchantId;
  const damage = computeMeleeDamage(base, activeEnchantId, activeEnchantId ? damageLevel : 0);
  const sweep = sweepingEdgeRatio(sweepLevel);
  const burn = fireAspectSeconds(fireLevel);
  const durabilitySave = unbreakingSaveChance(unbreakingLevel);

  const efficiencyLevel = findLevel(toolEnchants, "efficiency");
  const toolUnbreakingLevel = findLevel(toolEnchants, "unbreaking");
  const miningSpeed = efficiencySpeedMultiplier(toolBaseSpeed(toolMaterial), efficiencyLevel);
  const toolDurabilitySave = unbreakingSaveChance(toolUnbreakingLevel);
  const rangedDurabilitySave = unbreakingSaveChance(rangedUnbreakingLevel);

  // Sum armor points across whichever of the 4 slots are actually
  // equipped -- an empty slot contributes 0/0, same as having nothing on.
  const ARMOR_SLOTS: ArmorSlot[] = ["helmet", "chestplate", "leggings", "boots"];
  const totalArmorPoints = ARMOR_SLOTS.reduce(
    (sum, slot) => sum + (armor[slot] ? armorPiecePoints(slot, armor[slot]!).armor : 0),
    0
  );
  const armorReduction = armorReductionTypicalPercent(totalArmorPoints);
  const DAMAGE_TYPES: DamageType[] = ["generic", "fire", "blast", "projectile"];
  // At most one Protection-family entry can ever be in a slot's list --
  // EnchantListEditor's own incompatibleWith filtering already enforces
  // that (real exclusive_set data), so .find() here is safe.
  function protectionEntry(slot: ArmorSlot): ArmorPieceEnchant | undefined {
    const found = (armorEnchants[slot] ?? []).find((e) => (PROTECTION_ENCHANT_IDS as string[]).includes(e.enchantId));
    return found ? { enchantId: found.enchantId as ProtectionEnchantId, level: found.level } : undefined;
  }
  const protectionPieces = ARMOR_SLOTS.map((slot) => protectionEntry(slot));
  const finalReductionByType = Object.fromEntries(
    DAMAGE_TYPES.map((type) => {
      const epf = totalEpf(protectionPieces, type);
      return [type, combinedReductionPercent(armorReduction, epfReductionPercent(epf))];
    })
  ) as Record<DamageType, number>;

  const TARGET_LABEL: Record<string, string> = {
    generic: t("statsTargetGeneric", locale),
    undead: t("statsTargetUndead", locale),
    arthropod: t("statsTargetArthropod", locale),
    aquatic: t("statsTargetAquatic", locale),
  };

  return (
    <div className="mt-8">
      <p className="text-sm text-muted">{t("statsTagline", locale)}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("statsCharacterHeader", locale)}</h2>
          <div className="mt-3 flex gap-2">
            <input
              id="stats-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("statsUsernamePlaceholder", locale)}
              maxLength={16}
              className="min-w-0 flex-1 rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-2 text-sm"
            />
            <button
              onClick={loadSkin}
              className="no-print accent-gradient shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              {t("statsLoadSkinButton", locale)}
            </button>
          </div>
          <div className="relative mt-3 flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-raised)]">
            <canvas ref={canvasRef} className="h-[280px] w-full" />
            {skinFailed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center text-sm text-muted">
                <span>⚠️</span>
                <span>3D unavailable in this browser.</span>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">{skinCaption ?? t("statsSkinCaptionGeneric", locale)}</p>
        </section>

        <section className="panel p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("statsEquipmentHeader", locale)}</h2>

          <div className="mt-3 flex flex-wrap gap-3">
            <LabeledSelect
              id="stats-weapon-select"
              label={t("statsWeaponSlotLabel", locale)}
              value={weapon}
              onChange={(e) => changeWeapon(e.target.value as MeleeWeapon)}
            >
              <option value="sword">{bareItemName("sword", locale)}</option>
              <option value="axe">{bareItemName("axe", locale)}</option>
              <option value="trident">{bareItemName("trident", locale)}</option>
              <option value="mace">{bareItemName("mace", locale)}</option>
            </LabeledSelect>
            {materialsFor(weapon).length > 0 && (
              <LabeledSelect
                id="stats-material-select"
                label={t("step1Material", locale)}
                value={material}
                onChange={(e) => setMaterial(e.target.value as Material)}
              >
                {materialsFor(weapon).map((m) => (
                  <option key={m} value={m}>
                    {itemName(weapon, m, locale)}
                  </option>
                ))}
              </LabeledSelect>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <LabeledSelect
              id="stats-damage-enchant-select"
              label={t("statsDamageEnchantLabel", locale)}
              value={damageEnchantId}
              onChange={(e) => setDamageEnchantId(e.target.value)}
            >
              <option value="none">{t("noneOption", locale)}</option>
              {DAMAGE_ENCHANT_IDS.filter(weaponHas).map((id) => (
                <option key={id} value={id}>
                  {enchantmentName(id, locale)}
                </option>
              ))}
            </LabeledSelect>
            {activeEnchantId && (
              <LabeledSelect
                id="stats-damage-level-select"
                label={t("levelPrefix", locale)}
                value={damageLevel}
                onChange={(e) => setDamageLevel(Number(e.target.value))}
              >
                {Array.from({ length: enchantmentById(activeEnchantId).maxLevel }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </LabeledSelect>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {weaponHas("sweeping_edge") && (
              <LabeledSelect
                id="stats-sweep-select"
                label={t("statsSweepingEdgeLabel", locale)}
                value={sweepLevel}
                onChange={(e) => setSweepLevel(Number(e.target.value))}
              >
                {Array.from({ length: enchantmentById("sweeping_edge").maxLevel + 1 }, (_, i) => i).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl === 0 ? t("noneOption", locale) : lvl}
                  </option>
                ))}
              </LabeledSelect>
            )}
            {weaponHas("fire_aspect") && (
              <LabeledSelect
                id="stats-fire-select"
                label={t("statsFireAspectLabel", locale)}
                value={fireLevel}
                onChange={(e) => setFireLevel(Number(e.target.value))}
              >
                {Array.from({ length: enchantmentById("fire_aspect").maxLevel + 1 }, (_, i) => i).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl === 0 ? t("noneOption", locale) : lvl}
                  </option>
                ))}
              </LabeledSelect>
            )}
            <LabeledSelect
              id="stats-unbreaking-select"
              label={t("statsUnbreakingLabel", locale)}
              value={unbreakingLevel}
              onChange={(e) => setUnbreakingLevel(Number(e.target.value))}
            >
              {Array.from({ length: enchantmentById("unbreaking").maxLevel + 1 }, (_, i) => i).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === 0 ? t("noneOption", locale) : lvl}
                </option>
              ))}
            </LabeledSelect>
          </div>

          <div className="mt-3 flex flex-wrap items-start gap-3 border-t border-[var(--surface-border)] pt-3">
            <LabeledSelect
              id="stats-tool-material-select"
              label={`${t("statsToolSlotLabel", locale)} (${bareItemName("pickaxe", locale)})`}
              value={toolMaterial}
              onChange={(e) => setToolMaterial(e.target.value as Material)}
            >
              {materialsFor("pickaxe").map((m) => (
                <option key={m} value={m}>
                  {itemName("pickaxe", m, locale)}
                </option>
              ))}
            </LabeledSelect>
            <div className="min-w-[220px] flex-1">
              <EnchantListEditor idPrefix="stats-tool" category="pickaxe" entries={toolEnchants} onChange={setToolEnchants} locale={locale} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <ArmorSlotSelect
                id="stats-helmet-select"
                category="helmet"
                value={armor.helmet}
                onChange={(m) => setArmor((a) => ({ ...a, helmet: m }))}
                locale={locale}
              />
              <EnchantListEditor
                idPrefix="stats-helmet"
                category="helmet"
                entries={armorEnchants.helmet ?? []}
                onChange={(entries) => setArmorEnchants((a) => ({ ...a, helmet: entries }))}
                locale={locale}
              />
            </div>
            <div className="space-y-2">
              <ArmorSlotSelect
                id="stats-chestplate-select"
                category="chestplate"
                value={armor.chestplate}
                onChange={(m) => setArmor((a) => ({ ...a, chestplate: m }))}
                locale={locale}
              />
              <EnchantListEditor
                idPrefix="stats-chestplate"
                category="chestplate"
                entries={armorEnchants.chestplate ?? []}
                onChange={(entries) => setArmorEnchants((a) => ({ ...a, chestplate: entries }))}
                locale={locale}
              />
            </div>
            <div className="space-y-2">
              <ArmorSlotSelect
                id="stats-leggings-select"
                category="leggings"
                value={armor.leggings}
                onChange={(m) => setArmor((a) => ({ ...a, leggings: m }))}
                locale={locale}
              />
              <EnchantListEditor
                idPrefix="stats-leggings"
                category="leggings"
                entries={armorEnchants.leggings ?? []}
                onChange={(entries) => setArmorEnchants((a) => ({ ...a, leggings: entries }))}
                locale={locale}
              />
            </div>
            <div className="space-y-2">
              <ArmorSlotSelect
                id="stats-boots-select"
                category="boots"
                value={armor.boots}
                onChange={(m) => setArmor((a) => ({ ...a, boots: m }))}
                locale={locale}
              />
              <EnchantListEditor
                idPrefix="stats-boots"
                category="boots"
                entries={armorEnchants.boots ?? []}
                onChange={(entries) => setArmorEnchants((a) => ({ ...a, boots: entries }))}
                locale={locale}
              />
            </div>
          </div>
          <div className="mt-3">
            <ComingSoonSlot label={t("statsOffhandSlotLabel", locale)} />
          </div>
        </section>
      </div>

      <section className="panel mt-4 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("statsResultsHeader", locale)}</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-[var(--surface-raised)] p-3">
            <div className="text-xs text-muted">
              {t("statsDamagePerHitLabel", locale)}
              {activeEnchantId && damage.target !== "generic" && <> · {TARGET_LABEL[damage.target]}</>}
            </div>
            <div className="font-display accent-text mt-1 text-2xl font-bold">{damage.damagePerHit.toFixed(1)}</div>
          </div>
          <div className="rounded-lg bg-[var(--surface-raised)] p-3">
            <div className="text-xs text-muted">{t("statsDpsLabel", locale)}</div>
            <div className="font-display accent-text mt-1 text-2xl font-bold">{damage.dps.toFixed(1)}</div>
          </div>
          {sweepLevel > 0 && (
            <div className="rounded-lg bg-[var(--surface-raised)] p-3">
              <div className="text-xs text-muted">{t("statsSweepRatioLabel", locale)}</div>
              <div className="font-display accent-text mt-1 text-2xl font-bold">+{(sweep * 100).toFixed(0)}%</div>
            </div>
          )}
          {fireLevel > 0 && (
            <div className="rounded-lg bg-[var(--surface-raised)] p-3">
              <div className="text-xs text-muted">{t("statsBurnDurationLabel", locale)}</div>
              <div className="font-display accent-text mt-1 text-2xl font-bold">
                {burn.toFixed(1)}
                {t("statsSecondsSuffix", locale)}
              </div>
            </div>
          )}
          {unbreakingLevel > 0 && (
            <div className="rounded-lg bg-[var(--surface-raised)] p-3">
              <div className="text-xs text-muted">{t("statsDurabilitySaveLabel", locale)}</div>
              <div className="font-display accent-text mt-1 text-2xl font-bold">{(durabilitySave * 100).toFixed(0)}%</div>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">{t("statsDpsNote", locale)}</p>
        <p className="mt-2 text-xs text-[var(--status-add-fg)]">{t("statsVerifiedTag", locale)}</p>
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("statsMiningHeader", locale)}</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {REFERENCE_BLOCKS.map((block) => (
            <div key={block.id} className="rounded-lg bg-[var(--surface-raised)] p-3">
              <div className="text-xs text-muted">{blockLabel(block.id, locale)}</div>
              <div className="font-display accent-text mt-1 text-2xl font-bold">
                {breakTimeSeconds(miningSpeed, block.hardness).toFixed(2)}
                {t("statsSecondsSuffix", locale)}
              </div>
            </div>
          ))}
          {toolUnbreakingLevel > 0 && (
            <div className="rounded-lg bg-[var(--surface-raised)] p-3">
              <div className="text-xs text-muted">{t("statsDurabilitySaveLabel", locale)}</div>
              <div className="font-display accent-text mt-1 text-2xl font-bold">{(toolDurabilitySave * 100).toFixed(0)}%</div>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">{t("statsBreakTimeNote", locale)}</p>
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("statsRangedHeader", locale)}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <LabeledSelect
            id="stats-power-select"
            label={t("statsPowerLabel", locale)}
            value={powerLevel}
            onChange={(e) => setPowerLevel(Number(e.target.value))}
          >
            {Array.from({ length: enchantmentById("power").maxLevel + 1 }, (_, i) => i).map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 0 ? t("noneOption", locale) : lvl}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            id="stats-piercing-select"
            label={t("statsPiercingLabel", locale)}
            value={piercingLevel}
            onChange={(e) => setPiercingLevel(Number(e.target.value))}
          >
            {Array.from({ length: enchantmentById("piercing").maxLevel + 1 }, (_, i) => i).map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 0 ? t("noneOption", locale) : lvl}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            id="stats-quickcharge-select"
            label={t("statsQuickChargeLabel", locale)}
            value={quickChargeLevel}
            onChange={(e) => setQuickChargeLevel(Number(e.target.value))}
          >
            {Array.from({ length: enchantmentById("quick_charge").maxLevel + 1 }, (_, i) => i).map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 0 ? t("noneOption", locale) : lvl}
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            id="stats-ranged-unbreaking-select"
            label={t("statsUnbreakingLabel", locale)}
            value={rangedUnbreakingLevel}
            onChange={(e) => setRangedUnbreakingLevel(Number(e.target.value))}
          >
            {Array.from({ length: enchantmentById("unbreaking").maxLevel + 1 }, (_, i) => i).map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 0 ? t("noneOption", locale) : lvl}
              </option>
            ))}
          </LabeledSelect>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={infinityOn} onChange={(e) => setInfinityOn(e.target.checked)} className="h-3.5 w-3.5" />
            {t("statsInfinityLabel", locale)}
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={multishotOn} onChange={(e) => setMultishotOn(e.target.checked)} className="h-3.5 w-3.5" />
            {t("statsMultishotLabel", locale)}
          </label>
        </div>

        {(powerLevel > 0 || piercingLevel > 0 || quickChargeLevel > 0 || rangedUnbreakingLevel > 0 || infinityOn || multishotOn) && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {powerLevel > 0 && (
              <div className="rounded-lg bg-[var(--surface-raised)] p-3">
                <div className="text-xs text-muted">{t("statsPowerLabel", locale)}</div>
                <div className="font-display accent-text mt-1 text-2xl font-bold">+{powerBonusDamage(powerLevel).toFixed(1)}</div>
              </div>
            )}
            {piercingLevel > 0 && (
              <div className="rounded-lg bg-[var(--surface-raised)] p-3">
                <div className="text-xs text-muted">{t("statsPiercingLabel", locale)}</div>
                <div className="font-display accent-text mt-1 text-2xl font-bold">+{piercingCount(piercingLevel)}</div>
              </div>
            )}
            {quickChargeLevel > 0 && (
              <div className="rounded-lg bg-[var(--surface-raised)] p-3">
                <div className="text-xs text-muted">{t("statsQuickChargeLabel", locale)}</div>
                <div className="font-display accent-text mt-1 text-2xl font-bold">
                  {quickChargeReductionSeconds(quickChargeLevel).toFixed(2)}
                  {t("statsSecondsSuffix", locale)}
                </div>
              </div>
            )}
            {multishotOn && (
              <div className="rounded-lg bg-[var(--surface-raised)] p-3">
                <div className="text-xs text-muted">{t("statsMultishotLabel", locale)}</div>
                <div className="font-display accent-text mt-1 text-lg font-bold">{t("statsMultishotValue", locale)}</div>
              </div>
            )}
            {rangedUnbreakingLevel > 0 && (
              <div className="rounded-lg bg-[var(--surface-raised)] p-3">
                <div className="text-xs text-muted">{t("statsDurabilitySaveLabel", locale)}</div>
                <div className="font-display accent-text mt-1 text-2xl font-bold">{(rangedDurabilitySave * 100).toFixed(0)}%</div>
              </div>
            )}
            {infinityOn && (
              <div className="rounded-lg bg-[var(--surface-raised)] p-3">
                <div className="text-xs text-muted">{t("statsInfinityLabel", locale)}</div>
                <div className="font-display accent-text mt-1 text-lg font-bold">{t("statsInfinityValue", locale)}</div>
              </div>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">{t("statsRangedNote", locale)}</p>
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("statsArmorHeader", locale)}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DAMAGE_TYPES.map((type) => (
            <div key={type} className="rounded-lg bg-[var(--surface-raised)] p-3">
              <div className="text-xs text-muted">{damageTypeLabel(type, locale)}</div>
              <div className="font-display accent-text mt-1 text-2xl font-bold">
                {finalReductionByType[type].toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
        {ARMOR_SLOTS.some((slot) => findLevel(armorEnchants[slot], "unbreaking") > 0) && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ARMOR_SLOTS.filter((slot) => findLevel(armorEnchants[slot], "unbreaking") > 0).map((slot) => (
              <div key={slot} className="rounded-lg bg-[var(--surface-raised)] p-3">
                <div className="text-xs text-muted">
                  {bareItemName(slot, locale)} · {t("statsDurabilitySaveLabel", locale)}
                </div>
                <div className="font-display accent-text mt-1 text-2xl font-bold">
                  {(unbreakingSaveChance(findLevel(armorEnchants[slot], "unbreaking")) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">{t("statsArmorNote", locale)}</p>
      </section>
    </div>
  );
}
