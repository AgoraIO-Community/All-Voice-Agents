import { randomUUID } from "node:crypto";
import { AgentConfig, vendorCatalog, VendorDefinition } from "./agent-config";
import { createDefaultAgentConfig } from "./default-config";

export type CredentialProfile = {
  id: string;
  vendorId: string;
  label: string;
  envKey: string;
  createdAt: string;
};

export type AgentSessionState = {
  id: string;
  roomName: string;
  configId: string;
  activeConfig: AgentConfig;
  createdAt: string;
};

type Store = {
  configs: Map<string, AgentConfig>;
  vendors: VendorDefinition[];
  credentialProfiles: CredentialProfile[];
  sessions: Map<string, AgentSessionState>;
};

const globalForStore = globalThis as typeof globalThis & { __voiceAgentStore?: Store };
const defaultAgentConfig = createDefaultAgentConfig();

export const store: Store = globalForStore.__voiceAgentStore ?? {
  configs: new Map([[defaultAgentConfig.id, defaultAgentConfig]]),
  vendors: vendorCatalog,
  credentialProfiles: [
    { id: "openai-env", vendorId: "openai", label: "OpenAI from OPENAI_API_KEY", envKey: "OPENAI_API_KEY", createdAt: new Date().toISOString() },
    { id: "deepgram-env", vendorId: "deepgram", label: "Deepgram from DEEPGRAM_API_KEY", envKey: "DEEPGRAM_API_KEY", createdAt: new Date().toISOString() },
    { id: "elevenlabs-env", vendorId: "elevenlabs", label: "ElevenLabs from ELEVENLABS_API_KEY", envKey: "ELEVENLABS_API_KEY", createdAt: new Date().toISOString() },
    { id: "cartesia-env", vendorId: "cartesia", label: "Cartesia from CARTESIA_API_KEY", envKey: "CARTESIA_API_KEY", createdAt: new Date().toISOString() },
  ],
  sessions: new Map(),
};

globalForStore.__voiceAgentStore = store;

export function upsertConfig(config: AgentConfig): AgentConfig {
  store.configs.set(config.id, config);
  return config;
}

export function createSession(config: AgentConfig): AgentSessionState {
  const id = randomUUID();
  const session: AgentSessionState = {
    id,
    roomName: `voice-agent-${id.slice(0, 8)}`,
    configId: config.id,
    activeConfig: structuredClone(config),
    createdAt: new Date().toISOString(),
  };
  store.sessions.set(id, session);
  return session;
}
