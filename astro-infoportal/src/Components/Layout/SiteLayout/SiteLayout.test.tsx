import type { HTMLElement } from "node-html-parser";
import { parse } from "node-html-parser";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The real registry pulls in every page and block component; SiteLayout only
// needs to find the one it was handed, so stub the lookup at the module edge.
vi.mock("../../../App.Components", () => ({
  TestPage: ({ body }: { body: string }) => <p>{body}</p>,
}));

import SiteLayout from "./SiteLayout";

// Issue #713 (WCAG 3.1.2): an /en/ page with no English variant renders bokmål
// content under an English header and footer. <html lang> follows the content
// language, so the chrome has to carry its own lang or a screen reader reads
// the English navigation with Norwegian phonetics.
const CONTENT = "Innhold på bokmål";

const renderLayout = (props: Record<string, unknown>) =>
  parse(
    renderToStaticMarkup(
      <SiteLayout
        skipLinkText="Skip to main content"
        child={{ componentName: "TestPage", body: CONTENT }}
        {...props}
      />,
    ),
  );

// What a screen reader resolves for an element: the nearest lang on it or any
// ancestor. Undefined means it inherits <html lang> — the bug being fixed.
const inheritedLang = (element: HTMLElement | null): string | undefined => {
  for (let node = element; node; node = node.parentNode) {
    const lang = node.getAttribute?.("lang");
    if (lang) return lang;
  }
  return undefined;
};

const requireElement = (root: HTMLElement, selector: string): HTMLElement => {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Expected the layout to render ${selector}`);
  return element;
};

// The innermost element rendering a given string — the node whose language a
// screen reader resolves when it reads that text aloud.
const textOwner = (root: HTMLElement, text: string): HTMLElement => {
  const matches = root
    .querySelectorAll("*")
    .filter((element) => element.textContent.trim() === text);
  const owner = matches.at(-1);
  if (!owner) throw new Error(`Expected the layout to render "${text}"`);
  return owner;
};

describe("SiteLayout language tagging", () => {
  it("tags the UI chrome with the requested locale when the content fell back to bokmål", () => {
    const root = renderLayout({ locale: "en", contentLocale: "nb" });

    expect(inheritedLang(requireElement(root, "footer"))).toBe("en");
  });

  it("tags the page content with the language it actually fell back to", () => {
    const root = renderLayout({ locale: "en", contentLocale: "nb" });

    const content = requireElement(root, "main p");

    expect(content.textContent).toBe(CONTENT);
    expect(inheritedLang(content)).toBe("nb");
  });

  // The sidebar is built from the same Umbraco tree as the content, but the
  // library renders it in <aside>, outside <main> and so inside the chrome.
  it("tags sidebar navigation built from the fallback content", () => {
    const root = renderLayout({
      locale: "en",
      contentLocale: "nb",
      pageSidebarViewModel: {
        mainItems: [{ label: "Skjema og tenester", url: "/skjemaoversikt/" }],
      },
    });

    expect(requireElement(root, "aside a")).toBeTruthy();
    expect(inheritedLang(textOwner(root, "Skjema og tenester"))).toBe("nb");
  });

  // Guards against tagging unconditionally: a translated page has one language
  // throughout, <html lang> already says which, and every extra attribute is
  // markup the edge cache carries on every page of the site.
  it("adds no language markup when the page really is translated", () => {
    const root = renderLayout({ locale: "en", contentLocale: "en" });

    expect(root.querySelectorAll("[lang]")).toHaveLength(0);
  });
});
