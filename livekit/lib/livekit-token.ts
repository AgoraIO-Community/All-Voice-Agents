import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";

export type TokenResult =
  | { ok: true; serverUrl: string; token: string; roomName: string; identity: string }
  | { ok: false; missing: string[] };

export async function createParticipantToken(roomName: string, identity: string, agentMetadata?: string): Promise<TokenResult> {
  const serverUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const required: Array<[string, string | undefined]> = [
    ["LIVEKIT_URL", serverUrl],
    ["LIVEKIT_API_KEY", apiKey],
    ["LIVEKIT_API_SECRET", apiSecret],
  ];
  const missing = required.filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) return { ok: false, missing };

  const token = new AccessToken(apiKey, apiSecret, { identity });
  token.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: "configurable-voice-agent",
        metadata: agentMetadata ?? "{}",
      }),
    ],
  });
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  return { ok: true, serverUrl: serverUrl!, token: await token.toJwt(), roomName, identity };
}
