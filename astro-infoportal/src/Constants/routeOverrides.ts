const ROUTE_OVERRIDES: Record<string, string> = {
  "/starte-og-drive/dokumentmaler/": "/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/starte-og-drive/sideblokker/dokumentmaler/": "/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/nn/starte-og-drive/dokumentmaler/": "/nn/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/nn/starte-og-drive/sideblokker/dokumentmaler/": "/nn/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/en/start-and-run-business/document-templates/": "/en/start-and-run-business/document-templates/download-document-templates/",
  "/en/start-and-run-business/page-blocks/document-templates/": "/en/start-and-run-business/document-templates/download-document-templates/",
  "/hjelp/fa-fullmakt-til-a-gjore-noe/be-om-fullmakt/hva-er-be-om-fullmakt/": "/hjelp/ny-tilgangsstyring/be-om-fullmakt/hva-er-be-om-fullmakt",
  "/hjelp/fa-fullmakt-til-a-gjore-noe/noen-har-bedt-meg-om-fullmakt/hvordan-behandle-en-foresporsel/": "/hjelp/ny-tilgangsstyring/be-om-fullmakt/behandle-foresporsel",
  "/hjelp/finne-melding-og-skjema/finne-og-forsta-meldinger/jeg-finner-ikke-meldingene-mine/": "/hjelp/ny-innboks-beta/finne-og-forsta-meldinger/hvor-finner-jeg-meldingene-mine",
  "/hjelp/administrere-fullmakter/for-meg-selv-eller-min-virksomhet/slette-fullmakt-til-en-enkelttjeneste/": "/hjelp/ny-tilgangsstyring/enkelttjenester/slette-en-enkelttjeneste",
  "/hjelp/administrere-fullmakter/for-meg-selv-eller-min-virksomhet/slette-fullmakt/": "/hjelp/ny-tilgangsstyring/tilgangspakker/slette-tilgangspakke-fra-bruker",
  "/hjelp/administrere-fullmakter/for-klienter/oversikt-over-fullmakter-for-dine-klienter/": "/hjelp/ny-tilgangsstyring/klientadministrasjon/se-dine-klienter",
  "/hjelp/administrere-fullmakter/for-meg-selv-eller-min-virksomhet/gi-fullmakt-til-en-enkelttjeneste/": "/hjelp/ny-tilgangsstyring/enkelttjenester/gi-fullmakt-til-en-enkelttjeneste",
  "/hjelp/administrere-fullmakter/for-klienter/hvem-kan-administrere-fullmakter/": "/hjelp/ny-tilgangsstyring/tilgangspakker/roller-fra-enhetsregisteret-for-a-administrere-tilganger",
  "/hjelp/administrere-fullmakter/for-meg-selv-eller-min-virksomhet/hvem-kan-administrere-fullmakter/": "/hjelp/ny-tilgangsstyring/tilgangspakker/roller-fra-enhetsregisteret-for-a-administrere-tilganger",
  "/hjelp/administrere-fullmakter/for-meg-selv-eller-min-virksomhet/hva-betyr-det-a-gi-fullmakt-til-en-tilgangspakke/": "/hjelp/ny-tilgangsstyring/tilgangspakker/hva-betyr-det-a-gi-fullmakt-til-en-tilgangspakke",
  "/hjelp/administrere-fullmakter/for-meg-selv-eller-min-virksomhet/gi-fullmakt-til-en-tilgangspakke/": "/hjelp/ny-tilgangsstyring/tilgangspakker/via-menypunktet-fullmakter",
  "/hjelp/administrere-fullmakter/for-klienter/gi-og-slette-fullmakt-samlet/": "/hjelp/ny-tilgangsstyring/klientadministrasjon/gi-og-slette-tilgang-samlet",
  "/hjelp/administrere-fullmakter/for-klienter/slette-fullmakt/": "/hjelp/ny-tilgangsstyring/klientadministrasjon/slette-tilgang",
  "/hjelp/administrere-fullmakter/for-klienter/gi-fullmakt-til-en-klient-i-klientadministrasjon/": "/hjelp/ny-tilgangsstyring/klientadministrasjon/gi-tilgang",
  "/hjelp/finne-melding-og-skjema/filtrering-i-innboks/slik-filtrerer-du-meldinger-og-skjemaer-i-innboksen/": "/hjelp/ny-innboks-beta/steg-for-steg-guider/slik-filtrerer-du-i-innboksen",
  "/hjelp/finne-melding-og-skjema/finne-melding-jeg-har-fatt-varsel-pa/fatt-varsel-men-finner-ikke-brevetmeldingen/": "/hjelp/ny-innboks-beta/innboks/fatt-varsel-men-finner-ikke-brevetmeldingen",
  "/hjelp/finne-melding-og-skjema/finne-melding-jeg-har-fatt-varsel-pa/fatt-varsel-pa-et-skjema-men-finner-det-ikke-i-innboksen/": "/hjelp/ny-innboks-beta/innboks/fatt-varsel-om-et-skjema-men-finner-det-ikke-i-innboksen",
  "/hjelp/finne-melding-og-skjema/soke-etter-meldinger/soke-etter-brev-eller-skjema-i-innboksen/": "/hjelp/ny-innboks-beta/innboks/soke-etter-brev-eller-skjema-i-innboksen",
  "/hjelp/finne-melding-og-skjema/soke-etter-meldinger/soke-etter-meldinger-for-flere-aktorer-samtidig/": "/hjelp/ny-innboks-beta/innboks/soke-etter-meldinger-for-flere-aktorer-samtidig",
  "/hjelp/registrere-kontaktinformasjon-og-innstillinger/sette-opp-forhandsvalgt-aktor/hvordan-sette-opp-forhandsvalgt-aktor-i-din-profil/": "/hjelp/oversikt-over-varslingsinnstillinger/profilinnstillinger-og-kontaktinformasjon/forhandsvalgt-aktor-i-din-profil",
  "/hjelp/registrere-kontaktinformasjon-og-innstillinger/hvordan-registrere-eller-endre-kontaktinformasjon/hvordan-registrere-eller-endre-kontakinformasjon/": "/hjelp/oversikt-over-varslingsinnstillinger/profilinnstillinger-og-kontaktinformasjon/hvor-finner-jeg-profilinnstillingene-mine",
  "/hjelp/innlogging/velg-hvilken-virksomhet-altinn-skal-starte-med/forhandsvalgt-aktor-i-din-profil/": "/hjelp/oversikt-over-varslingsinnstillinger/profilinnstillinger-og-kontaktinformasjon/forhandsvalgt-aktor-i-din-profil",
  "/hjelp/administrere-fullmakter/for-klienter/hvordan-administrere-klienter-under-systemtilgang/": "/hjelp/ny-tilgangsstyring/steg-for-steg-guider/hvordan-administere-klienter-under-systemtilgang",
  "/hjelp/fa-fullmakt-til-a-gjore-noe/fa-fullmakt-til-a-representere-en-virksomhet/hvordan-be-om-fullmakt-pa-vegne-av-en-virksomhet/": "/hjelp/ny-tilgangsstyring/be-om-fullmakt/hvordan-be-om-fullmakt",
  "/hjelp/fa-fullmakt-til-a-gjore-noe/be-om-fullmakt/hvordan-be-om-fullmakt/": "/hjelp/ny-tilgangsstyring/be-om-fullmakt/hvordan-be-om-fullmakt",
  "/_vti_pvt/service.cnf/": "/tekniske-sider-vises-ikke-i-meny/service.cnf---redirect",
  "/_vti_bin/shtml.dll/": "/tekniske-sider-vises-ikke-i-meny/shtml.dll---redirect",
  "/_vti_bin/_vti_aut/author.dll/": "/tekniske-sider-vises-ikke-i-meny/author.dll---redirect",
  "/_vti_bin/_vti_adm/admin.dll/": "/tekniske-sider-vises-ikke-i-meny/admin.dll---redirect",
  "/altinnroller/": "/hjelp/profil/alle-altinn-roller",
  "/congratulations/": "/en/congratulations-on-your-new-business-venture",
  "/driftsmeldinger/": "/om-altinn/driftsmeldinger",
  "/eguide-renhold/": "/e-guide-renholdsbransjen",
  "/en/forms-overview/the-tax-administration-shared-services-agency/a-melding---order-reconciliation-information/": "/en/forms-overview/the-a-ordning/a-melding---order-reconciliation-information",
  "/en/forms-overview/the-tax-administration-shared-services-agency/declaration-of-paid-work-at-home-where-a-private-individual-is-the-employer/": "/en/forms-overview/the-a-ordning/declaration-of-paid-work-at-home-where-a-private-individual-is-the-employer",
  "/gratulerer/": "/gratulerer-med-etableringen",
  "/gratulerer-med-etableringa/": "/nn/gratulerer-med-etableringa",
  "/en/forms-overview/the-tax-administration-shared-services-agency/simplified-a-melding-for-charitable-or-non-profit-organisations/": "/en/forms-overview/the-a-ordning/simplified-a-melding-for-charitable-or-non-profit-organisations",
  "/enk/": "/starte-og-drive/starte/valg-av-organisasjonsform/enkeltpersonforetak",
  "/en/skjema-og-tjenester/": "/en/forms-overview",
  "/help/logging-in/self-identified/": "/en/help/logging-in/altinn-alternative-log-in-methods/log-in-without-national-identity-numberd-number",
  "/hjelp/innlogging/alternativ/": "/hjelp/innlogging/logg-inn-uten-f-d-nr",
  "/nn/hjelp/innlogging/alternativ/": "/nn/hjelp/innlogging/alternativ-innlogging-i-altinn",
  "/hjelp/innlogging/egenregistrert/": "/hjelp/innlogging/logg-inn-uten-f-d-nr/logg-inn-uten-fodselsnummerd-nummer",
  "/hjelp/innlogging/eigenregistrert/": "/nn/hjelp/innlogging/alternativ-innlogging-i-altinn/logg-inn-uten-fodselsnummerd-nummer",
  "/hjelp/innlogging/logg-inn/": "/hjelp/innlogging",
  "/nn/hjelp/innlogging/logg-inn/": "/nn/hjelp/innlogging",
  "/hjelp/innlogging/verksemdssertifikat/": "/nn/hjelp/innlogging/utgaande-innloggingsmetodar/Verksemdssertifikat",
  "/hjelp/innlogging/virksomhetssertifikat/": "/hjelp/innlogging/utgaende-innloggingsmetoder/virksomhetssertifikat",
  "/help/logging-in/log-in/": "/en/help/logging-in",
  "/help/logging-in/alternative/": "/en/help/logging-in/altinn-alternative-log-in-methods",
  "/nn/skjemaoversikt/etatenes-fellesforvaltning/forenkla-a-melding-for-velgjerande-eller-allmennyttig-organisasjon/": "/nn/skjemaoversikt/a-ordningen/Forenkla-a-melding-for-velgjerande-eller-allmennyttig-organisasjon",
  "/nn/skjemaoversikt/etatenes-fellesforvaltning/melding-om-lonna-arbeid-i-heimen/": "/nn/skjemaoversikt/a-ordningen/melding-om-lonna-arbeid-i-heimen",
  "/help/logging-in/enterprise-certificate/": "/en/help/logging-in/terminated-login-methods/enterprise-certificate",
  "/no/help/profile/estate-delegation/": "/hjelp/profil/estate-delegation",
  "/no/skjema-og-tjenester/": "/skjemaoversikt",
  "/om/": "/om-altinn",
  "/nn/help/profile/estate-delegation/": "/nn/hjelp/profil/delegering-av-boroller",
  "/innholdsstrategi/": "/om-altinn/innholdsstrategi-altinn-informasjonsportal",
  "/skjemaoversikt/a-ordningen/": "/skjemaoversikt/a-ordningen/a-melding",
  "/skjemaoversikt/a-ordningen/forenklet/": "/skjemaoversikt/a-ordningen/forenklet-a-melding-for-veldedig-eller-allmennyttig-organisasjon",
  "/skjemaoversikt/a-ordningen/inn/": "/skjemaoversikt/a-ordningen/a-melding---innsending-fra-system",
  "/skjemaoversikt/a-ordningen/melding/": "/skjemaoversikt/a-ordningen/melding-om-lonnet-arbeid-i-hjemmet",
  "/skjemaoversikt/etatenes-fellesforvaltning/a-melding---bestill-avstemmingsinformasjon/": "/nn/skjemaoversikt/a-ordningen/a-melding-bestill-avstemmingsinformasjon",
  "/skjemaoversikt/etatenes-fellesforvaltning/a-melding-bestill-avstemmingsinformasjon/": "/skjemaoversikt/a-ordningen/a-melding-bestill-avstemmingsinformasjon",
  "/oppstartsrettleiar/": "/nn/starte-og-drive/starte-bedrift/for-oppstart/oppstartsrettleiar-for-enkeltpersonforetak",
  "/oppstartsveileder/": "/starte-og-drive/starte/for-oppstart/oppstartsveileder-for-enkeltpersonforetak",
  "/startup-tuorial/": "/en/start-and-run-business/planning-starting/before-start-up/startup-tutorial-for-sole-proprietorships",
  "/om-nye-altinn/": "/nyheter/om-nye-altinn",
  "/starteogdrive/": "/starte-og-drive",
  "/tilgjengelighet/": "/om-altinn/tilgjengelighet",
  "/startandrun/": "/en/start-and-run-business"
};

const REDIRECTS: Record<string, string> = {
  "/starte-og-drive/dokumentmaler/": "/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/starte-og-drive/sideblokker/dokumentmaler/": "/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/nn/starte-og-drive/dokumentmaler/": "/nn/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/nn/starte-og-drive/sideblokker/dokumentmaler/": "/nn/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/en/start-and-run-business/document-templates/": "/en/start-and-run-business/document-templates/download-document-templates/",
  "/en/start-and-run-business/page-blocks/document-templates/": "/en/start-and-run-business/document-templates/download-document-templates/",
  "/en/start-and-run-business/guides-2/": "/en/start-and-run-business/planning-starting/guides",
  "/starte-og-drive/guider-2/": "/starte-og-drive/starte/guider",
  "/nn/starte-og-drive/guider-2/": "/nn/starte-og-drive/starte-bedrift/guider",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-prevention-personnel/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/forebyggende-personell/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/leder-for-beredskapsavdeling/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/deputy-chief-fire-officer-operations/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/deputy-chief-fire-officer-prevention/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/leder-av-forebyggendearbeidet/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/control-room-operator/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/operator-pa-nodmeldesentral/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/incident-commander/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/overordnet-vakt/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/crew-commanderleading-firefighter/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/utrykningsleder/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/firefighter/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brannkonstabel/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/Leder-av-brann-og-redningsvesenet/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/chief-fire-officer/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brannforebygger-feiersvenn/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/brann-og-redning-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/technical-blasting-adviser/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/explosives-and-pyrotechnics-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/teknisk-sprengningskyndig/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/sprengnings--og-pyrotekniske-yrker-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/journeyman-in-sweeping-chimneys/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/fire-and-rescue-professions",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/certified-pyrotechnician/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/explosives-and-pyrotechnics-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/profesjonell-pyrotekniker/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/sprengnings--og-pyrotekniske-yrker-yrkeskvalifikasjoner",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/scenepyrotekniker/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/sprengnings--og-pyrotekniske-yrker-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/certified-stage-pyrotechnician/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/explosives-and-pyrotechnics-professions",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/authorised-rock-blaster/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/explosives-and-pyrotechnics-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/bergsprenger/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/sprengnings--og-pyrotekniske-yrker-yrkeskvalifikasjoner",
  "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/authorised-rock-blaster-adviser/": "/en/forms-overview/the-norwegian-directorate-of-civil-protection-dsb/explosives-and-pyrotechnics-professions",
  "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/bergsprengningsleder/": "/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/sprengnings--og-pyrotekniske-yrker-yrkeskvalifikasjoner",
  "/skjemaoversikt/skatteetaten/soknad-om-dagsoppgjor-/": "/skjemaoversikt/skatteetaten/soknad-om-dagsoppgjor-manedsoppgjor/",
  "/drift/": "/driftsmeldinger7",
  "/hjelp/tilgangsstyring/": "/hjelp/",
  "/skjemaoversikt/skatteetaten/betalingsordning---bidrag-og-tilbakebetaling/": "/skjemaoversikt/skatteetaten/betalingsavtale---innkrevingsmyndigheten/",
  "/skjemaoversikt/landbruksdirektoratet/tilskudd-til-spesielle-miljotiltak-ijordbruket-smil/": "/skjemaoversikt/landbruksdirektoratet/tilskudd-til-spesielle-miljotiltak-i-jordbruket-smil/",
  "/en/help/tilgangsstyring/": "/en/help/",
  "/quickhelp/": "/hjelp/",
  "/help/tilgangsstyring/": "/hjelp/",
  "/nn/help/tilgangsstyring/": "/nn/hjelp/",
  "/hjelp/innlogging/Slik-logger-du-inn-i-Altinn/logg-inn-i-altinn/": "/hjelp/innlogging/slik-logger-du-inn-i-altinn/"
}

function normalizePath(path?: string) {
  if (!path || !path.startsWith("/")) {
    return path;
  }

  const [pathname, search = ""] = path.split("?", 2);
  const normalizedPathname = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return search ? `${normalizedPathname}?${search}` : normalizedPathname;
}

export function resolveRouteOverride(path: string) {
  return resolveContentUrl(path, ROUTE_OVERRIDES);
}

export function resolveRedirect(path: string) {
  return resolveContentUrl(path, REDIRECTS);
}

function resolveContentUrl(path: string, map: Record<string, string>) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) {
    return undefined;
  }

  const [pathname, search = ""] = normalizedPath.split("?", 2);
  const override = map[pathname];
  if (!override) {
    return path;
  }

  return search ? `${override}?${search}` : override;
}