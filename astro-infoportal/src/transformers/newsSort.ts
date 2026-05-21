// News list ordering: prefer the editor-managed `lastChanged` property; fall
// back to Umbraco's built-in `updateDate` when it's unset. Sorting happens
// client-side because the Delivery API can't coalesce two date fields in a
// single `sort=` expression.

export function effectiveNewsDate(item: any): number {
  const raw = item?.properties?.lastChanged ?? item?.updateDate;
  const t = raw ? Date.parse(raw) : Number.NaN;
  return Number.isFinite(t) ? t : 0;
}

export function sortNewsByEffectiveDateDesc<T>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => effectiveNewsDate(b) - effectiveNewsDate(a),
  );
}
