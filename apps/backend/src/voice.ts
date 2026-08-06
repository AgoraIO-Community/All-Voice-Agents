import { HttpError } from "./http-error.js";

export type VoiceVendor = "elevenlabs" | "pipecat";
export type ElevenLabsAgentKey = "maya" | "aarav";

export type VoiceProviderSummary = {
  id: VoiceVendor;
  label: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  setup: string[];
};

export type VoiceSession =
  | {
      vendor: "elevenlabs";
      transport: "signed-url";
      signedUrl: string;
      agentId: string;
      createdAgent: boolean;
    }
  | {
      vendor: "pipecat";
      transport: "unsupported";
    };

const elevenLabsApiBaseUrl = "https://api.elevenlabs.io/v1";

export function isVoiceVendor(value: string): value is VoiceVendor {
  return value === "elevenlabs" || value === "pipecat";
}

export function isElevenLabsAgentKey(
  value: string,
): value is ElevenLabsAgentKey {
  return value === "maya" || value === "aarav";
}

export function listVoiceProviders(): VoiceProviderSummary[] {
  const hasApiKey = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
  const hasMayaAgent = Boolean(process.env.ELEVENLABS_AGENT_ID?.trim());
  const hasConciergeAgent = Boolean(
    process.env.ELEVENLABS_CONCIERGE_AGENT_ID?.trim(),
  );

  return [
    {
      id: "elevenlabs",
      label: "ElevenLabs",
      description: "Browser voice conversations through ElevenLabs Agents.",
      enabled: true,
      configured: hasApiKey && hasMayaAgent && hasConciergeAgent,
      setup: [
        "ELEVENLABS_API_KEY",
        "ELEVENLABS_AGENT_ID",
        "ELEVENLABS_CONCIERGE_AGENT_ID",
      ],
    },
    {
      id: "pipecat",
      label: "Pipecat",
      description: "Provider slot reserved for a future Pipecat integration.",
      enabled: false,
      configured: false,
      setup: ["Not configured yet"],
    },
  ];
}

export async function createVoiceSession(
  vendor: VoiceVendor,
  agent: ElevenLabsAgentKey = "maya",
): Promise<VoiceSession> {
  if (vendor === "pipecat") {
    throw new HttpError(501, "Pipecat support has not been configured yet.");
  }

  return createElevenLabsSession(agent);
}

async function createElevenLabsSession(
  agent: ElevenLabsAgentKey,
): Promise<VoiceSession> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

  if (!apiKey) {
    throw new HttpError(
      400,
      "Missing ELEVENLABS_API_KEY. Add it to .env and restart the backend.",
    );
  }

  const { agentId, envName } = getElevenLabsAgentConfig(agent);

  if (!agentId) {
    throw new HttpError(
      400,
      `Missing ${envName}. Add your configured ElevenLabs agent ID to .env and restart the backend.`,
    );
  }

  const signedUrl = await getElevenLabsSignedUrl(apiKey, agentId);

  return {
    vendor: "elevenlabs",
    transport: "signed-url",
    signedUrl,
    agentId,
    createdAgent: false,
  };
}

function getElevenLabsAgentConfig(agent: ElevenLabsAgentKey) {
  if (agent === "aarav") {
    return {
      agentId: process.env.ELEVENLABS_CONCIERGE_AGENT_ID?.trim(),
      envName: "ELEVENLABS_CONCIERGE_AGENT_ID",
    };
  }

  return {
    agentId: process.env.ELEVENLABS_AGENT_ID?.trim(),
    envName: "ELEVENLABS_AGENT_ID",
  };
}

async function getElevenLabsSignedUrl(apiKey: string, agentId: string) {
  const url = new URL(
    `${elevenLabsApiBaseUrl}/convai/conversation/get-signed-url`,
  );
  url.searchParams.set("agent_id", agentId);

  const response = await fetch(url, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  const data = await readElevenLabsJson<{ signed_url?: string }>(
    response,
    "create an ElevenLabs signed URL",
  );

  if (!data.signed_url) {
    throw new HttpError(502, "ElevenLabs did not return a signed URL.");
  }

  return data.signed_url;
}

async function readElevenLabsJson<T>(response: Response, action: string) {
  const body = await response.text();
  const payload = parseJsonObject(body);

  if (!response.ok) {
    const details =
      typeof payload.detail === "string"
        ? payload.detail
        : body || response.statusText;

    throw new HttpError(
      502,
      `Unable to ${action}: ElevenLabs returned ${response.status}. ${details}`,
    );
  }

  return payload as T;
}

function parseJsonObject(body: string): Record<string, unknown> {
  if (!body) {
    return {};
  }

  const payload = JSON.parse(body) as unknown;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  return payload as Record<string, unknown>;
}
