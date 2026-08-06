export type ProviderId = "11labs" | "livekit" | "vapi" | "agora";
export type ProviderStatus = "ready" | "coming-soon";

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  description: string;
  path: `/${ProviderId}`;
  href?: string;
  status: ProviderStatus;
}

export const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: "11labs",
    name: "ElevenLabs",
    description: "Paneer travel concierge with Maya and Aarav.",
    path: "/11labs",
    status: "ready",
  },
  {
    id: "livekit",
    name: "LiveKit",
    description: "Configure and run a real-time LiveKit voice agent.",
    path: "/livekit",
    href: "https://livekit-voiceagent.vercel.app/",
    status: "ready",
  },
  {
    id: "vapi",
    name: "Vapi",
    description: "Hosted voice infrastructure comparison slot.",
    path: "/vapi",
    status: "coming-soon",
  },
  {
    id: "agora",
    name: "Agora",
    description: "Conversational AI and RTC comparison slot.",
    path: "/agora",
    status: "coming-soon",
  },
] as const;

export function getProvider(providerId: ProviderId): ProviderDefinition {
  const provider = PROVIDERS.find(({ id }) => id === providerId);

  if (!provider) {
    throw new Error(`Unknown voice provider: ${providerId}`);
  }

  return provider;
}
