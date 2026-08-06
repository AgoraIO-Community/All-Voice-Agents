import { PROVIDERS } from "../app/providerCatalog";

interface ProviderHomeProps {
  onNavigate: (path: string) => void;
}

const ArrowUpRightIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    className="provider-card__arrow"
    fill="none"
    focusable="false"
    viewBox="0 0 24 24"
  >
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

const ProviderHome: React.FC<ProviderHomeProps> = ({
  onNavigate,
}: ProviderHomeProps) => {
  return (
    <main className="provider-home">
      <header className="provider-home__nav">
        <span className="provider-home__brand">Voice Stack Lab</span>
        <span className="provider-home__count">4 providers</span>
      </header>

      <div className="provider-home__content">
        <section className="provider-home__intro" aria-labelledby="home-title">
          <p className="provider-home__kicker">Choose a voice stack</p>
          <h1 id="home-title">Hear the difference.</h1>
          <p className="provider-home__description">
            Launch the same conversational experience across leading real-time
            voice platforms.
          </p>
        </section>

        <section className="provider-grid" aria-label="Voice agent providers">
          {PROVIDERS.map((provider) => {
            const isReady = provider.status === "ready";

            return (
              <button
                className={
                  isReady
                    ? "provider-card provider-card--ready"
                    : "provider-card"
                }
                key={provider.id}
                onClick={() => onNavigate(provider.path)}
                type="button"
              >
                <span className="provider-card__topline">
                  <strong>{provider.name}</strong>
                  <span
                    className={
                      isReady
                        ? "provider-card__status"
                        : "provider-card__status provider-card__status--soon"
                    }
                  >
                    {isReady ? "Ready" : "Coming soon"}
                  </span>
                </span>
                <span className="provider-card__description">
                  {provider.description}
                </span>
                <span className="provider-card__action">
                  {isReady ? "Open /11labs" : `View ${provider.name}`}
                  <ArrowUpRightIcon />
                </span>
              </button>
            );
          })}
        </section>
      </div>

      <footer className="provider-home__footer">
        <span>One experience.</span>
        <span>Four ways to build it.</span>
      </footer>
    </main>
  );
};

export default ProviderHome;
