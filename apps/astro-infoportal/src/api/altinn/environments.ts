export interface PlatformEndpoints {
  platformBaseUrl: string;
  afBaseUrl: string;
  amUiBaseUrl: string;
  hostBaseUrl: string;
}

export interface EnvironmentDefinition extends PlatformEndpoints {
  key: string;
  hostnamePattern: string;
}

export const ENVIRONMENTS: EnvironmentDefinition[] = [
  {
    key: "tt02",
    hostnamePattern: "tt02",
    platformBaseUrl: "https://platform.tt02.altinn.no",
    afBaseUrl: "https://af.tt02.altinn.no",
    amUiBaseUrl: "https://am.ui.tt02.altinn.no",
    hostBaseUrl: "https://tt02.altinn.no/",
  },
  {
    key: "at21",
    hostnamePattern: "at21",
    platformBaseUrl: "https://platform.at21.altinn.cloud",
    afBaseUrl: "https://af.at23.altinn.cloud",
    amUiBaseUrl: "https://am.ui.at21.altinn.cloud",
    hostBaseUrl: "https://at21.altinn.cloud/",
  },
  {
    key: "at22",
    hostnamePattern: "at22",
    platformBaseUrl: "https://platform.at22.altinn.cloud",
    afBaseUrl: "https://af.at23.altinn.cloud",
    amUiBaseUrl: "https://am.ui.at22.altinn.cloud",
    hostBaseUrl: "https://at22.altinn.cloud/",
  },
  {
    key: "at23",
    hostnamePattern: "at23",
    platformBaseUrl: "https://platform.at23.altinn.cloud",
    afBaseUrl: "https://af.at23.altinn.cloud",
    amUiBaseUrl: "https://am.ui.at23.altinn.cloud",
    hostBaseUrl: "https://at23.altinn.cloud/",
  },
  {
    key: "inte",
    hostnamePattern: "inte.info",
    platformBaseUrl: "https://platform.at23.altinn.cloud",
    afBaseUrl: "https://af.at23.altinn.cloud",
    amUiBaseUrl: "https://am.ui.at23.altinn.cloud",
    hostBaseUrl: "https://at23.altinn.cloud/",
  },
  {
    key: "at24",
    hostnamePattern: "at24",
    platformBaseUrl: "https://platform.at24.altinn.cloud",
    afBaseUrl: "https://af.at23.altinn.cloud",
    amUiBaseUrl: "https://am.ui.at24.altinn.cloud",
    hostBaseUrl: "https://at24.altinn.cloud/",
  },
  {
    key: "production",
    hostnamePattern: "",
    platformBaseUrl: "https://platform.altinn.no",
    afBaseUrl: "https://af.altinn.no",
    amUiBaseUrl: "https://am.ui.altinn.no",
    hostBaseUrl: "https://altinn.no/",
  },
];

const SORTED_PATTERNS = ENVIRONMENTS.filter((e) => e.hostnamePattern).sort(
  (a, b) => b.hostnamePattern.length - a.hostnamePattern.length,
);

const DEV_FALLBACK_KEY = "at23";

function isDevHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".workers.dev")
  );
}

export function resolveEnvironment(
  hostname: string | null | undefined,
): PlatformEndpoints {
  const host = (hostname ?? "").toLowerCase();

  if (host) {
    for (const env of SORTED_PATTERNS) {
      if (host.includes(env.hostnamePattern.toLowerCase())) {
        return env;
      }
    }

    if (isDevHost(host)) {
      const devEnv = ENVIRONMENTS.find((e) => e.key === DEV_FALLBACK_KEY);
      if (devEnv) return devEnv;
    }
  }

  const production = ENVIRONMENTS.find((e) => e.key === "production");
  return production ?? ENVIRONMENTS[0];
}
