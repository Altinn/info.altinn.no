namespace umbraco_infoportal.Search.BestBets;

// TEMPORARY: hardcoded until an admin UI in the Umbraco backoffice replaces this.
// Ported from Optimizely Search & Navigation "Best Bets" (All Websites / All languages).
//
// Each bet is identified by its page title. During indexing, the extractor
// looks up the page title here and, if a bet matches, writes the bet's
// trigger phrases onto the indexed document's BestBetTriggers field.
// At search time, Elasticsearch matches user queries against those triggers
// (with a high boost), so dialect/synonym/editorial variants that don't
// appear in page text still surface the page.
//
// Titles are reproduced verbatim from the Optimizely export. Preserve casing,
// diacritics (ø å æ), special chars (§, – en-dash).
//
// Trigger phrases are enumerated intentionally: Norwegian bokmål + nynorsk +
// inflected forms appear as separate entries. Matching must NOT stem —
// the Elasticsearch analyzer for this field uses whitespace + lowercase only.
public static class BestBetData
{
    private static readonly string[] SkattemeldingTriggers =
    [
        "skattemelding",
        "skattemeldingen",
        "skattemeldinga",
        "selvangivelse",
        "selvangivelsen",
        "sjølmelding",
        "sjølmeldinga",
    ];

    public static readonly IReadOnlyList<BestBet> All =
    [
        new BestBet(
            "Søknad om autorisasjon og lisens som helsepersonell",
            [
                "autorisasjon som helsefagarbeider",
                "søknad om autorisasjon",
                "søknad autorisasjon",
                "autorisasjon lege",
                "godkjenning",
                "lisens",
                "lege",
                "sykepleier",
                "helse",
                "autorisasjon",
            ]),
        new BestBet(
            "Skattemelding for formue- og inntektsskatt - lønnstakere og pensjonister mv.",
            SkattemeldingTriggers),
        new BestBet(
            "Skattemelding for formue- og inntektsskatt – personlig næringsdrivende mv",
            SkattemeldingTriggers),
        new BestBet(
            "Skattemelding for formues- og inntektsskatt - aksjeselskap mv.",
            SkattemeldingTriggers),
        new BestBet(
            "Skattemelding for forhåndsfastsetting av skatt på formue og inntekt",
            SkattemeldingTriggers),
        new BestBet(
            "Skattemelding for forhåndsfastsetting av skatt på inntekt utenlandsk arbeidstaker/Tax return for advance assessment of foreign employee",
            SkattemeldingTriggers),
        new BestBet(
            "Skattemelding for person som ikke har mottatt forhåndsutfylt skattemelding for formues- og inntektsskatt",
            SkattemeldingTriggers),
        new BestBet(
            "Skattemelding for selskap som omfattes av petroleumsskatteloven § 1",
            SkattemeldingTriggers),
        new BestBet(
            "Søknad om utsatt frist for levering av skattemelding for formues- og inntektsskatt - lønnstakere og pensjonister m.v.",
            SkattemeldingTriggers),
        new BestBet(
            "Søknad om utsatt frist for levering av klienters skattemelding for formues- og inntektsskatt",
            SkattemeldingTriggers),
        new BestBet(
            "Søknad om utsatt frist for levering av skattemelding for formues- og inntektsskatt - næringsdrivende",
            SkattemeldingTriggers),
    ];

    private static readonly Dictionary<string, BestBet> ByTitle =
        All.ToDictionary(b => b.Title, StringComparer.Ordinal);

    public static BestBet? FindByTitle(string? title) =>
        title != null && ByTitle.TryGetValue(title, out var bet) ? bet : null;
}
