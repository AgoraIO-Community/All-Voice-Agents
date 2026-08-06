import { z } from "zod";

export const providerCapabilitySchema = z.enum(["asr", "llm", "tts"]);
export type ProviderCapability = z.infer<typeof providerCapabilitySchema>;

export const credentialModeSchema = z.enum(["livekit_inference", "custom_key"]);
export type CredentialMode = z.infer<typeof credentialModeSchema>;

export const applyConfigChangesSchema = z.enum(["next_session"]);
export type ApplyConfigChanges = z.infer<typeof applyConfigChangesSchema>;

export const vendorDefinitionSchema = z.object({
  vendorId: z.string().min(1),
  label: z.string().min(1),
  capability: providerCapabilitySchema,
  credentialModes: z.array(credentialModeSchema).min(1),
  defaultCredentialMode: credentialModeSchema,
  models: z.array(z.string().min(1)).min(1),
  configFields: z.array(z.string().min(1)),
  enabled: z.boolean(),
});
export type VendorDefinition = z.infer<typeof vendorDefinitionSchema>;

export const vendorCatalog: VendorDefinition[] = [
  {
    vendorId: "livekit-inference-asr",
    label: "LiveKit Inference STT",
    capability: "asr",
    credentialModes: ["livekit_inference"],
    defaultCredentialMode: "livekit_inference",
    models: ["deepgram/nova-3", "deepgram/flux-general"],
    configFields: ["model", "language"],
    enabled: true,
  },
  {
    vendorId: "deepgram",
    label: "Deepgram",
    capability: "asr",
    credentialModes: ["custom_key"],
    defaultCredentialMode: "custom_key",
    models: ["nova-3", "flux-general"],
    configFields: ["model", "language"],
    enabled: true,
  },
  {
    vendorId: "livekit-inference-llm",
    label: "LiveKit Inference LLM",
    capability: "llm",
    credentialModes: ["livekit_inference"],
    defaultCredentialMode: "livekit_inference",
    models: ["google/gemma-4-31b-it", "openai/gpt-4.1-mini"],
    configFields: ["model", "temperature"],
    enabled: true,
  },
  {
    vendorId: "openai",
    label: "OpenAI",
    capability: "llm",
    credentialModes: ["custom_key"],
    defaultCredentialMode: "custom_key",
    models: ["gpt-5.3-chat-latest", "gpt-4.1-mini"],
    configFields: ["model", "temperature", "baseUrl"],
    enabled: true,
  },
  {
    vendorId: "livekit-inference-tts",
    label: "LiveKit Inference TTS",
    capability: "tts",
    credentialModes: ["livekit_inference"],
    defaultCredentialMode: "livekit_inference",
    models: ["inworld/inworld-tts-2", "cartesia/sonic-3"],
    configFields: ["model", "voice", "speed"],
    enabled: true,
  },
  {
    vendorId: "elevenlabs",
    label: "ElevenLabs",
    capability: "tts",
    credentialModes: ["custom_key"],
    defaultCredentialMode: "custom_key",
    models: ["eleven_multilingual_v2", "eleven_turbo_v2_5"],
    configFields: ["model", "voice", "stability"],
    enabled: true,
  },
  {
    vendorId: "cartesia",
    label: "Cartesia",
    capability: "tts",
    credentialModes: ["custom_key"],
    defaultCredentialMode: "custom_key",
    models: ["sonic-3", "sonic-2"],
    configFields: ["model", "voice", "speed"],
    enabled: true,
  },
];

export const providerSelectionSchema = z.object({
  vendorId: z.string().min(1),
  model: z.string().min(1),
  credentialMode: credentialModeSchema,
  credentialProfileId: z.string().optional(),
});
export type ProviderSelection = z.infer<typeof providerSelectionSchema>;

export const agentConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  instructions: z.string().min(1),
  session: z.object({
    mode: z.literal("talk"),
    applyConfigChanges: applyConfigChangesSchema,
  }),
  providers: z.object({
    asr: providerSelectionSchema.extend({ language: z.string().min(1) }),
    llm: providerSelectionSchema.extend({ temperature: z.number().min(0).max(2) }),
    tts: providerSelectionSchema.extend({ voice: z.string().min(1), speed: z.number().min(0.5).max(2) }),
  }),
  audio: z.object({
    bargeInEnabled: z.boolean(),
    noiseCancellationEnabled: z.boolean(),
  }),
  turnDetection: z.object({
    enabled: z.boolean(),
    timeoutMs: z.number().int().min(100).max(5000),
  }),
  transcript: z.object({
    interimResults: z.boolean(),
    persist: z.boolean(),
  }),
});
export type AgentConfig = z.infer<typeof agentConfigSchema>;

export const baseDefaultAgentConfig: AgentConfig = {
  id: "default",
  name: "Support Voice Agent",
  instructions: "You are a concise, friendly voice AI assistant. Keep answers brief, natural, and easy to follow by ear.",
  session: {
    mode: "talk",
    applyConfigChanges: "next_session",
  },
  providers: {
    asr: {
      vendorId: "livekit-inference-asr",
      model: "deepgram/nova-3",
      credentialMode: "livekit_inference",
      language: "en",
    },
    llm: {
      vendorId: "livekit-inference-llm",
      model: "openai/gpt-4.1-mini",
      credentialMode: "livekit_inference",
      temperature: 0.4,
    },
    tts: {
      vendorId: "livekit-inference-tts",
      model: "inworld/inworld-tts-2",
      credentialMode: "livekit_inference",
      voice: "Ashley",
      speed: 1,
    },
  },
  audio: {
    bargeInEnabled: true,
    noiseCancellationEnabled: true,
  },
  turnDetection: {
    enabled: true,
    timeoutMs: 900,
  },
  transcript: {
    interimResults: true,
    persist: false,
  },
};

export const defaultAgentConfig = baseDefaultAgentConfig;

export type ValidationResult = { ok: true; config: AgentConfig } | { ok: false; issues: string[] };

export function validateAgentConfig(value: unknown, catalog: VendorDefinition[] = vendorCatalog): ValidationResult {
  const parsed = agentConfigSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  }

  const issues: string[] = [];
  const config = parsed.data;
  const selections: Array<[ProviderCapability, ProviderSelection]> = [
    ["asr", config.providers.asr],
    ["llm", config.providers.llm],
    ["tts", config.providers.tts],
  ];

  for (const [capability, selection] of selections) {
    const vendor = catalog.find((item) => item.enabled && item.capability === capability && item.vendorId === selection.vendorId);
    if (!vendor) {
      issues.push(`providers.${capability}.vendorId is not an enabled ${capability} vendor`);
      continue;
    }
    if (!vendor.models.includes(selection.model)) {
      issues.push(`providers.${capability}.model is not supported by ${vendor.vendorId}`);
    }
    if (!vendor.credentialModes.includes(selection.credentialMode)) {
      issues.push(`providers.${capability}.credentialMode is not supported by ${vendor.vendorId}`);
    }
    if (selection.credentialMode === "custom_key" && !selection.credentialProfileId) {
      issues.push(`providers.${capability}.credentialProfileId is required for custom_key mode`);
    }
  }

  return issues.length ? { ok: false, issues } : { ok: true, config };
}

export function flattenImportantConfig(config: AgentConfig): Array<{ key: string; value: string | number | boolean }> {
  return [
    { key: "session.mode", value: config.session.mode },
    { key: "session.applyConfigChanges", value: config.session.applyConfigChanges },
    { key: "providers.asr.vendorId", value: config.providers.asr.vendorId },
    { key: "providers.asr.model", value: config.providers.asr.model },
    { key: "providers.llm.vendorId", value: config.providers.llm.vendorId },
    { key: "providers.llm.model", value: config.providers.llm.model },
    { key: "providers.llm.temperature", value: config.providers.llm.temperature },
    { key: "providers.tts.vendorId", value: config.providers.tts.vendorId },
    { key: "providers.tts.model", value: config.providers.tts.model },
    { key: "providers.tts.voice", value: config.providers.tts.voice },
    { key: "audio.bargeInEnabled", value: config.audio.bargeInEnabled },
    { key: "audio.noiseCancellationEnabled", value: config.audio.noiseCancellationEnabled },
    { key: "turnDetection.enabled", value: config.turnDetection.enabled },
    { key: "turnDetection.timeoutMs", value: config.turnDetection.timeoutMs },
    { key: "transcript.interimResults", value: config.transcript.interimResults },
    { key: "transcript.persist", value: config.transcript.persist },
  ];
}
