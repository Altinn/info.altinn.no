import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";

interface HealthCheck {
  status: Status;
  totalDuration: string;
  entries: Record<string, HealthItem>;
};

interface HealthItem {
  status: Status;
  duration: string;
  tags: Tag[];
};

type Tag = "dependencies" | "pages" | "critical";
type Status = "Healthy" | "Degraded" | "Unhealthy";

const UMBRACO_HEALTH_URL:URL = new URL(env.UMBRACO_API_URL + "umbraco/api/health/ready");

async function getHealthItem(name:string, url:URL, expectedContent:string):Promise<HealthItem> {
    const startTime = performance.now();

    const request:Request = new Request(url);
    const response:Response = await fetch(request, { signal: AbortSignal.timeout(5000) });

    let healthy:boolean = false;

    if (response.ok) {
        let content:string = await response.text();
        healthy = content.indexOf(expectedContent) > -1;
    }

    const duration = performance.now() - startTime;

    const healthItem:HealthItem = {
        status: healthy ? "Healthy" : "Unhealthy",
        duration: formatDuration(duration),
        tags: getTags(name)
    };

    return healthItem;
}

function getTags(name:string) {
    let tags:Tag[] = [];

    tags.push(name.startsWith("/") ? "pages" : "dependencies");
    
    if (name === "/") {
        tags.push("critical");
    }

    return tags;
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);

  const fraction = Math.round((ms % 1000) * 10_000)
    .toString()
    .padStart(7, "0");

  return `${hours.toString().padStart(2, "0")}:` +
         `${minutes.toString().padStart(2, "0")}:` +
         `${seconds.toString().padStart(2, "0")}.` +
         fraction;
}

export const GET: APIRoute = async ({url}) => {
    const baseUrl:URL = url.origin;

    const startTime = performance.now();

    // Run probes in parallell
    const [homePage, starteOgDrive, skjemaoversikt, hjelp, umbraco, elasticsearch] = await Promise.all([
        getHealthItem("/", baseUrl, "<title>Altinn - Start</title>"),
        getHealthItem("/starte-og-drive", new URL(baseUrl + "/starte-og-drive"), "<title>Altinn - Starte og drive bedrift</title>"),
        getHealthItem("/skjemaoversikt", new URL(baseUrl + "/skjemaoversikt"), "<title>Altinn - Skjemaoversikt</title>"),
        getHealthItem("/hjelp", new URL(baseUrl + "/hjelp"), "<title>Altinn - Hjelp</title>"),
        getHealthItem("umbraco", UMBRACO_HEALTH_URL, "Healthy"),
        getHealthItem("elasticsearch", new URL(baseUrl + "/sok?q=starte&cachebuster=" + Date.now()), "registrere en forening")],
    );

    const duration = performance.now() - startTime;    
    
    var overAllStatus:Status = homePage.status === "Healthy" ? "Healthy" : "Unhealthy";

    for (const healthEntry of [homePage, starteOgDrive, skjemaoversikt, hjelp, umbraco, elasticsearch]) {
        if (healthEntry.status !== "Healthy") {
            overAllStatus = "Degraded";
        }
    }     

    const healthCheck:HealthCheck = {
        status: overAllStatus,
        totalDuration: formatDuration(duration),
        entries: {
            "/": homePage,
            "/starte-og-drive": starteOgDrive,
            "/skjemaoversikt": skjemaoversikt,
            "/hjelp": hjelp,
            "umbraco": umbraco,
            "elasticsearch": elasticsearch
        }
    }

    return new Response(JSON.stringify(healthCheck, null, 2), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    });
};

