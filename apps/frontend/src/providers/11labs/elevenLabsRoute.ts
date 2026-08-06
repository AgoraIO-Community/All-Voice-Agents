export type ElevenLabsRouteId = "explore" | "concierge";

export interface ElevenLabsRouteState {
  isCallRoute: boolean;
  routeId: ElevenLabsRouteId;
}

export function getElevenLabsRoute(
  pathname: string,
): ElevenLabsRouteState {
  const routeId = pathname.startsWith("/11labs/concierge")
    ? "concierge"
    : "explore";

  return {
    isCallRoute: pathname === `/11labs/${routeId}/call`,
    routeId,
  };
}

export function getElevenLabsPath(
  routeId: ElevenLabsRouteId,
  isCallRoute = false,
): string {
  return `/11labs/${routeId}${isCallRoute ? "/call" : ""}`;
}
