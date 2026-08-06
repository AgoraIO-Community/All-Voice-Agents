export type VoiceVendor = "elevenlabs" | "pipecat";
export type VoiceAgent = "maya" | "aarav";

export type VoiceSessionResponse = {
  vendor: "elevenlabs";
  transport: "signed-url";
  signedUrl: string;
  agentId: string;
  createdAgent: boolean;
};

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const isLocalHostname =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";
const API_URL =
  configuredApiUrl || (isLocalHostname ? "http://127.0.0.1:4000" : "");

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

export function createVoiceSession(vendor: VoiceVendor, agent: VoiceAgent) {
  return fetchJson<VoiceSessionResponse>("/api/voice/session", {
    body: JSON.stringify({ agent, vendor }),
    method: "POST",
  });
}
