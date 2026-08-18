import { describe, expect, it, vi } from "vitest";
import {
  buildPromoAreaContentArea,
  buildProviderContactInfo,
  expandSharedBlocks,
  isContactBlock,
  mapContactBlock,
  promoAreaIsEmpty,
  resolvePromoAreaWithNbFallback,
} from "./promoAreaContact";

const contactBlock = (properties: Record<string, unknown>) => ({
  content: { contentType: "formElementContact", properties },
});
const freetextBlock = (properties: Record<string, unknown>) => ({
  content: { contentType: "formElementContactFreetext", properties },
});
const otherBlock = (properties: Record<string, unknown>) => ({
  content: { contentType: "linkButtonBlock", properties },
});
// "Delt blokk": a blockPicker wrapper holding unexpanded Content Picker refs.
const sharedBlockPicker = (...refs: { id: string; path?: string }[]) => ({
  content: {
    contentType: "blockPicker",
    properties: {
      blockPicker: refs.map((ref) => ({
        contentType: "providerContactInformationBlock",
        id: ref.id,
        route: { path: ref.path ?? `/delte-blokker/${ref.id}/` },
        properties: {},
      })),
    },
  },
});

describe("isContactBlock", () => {
  it("recognises both Faglig brukerstøtte block content types", () => {
    expect(isContactBlock("formElementContact")).toBe(true);
    expect(isContactBlock("formElementContactFreetext")).toBe(true);
  });

  it("recognises the shared-block content type used by Delt blokk", () => {
    expect(isContactBlock("providerContactInformationBlock")).toBe(true);
  });

  it("rejects other content types and undefined", () => {
    expect(isContactBlock("linkButtonBlock")).toBe(false);
    expect(isContactBlock(undefined)).toBe(false);
  });
});

describe("promoAreaIsEmpty", () => {
  it("treats null, missing items and empty items as empty", () => {
    expect(promoAreaIsEmpty(null)).toBe(true);
    expect(promoAreaIsEmpty(undefined)).toBe(true);
    expect(promoAreaIsEmpty({})).toBe(true);
    expect(promoAreaIsEmpty({ items: [] })).toBe(true);
    expect(promoAreaIsEmpty([])).toBe(true);
  });

  it("treats a populated block list as non-empty", () => {
    expect(promoAreaIsEmpty({ items: [contactBlock({})] })).toBe(false);
    expect(promoAreaIsEmpty([contactBlock({})])).toBe(false);
  });
});

describe("mapContactBlock", () => {
  it("maps contact properties onto a ProviderContactInformationBlock view-model", () => {
    const body = { items: [{ html: "<p>hi</p>", componentName: "RichText" }] };
    const vm = mapContactBlock({
      body,
      telephone: "22 86 03 12",
      telephoneLabel: "Tlf",
      email: "post@toll.no",
      emailTitle: "E-post",
      heading: "Trenger du hjelp?",
    });

    expect(vm).toMatchObject({
      componentName: "ProviderContactInformationBlock",
      body,
      telephone: "22 86 03 12",
      telephoneLabel: "Tlf",
      email: "post@toll.no",
      emailTitle: "E-post",
      pageName: "Trenger du hjelp?",
      providerIcon: undefined,
    });
  });

  it("uses the provider name and emblem as the heading fallback when the block has no heading", () => {
    const vm = mapContactBlock(
      { email: "post@patentstyret.no" },
      { name: "Patentstyret", imageUrl: "/img/pat.svg" },
    );

    expect(vm.pageName).toBe("Patentstyret");
    expect(vm.providerIcon).toEqual({
      name: "Patentstyret",
      imageUrl: "/img/pat.svg",
    });
  });

  it("prefers the block heading over the fallback name and then hides the emblem", () => {
    const vm = mapContactBlock(
      { heading: "Kontakt oss" },
      { name: "Patentstyret" },
    );
    expect(vm.pageName).toBe("Kontakt oss");
    expect(vm.providerIcon).toBeUndefined();
  });

  it("falls back to an empty heading and no emblem when there is no heading and no fallback", () => {
    const vm = mapContactBlock({ email: "x@y.no" });
    expect(vm.pageName).toBe("");
    expect(vm.providerIcon).toBeUndefined();
  });
});

describe("buildPromoAreaContentArea", () => {
  const transformOther = (content: any) => ({
    componentName: "OtherBlock",
    ...content.properties,
  });

  it("maps a contact block to a ProviderContactInformationBlock inside a ContentArea", () => {
    const result = buildPromoAreaContentArea(
      { items: [freetextBlock({ email: "post@toll.no" })] },
      transformOther,
    );

    expect(result).toEqual({
      componentName: "ContentArea",
      items: [
        expect.objectContaining({
          componentName: "ProviderContactInformationBlock",
          email: "post@toll.no",
        }),
      ],
    });
  });

  it("delegates non-contact blocks to the supplied transformer", () => {
    const spy = vi.fn(transformOther);
    const result = buildPromoAreaContentArea(
      { items: [otherBlock({ label: "Click" })] },
      spy,
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result?.items[0]).toEqual({
      componentName: "OtherBlock",
      label: "Click",
    });
  });

  it("returns undefined when there are no items", () => {
    expect(buildPromoAreaContentArea(null, transformOther)).toBeUndefined();
    expect(
      buildPromoAreaContentArea({ items: [] }, transformOther),
    ).toBeUndefined();
  });
});

describe("buildProviderContactInfo", () => {
  it("returns the first contact block as a single view-model with the provider fallback", () => {
    const result = buildProviderContactInfo(
      {
        items: [
          contactBlock({ email: "first@toll.no" }),
          contactBlock({ email: "second@toll.no" }),
        ],
      },
      { name: "Tolletaten", imageUrl: "/img/toll.svg" },
    );

    expect(result?.email).toBe("first@toll.no");
    expect(result?.pageName).toBe("Tolletaten");
    expect(result?.providerIcon).toEqual({
      name: "Tolletaten",
      imageUrl: "/img/toll.svg",
    });
  });

  it("returns undefined when there is no contact block", () => {
    expect(
      buildProviderContactInfo({ items: [otherBlock({})] }, { name: "X" }),
    ).toBeUndefined();
    expect(buildProviderContactInfo(null, { name: "X" })).toBeUndefined();
  });
});

describe("resolvePromoAreaWithNbFallback", () => {
  it("returns the localized promoArea untouched when it already has items", async () => {
    const fetchNb = vi.fn();
    const localized = { items: [contactBlock({})] };

    const result = await resolvePromoAreaWithNbFallback(
      "id-1",
      localized,
      "en",
      fetchNb,
    );

    expect(result).toBe(localized);
    expect(fetchNb).not.toHaveBeenCalled();
  });

  it("fetches the nb node and uses its promoArea when the localized value is empty", async () => {
    const nbPromoArea = { items: [contactBlock({ email: "post@toll.no" })] };
    const fetchNb = vi
      .fn()
      .mockResolvedValue({ properties: { promoArea: nbPromoArea } });

    const result = await resolvePromoAreaWithNbFallback(
      "id-1",
      null,
      "en",
      fetchNb,
    );

    expect(fetchNb).toHaveBeenCalledWith("id-1");
    expect(result).toBe(nbPromoArea);
  });

  it("does not fall back when the content locale is already nb", async () => {
    const fetchNb = vi.fn();
    const result = await resolvePromoAreaWithNbFallback(
      "id-1",
      null,
      "nb",
      fetchNb,
    );

    expect(result).toBeNull();
    expect(fetchNb).not.toHaveBeenCalled();
  });

  it("keeps the empty localized value when the nb node also has no promoArea", async () => {
    const fetchNb = vi.fn().mockResolvedValue({ properties: {} });
    const result = await resolvePromoAreaWithNbFallback(
      "id-1",
      null,
      "en",
      fetchNb,
    );

    expect(result).toBeNull();
  });
});

describe("expandSharedBlocks", () => {
  const resolved = (id: string, email: string) => ({
    contentType: "providerContactInformationBlock",
    id,
    properties: { email, heading: "Godkjenningsmyndighet" },
  });

  it("replaces a Delt blokk wrapper with the resolved shared block", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValue(resolved("block-1", "post@miljodir.no"));

    const result = await expandSharedBlocks(
      { items: [sharedBlockPicker({ id: "block-1" })] },
      resolve,
    );

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(result.items).toEqual([
      { content: resolved("block-1", "post@miljodir.no") },
    ]);
  });

  it("expands every reference held by one wrapper, in order", async () => {
    const resolve = vi
      .fn()
      .mockImplementation(async (ref: any) =>
        resolved(ref.id, `${ref.id}@x.no`),
      );

    const result = await expandSharedBlocks(
      { items: [sharedBlockPicker({ id: "a" }, { id: "b" })] },
      resolve,
    );

    expect(result.items.map((i: any) => i.content.id)).toEqual(["a", "b"]);
  });

  it("drops references that cannot be resolved instead of rendering an empty block", async () => {
    const resolve = vi.fn().mockResolvedValue(null);

    const result = await expandSharedBlocks(
      { items: [sharedBlockPicker({ id: "gone" })] },
      resolve,
    );

    expect(result.items).toEqual([]);
  });

  it("leaves inline blocks untouched and resolves nothing for them", async () => {
    const resolve = vi.fn();
    const inline = freetextBlock({ email: "post@toll.no" });

    const result = await expandSharedBlocks({ items: [inline] }, resolve);

    expect(resolve).not.toHaveBeenCalled();
    expect(result.items).toEqual([inline]);
  });

  it("returns an empty promoArea unchanged", async () => {
    const resolve = vi.fn();
    expect(await expandSharedBlocks(null, resolve)).toBeNull();
    expect(resolve).not.toHaveBeenCalled();
  });

  it("feeds buildPromoAreaContentArea a renderable contact block (issue #690)", async () => {
    const expanded = await expandSharedBlocks(
      { items: [sharedBlockPicker({ id: "block-1" })] },
      async () => resolved("block-1", "post@miljodir.no"),
    );

    const result = buildPromoAreaContentArea(expanded, () => undefined);

    expect(result).toEqual({
      componentName: "ContentArea",
      items: [
        expect.objectContaining({
          componentName: "ProviderContactInformationBlock",
          email: "post@miljodir.no",
          pageName: "Godkjenningsmyndighet",
        }),
      ],
    });
  });
});
