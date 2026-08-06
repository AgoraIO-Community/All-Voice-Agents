export type ApiHealth = {
  service: string;
  status: "ok";
  uptimeSeconds: number;
  timestamp: string;
};

export type ApiSummary = {
  title: string;
  message: string;
  features: string[];
};

export type VoiceVendor = "elevenlabs" | "pipecat";
export type VoiceAgent = "maya" | "aarav";

export type VoiceProvider = {
  id: VoiceVendor;
  label: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  setup: string[];
};

export type VoiceProvidersResponse = {
  providers: VoiceProvider[];
};

export type VoiceSessionResponse = {
  vendor: "elevenlabs";
  transport: "signed-url";
  signedUrl: string;
  agentId: string;
  createdAgent: boolean;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };

    if (typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    return `Request failed with ${response.status}`;
  }

  return `Request failed with ${response.status}`;
}

export function getHealth(signal?: AbortSignal) {
  return fetchJson<ApiHealth>("/health", { signal });
}

export function getSummary(signal?: AbortSignal) {
  return fetchJson<ApiSummary>("/api/summary", { signal });
}

export function getVoiceProviders(signal?: AbortSignal) {
  return fetchJson<VoiceProvidersResponse>("/api/voice/providers", { signal });
}

export function createVoiceSession(vendor: VoiceVendor, agent: VoiceAgent) {
  return fetchJson<VoiceSessionResponse>("/api/voice/session", {
    body: JSON.stringify({ agent, vendor }),
    method: "POST",
  });
}
