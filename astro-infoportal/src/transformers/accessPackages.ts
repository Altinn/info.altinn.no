import { getResource, getRoles, getAccessPackages } from "../api/altinn/client";
import { type Locale, t } from "@i18n/index";

// Translations are reused between threads, only loaded from Altinn after deploy
const rolesTranslations = new Map<string, string>();
const accessPackagesTranslations = new Map<string, string>();

async function loadTranslations(hostname:string | undefined, locale:Locale) {
    const [accessPackagesMetadata, rolesMetadata] = await Promise.all([
        getAccessPackages(hostname, locale.toString()),
        getRoles(hostname, locale.toString())
    ]);

    for (const entry of accessPackagesMetadata) {
        for (const area of entry.areas) {
            for (const pkg of area.packages) {
                accessPackagesTranslations.set(cacheKey(locale, pkg.urn), pkg.name);
            }
        }
    }

    for (const entry of rolesMetadata) {
        rolesTranslations.set(locale + ":" + (entry.legacyUrn || entry.urn), entry.name);
    }
}

export async function getAccessPackagesHtml(resourceId:string, hostname:string | undefined, locale:Locale):Promise<string> {
    if (accessPackagesTranslations.size == 0) {
        await Promise.all([
          loadTranslations(hostname, "nb"),
          loadTranslations(hostname, "nn"),
          loadTranslations(hostname, "en")
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

    if (accessPackages.length > 0) {
        return getHtmlForAccessPackagesAndRoles(accessPackages, roles, locale);
    } else if (roles.length > 0) {
        return getHtmlForRolesOnly(roles, locale);
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






