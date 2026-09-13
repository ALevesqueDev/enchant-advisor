// Builds the Stats Calculator's 3D-character skin texture entirely from
// canvas drawing -- no bundled image asset, no real Minecraft skin/armor
// texture anywhere in this file. Mojang's usage guidelines restrict
// redistributing their own texture/graphics assets (confirmed while
// scoping this feature), so instead of a Steve/Alex recolor or extracted
// armor textures, each equipped slot's material tier just recolors the
// relevant region of an original "enchanted construct" base -- our own
// look, not a copy of the game's.
//
// Legacy 64x32 skin layout on purpose (not the extended 64x64 format,
// which adds separate left-arm/left-leg regions skinview3d would
// otherwise need correctly placed) -- skinview3d auto-mirrors the right
// arm/leg onto the left, so there's no risk of getting those extended
// offsets wrong for what's fundamentally a stylized placeholder.
import type { Material } from "@/lib/materials";

export interface ArmorLoadout {
  helmet?: Material;
  chestplate?: Material;
  leggings?: Material;
  boots?: Material;
}

/**
 * One color per material tier, loosely evoking the real item's palette
 * (iron = pale silver, diamond = cyan, netherite = near-black purple,
 * etc.) without reproducing any actual game texture. Slots left at
 * "none" keep the base construct color for that body region instead.
 */
const TIER_COLOR: Partial<Record<Material, string>> = {
  leather: "#a5673f",
  chainmail: "#6b6b76",
  iron: "#d9d9e0",
  golden: "#f2c94c",
  diamond: "#5eead4",
  netherite: "#2e2233",
  copper: "#c77b4a",
  turtle_shell: "#4d8b5a",
};

const BASE_INK = "#1a1729";
const BASE_HEAD = "#c4b5fd";
const BASE_TORSO = "#818cf8";
const BASE_LIMB = "#22d3ee";

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Head cube's 6-face UV unwrap (legacy 64x32 layout, top-left origin). */
function drawHead(ctx: CanvasRenderingContext2D, color: string) {
  box(ctx, 8, 0, 8, 8, color);
  box(ctx, 16, 0, 8, 8, color);
  box(ctx, 0, 8, 8, 8, color);
  box(ctx, 8, 8, 8, 8, color);
  box(ctx, 16, 8, 8, 8, color);
  box(ctx, 24, 8, 8, 8, color);
}

/** Torso cube's 6-face UV unwrap. */
function drawTorso(ctx: CanvasRenderingContext2D, color: string) {
  box(ctx, 20, 16, 8, 4, color);
  box(ctx, 28, 16, 8, 4, color);
  box(ctx, 16, 20, 4, 12, color);
  box(ctx, 20, 20, 8, 12, color);
  box(ctx, 28, 20, 4, 12, color);
  box(ctx, 32, 20, 8, 12, color);
}

/** Right arm cube (skinview3d mirrors this onto the left automatically in the legacy format). */
function drawArms(ctx: CanvasRenderingContext2D, color: string) {
  box(ctx, 44, 16, 4, 4, color);
  box(ctx, 48, 16, 4, 4, color);
  box(ctx, 40, 20, 4, 12, color);
  box(ctx, 44, 20, 4, 12, color);
  box(ctx, 48, 20, 4, 12, color);
  box(ctx, 52, 20, 4, 12, color);
}

/**
 * Right leg cube (mirrored to the left automatically). `bootBand` limits
 * the recolor to just the bottom few rows of each side face -- boots only
 * cover the foot, not the whole leg, so a boots-tier color shouldn't
 * overwrite a leggings-tier color drawn first.
 */
function drawLeg(ctx: CanvasRenderingContext2D, color: string, bootBand = false) {
  if (!bootBand) {
    box(ctx, 4, 16, 4, 4, color);
    box(ctx, 8, 16, 4, 4, color);
    box(ctx, 0, 20, 4, 12, color);
    box(ctx, 4, 20, 4, 12, color);
    box(ctx, 8, 20, 4, 12, color);
    box(ctx, 12, 20, 4, 12, color);
    return;
  }
  // Bottom 3 of the leg's 12px-tall side faces -- the "boot" band.
  box(ctx, 0, 29, 4, 3, color);
  box(ctx, 4, 29, 4, 3, color);
  box(ctx, 8, 29, 4, 3, color);
  box(ctx, 12, 29, 4, 3, color);
}

/** Builds the full skin texture as a data URL, ready for skinview3d's `skin` option or `loadSkin()`. */
export function buildCharacterSkin(loadout: ArmorLoadout = {}): string {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = BASE_INK;
  ctx.fillRect(0, 0, 64, 32);

  drawHead(ctx, (loadout.helmet && TIER_COLOR[loadout.helmet]) || BASE_HEAD);
  drawTorso(ctx, (loadout.chestplate && TIER_COLOR[loadout.chestplate]) || BASE_TORSO);
  drawArms(ctx, (loadout.chestplate && TIER_COLOR[loadout.chestplate]) || BASE_LIMB);
  drawLeg(ctx, (loadout.leggings && TIER_COLOR[loadout.leggings]) || BASE_INK);
  if (loadout.boots && TIER_COLOR[loadout.boots]) drawLeg(ctx, TIER_COLOR[loadout.boots]!, true);

  return c.toDataURL("image/png");
}
