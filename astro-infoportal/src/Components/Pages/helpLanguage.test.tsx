import { type HTMLElement, parse } from "node-html-parser";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UiLanguageProvider } from "../Shared/UiLanguage/UiLanguage";

// ContentArea resolves every block through the registry, which would drag the
// whole component tree into these tests.
vi.mock("/App.Components", () => ({
  ContentArea: () => null,
  RichTextArea: () => null,
  OperationalMessage: () => null,
}));

const HelpStartPage = (await import("./HelpStartPage/HelpStartPage")).default;
const HelpSearchPage = (await import("./HelpSearchPage/HelpSearchPage"))
  .default;
const HelpProcessArticlePage = (
  await import("./HelpProcessArticlePage/HelpProcessArticlePage")
).default;

// Most of the help tree has no English or nynorsk variant (on at22, 43 of 47
// helpProcessArticlePage nodes and 53 of 148 helpQuestionPage nodes), so these
// pages render bokmål content inside an interface that is still English. The
// interface strings sit in a region marked `lang="nb"` and a screen reader
// reads them with Norwegian phonetics unless each one carries its own language
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
  let node: HTMLElement | null = owner;
  while (node) {
    const lang = node.getAttribute?.("lang");
    if (lang) return lang;
    node = node.parentNode;
  }
  return undefined;
};

describe("HelpStartPage section headings", () => {
  const markup = () =>
    inEnglishChannel(
      <HelpStartPage
        pageName="Få hjelp til Altinn"
        newDrilldownPages={[{ pageName: "Skatt og avgift", url: "/a" }]}
        oldDrilldownPages={[{ pageName: "Roller og rettigheter", url: "/b" }]}
        questionArea={[{ pageName: "Hvordan logger jeg inn?" }]}
        helpContentArea={{ items: [] }}
        translatedNewVersionHeading="Get help in the new version of Altinn"
        translatedCurrentVersionHeading="Get help in the old version of Altinn"
        translatedQuestionAreaHeading="Questions you may have:"
        translatedHelpContentAreaHeading="Contact us"
        translatedSearchHeading="Search on altinn.no"
        searchPlaceholder="Search on altinn.no"
      />,
    );

  it.each([
    ["the new-version heading", "Get help in the new version of Altinn"],
    ["the current-version heading", "Get help in the old version of Altinn"],
    ["the question-area heading", "Questions you may have:"],
    ["the help-content-area heading", "Contact us"],
    ["the search heading", "Search on altinn.no"],
  ])("tags %s", (_name, text) => {
    expect(langOf(markup(), text)).toBe("en");
  });

  // The page name and the linked page names are content, in the same language
  // as the article around them, so tagging them would hand a screen reader the
  // wrong voice.
  it.each([
    ["the page name", "Få hjelp til Altinn"],
    ["a drilldown card title", "Skatt og avgift"],
    ["a question title", "Hvordan logger jeg inn?"],
  ])("leaves %s alone", (_name, text) => {
    expect(langOf(markup(), text)).toBeUndefined();
  });

  // An editor who typed their own heading wrote it in the language of the
  // content, not the language of the interface.
  it("leaves an editor-written section heading alone", () => {
    const withEditorHeadings = inEnglishChannel(
      <HelpStartPage
        pageName="Få hjelp til Altinn"
        newDrilldownPages={[{ pageName: "Skatt og avgift", url: "/a" }]}
        newVersionHeading="Få hjelp i ny versjon"
        translatedNewVersionHeading="Get help in the new version of Altinn"
      />,
    );

    expect(langOf(withEditorHeadings, "Få hjelp i ny versjon")).toBeUndefined();
  });
});

describe("HelpSearchPage result summary", () => {
  const markup = () =>
    inEnglishChannel(
      <HelpSearchPage
        pageName="Søk i hjelp"
        query="skattemelding"
        totalHits={3}
        results={[{ pageName: "Slik leverer du skattemeldingen" }]}
        searchHitsText="results"
        searchForText="for"
        advertisementIntroText="You are searching the help pages"
        clickHereText="Click here"
        toSearchForText="to search for"
        inText="in"
        otherContentText="other content on altinn.no"
        searchPageUrl="/en/search"
      />,
    );

  it.each([
    ["the hit count label", "results"],
    ["the search-for label", "for"],
    ["the advertisement intro", "You are searching the help pages"],
    ["the click-here link", "Click here"],
    ["the to-search-for label", "to search for"],
    ["the in label", "in"],
    ["the other-content label", "other content on altinn.no"],
  ])("tags %s", (_name, text) => {
    expect(langOf(markup(), text)).toBe("en");
  });

  it("leaves a result title alone", () => {
    expect(langOf(markup(), "Slik leverer du skattemeldingen")).toBeUndefined();
  });
});

describe("HelpProcessArticlePage footer", () => {
  const markup = () =>
    inEnglishChannel(
      <HelpProcessArticlePage
        pageName="Slik søker du om tilskudd"
        lastUpdatedDateText="Last updated"
        lastUpdatedDateString="12.03.2026"
      />,
    );

  it("tags the last-updated label", () => {
    expect(langOf(markup(), "Last updated")).toBe("en");
  });

  it("leaves the page name alone", () => {
    expect(langOf(markup(), "Slik søker du om tilskudd")).toBeUndefined();
  });
});
