import type { ProviderDefinition } from "@repo/provider-navigation";

interface ComingSoonProviderProps {
  provider: ProviderDefinition;
}

const ArrowLeftIcon: React.FC = () => (
  <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ArrowRightIcon: React.FC = () => (
  <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ComingSoonProvider: React.FC<ComingSoonProviderProps> = ({
  provider,
}: ComingSoonProviderProps) => {
  return (
    <main className="coming-soon">
      <div className="coming-soon__orbit" aria-hidden="true">
        <span />
      </div>
      <section className="coming-soon__content">
        <p className="coming-soon__status">Integration coming soon</p>
        <h1>{provider.name}</h1>
        <p>{provider.description}</p>
        <div className="coming-soon__actions">
          <a href="/">
            <ArrowLeftIcon />
            Back to all providers
          </a>
          <a
            className="coming-soon__primary"
            href="/11labs"
          >
            Try ElevenLabs
            <ArrowRightIcon />
          </a>
        </div>
      </section>
      <p className="coming-soon__note">
        This route is reserved for the next provider implementation.
      </p>
    </main>
  );
};

export default ComingSoonProvider;
