// A deep module for the "label above a select, both styled the same way"
// shape that repeated identically 5 times (4x in SearchMode.tsx, once in
// page.tsx's material picker) before a code-review pass flagged it as
// duplicated code. Deliberately NOT used for the "current enchants" row
// in page.tsx — that one is a genuinely different shape (label wraps a
// rarity dot + name, select sits inline beside it rather than stacked
// below), so forcing it into this component would be a shallow,
// awkwardly-parameterized fit rather than real sharing.
export default function LabeledSelect({
  id,
  label,
  value,
  onChange,
  children,
  fullWidth = false,
}: {
  id: string;
  label: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  /** page.tsx's material select spans full width on mobile; SearchMode's selects don't need to. */
  fullWidth?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`mt-1.5 block rounded-md border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2 py-1.5 text-sm ${fullWidth ? "w-full sm:w-auto" : ""}`}
      >
        {children}
      </select>
    </div>
  );
}
