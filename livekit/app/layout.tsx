import type { Metadata } from "next";
import "./globals.css";

const PROVIDERS = [
  { href: "/11labs", label: "ElevenLabs" },
  { href: "/livekit", label: "LiveKit" },
  { href: "/vapi", label: "Vapi" },
  { href: "/agora", label: "Agora" },
] as const;

export const metadata: Metadata = {
  title: "LiveKit Voice Agent Console",
  description: "Configure and run LiveKit AI voice agents with swappable ASR, LLM, and TTS vendors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
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
                  aria-current={provider.label === "LiveKit" ? "page" : undefined}
                  className={
                    provider.label === "LiveKit"
                      ? "provider-tabs__link provider-tabs__link--active"
                      : "provider-tabs__link"
                  }
                  href={provider.href}
                  key={provider.href}
                >
                  {provider.label}
                </a>
              ))}
            </nav>
          </header>
          <div className="provider-shell__content">{children}</div>
        </div>
      </body>
    </html>
  );
}
