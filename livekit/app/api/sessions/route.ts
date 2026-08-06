import { NextRequest, NextResponse } from "next/server";
import { createParticipantToken } from "@/lib/livekit-token";
import { createSession, store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ sessions: [...store.sessions.values()] });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const configId = typeof body.configId === "string" ? body.configId : "default";
  const config = store.configs.get(configId);
  if (!config) {
    return NextResponse.json({ issue: `Unknown configId ${configId}` }, { status: 404 });
  }

  const session = createSession(config);
  const identity = `user-${session.id.slice(0, 8)}`;
  const tokenResult = await createParticipantToken(session.roomName, identity, JSON.stringify({ sessionId: session.id, configId: config.id, activeConfig: session.activeConfig }));

  return NextResponse.json({
    session,
    livekit: tokenResult,
    demoMode: !tokenResult.ok,
  });
}
