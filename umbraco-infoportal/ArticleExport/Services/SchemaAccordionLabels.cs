namespace umbraco_infoportal.ArticleExport.Services;

// Mirror of the frontend schema i18n keys (astro-infoportal/src/i18n/locales/*.json).
// A schemaAccordianBlock's `translatedHeading` holds one of these keys; the backend
// has no Umbraco dictionary, so we resolve them here to keep the export in step with
// the live site. Keyed by 2-letter ISO prefix (nb/nn/en).
internal static class SchemaAccordionLabels
{
    private static readonly Dictionary<string, string> AboutThisSchema = new(StringComparer.OrdinalIgnoreCase)
    {
        ["nb"] = "Om denne tjenesten",
        ["nn"] = "Om denne tenesta",
        ["en"] = "About this form",
    };

    private static readonly Dictionary<string, Dictionary<string, string>> Headings = new(StringComparer.OrdinalIgnoreCase)
    {
        ["schema.accordions.whenToUse"] = new() { ["nb"] = "Når skal jeg bruke denne tjenesten?", ["nn"] = "Når skal eg bruke denne tenesta?", ["en"] = "When should I use this service?" },
        ["schema.accordions.summary"] = new() { ["nb"] = "Kort om tjenesten", ["nn"] = "Kort om tenesta", ["en"] = "About the service" },
        ["schema.accordions.requirements"] = new() { ["nb"] = "Krav til innsender", ["nn"] = "Krav til innsendar", ["en"] = "Requirements" },
        ["schema.accordions.submission"] = new() { ["nb"] = "Innlevering", ["nn"] = "Innlevering", ["en"] = "Submission" },
        ["schema.accordions.whoShouldSend"] = new() { ["nb"] = "Hvem skal levere?", ["nn"] = "Kven skal levere?", ["en"] = "Who should complete this?" },
        ["schema.accordions.submissionBySystem"] = new() { ["nb"] = "Innsending fra datasystem", ["nn"] = "Innsending frå datasystem", ["en"] = "Reporting through a computer system" },
        ["schema.accordions.rules"] = new() { ["nb"] = "Lovhjemmel", ["nn"] = "Lovheimel", ["en"] = "Legal basis" },
        ["schema.accordions.category"] = new() { ["nb"] = "Kategori", ["nn"] = "Kategori", ["en"] = "Category" },
        ["schema.accordions.agency"] = new() { ["nb"] = "Etater", ["nn"] = "Etatar", ["en"] = "Agency" },
        ["schema.accordions.whatAttachments"] = new() { ["nb"] = "Hvilke vedleggsskjema finnes for dette skjemaet?", ["nn"] = "Kva vedleggsskjema finst for dette skjemaet?", ["en"] = "What attachment forms exist for this form?" },
        ["schema.accordions.whoNeedsToSend"] = new() { ["nb"] = "Hvem må sende", ["nn"] = "Kven må sende", ["en"] = "Who has to complete" },
        ["schema.accordions.whoDoesntNeedToSend"] = new() { ["nb"] = "Hvem må ikke sende", ["nn"] = "Kven må ikkje sende", ["en"] = "Who is exempt" },
        ["schema.accordions.ifYouDontSend"] = new() { ["nb"] = "Hvis du ikke leverer", ["nn"] = "Om du ikkje leverer", ["en"] = "What if I don't complete" },
        ["schema.importAccordions.a"] = new() { ["nb"] = "Hva skal jeg legge ved?", ["nn"] = "Kva skal eg leggje ved?", ["en"] = "What should I attach?" },
        ["schema.importAccordions.b"] = new() { ["nb"] = "Når skal skjemaet brukes?", ["nn"] = "Når skal skjemaet brukast?", ["en"] = "When should I use this form?" },
        ["schema.importAccordions.c"] = new() { ["nb"] = "Hvem skal bruke skjemaet?", ["nn"] = "Kven skal bruke skjemaet?", ["en"] = "Who should use this form?" },
        ["schema.importAccordions.d"] = new() { ["nb"] = "Hvorfor skal skjemaet brukes?", ["nn"] = "Kvifor skal skjemaet brukast?", ["en"] = "Why should I use this form?" },
        ["schema.importAccordions.e"] = new() { ["nb"] = "Mer om skjemaet", ["nn"] = "Meir om skjemaet", ["en"] = "More about the form" },
        ["schema.importAccordions.f"] = new() { ["nb"] = "Gamle versjoner av skjemaet", ["nn"] = "Gamle versjonar av skjemaet", ["en"] = "Old versions of the form" },
    };

    public static string AboutHeading(string? isoCode) =>
        Lookup(AboutThisSchema, isoCode) ?? AboutThisSchema["nb"];

    // Returns null when the key is empty or unknown so the caller can fall back to the
    // editor-typed `heading` field.
    public static string? TranslateHeading(string? key, string? isoCode)
    {
        if (string.IsNullOrWhiteSpace(key) || !Headings.TryGetValue(key, out Dictionary<string, string>? byLang))
        {
            return null;
        }

        return Lookup(byLang, isoCode) ?? Lookup(byLang, "nb");
    }

    private static string? Lookup(Dictionary<string, string> map, string? isoCode)
    {
        string prefix = string.IsNullOrEmpty(isoCode)
            ? string.Empty
            : isoCode[..Math.Min(2, isoCode.Length)];
        return map.TryGetValue(prefix, out string? value) ? value : null;
    }
}
