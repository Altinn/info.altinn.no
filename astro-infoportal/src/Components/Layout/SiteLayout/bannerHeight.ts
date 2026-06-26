/**
 * Sum the rendered heights of the banner elements stacked above the layout.
 * A missing banner (null) or a hidden one (display:none → offsetHeight 0)
 * contributes nothing, so the total reflects only what is actually visible.
 */
export function sumOffsetHeights(
  elements: ReadonlyArray<Pick<HTMLElement, "offsetHeight"> | null>,
): number {
  return elements.reduce((total, el) => total + (el?.offsetHeight ?? 0), 0);
}
