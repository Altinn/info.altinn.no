import { type HTMLElement, parse } from "node-html-parser";

const LINK_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" focusable="false" role="img" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M14.909 5.152a2.25 2.25 0 0 1 3.182 0l.757.757a2.25 2.25 0 0 1 0 3.182l-4.964 4.965a1.25 1.25 0 0 1-1.768 0L11.03 12.97a.75.75 0 1 0-1.06 1.06l1.085 1.086a2.75 2.75 0 0 0 3.89 0l4.964-4.964a3.75 3.75 0 0 0 0-5.304l-.757-.757-.53.53.53-.53a3.75 3.75 0 0 0-5.304 0l-.878.879a.75.75 0 0 0 1.06 1.06zm-1.964 3.732a2.75 2.75 0 0 0-3.89 0l-4.964 4.964a3.75 3.75 0 0 0 0 5.304l.513-.514-.513.514.757.757a3.75 3.75 0 0 0 5.304 0l.878-.879a.75.75 0 0 0-1.06-1.06l-.879.878a2.25 2.25 0 0 1-3.182 0l-.757-.757a2.25 2.25 0 0 1 0-3.182l4.964-4.965a1.25 1.25 0 0 1 1.768 0l1.086 1.086a.75.75 0 0 0 1.06-1.06z" clip-rule="evenodd"/></svg>';

export interface RichTextTransformOptions {
  usedIds: Set<string>;
  addAnchors: boolean;
}

export function transformRichTextHtml(
  html: string,
  options: RichTextTransformOptions,
): string {
  if (!html || !html.trim()) return html;

  const root = parse(html);

  if (options.addAnchors) {
    addHeadingAnchors(root, options.usedIds);
  }
  rewriteTables(root);
  rewriteLinks(root);

  return root.toString();
}

function addHeadingAnchors(root: HTMLElement, usedIds: Set<string>): void {
  const headings = root.querySelectorAll("h2");
  for (const h of headings) {
    let id = h.getAttribute("id");
    if (id?.trim()) {
      usedIds.add(id);
    } else {
      const text = decodeEntities(h.textContent ?? "");
      id = makeUniqueSlug(slugify(text), usedIds);
      h.setAttribute("id", id);
    }

    const hasAnchor =
      h.querySelector("a.heading-anchor") !== null ||
      h.innerHTML.includes("heading-anchor");
    if (hasAnchor) continue;

    const anchorHtml = `<a class="heading-anchor" href="#${id}" aria-hidden="true" tabindex="-1"><span class="heading-anchor__icon" aria-hidden="true">${LINK_ICON_SVG}</span></a>`;
    h.insertAdjacentHTML("afterbegin", anchorHtml);
  }
}

function rewriteTables(root: HTMLElement): void {
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
    const attrs = td.attributes;
    const inner = td.innerHTML;
    const attrString = Object.entries(attrs)
      .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
      .join(" ");
    const th = parse(`<th${attrString ? " " + attrString : ""}>${inner}</th>`)
      .firstChild as HTMLElement;
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
