import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AgentConfig, baseDefaultAgentConfig } from "./agent-config";

const fallbackPrompt = "You are a concise, friendly voice AI assistant. Keep answers brief, natural, and easy to follow by ear.";

export function readDefaultSystemPrompt() {
  const promptPath = join(process.cwd(), "system-prompt.md");
  if (!existsSync(promptPath)) return fallbackPrompt;
  const prompt = readFileSync(promptPath, "utf8").trim();
  return prompt || fallbackPrompt;
}

export function createDefaultAgentConfig(): AgentConfig {
  return {
    ...baseDefaultAgentConfig,
    instructions: readDefaultSystemPrompt(),
  };
}
