import { type HTMLElement, parse } from "node-html-parser";

const LINK_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" focusable="false" role="img" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M14.909 5.152a2.25 2.25 0 0 1 3.182 0l.757.757a2.25 2.25 0 0 1 0 3.182l-4.964 4.965a1.25 1.25 0 0 1-1.768 0L11.03 12.97a.75.75 0 1 0-1.06 1.06l1.085 1.086a2.75 2.75 0 0 0 3.89 0l4.964-4.964a3.75 3.75 0 0 0 0-5.304l-.757-.757-.53.53.53-.53a3.75 3.75 0 0 0-5.304 0l-.878.879a.75.75 0 0 0 1.06 1.06zm-1.964 3.732a2.75 2.75 0 0 0-3.89 0l-4.964 4.964a3.75 3.75 0 0 0 0 5.304l.513-.514-.513.514.757.757a3.75 3.75 0 0 0 5.304 0l.878-.879a.75.75 0 0 0-1.06-1.06l-.879.878a2.25 2.25 0 0 1-3.182 0l-.757-.757a2.25 2.25 0 0 1 0-3.182l4.964-4.965a1.25 1.25 0 0 1 1.768 0l1.086 1.086a.75.75 0 0 0 1.06-1.06z" clip-rule="evenodd"/></svg>';

export interface RichTextTransformOptions {
  usedIds: Set<string>;
  addAnchors: boolean;
  // Localized prefix for the heading permalink's accessible name, e.g.
  // "Lenke til seksjonen" → aria-label "Lenke til seksjonen {heading}".
  anchorLabel?: string;
  // Localized accessible name for the table scroll container, e.g. "Tabell".
  // When set, the wrapper becomes a labelled `role="region"`; when omitted it
  // stays an unnamed (but still keyboard-scrollable) container.
  tableLabel?: string;
}

export function transformRichTextHtml(
  html: string,
  options: RichTextTransformOptions,
): string {
  if (!html || !html.trim()) return html;

  const root = parse(html);

  if (options.addAnchors) {
    addHeadingAnchors(root, options.usedIds, options.anchorLabel ?? "");
  }
  rewriteTables(root, options.tableLabel);
  rewriteLinks(root);

  return root.toString();
}

/**
 * Walks a JSON-shaped tree and rewrites `RichText.html` inside every
 * `RichTextArea` node using {@link transformRichTextHtml}. Must run server-side
 * only (e.g. from the JSON transformer pipeline) — running it again on the
 * client would re-parse already-transformed HTML and risks producing a
 * different string due to environment-specific `node-html-parser` behavior,
 * which is exactly the React hydration mismatch this is here to prevent.
 */
export function walkAndTransformRichText(
  node: unknown,
  options?: { tableLabel?: string },
): void {
  if (Array.isArray(node)) {
    for (const item of node) walkAndTransformRichText(item, options);
    return;
  }
  if (typeof node !== "object" || node === null) return;

  // Match the leaf "RichText" items, not a container "RichTextArea" tag (only
  // present at a few sites); `addAnchors` is read from the container.
  if ("items" in node && Array.isArray(node.items)) {
    const addAnchors = "addAnchors" in node && node.addAnchors === true;
    const anchorLabel =
      "anchorLabel" in node && typeof node.anchorLabel === "string"
        ? node.anchorLabel
        : undefined;
    const usedIds = new Set<string>();
    for (const item of node.items) {
      if (isRichTextItem(item)) {
        item.html = transformRichTextHtml(item.html, {
          usedIds,
          addAnchors,
          anchorLabel,
          tableLabel: options?.tableLabel,
        });
      }
    }
  }

  for (const value of Object.values(node)) {
    walkAndTransformRichText(value, options);
  }
}

function isRichTextItem(
  value: unknown,
): value is { componentName: string; html: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "componentName" in value &&
    value.componentName === "RichText" &&
    "html" in value &&
    typeof value.html === "string"
  );
}

// Gives every <h2> a stable slug `id` (so #section deep-links work) and a
// "permalink" anchor for editors. The anchor is a real, keyboard-focusable,
// labelled link — NOT an empty/aria-hidden one — so it doesn't trip the WCAG
// "empty link" / "aria-hidden on focusable" checks (issue #533). Only the
// decorative icon inside is aria-hidden.
function addHeadingAnchors(
  root: HTMLElement,
  usedIds: Set<string>,
  anchorLabel: string,
): void {
  for (const h of root.querySelectorAll("h2")) {
    let id = h.getAttribute("id")?.trim() || "";
    if (id) {
      usedIds.add(id);
    } else {
      id = makeUniqueSlug(
        slugify(decodeEntities(h.textContent ?? "")),
        usedIds,
      );
      h.setAttribute("id", id);
    }

    const text = decodeEntities(h.textContent ?? "").trim();
    // Don't anchor an empty heading (#530), and don't double-add.
    if (!text || h.querySelector("a.heading-anchor")) continue;

    const label = escapeAttr(`${anchorLabel} ${text}`.trim());
    h.insertAdjacentHTML(
      "afterbegin",
      `<a class="heading-anchor" href="#${id}" aria-label="${label}"><span class="heading-anchor__icon" aria-hidden="true">${LINK_ICON_SVG}</span></a>`,
    );
  }
}

function rewriteTables(root: HTMLElement, tableLabel?: string): void {
  const tables = root.querySelectorAll("table");
  for (const table of tables) {
    const classes = splitClasses(table.getAttribute("class"));
    if (!classes.some((c) => c.toLowerCase() === "ds-table")) {
      classes.push("ds-table");
    }
    table.setAttribute("class", classes.join(" "));
    table.setAttribute("data-zebra", "true");
    table.removeAttribute("border");
    table.removeAttribute("style");

    for (const styled of table.querySelectorAll("[style]")) {
      styled.removeAttribute("style");
    }

    promoteFirstRowToHeader(table);
    downgradeEmptyHeaders(table);

    // Wrap the table so a wide table scrolls horizontally instead of
    // overflowing the page on narrow screens (issue #359). `tabindex="0"`
    // makes the scroll container reachable by keyboard (WCAG 2.1.1). Guard
    // against double-wrapping if the transform runs on already-rewritten HTML.
    const parent = table.parentNode as HTMLElement | null;
    const alreadyWrapped = splitClasses(parent?.getAttribute?.("class")).some(
      (c) => c === "rich-text-table",
    );
    if (!alreadyWrapped) {
      // A named region helps screen-reader users find/scroll the table; skip
      // the name (no `role="region"`) when none is supplied to avoid an
      // unnamed landmark.
      const region = tableLabel
        ? ` role="region" aria-label="${escapeAttr(tableLabel)}"`
        : "";
      const wrapper = parse(
        `<div class="rich-text-table" tabindex="0"${region}>${table.toString()}</div>`,
      ).firstChild as HTMLElement;
      table.replaceWith(wrapper);
    }
  }
}

// A <th> with no text/media is an empty table header (WCAG violation, issue
// #530). It's not a real header, so downgrade it to a <td>.
function cellIsEmpty(cell: HTMLElement): boolean {
  if (cell.querySelector("img, svg, picture, video, iframe")) return false;
  return !(cell.textContent ?? "").trim();
}

function downgradeEmptyHeaders(table: HTMLElement): void {
  for (const th of table.querySelectorAll("th")) {
    if (!cellIsEmpty(th)) continue;
    const attrString = Object.entries(th.attributes)
      .filter(([k]) => k.toLowerCase() !== "scope")
      .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
      .join(" ");
    const td = parse(`<td${attrString ? " " + attrString : ""}></td>`)
      .firstChild as HTMLElement;
    th.replaceWith(td);
  }
}

function promoteFirstRowToHeader(table: HTMLElement): void {
  const directChild = (parent: HTMLElement, tag: string): HTMLElement | null =>
    (parent.childNodes.find(
      (n) => (n as HTMLElement).tagName?.toLowerCase() === tag,
    ) as HTMLElement) ?? null;

  if (directChild(table, "thead")) return;

  const tbody = directChild(table, "tbody");
  if (!tbody) return;

  const firstRow = directChild(tbody, "tr");
  if (!firstRow) return;

  const cells = firstRow.childNodes.filter(
    (n) => (n as HTMLElement).tagName?.toLowerCase() === "td",
  ) as HTMLElement[];
  for (const td of cells) {
    // Leave blank corner/spacer cells as <td>; an empty <th> is a WCAG
    // violation (issue #530) and a blank cell isn't a real column header.
    if (cellIsEmpty(td)) continue;
    const attrs = td.attributes;
    const inner = td.innerHTML;
    const hasScope = Object.keys(attrs).some(
      (k) => k.toLowerCase() === "scope",
    );
    const attrString = Object.entries(attrs)
      .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
      .join(" ");
    const scopeAttr = hasScope ? "" : ' scope="col"';
    const th = parse(
      `<th${scopeAttr}${attrString ? " " + attrString : ""}>${inner}</th>`,
    ).firstChild as HTMLElement;
    td.replaceWith(th);
  }

  const theadHtml = `<thead>${firstRow.toString()}</thead>`;
  firstRow.remove();
  table.insertAdjacentHTML("afterbegin", theadHtml);
}

function rewriteLinks(root: HTMLElement): void {
  const links = root.querySelectorAll("a");
  for (const link of links) {
    const classes = splitClasses(link.getAttribute("class"));
    // The heading permalink is a special icon link, not a content link.
    if (classes.some((c) => c.toLowerCase() === "heading-anchor")) continue;

    if (!classes.some((c) => c.toLowerCase() === "ds-link")) {
      classes.push("ds-link");
    }
    link.setAttribute("class", classes.join(" "));
    link.removeAttribute("title");
  }
}

export function slugify(input: string): string {
  if (!input || !input.trim()) return "section";

  const normalized = input.normalize("NFC").toLowerCase();
  let result = "";
  let lastDash = false;
  for (const ch of normalized) {
    if (/[\p{L}\p{N}]/u.test(ch)) {
      result += ch;
      lastDash = false;
    } else if (/[\s\-_]/.test(ch)) {
      if (!lastDash) {
        result += "-";
        lastDash = true;
      }
    }
  }
  return result.replace(/^-+|-+$/g, "") || "section";
}

export function makeUniqueSlug(base: string, used: Set<string>): string {
  const baseSlug = base || "section";
  let slug = baseSlug;
  let i = 2;
  while (used.has(slug)) {
    slug = `${baseSlug}-${i++}`;
  }
  used.add(slug);
  return slug;
}

function splitClasses(value: string | undefined | null): string[] {
  if (!value) return [];
  return value.split(/\s+/).filter(Boolean);
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
