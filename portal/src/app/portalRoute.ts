import type { ProviderId } from "@repo/provider-navigation";

type PortalProviderId = Exclude<ProviderId, "11labs">;

export type PortalRoute =
  | { kind: "home" }
  | { kind: "provider"; providerId: PortalProviderId };

const PROVIDER_ROUTES: Readonly<Record<string, PortalProviderId>> = {
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

export function getPortalRoute(pathname: string): PortalRoute {
  const providerId = PROVIDER_ROUTES[normalizePathname(pathname)];

  if (providerId) {
    return { kind: "provider", providerId };
  }

  return { kind: "home" };
}
