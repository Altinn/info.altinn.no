export interface Env {
  ORIGIN: string;
}

export default {
  async fetch(request, env, ctx) {
    const targetBase = env.ORIGIN;
    const url = new URL(request.url);
    const targetUrl = targetBase + url.pathname + url.search;
    const incomingUrl = new URL(request.url);

	  const headers = new Headers(request.headers);
    headers.set("Host", incomingUrl.host);
    headers.set("X-Forwarded-Host", incomingUrl.host);
    headers.set("X-Forwarded-Proto", incomingUrl.protocol.replace(":", ""));

    const cookieHeader = headers.get("Cookie");

    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map(c => c.trim());

      const allowedPrefixes = [
        "UMB_",
        "__Host-umb",
        ".AspNetCore.",
        "Umbraco"
      ];

      // Filter cookies
      const filteredCookies = cookies.filter(cookie => {
        const [name] = cookie.split("=");
        return allowedPrefixes.some(prefix => name.startsWith(prefix))
      });

      if (filteredCookies.length > 0) {
        headers.set("Cookie", filteredCookies.join("; "));
      } else {
        // Remove Cookie header entirely if nothing remains
        headers.delete("Cookie");
      } 
    }

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
      redirect: "manual"
    });

	  const response:Response = await fetch(proxyRequest);

	  return response;
  }
} satisfies ExportedHandler<Env>;

