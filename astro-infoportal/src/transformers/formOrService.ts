import { env } from "cloudflare:workers";
import { isTranslationKey, type TranslationKey } from "@i18n/index";

export type FormOrService = "form" | "service";

// Editors turns on "Vis som tjeneste i stedet for skjema" in the schema page's `showAsService` toggle,
// which decides the start button label and the wording of the fixed
// accordion headings (issue #793). Default is "Skjema". Behind the
// USE_FORM_OR_SERVICE flag until the pre-announced switch date; while off this
// returns null and every schema keeps its legacy texts.
// TODO: We can remove this function when the feature flag is not in use
export function resolveFormOrService(
  raw: boolean | undefined,
): FormOrService | null {
  if (env.USE_FORM_OR_SERVICE !== "true") return null;
  if (raw === undefined || raw === null) return 'form';
  return raw ? "service" : "form";
}

// Legacy label is "Start tjeneste", so only an explicit "Skjema" changes it.
export function startSchemaTextKey(kind: FormOrService | null): TranslationKey {
  return kind === "form" ? "schema.startForm" : "schema.startService";
}

// The fixed accordion headings say "skjemaet"; a `<key>.service` variant
// exists for those that need rewording, e.g. "Hvem skal bruke skjemaet?" →
// "Hvem skal bruke tjenesten?". Headings without a variant pass through.
export function accordionHeadingKey<K extends string>(
  key: K,
  kind: FormOrService | null,
): K | TranslationKey {
  if (kind !== "service") return key;
  const serviceKey = `${key}.service`;
  return isTranslationKey(serviceKey) ? serviceKey : key;
}
