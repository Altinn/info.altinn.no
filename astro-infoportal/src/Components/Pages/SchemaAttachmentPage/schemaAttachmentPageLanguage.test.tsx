import { parse } from "node-html-parser";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UiLanguageProvider } from "../../Shared/UiLanguage/UiLanguage";

vi.mock("/App.Components", () => ({
  ContentArea: () => null,
  OperationalMessage: () => null,
  RichTextArea: () => null,
}));

const SchemaAttachmentPage = (await import("./SchemaAttachmentPage")).default;

/** An English interface rendered around bokmål content (issue #713). */
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
  let node: typeof owner | null = owner;
  while (node) {
    const lang = node.getAttribute("lang");
    if (lang) return lang;
    node = node.parentNode;
  }
  return undefined;
};

const relatedSchema = {
  id: "1",
  title: "Søknad om bostøtte (RF-1030)",
  url: "/skjemaoversikt/husbanken/bostotte/",
  providers: [],
};

describe("SchemaAttachmentPage related schemas", () => {
  it("tags the intro line above the list", () => {
    const markup = inEnglishChannel(
      <SchemaAttachmentPage
        whereToFindSchemaText="You will find the form here"
        relatedSchemas={[relatedSchema]}
      />,
    );

    // Rendered with a trailing colon, so the whole visible line is the lookup.
    expect(langOf(markup, "You will find the form here:")).toBe("en");
  });

  // The schema titles in the list are the editors' own, in the language of the
  // content around them — tagging them would give a screen reader the wrong voice.
  it("leaves the editor-written schema titles alone", () => {
    const markup = inEnglishChannel(
      <SchemaAttachmentPage
        whereToFindSchemaText="You will find the form here"
        relatedSchemas={[relatedSchema]}
      />,
    );

    expect(langOf(markup, relatedSchema.title)).toBeUndefined();
  });
});

// Two more pieces of interface text that reach the reader through third-party
// components whose props are typed `string`. The prop cannot carry `lang`, but
// the element around it can, and the text inherits it.
describe("SchemaAttachmentPage interface text in third-party components", () => {
  it("tags the attachment badge", () => {
    const markup = inEnglishChannel(
      <SchemaAttachmentPage
        pageName="Vedlegg til RF-1030"
        attachmentBadgeText="Attachment"
      />,
    );

    expect(langOf(markup, "Attachment")).toBe("en");
  });

  it("tags the page's own not-translated notice", () => {
    const markup = inEnglishChannel(
      <SchemaAttachmentPage
        pageName="Vedlegg til RF-1030"
        missingTranslation={true}
        missingTranslationText="This content is not available in English."
      />,
    );

    expect(langOf(markup, "This content is not available in English.")).toBe(
      "en",
    );
  });
});
