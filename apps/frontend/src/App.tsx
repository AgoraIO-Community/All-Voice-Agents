import { lazy, Suspense, useEffect, useState } from "react";
import { getProvider, ProviderShell } from "@repo/provider-navigation";
import { getAppRoute } from "./app/appRoute";
import { navigateTo } from "./app/navigate";
import ComingSoonProvider from "./components/ComingSoonProvider";
import ProviderHome from "./components/ProviderHome";
import "./App.css";

const ElevenLabsExperience = lazy(() =>
  import("./providers/11labs/ElevenLabsExperience").then((module) => ({
    default: module.ElevenLabsExperience,
  })),
);

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const route = getAppRoute(pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (route.kind === "home") {
    return <ProviderHome />;
  }

  const provider = getProvider(route.providerId);

  return (
    <ProviderShell activeProviderId={provider.id}>
      {provider.id === "11labs" ? (
        <Suspense
          fallback={(
            <div className="provider-loading" role="status">
              Loading ElevenLabs…
            </div>
          )}
        >
          <ElevenLabsExperience
            pathname={pathname}
            onNavigate={navigateTo}
          />
        </Suspense>
      ) : (
        <ComingSoonProvider provider={provider} />
      )}
    </ProviderShell>
  );
}
