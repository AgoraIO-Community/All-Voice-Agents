import { NextRequest, NextResponse } from "next/server";
import { validateAgentConfig } from "@/lib/agent-config";
import { createDefaultAgentConfig } from "@/lib/default-config";
import { store, upsertConfig } from "@/lib/store";

export async function GET() {
  if (!store.configs.has("default")) {
    store.configs.set("default", createDefaultAgentConfig());
  }
  return NextResponse.json({ configs: [...store.configs.values()] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = validateAgentConfig(body, store.vendors);
  if (!result.ok) {
    return NextResponse.json({ issues: result.issues }, { status: 400 });
  }
  return NextResponse.json({ config: upsertConfig(result.config) });
}
