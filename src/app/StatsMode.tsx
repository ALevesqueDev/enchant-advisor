"use client";

import { useEffect, useRef, useState } from "react";
import { enchantmentById } from "@/lib/enchantments";
import { materialsFor, type Material } from "@/lib/materials";
import { enchantmentName, itemName, bareItemName } from "@/lib/i18n";
import { t, blockLabel } from "@/lib/strings";
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
 * One armor slot's material picker -- affects the 3D character's colors
 * (characterSkin.ts) immediately, but doesn't compute a real damage-
 * reduction stat yet (that's Phase 3, pending the dedicated armor-formula
 * verification pass). "None" is a real option, not just a default: an
 * empty slot is a legitimate loadout choice, not an unset field.
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
  const [efficiencyLevel, setEfficiencyLevel] = useState(5);
  const [armor, setArmor] = useState<ArmorLoadout>({});
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
    if (!materialsFor(w).includes(material)) setMaterial(materialsFor(w)[0]);
    if (!enchantmentById("sweeping_edge").categories.includes(w)) setSweepLevel(0);
    if (!enchantmentById("fire_aspect").categories.includes(w)) setFireLevel(0);
  }

  const base = weaponBaseStats(weapon, material);
  const activeEnchantId = damageEnchantId === "none" ? null : damageEnchantId;
  const damage = computeMeleeDamage(base, activeEnchantId, activeEnchantId ? damageLevel : 0);
  const sweep = sweepingEdgeRatio(sweepLevel);
  const burn = fireAspectSeconds(fireLevel);
  const durabilitySave = unbreakingSaveChance(unbreakingLevel);

  const miningSpeed = efficiencySpeedMultiplier(toolBaseSpeed(toolMaterial), efficiencyLevel);

  const TARGET_LABEL: Record<string, string> = {
    generic: t("statsTargetGeneric", locale),
    undead: t("statsTargetUndead", locale),
    arthropod: t("statsTargetArthropod", locale),
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
            </LabeledSelect>
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
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <LabeledSelect
              id="stats-damage-enchant-select"
              label={t("statsDamageEnchantLabel", locale)}
              value={damageEnchantId}
              onChange={(e) => setDamageEnchantId(e.target.value)}
            >
              <option value="none">{t("noneOption", locale)}</option>
              {DAMAGE_ENCHANT_IDS.map((id) => (
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

          <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--surface-border)] pt-3">
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
            <LabeledSelect
              id="stats-efficiency-select"
              label={t("statsEfficiencyLabel", locale)}
              value={efficiencyLevel}
              onChange={(e) => setEfficiencyLevel(Number(e.target.value))}
            >
              {Array.from({ length: enchantmentById("efficiency").maxLevel + 1 }, (_, i) => i).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === 0 ? t("noneOption", locale) : lvl}
                </option>
              ))}
            </LabeledSelect>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <ArmorSlotSelect
              id="stats-helmet-select"
              category="helmet"
              value={armor.helmet}
              onChange={(m) => setArmor((a) => ({ ...a, helmet: m }))}
              locale={locale}
            />
            <ArmorSlotSelect
              id="stats-chestplate-select"
              category="chestplate"
              value={armor.chestplate}
              onChange={(m) => setArmor((a) => ({ ...a, chestplate: m }))}
              locale={locale}
            />
            <ArmorSlotSelect
              id="stats-leggings-select"
              category="leggings"
              value={armor.leggings}
              onChange={(m) => setArmor((a) => ({ ...a, leggings: m }))}
              locale={locale}
            />
            <ArmorSlotSelect
              id="stats-boots-select"
              category="boots"
              value={armor.boots}
              onChange={(m) => setArmor((a) => ({ ...a, boots: m }))}
              locale={locale}
            />
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
        </div>
        <p className="mt-3 text-xs text-muted">{t("statsBreakTimeNote", locale)}</p>
      </section>
    </div>
  );
}
