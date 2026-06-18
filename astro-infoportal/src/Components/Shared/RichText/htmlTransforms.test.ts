import { describe, expect, it } from "vitest";
import { transformRichTextHtml } from "./htmlTransforms";

const transform = (html: string) =>
  transformRichTextHtml(html, {
    usedIds: new Set<string>(),
    addAnchors: false,
  });

const count = (html: string, re: RegExp) => html.match(re)?.length ?? 0;
const emptyThCount = (html: string) => count(html, /<th[^>]*>\s*<\/th>/gi);
const thCount = (html: string) => count(html, /<th[\s>]/gi);

describe("rewriteTables: empty header cells (issue #530)", () => {
  it("keeps an empty first-row corner cell as <td> instead of an empty <th>", () => {
    const out = transform(
      "<table><tbody>" +
        "<tr><td></td><td>Frilanser</td><td>Selvstendig</td></tr>" +
        "<tr><td>Krav</td><td>Nei</td><td>Ja</td></tr>" +
        "</tbody></table>",
    );
    expect(out).toContain("<thead>");
    expect(emptyThCount(out)).toBe(0);
    // the two non-empty header cells are promoted; the empty corner is not
    expect(thCount(out)).toBe(2);
  });

  it('adds scope="col" to promoted header cells', () => {
    const out = transform(
      "<table><tbody>" +
        "<tr><td>A</td><td>B</td></tr>" +
        "<tr><td>1</td><td>2</td></tr>" +
        "</tbody></table>",
    );
    expect(thCount(out)).toBe(2);
    expect(emptyThCount(out)).toBe(0);
    expect(count(out, /scope="col"/g)).toBe(2);
  });

  it("downgrades an authored empty <th> to <td>", () => {
    const out = transform(
      "<table><thead><tr><th></th><th>A</th></tr></thead>" +
        "<tbody><tr><td>x</td><td>y</td></tr></tbody></table>",
    );
    expect(emptyThCount(out)).toBe(0);
    expect(thCount(out)).toBe(1);
  });

  it("still tags the table with ds-table", () => {
    const out = transform(
      "<table><tbody><tr><td>A</td></tr><tr><td>1</td></tr></tbody></table>",
    );
    expect(out).toContain("ds-table");
  });
});

describe("accessible heading section anchors (issue #533)", () => {
  const transformWithAnchors = (html: string) =>
    transformRichTextHtml(html, {
      usedIds: new Set<string>(),
      addAnchors: true,
      anchorLabel: "Lenke til seksjonen",
    });

  const firstAnchorTag = (html: string) => html.match(/<a\b[^>]*>/)?.[0] ?? "";

  it("assigns a slug id to the heading", () => {
    expect(transformWithAnchors("<h2>Skatt</h2>")).toContain('id="skatt"');
  });

  it("adds a labelled, focusable anchor that is not empty or aria-hidden", () => {
    const a = firstAnchorTag(transformWithAnchors("<h2>Skatt</h2>"));
    expect(a).toContain('class="heading-anchor"');
    expect(a).toContain('href="#skatt"');
    expect(a).toContain('aria-label="Lenke til seksjonen Skatt"');
    expect(a).not.toContain("aria-hidden"); // the <a> stays in the a11y tree
    expect(a).not.toContain('tabindex="-1"'); // keyboard-accessible
  });

  it("keeps the decorative icon aria-hidden", () => {
    expect(transformWithAnchors("<h2>Skatt</h2>")).toContain(
      'class="heading-anchor__icon" aria-hidden="true"',
    );
  });

  it("escapes quotes in the aria-label", () => {
    const a = firstAnchorTag(transformWithAnchors('<h2>Skatt "x"</h2>'));
    expect(a).toContain("&quot;");
    expect(a).not.toContain('"x"');
  });

  it("does not add an anchor to an empty heading", () => {
    expect(transformWithAnchors("<h2></h2>")).not.toContain("heading-anchor");
  });

  it("keeps ids unique across repeated heading text", () => {
    const out = transformWithAnchors("<h2>Skatt</h2><h2>Skatt</h2>");
    expect(out).toContain('id="skatt"');
    expect(out).toContain('id="skatt-2"');
  });
});
