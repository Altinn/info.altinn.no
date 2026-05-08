const ROUTE_OVERRIDES: Record<string, string> = {
  "/starte-og-drive/dokumentmaler/": "/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/starte-og-drive/sideblokker/dokumentmaler/": "/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/nn/starte-og-drive/dokumentmaler/": "/nn/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/nn/starte-og-drive/sideblokker/dokumentmaler/": "/nn/starte-og-drive/dokumentmaler/last-ned-dokumentmaler/",
  "/en/start-and-run-business/document-templates/": "/en/start-and-run-business/document-templates/download-document-templates/",
  "/en/start-and-run-business/page-blocks/document-templates/": "/en/start-and-run-business/document-templates/download-document-templates/",
};

function normalizePath(path?: string) {
  if (!path || !path.startsWith("/")) {
    return path;
  }

  const [pathname, search = ""] = path.split("?", 2);
  const normalizedPathname = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return search ? `${normalizedPathname}?${search}` : normalizedPathname;
}

export function resolveRouteOverride(path?: string) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) {
    return undefined;
  }

  const [pathname, search = ""] = normalizedPath.split("?", 2);
  const override = ROUTE_OVERRIDES[pathname];
  if (!override) {
    return path;
  }

  return search ? `${override}?${search}` : override;
}
