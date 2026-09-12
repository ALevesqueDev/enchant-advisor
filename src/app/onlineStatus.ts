// Extracted purely so the bug below has a permanent regression test —
// see OfflineBanner.tsx for where this is actually used.
//
// Bug fixed 2026-09-12: `typeof navigator === "undefined"` isn't enough
// to detect "not a real browser". Node 21+ ships a partial global
// `navigator` object (for Web-standard compatibility) whose `onLine`
// property is simply `undefined`, not `false` and not absent. Treating
// that as falsy (`someValue || false`-style logic) made the banner
// incorrectly show on first paint on every server-rendered page load,
// in both `next dev` and the static production build, until the
// client-side effect corrected it a moment later.
//
// `!== false` treats "we don't actually know" (Node's stub, or any
// environment that doesn't support the property at all) the same as
// "assume online" — the correct default either way — and only an
// explicit `false` is treated as offline.
export function isOnlineByDefault(onLineValue: boolean | undefined): boolean {
  return onLineValue !== false;
}
