import { env } from "cloudflare:workers";
import { getResource, getRoles, getAccessPackages } from "../api/altinn/client";
import { type Locale, t } from "@i18n/index";

// Altinn roles stop being used at the turn of 2026/2027. Switch the flag on per
// environment, then purge the Cloudflare cache: schema pages are cached with the list in them.
// TODO: Remove the role listing and this flag once it is on in every environment.
function hideAltinnRoles(): boolean {
    return env.HIDE_ALTINN_ROLES === "true";
}

// Translations are reused between threads, only loaded from Altinn after deploy
const rolesTranslations = new Map<string, string>();
const accessPackagesTranslations = new Map<string, string>();
// Only the old Altinn 2 roles are listed. Enhetsregisteret roles are covered by
// the text above the lists, which says a role there is enough.
const altinn2Roles = new Set<string>();

async function loadTranslations(hostname:string | undefined, locale:Locale, includeRoles:boolean) {
    const [accessPackagesMetadata, rolesMetadata] = await Promise.all([
        getAccessPackages(hostname, locale.toString()),
        includeRoles ? getRoles(hostname, locale.toString()) : []
    ]);

    for (const entry of accessPackagesMetadata) {
        for (const area of entry.areas) {
            for (const pkg of area.packages) {
                accessPackagesTranslations.set(cacheKey(locale, pkg.urn), pkg.name);
            }
        }
    }

    for (const entry of rolesMetadata) {
        if (entry.provider?.code !== "sys-altinn2") {
            continue;
        }
        const urn = entry.legacyUrn || entry.urn;
        altinn2Roles.add(urn);
        rolesTranslations.set(cacheKey(locale, urn), entry.name);
    }
}

export async function getAccessPackagesHtml(resourceId:string, hostname:string | undefined, locale:Locale):Promise<string> {
    const hideRoles = hideAltinnRoles();

    if (accessPackagesTranslations.size == 0) {
        await Promise.all([
          loadTranslations(hostname, "nb", !hideRoles),
          loadTranslations(hostname, "nn", !hideRoles),
          loadTranslations(hostname, "en", !hideRoles)
        ]);
    }

    const resourceJson = await getResource(resourceId, hostname);
    const accessPackages:string[] = [];
    const roles:string[] = [];
    
    for (const entry of resourceJson.data) {
        if (entry.type == "urn:altinn:rolecode") {
          roles.push(entry.urn);
        } else if (entry.type == "urn:altinn:accesspackage") {
          accessPackages.push(entry.urn);
        }
    }

    const listedRoles = hideRoles ? [] : roles.filter((role) => altinn2Roles.has(role));

    if (accessPackages.length > 0) {
        if (listedRoles.length === 0) {
            return getHtmlForAccessPackagesOnly(accessPackages, locale);
        }
        return getHtmlForAccessPackagesAndRoles(accessPackages, listedRoles, locale);
    } else if (roles.length > 0) {
        if (listedRoles.length === 0) {
            return t("schema.withoutAccessPackages", locale);
        }
        return getHtmlForRolesOnly(listedRoles, locale);
    }

    console.error(`No access packages or roles found for resourceId ${resourceId}`);
    return "";
}

function getHtmlForAccessPackagesAndRoles(accessPackages:string[], roles:string[], locale:Locale) {
  let html = t("schema.withAccessPackages.aboveLists", locale);

  html += "<ul>";

  for (const accessPackage of accessPackages) {
    html += "<li>" + accessPackagesTranslations.get(cacheKey(locale, accessPackage));
  }

  html += "</ul>";

  html += t("schema.withAccessPackages.betweenLists", locale);

  html += "<ul>";

  for (const role of roles) {
    html += "<li>" + rolesTranslations.get(cacheKey(locale, role));
  }

  html += "</ul>";

  return html;  
}

function getHtmlForAccessPackagesOnly(accessPackages:string[], locale:Locale) {
  let html = t("schema.withAccessPackages.aboveLists", locale);

  html += "<ul>";

  for (const accessPackage of accessPackages) {
    html += "<li>" + accessPackagesTranslations.get(cacheKey(locale, accessPackage));
  }

  html += "</ul>";

  html += t("schema.withAccessPackages.belowList", locale);

  return html;
}

function getHtmlForRolesOnly(roles:string[], locale:Locale) {
  let html = t("schema.withRolesOnly.aboveList", locale);

  html += "<ul>";

  for (const role of roles) {
    html += "<li>" + rolesTranslations.get(cacheKey(locale, role));
  }

  html += "</ul>";

  return html;  
}

function cacheKey(locale:Locale, urn:string) {
    return locale + ":" + urn;
}






