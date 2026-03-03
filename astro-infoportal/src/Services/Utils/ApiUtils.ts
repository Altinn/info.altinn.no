export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
    public requestUrl?: string
  ) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "HttpError";
  }
}

export const buildQuery = (
  params: Record<string, string | number | string[] | undefined>
) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v))
      v.forEach((x) => {
        searchParams.append(k, String(x));
      });
    else if (v !== undefined && v !== "") searchParams.set(k, String(v));
  });
  return searchParams.toString();
};

export type Fetcher = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;

export async function getJson<T>(
  url: string,
  {
    signal,
    fetchImpl = fetch as Fetcher,
    timeoutMs = 15000,
  }: { signal?: AbortSignal; fetchImpl?: Fetcher; timeoutMs?: number }
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (signal)
    signal.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const res = await fetchImpl(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new HttpError(res.status, res.statusText, text, url);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}
