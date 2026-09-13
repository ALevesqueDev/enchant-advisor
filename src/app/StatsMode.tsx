"use client";

import { useEffect, useRef, useState } from "react";
import { enchantmentById } from "@/lib/enchantments";
import { materialsFor, type Material } from "@/lib/materials";
import { enchantmentName, itemName, bareItemName } from "@/lib/i18n";
import { t } from "@/lib/strings";
import {
  weaponBaseStats,
  computeMeleeDamage,
  sweepingEdgeRatio,
  fireAspectSeconds,
  unbreakingSaveChance,
  DAMAGE_ENCHANT_IDS,
  type MeleeWeapon,
} from "@/lib/weaponStats";
import { useLocale } from "./LocaleContext";
import LabeledSelect from "./LabeledSelect";

const USERNAME_STORAGE_KEY = "enchant-advisor-mc-username";

/**
 * Draws a small, deliberately original 64x32 "enchanted construct" skin
 * texture (legacy layout -- skinview3d auto-mirrors the left arm/leg from
 * the right, so there's no risk of getting the extended 64x64 format's
 * separate left-side UV offsets wrong). NOT a copy of Steve/Alex or any
 * real skin -- Mojang's usage guidelines restrict redistributing their
 * texture assets, so this is our own recolor in the app's own accent
 * palette instead. Placeholder until real skin-by-username lookup ships.
 */
function buildPlaceholderSkin(): string {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  const ink = "#1a1729",
    head = "#c4b5fd",
    torso = "#818cf8",
    limb = "#22d3ee";
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, 64, 32);
  const box = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  box(8, 0, 8, 8, head);
  box(16, 0, 8, 8, head);
  box(0, 8, 8, 8, head);
  box(8, 8, 8, 8, head);
  box(16, 8, 8, 8, head);
  box(24, 8, 8, 8, head);
  box(20, 16, 8, 4, torso);
  box(28, 16, 8, 4, torso);
  box(16, 20, 4, 12, torso);
  box(20, 20, 8, 12, torso);
  box(28, 20, 4, 12, torso);
  box(32, 20, 8, 12, torso);
  box(44, 16, 4, 4, limb);
  box(48, 16, 4, 4, limb);
  box(40, 20, 4, 12, limb);
  box(44, 20, 4, 12, limb);
  box(48, 20, 4, 12, limb);
  box(52, 20, 4, 12, limb);
  box(4, 16, 4, 4, ink);
  box(8, 16, 4, 4, ink);
  box(0, 20, 4, 12, ink);
  box(4, 20, 4, 12, ink);
  box(8, 20, 4, 12, ink);
  box(12, 20, 4, 12, ink);
  return c.toDataURL("image/png");
}

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

export default function StatsMode() {
  const { locale } = useLocale();

  const [weapon, setWeapon] = useState<MeleeWeapon>("sword");
  const [material, setMaterial] = useState<Material>("diamond");
  const [damageEnchantId, setDamageEnchantId] = useState<string>("sharpness");
  const [damageLevel, setDamageLevel] = useState(5);
  const [sweepLevel, setSweepLevel] = useState(0);
  const [fireLevel, setFireLevel] = useState(0);
  const [unbreakingLevel, setUnbreakingLevel] = useState(0);
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
  const [skinFailed, setSkinFailed] = useState(false);

  useEffect(() => {
    let viewer: { dispose: () => void } | null = null;
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
          skin: buildPlaceholderSkin(),
        });
        try {
          created.autoRotate = true;
          created.autoRotateSpeed = 0.8;
          created.zoom = 0.85;
        } catch {
          // Cosmetic only -- the viewer still works without these.
        }
        viewer = created;
      })
      .catch(() => {
        if (!cancelled) setSkinFailed(true);
      });
    return () => {
      cancelled = true;
      viewer?.dispose();
    };
  }, []);

  function loadSkin() {
    try {
      localStorage.setItem(USERNAME_STORAGE_KEY, username);
    } catch {
      // Non-fatal -- the choice just won't persist across visits.
    }
    setSkinCaption(
      username.trim()
        ? t("statsSkinCaptionNamed", locale)
        : t("statsSkinCaptionGeneric", locale)
    );
  }

  function changeWeapon(w: MeleeWeapon) {
    setWeapon(w);
    if (!materialsFor(w).includes(material)) setMaterial(materialsFor(w)[0]);
  }

  const base = weaponBaseStats(weapon, material);
  const activeEnchantId = damageEnchantId === "none" ? null : damageEnchantId;
  const damage = computeMeleeDamage(base, activeEnchantId, activeEnchantId ? damageLevel : 0);
  const sweep = sweepingEdgeRatio(sweepLevel);
  const burn = fireAspectSeconds(fireLevel);
  const durabilitySave = unbreakingSaveChance(unbreakingLevel);

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

          <div className="mt-4 space-y-2">
            <ComingSoonSlot label={bareItemName("helmet", locale)} />
            <ComingSoonSlot label={bareItemName("chestplate", locale)} />
            <ComingSoonSlot label={bareItemName("leggings", locale)} />
            <ComingSoonSlot label={bareItemName("boots", locale)} />
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
    </div>
  );
}
