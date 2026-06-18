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
