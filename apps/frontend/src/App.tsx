import { lazy, Suspense, useEffect, useState } from "react";
import { getAppRoute } from "./app/appRoute";
import { navigateTo } from "./app/navigate";
import { getProvider } from "./app/providerCatalog";
import ComingSoonProvider from "./components/ComingSoonProvider";
import ProviderHome from "./components/ProviderHome";
import ProviderLayout from "./components/ProviderLayout";
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
    return <ProviderHome onNavigate={navigateTo} />;
  }

  const provider = getProvider(route.providerId);

  return (
    <ProviderLayout
      activeProviderId={provider.id}
      onNavigate={navigateTo}
    >
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
        <ComingSoonProvider provider={provider} onNavigate={navigateTo} />
      )}
    </ProviderLayout>
  );
}
