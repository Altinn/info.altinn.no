// SubCategoryPage names in Umbraco are stored as "<Category> - <Subcategory>"
// (e.g. "For privatperson - Navn"). The prefix isn't always re-translated per
// locale, so EN/NN pages can show the NB prefix verbatim ("For privatperson
// - Work"). Strip everything up to and including the first " - " so titles,
// breadcrumbs, and sidebar items show only the subcategory portion.
export function stripCategoryPrefix(name: string | undefined | null): string {
  if (!name) return name ?? "";
  const idx = name.indexOf(" - ");
  return idx >= 0 ? name.slice(idx + 3) : name;
}
