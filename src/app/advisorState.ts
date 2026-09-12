// The advisor's selection state as one deep module instead of four
// separate useState hooks that had to be kept in sync by hand at every
// call site (category/material/goalId/current always reset together on
// a category change, and always hydrated together from a shared link).
// A code-review pass flagged that as a Data Clump — shareLink.ts's
// AdvisorShareState already names the bundle conceptually; this gives
// page.tsx's own state the same shape, plus a reducer that owns the
// "what changes together" invariant so a caller can't forget a field.
import { enchantmentById, enchantmentsFor, ITEM_CATEGORY_LABELS } from "@/lib/enchantments";
import { GOALS } from "@/lib/goals";
import { materialsFor, type Material } from "@/lib/materials";
import type { AdvisorShareState } from "@/lib/shareLink";
import type { EnchantSet, ItemCategory } from "@/lib/types";

export const CATEGORIES = Object.keys(ITEM_CATEGORY_LABELS) as ItemCategory[];

export interface AdvisorState {
  category: ItemCategory;
  material: Material | undefined;
  goalId: string;
  current: EnchantSet;
}

/** Diamond is the sensible default when a category has material variants — most commonly referenced tier. */
function defaultMaterialFor(category: ItemCategory): Material | undefined {
  const materials = materialsFor(category);
  if (materials.length === 0) return undefined;
  return materials.includes("diamond") ? "diamond" : materials[0];
}

/** Fresh state for a category with no prior selection — used both for the initial render and for CHANGE_CATEGORY. */
export function initialAdvisorState(category: ItemCategory): AdvisorState {
  return { category, material: defaultMaterialFor(category), goalId: GOALS[category][0].id, current: {} };
}

export type AdvisorAction =
  | { type: "CHANGE_CATEGORY"; category: ItemCategory }
  | { type: "SET_MATERIAL"; material: Material }
  | { type: "SET_GOAL"; goalId: string }
  | { type: "SET_LEVEL"; enchantId: string; level: number }
  /** From a shared link's decoded (untrusted) params — every field is validated here, in one place, rather than at each call site. */
  | { type: "HYDRATE"; advisor: Partial<AdvisorShareState> | null };

export function advisorReducer(state: AdvisorState, action: AdvisorAction): AdvisorState {
  switch (action.type) {
    case "CHANGE_CATEGORY":
      return initialAdvisorState(action.category);

    case "SET_MATERIAL":
      return { ...state, material: action.material };

    case "SET_GOAL":
      return { ...state, goalId: action.goalId };

    case "SET_LEVEL": {
      const current = { ...state.current };
      if (action.level <= 0) delete current[action.enchantId];
      else current[action.enchantId] = action.level;
      return { ...state, current };
    }

    case "HYDRATE": {
      const a = action.advisor;
      if (!a?.category || !CATEGORIES.includes(a.category)) return state;
      const category = a.category;

      const materials = materialsFor(category);
      const material = a.material && materials.includes(a.material) ? a.material : defaultMaterialFor(category);

      const goalsForCategory = GOALS[category];
      const goalId = a.goalId && goalsForCategory.some((g) => g.id === a.goalId) ? a.goalId : goalsForCategory[0].id;

      const validIds = new Set(enchantmentsFor(category).map((e) => e.id));
      const current: EnchantSet = {};
      if (a.current) {
        for (const [id, level] of Object.entries(a.current)) {
          if (validIds.has(id) && level >= 1 && level <= enchantmentById(id).maxLevel) current[id] = level;
        }
      }

      return { category, material, goalId, current };
    }

    default:
      return state;
  }
}
