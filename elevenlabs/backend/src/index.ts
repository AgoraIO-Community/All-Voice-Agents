import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import "./env.js";
import {
  createVoiceSession,
  HttpError,
  isElevenLabsAgentKey,
  isVoiceVendor,
  listVoiceProviders,
} from "@repo/elevenlabs-server";

const defaultHost = process.env.RAILWAY_ENVIRONMENT ? "0.0.0.0" : "127.0.0.1";
const host = process.env.HOST ?? defaultHost;
const port = Number(process.env.PORT ?? 4000);
const startedAt = Date.now();

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGIN ?? "*";

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function getCorsOrigin(request: IncomingMessage) {
  const requestOrigin = request.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes("*")) {
    return requestOrigin ?? "*";
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0] ?? "*";
}

function sendJson(
  request: IncomingMessage,
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers":
      request.headers["access-control-request-headers"] ?? "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  });
  response.end(statusCode === 204 ? undefined : JSON.stringify(payload));
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function readJsonBody<T extends Record<string, unknown>>(
  request: IncomingMessage,
) {
  const body = await readBody(request);

  if (!body) {
    return {} as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
) {
  const method = request.method ?? "GET";
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (method === "OPTIONS") {
    sendJson(request, response, 204, null);
    return;
  }

  if (method === "GET" && requestUrl.pathname === "/health") {
    sendJson(request, response, 200, {
      service: "backend",
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    });
    return;
  }

  if (method === "GET" && requestUrl.pathname === "/api/summary") {
    sendJson(request, response, 200, {
      title: "Node API",
      message: "The backend is serving typed JSON to the Vite frontend.",
      features: [
        "TypeScript",
        "Node HTTP",
        "CORS enabled",
        "Voice provider registry",
      ],
    });
    return;
  }

  if (method === "GET" && requestUrl.pathname === "/api/voice/providers") {
    sendJson(request, response, 200, {
      providers: listVoiceProviders(),
    });
    return;
  }

  if (method === "POST" && requestUrl.pathname === "/api/voice/session") {
    const body = await readJsonBody<{ agent?: unknown; vendor?: unknown }>(
      request,
    );
    const vendor = typeof body.vendor === "string" ? body.vendor : "elevenlabs";
    const agent = typeof body.agent === "string" ? body.agent : "maya";

    if (!isVoiceVendor(vendor)) {
      throw new HttpError(400, `Unsupported voice vendor: ${vendor}`);
    }

    if (!isElevenLabsAgentKey(agent)) {
      throw new HttpError(400, `Unsupported ElevenLabs agent: ${agent}`);
    }

    sendJson(request, response, 200, await createVoiceSession(vendor, agent));
    return;
  }

  if (method === "POST" && requestUrl.pathname === "/api/echo") {
    const body = await readJsonBody(request);

    sendJson(request, response, 200, {
      received: body,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  sendJson(request, response, 404, {
    error: "Not found",
    path: requestUrl.pathname,
  });
}

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    sendJson(request, response, statusCode, { error: message });
  });
});

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});
