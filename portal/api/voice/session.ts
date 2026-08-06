import {
  createVoiceSession,
  HttpError,
  isElevenLabsAgentKey,
  isVoiceVendor,
} from "@repo/elevenlabs-server";

type SessionRequestBody = {
  agent?: unknown;
  vendor?: unknown;
};

function jsonResponse(
  payload: unknown,
  status: number,
  headers: HeadersInit = {},
): Response {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

async function readRequestBody(request: Request): Promise<SessionRequestBody> {
  try {
    const payload: unknown = await request.json();

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new HttpError(400, "Request body must be a JSON object.");
    }

    return payload as SessionRequestBody;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Method not allowed" },
        405,
        { Allow: "POST" },
      );
    }

    try {
      const body = await readRequestBody(request);
      const vendor =
        typeof body.vendor === "string" ? body.vendor : "elevenlabs";
      const agent = typeof body.agent === "string" ? body.agent : "maya";

      if (!isVoiceVendor(vendor)) {
        throw new HttpError(400, `Unsupported voice vendor: ${vendor}`);
      }

      if (!isElevenLabsAgentKey(agent)) {
        throw new HttpError(400, `Unsupported ElevenLabs agent: ${agent}`);
      }

      return jsonResponse(await createVoiceSession(vendor, agent), 200);
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        return jsonResponse({ error: error.message }, error.statusCode);
      }

      console.error("Unexpected voice session error", error);
      return jsonResponse({ error: "Unexpected server error" }, 500);
    }
  },
};
