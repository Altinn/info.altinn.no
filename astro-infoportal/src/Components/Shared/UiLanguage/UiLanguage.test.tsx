import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UiLanguageProvider, UiText } from "./UiLanguage";

// Issue #713 follow-up. On a page that fell back to bokmål the content region is
// tagged lang="nb", but the interface strings rendered inside it — button
// labels, accordion headings, "no hits" — are still in the language the reader
// asked for. Each has to say so, or a screen reader reads English with Norwegian
// phonetics. On a properly translated page there is nothing to mark.
describe("UiText", () => {
  it("marks interface text with the language it is written in", () => {
    const markup = renderToStaticMarkup(
      <UiLanguageProvider lang="en">
        <UiText>Start service</UiText>
      </UiLanguageProvider>,
    );

    expect(markup).toBe('<span lang="en">Start service</span>');
  });

  it("adds no markup when the page is not a fallback", () => {
    const markup = renderToStaticMarkup(
      <UiLanguageProvider lang={undefined}>
        <UiText>Start service</UiText>
      </UiLanguageProvider>,
    );

    expect(markup).toBe("Start service");
  });

  it("adds no markup outside a provider", () => {
    const markup = renderToStaticMarkup(<UiText>Start service</UiText>);

    expect(markup).toBe("Start service");
  });
});
