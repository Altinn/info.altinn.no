import { env } from "cloudflare:workers";
import { getResource, getRoles, getAccessPackages } from "../api/altinn/client";
import { type Locale, t } from "@i18n/index";

// Altinn roles stop being used at the turn of 2026/2027. Switch the flag on per
// environment, then purge the Cloudflare cache: schema pages are cached with the list in them.
// TODO: Remove the Altinn 2 role listing and this flag once it is on in every environment.
function hideAltinnRoles(): boolean {
    return env.HIDE_ALTINN_ROLES === "true";
}

// Translations are reused between threads, only loaded from Altinn after deploy
const rolesTranslations = new Map<string, string>();
const accessPackagesTranslations = new Map<string, string>();
// Only Enhetsregisteret roles and the old Altinn 2 roles are listed; the
// resource registry also references Altinn 3 roles and codes Altinn doesn't know.
const enhetsregisteretRoles = new Set<string>();
const altinn2Roles = new Set<string>();

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
        const urn = entry.legacyUrn || entry.urn;
        if (entry.provider?.code === "sys-ccr") {
            enhetsregisteretRoles.add(urn);
        } else if (entry.provider?.code === "sys-altinn2") {
            altinn2Roles.add(urn);
        } else {
            continue;
        }
        rolesTranslations.set(cacheKey(locale, urn), entry.name);
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

    const erRoles = roles.filter((role) => enhetsregisteretRoles.has(role));
    const oldAltinnRoles = hideAltinnRoles() ? [] : roles.filter((role) => altinn2Roles.has(role));
    const erRolesHtml = erRoles.length > 0
        ? t("schema.withErRoles.aboveList", locale) + listHtml(erRoles, rolesTranslations, locale)
        : null;

    if (accessPackages.length > 0) {
        let html = erRolesHtml
            ? erRolesHtml + t("schema.withErRoles.accessPackages", locale)
            : t("schema.withAccessPackages.aboveLists", locale);
        html += listHtml(accessPackages, accessPackagesTranslations, locale);
        if (oldAltinnRoles.length > 0) {
            html += t("schema.withAccessPackages.betweenLists", locale) + listHtml(oldAltinnRoles, rolesTranslations, locale);
        } else {
            html += t("schema.withAccessPackages.belowList", locale);
        }
        return html;
    }

    if (roles.length > 0) {
        if (erRolesHtml) {
            let html = erRolesHtml + t("schema.withErRoles.singleService", locale);
            if (oldAltinnRoles.length > 0) {
                html += t("schema.withErRoles.altinn2Roles", locale) + listHtml(oldAltinnRoles, rolesTranslations, locale);
            }
            return html;
        }
        if (oldAltinnRoles.length > 0) {
            return t("schema.withRolesOnly.aboveList", locale) + listHtml(oldAltinnRoles, rolesTranslations, locale);
        }
        return t("schema.withoutAccessPackages", locale);
    }

    console.error(`No access packages or roles found for resourceId ${resourceId}`);
    return "";
}

function listHtml(urns:string[], translations:Map<string, string>, locale:Locale) {
    let html = "<ul>";
    for (const urn of urns) {
        html += "<li>" + translations.get(cacheKey(locale, urn));
    }
    return html + "</ul>";
}

function cacheKey(locale:Locale, urn:string) {
    return locale + ":" + urn;
}
