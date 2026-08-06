import { ProviderShell } from "@repo/provider-navigation";
import { useEffect, useState } from "react";
import { navigateTo } from "./app/navigate";
import { ElevenLabsExperience } from "./ElevenLabsExperience";

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <ProviderShell activeProviderId="11labs">
      <ElevenLabsExperience pathname={pathname} onNavigate={navigateTo} />
    </ProviderShell>
  );
}
