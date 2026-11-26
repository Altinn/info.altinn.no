import { describe, expect, it } from "vitest";
import { formLinkClickEvent, searchHasNoPersonalData } from "./consent";

describe("searchHasNoPersonalData", () => {
  it("is true for a clean query string", () => {
    expect(searchHasNoPersonalData("?q=skatt")).toBe(true);
    expect(searchHasNoPersonalData("")).toBe(true);
  });

  it("is false when the query contains an email", () => {
    expect(searchHasNoPersonalData("?email=ola%40example.com")).toBe(false);
  });

  it("is false when the query contains a long digit run (fødselsnummer)", () => {
    expect(searchHasNoPersonalData("?q=12345678901")).toBe(false);
  });

  it("is false for a malformed query that cannot be decoded", () => {
    expect(searchHasNoPersonalData("?q=%E0%A4%A")).toBe(false);
  });
});

describe("formLinkClickEvent", () => {
  const target = (...classes: string[]) => ({
    closest: (selector: string) =>
      classes.includes(selector.slice(1)) ? {} : null,
  });
  const page = (h1: string | null) => ({
    querySelector: () => (h1 === null ? null : { textContent: h1 }),
  });

  it("reports a click on the start button as 'start altinn form'", () => {
    expect(
      formLinkClickEvent(
        target("altinn-skjema-link") as never,
        page("  Skattemelding (RF-1030) \n") as never,
      ),
    ).toEqual([
      "event",
      "start altinn form",
      "Click",
      "Skattemelding (RF-1030)",
    ]);
  });

  it("reports a click on the external link as 'link external form'", () => {
    expect(
      formLinkClickEvent(
        target("external-skjema-link") as never,
        page("Søknad") as never,
      ),
    ).toEqual(["event", "link external form", "Click", "Søknad"]);
  });

  it("labels the event '(no h1)' when the page has no heading", () => {
    expect(
      formLinkClickEvent(
        target("altinn-skjema-link") as never,
        page(null) as never,
      )?.[3],
    ).toBe("(no h1)");
  });

  it("ignores clicks outside form links and on non-elements", () => {
    expect(
      formLinkClickEvent(target("other") as never, page("x") as never),
    ).toBeNull();
    expect(formLinkClickEvent({} as never, page("x") as never)).toBeNull();
    expect(formLinkClickEvent(null, page("x") as never)).toBeNull();
  });
});
