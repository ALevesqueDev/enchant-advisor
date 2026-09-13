import type { BookshelfCurvePoint } from "@/lib/tableOdds";
import { t, bookshelfCurveSummary } from "@/lib/strings";
import type { Locale } from "@/lib/i18n";

/**
 * A deep module for "here's the odds curve across every bookshelf count" —
 * hides the bar-sizing math, the current-count highlight, and the
 * one-sentence summary behind a 3-prop interface. Hand-rolled divs rather
 * than a charting library: 16 bars is simple enough that a dependency
 * would cost more (bundle size, API surface) than it saves.
 */
export default function BookshelfCurveChart({
  points,
  currentBookshelves,
  locale,
}: {
  points: BookshelfCurvePoint[];
  currentBookshelves: number;
  locale: Locale;
}) {
  const max = Math.max(...points.map((p) => p.probability), 0.0001); // avoid divide-by-zero if every point is 0%

  return (
    <section className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t("searchBookshelfCurveHeader", locale)}
      </h3>
      <p className="mt-1 text-xs text-muted">{t("searchBookshelfCurveNote", locale)}</p>

      <div className="panel mt-3 p-4">
        <div className="flex h-32 items-end gap-1">
          {points.map((p) => {
            const isCurrent = p.bookshelves === currentBookshelves;
            const heightPct = Math.max(2, (p.probability / max) * 100); // 2% floor so a 0% bar is still visible as a sliver, not invisible
            return (
              <div key={p.bookshelves} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  role="img"
                  aria-label={`${p.bookshelves} ${t("searchBookshelfCurveAxis", locale)}: ${(p.probability * 100).toFixed(1)}%`}
                  title={`${p.bookshelves} ${t("searchBookshelfCurveAxis", locale)} — ${(p.probability * 100).toFixed(1)}%`}
                  className={`w-full rounded-t-sm ${isCurrent ? "accent-gradient" : "bg-[var(--surface-raised)]"}`}
                  style={{
                    height: `${heightPct}%`,
                    outline: isCurrent ? "2px solid var(--accent-solid)" : undefined,
                    outlineOffset: isCurrent ? "1px" : undefined,
                  }}
                />
                <span className={`text-[10px] ${isCurrent ? "font-bold accent-text" : "text-muted"}`}>{p.bookshelves}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[10px] uppercase tracking-wide text-muted">
          {t("searchBookshelfCurveAxis", locale)}
        </p>
      </div>

      <p className="mt-2 text-xs text-muted">{bookshelfCurveSummary(points, locale)}</p>
    </section>
  );
}
