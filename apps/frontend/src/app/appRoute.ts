import type { ProviderId } from "./providerCatalog";

export type AppRoute =
  | { kind: "home" }
  | { kind: "provider"; providerId: ProviderId };

const ELEVENLABS_PATHS = new Set([
  "/11labs",
  "/11labs/explore",
  "/11labs/explore/call",
  "/11labs/concierge",
  "/11labs/concierge/call",
]);

const PLACEHOLDER_ROUTES: Readonly<Record<string, ProviderId>> = {
  "/agora": "agora",
  "/livekit": "livekit",
  "/vapi": "vapi",
};

function normalizePathname(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "") || "/";
}

export function getAppRoute(pathname: string): AppRoute {
  const normalizedPathname = normalizePathname(pathname);

  if (ELEVENLABS_PATHS.has(normalizedPathname)) {
    return { kind: "provider", providerId: "11labs" };
  }

  const providerId = PLACEHOLDER_ROUTES[normalizedPathname];

  if (providerId) {
    return { kind: "provider", providerId };
  }

  return { kind: "home" };
}
