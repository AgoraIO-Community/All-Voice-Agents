import { describe, expect, it } from "vitest";
import { createDefaultAgentConfig, readDefaultSystemPrompt } from "@/lib/default-config";

describe("default config", () => {
  it("uses system-prompt.md as the default system prompt", () => {
    const prompt = readDefaultSystemPrompt();
    const config = createDefaultAgentConfig();

    expect(prompt).toContain("ACTIVE_PERSONA");
    expect(config.instructions).toBe(prompt);
  });
});
