import { NextRequest, NextResponse } from "next/server";
import { createParticipantToken } from "@/lib/livekit-token";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (typeof body.roomName !== "string" || typeof body.identity !== "string") {
    return NextResponse.json({ issue: "roomName and identity are required" }, { status: 400 });
  }

  const result = await createParticipantToken(body.roomName, body.identity);
  const status = result.ok ? 200 : 428;
  return NextResponse.json(result, { status });
}
