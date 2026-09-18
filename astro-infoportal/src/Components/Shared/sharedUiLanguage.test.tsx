import { parse } from "node-html-parser";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MunicipalityCountySearch from "./MunicipalityCountySearch/MunicipalityCountySearch";
import RichTextMetadata from "./RichTextMetadata/RichTextMetadata";
import SearchInput from "./SearchInput/SearchInput";
import { UiLanguageProvider } from "./UiLanguage/UiLanguage";

// Shared components rendered inside the page body. Their labels come from the
// interface translations while the values beside them are the editor's, so on a
// page that fell back to bokmål the two sit side by side in different languages
// (WCAG 3.1.2, issue #713).
const inEnglishChannel = (node: React.ReactNode) =>
  parse(
    renderToStaticMarkup(
      <UiLanguageProvider lang="en">{node}</UiLanguageProvider>,
    ),
  );

const langOf = (markup: ReturnType<typeof parse>, text: string) => {
  const owner = markup
    .querySelectorAll("*")
    .filter((element) => element.textContent.trim() === text)
    .at(-1);
  if (!owner) throw new Error(`Expected "${text}" to be rendered`);
  let node: ReturnType<typeof markup.querySelector> = owner;
  while (node) {
    const lang = node.getAttribute?.("lang");
    if (lang) return lang;
    node = node.parentNode;
  }
  return undefined;
};

const Icon = () => <svg />;

describe("RichTextMetadata", () => {
  const render = () =>
    inEnglishChannel(
      <RichTextMetadata
        items={[{ icon: Icon, label: "Deadline", content: "1. mars hvert år" }]}
      />,
    );

  it("tags the label, which comes from the interface translations", () => {
    expect(langOf(render(), "Deadline:")).toBe("en");
  });

  it("leaves the editor's value beside it alone", () => {
    expect(langOf(render(), "1. mars hvert år")).toBeUndefined();
  });
});

describe("MunicipalityCountySearch", () => {
  it("tags the heading asking which municipality to search for", () => {
    const markup = inEnglishChannel(
      <MunicipalityCountySearch
        apiSourceUrl="/api/municipalities"
        whatText="Which municipality does this concern?"
        searchPlaceholder="Search"
        noHitText="No hits"
      />,
    );

    expect(langOf(markup, "Which municipality does this concern?")).toBe("en");
  });
});

// Interface text that reaches the reader through an attribute — a placeholder or
// an accessible name — cannot carry `lang` itself. The element holding the
// attribute can, and it inherits from any ancestor, so wrapping still fixes it.
const langOfElement = (
  markup: ReturnType<typeof parse>,
  selector: string,
): string | undefined => {
  const owner = markup.querySelector(selector);
  if (!owner) throw new Error(`Expected the page to render ${selector}`);
  let node: typeof owner | null = owner;
  while (node) {
    const lang = node.getAttribute("lang");
    if (lang) return lang;
    node = node.parentNode;
  }
  return undefined;
};

describe("SearchInput", () => {
  it("marks the language of its placeholder and accessible name", () => {
    const markup = inEnglishChannel(
      <SearchInput
        searchPageUrl="/en/help/search/"
        placeholder="Search the help pages"
        ariaLabel="Search the help pages"
      />,
    );

    expect(langOfElement(markup, "input")).toBe("en");
  });
});

describe("MunicipalityCountySearch search field", () => {
  it("marks the language of the search placeholder", () => {
    const markup = inEnglishChannel(
      <MunicipalityCountySearch
        apiSourceUrl="/api/municipalities"
        whatText="Which municipality does this concern?"
        searchPlaceholder="Search for a municipality"
        noHitText="No hits"
      />,
    );

    expect(langOfElement(markup, "input")).toBe("en");
  });
});
