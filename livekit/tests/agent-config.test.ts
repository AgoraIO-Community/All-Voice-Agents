import { describe, expect, it } from "vitest";
import { defaultAgentConfig, flattenImportantConfig, validateAgentConfig, vendorCatalog } from "@/lib/agent-config";

describe("agent config", () => {
  it("accepts the default LiveKit Inference config", () => {
    const result = validateAgentConfig(defaultAgentConfig);
    expect(result.ok).toBe(true);
  });

  it("requires credential profile IDs for custom-key vendors", () => {
    const config = structuredClone(defaultAgentConfig);
    config.providers.llm = {
      vendorId: "openai",
      model: "gpt-5.3-chat-latest",
      credentialMode: "custom_key",
      temperature: 0.3,
    };

    const result = validateAgentConfig(config, vendorCatalog);
    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.issues).toContain("providers.llm.credentialProfileId is required for custom_key mode");
  });

  it("exposes exact active config keys for the UI", () => {
    const keys = flattenImportantConfig(defaultAgentConfig).map((entry) => entry.key);
    expect(keys).toContain("session.mode");
    expect(keys).toContain("session.applyConfigChanges");
    expect(keys).toContain("providers.llm.temperature");
    expect(keys).toContain("audio.bargeInEnabled");
    expect(keys).toContain("transcript.interimResults");
  });
});
