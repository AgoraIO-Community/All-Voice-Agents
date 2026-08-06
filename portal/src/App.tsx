import { getProvider, ProviderShell } from "@repo/provider-navigation";
import { getPortalRoute } from "./app/portalRoute";
import ComingSoonProvider from "./components/ComingSoonProvider";
import ProviderHome from "./components/ProviderHome";
import "./Portal.css";

export function App() {
  const route = getPortalRoute(window.location.pathname);

  if (route.kind === "home") {
    return <ProviderHome />;
  }

  const provider = getProvider(route.providerId);

  return (
    <ProviderShell activeProviderId={provider.id}>
      <ComingSoonProvider provider={provider} />
    </ProviderShell>
  );
}
