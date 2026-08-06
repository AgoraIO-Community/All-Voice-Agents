import { PROVIDERS, type ProviderId } from "./providerCatalog.js";

export interface ProviderShellProps {
  activeProviderId: ProviderId;
  children: React.ReactNode;
}

export const ProviderShell: React.FC<ProviderShellProps> = ({
  activeProviderId,
  children,
}: ProviderShellProps) => {
  return (
    <div className="provider-shell">
      <header className="provider-shell__header">
        <a className="provider-shell__brand" href="/">
          Voice Stack Lab
        </a>
        <a className="provider-shell__home" href="/">
          Home
        </a>
        <nav className="provider-tabs" aria-label="Voice providers">
          {PROVIDERS.map((provider) => (
            <a
              aria-current={
                provider.id === activeProviderId ? "page" : undefined
              }
              className={
                provider.id === activeProviderId
                  ? "provider-tabs__link provider-tabs__link--active"
                  : "provider-tabs__link"
              }
              href={provider.path}
              key={provider.id}
            >
              {provider.name}
            </a>
          ))}
        </nav>
      </header>
      <div className="provider-shell__content">{children}</div>
    </div>
  );
};
