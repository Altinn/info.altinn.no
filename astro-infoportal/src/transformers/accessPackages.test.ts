import { t } from "@i18n/index";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({
  getResource: vi.fn(),
  getRoles: vi.fn(),
  getAccessPackages: vi.fn(),
}));

vi.mock("../api/altinn/client", () => client);

const packageUrn = "urn:altinn:accesspackage:regnskapsforer";
const roleUrn = "urn:altinn:rolecode:REGNA";

function subjects(...entries: Array<[type: string, urn: string]>) {
  return { data: entries.map(([type, urn]) => ({ type, urn })) };
}

let hideAltinnRoles: string | undefined;

// The transformer keeps the metadata translations in module state, so each
// test loads a fresh copy of it, along with a fresh env.
async function accessHtml(resource: ReturnType<typeof subjects>) {
  client.getResource.mockResolvedValue(resource);
  vi.resetModules();
  const { env } = await import("cloudflare:workers");
  env.HIDE_ALTINN_ROLES = hideAltinnRoles;
  const { getAccessPackagesHtml } = await import("./accessPackages");
  return getAccessPackagesHtml("some-resource", undefined, "nb");
}

beforeEach(() => {
  client.getAccessPackages.mockImplementation(async (_host, locale) => [
    {
      areas: [
        {
          packages: [{ urn: packageUrn, name: `Regnskapsfører (${locale})` }],
        },
      ],
    },
  ]);
  client.getRoles.mockImplementation(async (_host, locale) => [
    {
      urn: "urn:altinn:role:regnskapsforer",
      legacyUrn: roleUrn,
      name: `Regnskapsmedarbeider (${locale})`,
    },
  ]);
});

afterEach(() => {
  hideAltinnRoles = undefined;
  vi.clearAllMocks();
});

describe("getAccessPackagesHtml with HIDE_ALTINN_ROLES off", () => {
  it("lists both the access packages and the old Altinn roles", async () => {
    const html = await accessHtml(
      subjects(
        ["urn:altinn:accesspackage", packageUrn],
        ["urn:altinn:rolecode", roleUrn],
      ),
    );

    expect(html).toContain("<li>Regnskapsfører (nb)");
    expect(html).toContain(t("schema.withAccessPackages.betweenLists", "nb"));
    expect(html).toContain("<li>Regnskapsmedarbeider (nb)");
  });

  it("lists only the access packages when there are no roles", async () => {
    const html = await accessHtml(
      subjects(["urn:altinn:accesspackage", packageUrn]),
    );

    expect(html).toBe(
      t("schema.withAccessPackages.aboveLists", "nb") +
        "<ul><li>Regnskapsfører (nb)</ul>" +
        t("schema.withAccessPackages.belowList", "nb"),
    );
  });

  it("lists the old Altinn roles when there are no access packages", async () => {
    const html = await accessHtml(subjects(["urn:altinn:rolecode", roleUrn]));

    expect(html).toContain(t("schema.withRolesOnly.aboveList", "nb"));
    expect(html).toContain("<li>Regnskapsmedarbeider (nb)");
  });
});

describe("getAccessPackagesHtml with HIDE_ALTINN_ROLES on", () => {
  beforeEach(() => {
    hideAltinnRoles = "true";
  });

  it("lists the access packages but not the old Altinn roles", async () => {
    const html = await accessHtml(
      subjects(
        ["urn:altinn:accesspackage", packageUrn],
        ["urn:altinn:rolecode", roleUrn],
      ),
    );

    expect(html).toBe(
      t("schema.withAccessPackages.aboveLists", "nb") +
        "<ul><li>Regnskapsfører (nb)</ul>" +
        t("schema.withAccessPackages.belowList", "nb"),
    );
  });

  it("shows the fixed text when the resource has only roles", async () => {
    const html = await accessHtml(subjects(["urn:altinn:rolecode", roleUrn]));

    expect(html).toBe(t("schema.withoutAccessPackages", "nb"));
  });

  it("does not fetch the roles metadata", async () => {
    await accessHtml(subjects(["urn:altinn:accesspackage", packageUrn]));

    expect(client.getRoles).not.toHaveBeenCalled();
  });

  it("says nothing about a transition period", async () => {
    for (const locale of ["nb", "nn", "en"] as const) {
      expect(t("schema.withAccessPackages.belowList", locale)).not.toMatch(
        /overgangsperiode|transition/i,
      );
      expect(t("schema.withoutAccessPackages", locale)).not.toMatch(
        /overgangsperiode|transition/i,
      );
    }
  });
});
