// A deep module for "here's a ranked list of odds" — hides the medal/
// panel/glint/progress-bar/percentage-formatting behind one small props
// interface. Extracted after a code-review pass flagged the table-combo
// and book-combo result blocks in SearchMode.tsx as near-duplicates; the
// best-method ranking is a third, near-identical shape, so this now
// backs all three call sites there instead of three copies of the same
// markup evolving independently.
const RANK_MEDAL = ["🥇", "🥈", "🥉"];

export interface RankedResultsItem {
  /** Unique within the list — becomes the React key. */
  key: string;
  label: React.ReactNode;
  /** 0-1. Rendered as a percentage and as the progress-bar fill. */
  probability: number;
  /** Decimal places for the percentage — table/book use 1, trading/fishing use 3 (their odds are much smaller per attempt). */
  probabilityDigits: number;
  /** Optional extra line under the progress bar (e.g. an expected-attempts note). */
  note?: React.ReactNode;
}

export default function RankedResultsList({ items }: { items: RankedResultsItem[] }) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((item, i) => (
        <div
          key={item.key}
          className={`panel flex items-center gap-3 p-3 ${i === 0 ? "glint ring-1 ring-[var(--accent-solid)]" : ""}`}
        >
          {/* Decorative — rank is already conveyed by list order and the % shown right after. */}
          <span aria-hidden="true" className="w-6 shrink-0 text-center text-base">
            {RANK_MEDAL[i] ?? i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{item.label}</span>
              <span className="font-display shrink-0 text-sm font-bold accent-text">
                {(item.probability * 100).toFixed(item.probabilityDigits)}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-raised)]">
              <div
                className="accent-gradient h-full rounded-full"
                style={{ width: `${Math.min(100, item.probability * 100)}%` }}
              />
            </div>
            {item.note && <p className="mt-1 text-xs text-muted">{item.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
