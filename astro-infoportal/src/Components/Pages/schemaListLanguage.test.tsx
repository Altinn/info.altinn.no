import type { HTMLElement } from "node-html-parser";
import { parse } from "node-html-parser";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Both pages pull blocks from the registry, which drags in every component.
vi.mock("/App.Components", () => ({
  ContentArea: () => null,
  RichTextArea: () => null,
  OperationalMessage: () => null,
  ProviderContactInformationBlock: () => null,
}));

const ProviderPage = (await import("./ProviderPage/ProviderPage")).default;
const SubCategoryPage = (await import("./SubCategoryPage/SubCategoryPage"))
  .default;

// Services merged in from bokmål sit in an otherwise English list (issue #705),
// so the page language says "en" while these titles are Norwegian. Each one has
// to carry its own lang or a screen reader reads it with English phonetics
// (WCAG 3.1.2, issue #713).
const schemas = [
  { id: "1", title: "Medicinal products for animals", url: "/en/a/" },
  { id: "2", title: "Apotekdrift", url: "/en/b/", titleLang: "nb" },
];

const langOfTitle = (markup: string, title: string) => {
  const root = parse(markup);
  const owner = root
    .querySelectorAll("*")
    .filter((element) => element.textContent.trim() === title)
    .at(-1);
  if (!owner) throw new Error(`Expected the list to render "${title}"`);
  let node: HTMLElement | null = owner;
  while (node) {
    const lang = node.getAttribute?.("lang");
    if (lang) return lang;
    node = node.parentNode;
  }
  return undefined;
};

describe.each([
  ["ProviderPage", ProviderPage],
  ["SubCategoryPage", SubCategoryPage],
])("%s schema list", (_name, Page) => {
  const markup = () => renderToStaticMarkup(<Page schemas={schemas} />);

  it("tags a service title that was served in bokmål", () => {
    expect(langOfTitle(markup(), "Apotekdrift")).toBe("nb");
  });

  it("leaves a translated service title untagged", () => {
    expect(
      langOfTitle(markup(), "Medicinal products for animals"),
    ).toBeUndefined();
  });
});
