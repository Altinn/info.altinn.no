import { type HTMLElement as HtmlNode, parse } from "node-html-parser";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UiLanguageProvider } from "../../Shared/UiLanguage/UiLanguage";

vi.mock("/App.Components", () => ({
  ContentArea: () => null,
  RichTextArea: () => null,
}));

const SubsidyPage = (await import("./SubsidyPage")).default;

// subsidyPage is the worst offender on at22: all 216 of them render bokmål
// content to an English or nynorsk visitor, so every interface string on the
// page sits inside a region marked lang="nb" (WCAG 3.1.2, issue #713).
const inEnglishChannel = (node: React.ReactNode) =>
  parse(
    renderToStaticMarkup(
      <UiLanguageProvider lang="en">{node}</UiLanguageProvider>,
    ),
  );

/** The language a screen reader would use for `text`: the nearest `lang` above
 *  the innermost element that renders it. */
const langOf = (markup: ReturnType<typeof parse>, text: string) => {
  const owner = markup
    .querySelectorAll("*")
    .filter((element) => element.textContent.includes(text))
    .at(-1);
  if (!owner) throw new Error(`Expected "${text}" to be rendered`);
  for (let node: HtmlNode | null = owner; node; node = node.parentNode) {
    const lang = node.getAttribute?.("lang");
    if (lang) return lang;
  }
  return undefined;
};

describe("SubsidyPage last-updated byline", () => {
  it("tags the translated label", () => {
    const markup = inEnglishChannel(
      <SubsidyPage
        lastUpdatedDateText="Last updated"
        lastUpdatedDateString="18.09.2026"
      />,
    );

    expect(langOf(markup, "Last updated")).toBe("en");
  });

  it("still renders the label and the date as one line", () => {
    const markup = inEnglishChannel(
      <SubsidyPage
        lastUpdatedDateText="Last updated"
        lastUpdatedDateString="18.09.2026"
      />,
    );

    expect(markup.textContent).toContain("Last updated 18.09.2026");
  });

  it("renders the date alone when there is no label", () => {
    const markup = inEnglishChannel(
      <SubsidyPage lastUpdatedDateString="18.09.2026" />,
    );

    expect(markup.textContent).toContain("18.09.2026");
  });

  // The page name is the editor's own, in the language of the content around
  // it. Tagging it would hand a screen reader the wrong voice.
  it("leaves the editor-written page name alone", () => {
    const markup = inEnglishChannel(
      <SubsidyPage
        pageName="Tilskudd til fiskerihavner"
        lastUpdatedDateText="Last updated"
        lastUpdatedDateString="18.09.2026"
      />,
    );

    expect(langOf(markup, "Tilskudd til fiskerihavner")).toBeUndefined();
  });

  // The editor's own timeline headings are content too.
  it("leaves editor-written timeline headings alone", () => {
    const markup = inEnglishChannel(
      <SubsidyPage
        timeline={[{ heading: "Søk om tilskudd" }, { heading: "Få svar" }]}
      />,
    );

    expect(langOf(markup, "Søk om tilskudd")).toBeUndefined();
  });
});

describe("SubsidyPage on a properly translated page", () => {
  it("adds no language marking at all", () => {
    const markup = parse(
      renderToStaticMarkup(
        <UiLanguageProvider lang={undefined}>
          <SubsidyPage
            lastUpdatedDateText="Sist oppdatert"
            lastUpdatedDateString="18.09.2026"
          />
        </UiLanguageProvider>,
      ),
    );

    expect(markup.querySelectorAll("[lang]")).toHaveLength(0);
  });
});
