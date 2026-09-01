import { describe, expect, it } from "vitest";
import { searchHasNoPersonalData } from "./consent";

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
