import type { HTMLElement } from "node-html-parser";
import { parse } from "node-html-parser";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UiLanguageProvider } from "../../Shared/UiLanguage/UiLanguage";

vi.mock("/App.Components", () => ({
  ContentArea: () => null,
  OperationalMessage: () => null,
  RichTextArea: () => null,
}));

const SchemaAccordianBlock = (
  await import("../../Blocks/SchemaAccordianBlock/SchemaAccordianBlock")
).default;
const SchemaPage = (await import("./SchemaPage")).default;

// The violations Jørgen's audit found on at22 after the first fix shipped: the
// alert was tagged, but "Start service" and the accordion headings still sat
// inside the bokmål content region with no language of their own.
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

describe("SchemaAccordianBlock heading language", () => {
  it("tags a heading that came from the interface translations", () => {
    const markup = inEnglishChannel(
      <SchemaAccordianBlock translatedHeading="When should I use this form?" />,
    );

    expect(langOf(markup, "When should I use this form?")).toBe("en");
  });

  // The editor's own heading is content, in the same language as the article
  // around it, so tagging it would hand a screen reader the wrong voice.
  it("leaves an editor-written heading alone", () => {
    const markup = inEnglishChannel(
      <SchemaAccordianBlock
        heading="Når skal jeg bruke dette skjemaet?"
        translatedHeading="When should I use this form?"
      />,
    );

    expect(langOf(markup, "Når skal jeg bruke dette skjemaet?")).toBeUndefined();
  });
});

describe("SchemaPage action buttons", () => {
  it("tags the start-service label", () => {
    const markup = inEnglishChannel(
      <SchemaPage
        startSchemaLink="https://skjema.altinn.no/x"
        startSchemaLinkText="Start service"
      />,
    );

    expect(langOf(markup, "Start service")).toBe("en");
  });
});

describe("SchemaPage external form link", () => {
  // `shallowLinkText` is built in the transformer from t("schema.shallowLink")
  // plus the target's domain, so the whole label is interface text.
  it("tags the shallow-link label", () => {
    const markup = inEnglishChannel(
      <SchemaPage
        shallowLink="https://www.skatteetaten.no/skjema"
        shallowLinkText="Go to skatteetaten.no"
      />,
    );

    expect(langOf(markup, "Go to skatteetaten.no")).toBe("en");
  });
});

describe("SchemaPage editorial content", () => {
  // The schema's name is the editor's own, in the language of the article.
  it("leaves the schema name alone", () => {
    const markup = inEnglishChannel(
      <SchemaPage schemaPageNameText="Søknad om bostøtte" />,
    );

    expect(langOf(markup, "Søknad om bostøtte")).toBeUndefined();
  });
});
