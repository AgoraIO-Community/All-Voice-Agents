import { PROVIDERS, type ProviderId } from "../app/providerCatalog";

interface ProviderLayoutProps {
  activeProviderId: ProviderId;
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

const ProviderLayout: React.FC<ProviderLayoutProps> = ({
  activeProviderId,
  children,
  onNavigate,
}: ProviderLayoutProps) => {
  return (
    <div className="provider-shell">
      <header className="provider-shell__header">
        <button
          className="provider-shell__brand"
          onClick={() => onNavigate("/")}
          type="button"
        >
          Voice Stack Lab
        </button>
        <button
          className="provider-shell__home"
          onClick={() => onNavigate("/")}
          type="button"
        >
          Home
        </button>
        <nav className="provider-tabs" aria-label="Voice providers">
          {PROVIDERS.map((provider) => (
            <button
              aria-current={
                provider.id === activeProviderId ? "page" : undefined
              }
              className={
                provider.id === activeProviderId
                  ? "provider-tabs__button provider-tabs__button--active"
                  : "provider-tabs__button"
              }
              key={provider.id}
              onClick={() => onNavigate(provider.path)}
              type="button"
            >
              {provider.name}
            </button>
          ))}
        </nav>
      </header>
      <div className="provider-shell__content">{children}</div>
    </div>
  );
};

export default ProviderLayout;
