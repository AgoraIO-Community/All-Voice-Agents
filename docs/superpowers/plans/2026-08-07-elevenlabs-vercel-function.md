# ElevenLabs Vercel Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve ElevenLabs signed-session creation from a same-origin Vercel Function at `/api/voice/session` while keeping the existing Node/Railway backend available for local development and rollback.

**Architecture:** Extract the current ElevenLabs signing logic into a compiled, server-only workspace package consumed by both the fallback Node backend and the portal's Vercel Function. The ElevenLabs frontend will use an explicit `VITE_API_URL` when configured, default to the local Node backend during development, and default to same-origin `/api` requests in Preview and Production.

**Tech Stack:** TypeScript 5.9, Node.js 20+, Vercel Functions Web Request/Response API, Vite 7, npm workspaces, Turborepo.

## Global Constraints

- Production endpoint: `POST https://all-voice-agents.vercel.app/api/voice/session`.
- Keep `elevenlabs/backend` and its Railway deployment contract as a rollback path.
- Do not add automated test files, test dependencies, or test scripts.
- Validate changes with type-checks, builds, HTTP smoke checks, and browser verification.
- Never expose `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, or `ELEVENLABS_CONCIERGE_AGENT_ID` through a `VITE_` variable.
- Preserve the existing session request body `{ vendor, agent }` and signed-session response shape.
- Preserve `VITE_API_URL` as an optional local-development and Railway-rollback override.
- Keep Node.js version compatibility at `>=20.19.0`.
- Do not remove or automatically pause the Railway service.

---

## File Map

### New files

- `packages/elevenlabs-server/package.json` — compiled server-only workspace package metadata and scripts.
- `packages/elevenlabs-server/tsconfig.json` — Node TypeScript build configuration.
- `packages/elevenlabs-server/src/index.ts` — public server-package exports.
- `packages/elevenlabs-server/src/http-error.ts` — shared typed HTTP error.
- `packages/elevenlabs-server/src/voice.ts` — ElevenLabs configuration, validation, and signed-URL request logic.
- `portal/api/voice/session.ts` — Vercel Function for the production session endpoint.

### Modified files

- `elevenlabs/backend/src/index.ts` — consume the shared server package.
- `elevenlabs/backend/package.json` — add the shared package and ensure it builds before direct backend builds/dev runs.
- `portal/package.json` — add the shared package and build it before portal builds.
- `portal/tsconfig.json` — include `portal/api` in type-checking.
- `elevenlabs/frontend/src/api.ts` — select same-origin production API and remove unused API wrappers.
- `.env.example` — document the optional local/rollback `VITE_API_URL`.
- `README.md` — document Vercel Function ownership, variables, rollout, and Railway fallback.
- `package-lock.json` — register the new workspace and dependencies.
- `docs/superpowers/specs/2026-08-07-elevenlabs-vercel-function-design.md` — mark the approved specification ready for implementation.

---

### Task 1: Extract the Shared ElevenLabs Server Package

**Files:**
- Create: `packages/elevenlabs-server/package.json`
- Create: `packages/elevenlabs-server/tsconfig.json`
- Create: `packages/elevenlabs-server/src/index.ts`
- Move: `elevenlabs/backend/src/http-error.ts` → `packages/elevenlabs-server/src/http-error.ts`
- Move: `elevenlabs/backend/src/voice.ts` → `packages/elevenlabs-server/src/voice.ts`
- Modify: `elevenlabs/backend/src/index.ts:3-10`
- Modify: `elevenlabs/backend/package.json:6-22`
- Modify: `package-lock.json`

**Interfaces:**
- Produces package: `@repo/elevenlabs-server`.
- Produces class: `HttpError(statusCode: number, message: string)`.
- Produces types: `VoiceVendor`, `ElevenLabsAgentKey`, `VoiceProviderSummary`, `VoiceSession`.
- Produces functions: `createVoiceSession(vendor, agent)`, `isVoiceVendor(value)`, `isElevenLabsAgentKey(value)`, and `listVoiceProviders()`.
- Preserves the fallback backend's existing HTTP routes and JSON behavior.

- [ ] **Step 1: Create the server package metadata**

Create `packages/elevenlabs-server/package.json`:

```json
{
  "name": "@repo/elevenlabs-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "check-types": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0"
  },
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "@types/node": "^22.15.3",
    "eslint": "^9.39.1",
    "typescript": "5.9.2"
  }
}
```

- [ ] **Step 2: Create the Node TypeScript configuration**

Create `packages/elevenlabs-server/tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Move the existing server logic without changing behavior**

Run:

```bash
git mv elevenlabs/backend/src/http-error.ts packages/elevenlabs-server/src/http-error.ts
git mv elevenlabs/backend/src/voice.ts packages/elevenlabs-server/src/voice.ts
```

Keep the existing import inside `voice.ts` as:

```ts
import { HttpError } from "./http-error.js";
```

- [ ] **Step 4: Define the package's public exports**

Create `packages/elevenlabs-server/src/index.ts`:

```ts
export { HttpError } from "./http-error.js";
export {
  createVoiceSession,
  isElevenLabsAgentKey,
  isVoiceVendor,
  listVoiceProviders,
} from "./voice.js";
export type {
  ElevenLabsAgentKey,
  VoiceProviderSummary,
  VoiceSession,
  VoiceVendor,
} from "./voice.js";
```

- [ ] **Step 5: Switch the fallback backend to the shared package**

Replace the local imports at the top of `elevenlabs/backend/src/index.ts` with:

```ts
import {
  createVoiceSession,
  HttpError,
  isElevenLabsAgentKey,
  isVoiceVendor,
  listVoiceProviders,
} from "@repo/elevenlabs-server";
```

Do not change the existing request parsing, CORS, health, provider-list, echo, or error-response logic.

- [ ] **Step 6: Declare the dependency and direct-build prerequisites**

Update `elevenlabs/backend/package.json` scripts and dependencies to include:

```json
{
  "scripts": {
    "predev": "npm run build --workspace @repo/elevenlabs-server",
    "dev": "tsc && node dist/index.js",
    "prebuild": "npm run build --workspace @repo/elevenlabs-server",
    "build": "tsc",
    "precheck-types": "npm run build --workspace @repo/elevenlabs-server",
    "start": "node dist/index.js",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/elevenlabs-server": "*",
    "dotenv": "^17.4.2"
  }
}
```

- [ ] **Step 7: Refresh the workspace lockfile**

Run:

```bash
npm install
```

Expected: `package-lock.json` contains `packages/elevenlabs-server` and the backend workspace link to `@repo/elevenlabs-server`.

- [ ] **Step 8: Validate the package and fallback backend**

Run:

```bash
npm run check-types --workspace @repo/elevenlabs-server
npm run build --workspace @repo/elevenlabs-server
npm run check-types --workspace @voice-agents/elevenlabs-backend
npm run build --workspace @voice-agents/elevenlabs-backend
```

Expected: all four commands exit `0`; `packages/elevenlabs-server/dist/index.js` and `elevenlabs/backend/dist/index.js` exist.

- [ ] **Step 9: Commit the extraction**

```bash
git add packages/elevenlabs-server elevenlabs/backend package-lock.json
git commit -m "Extract shared ElevenLabs server logic"
```

---

### Task 2: Add the Portal Vercel Function

**Files:**
- Create: `portal/api/voice/session.ts`
- Modify: `portal/package.json:6-28`
- Modify: `portal/tsconfig.json:2-14`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes `@repo/elevenlabs-server` exports from Task 1.
- Produces `POST /api/voice/session` with the existing `VoiceSession` JSON shape.
- Produces JSON errors as `{ error: string }`.
- Produces `405` with `Allow: POST` for non-POST methods.

- [ ] **Step 1: Create the function handler**

Create `portal/api/voice/session.ts`:

```ts
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
```

- [ ] **Step 2: Declare the portal's server dependency and build prerequisite**

Add these entries to `portal/package.json`:

```json
{
  "scripts": {
    "prebuild": "npm run build --workspace @repo/elevenlabs-server",
    "precheck-types": "npm run build --workspace @repo/elevenlabs-server"
  },
  "dependencies": {
    "@repo/elevenlabs-server": "*"
  }
}
```

Preserve every existing script and dependency while merging these entries.

- [ ] **Step 3: Include Vercel Functions in portal type-checking**

Change the `include` field in `portal/tsconfig.json` to:

```json
"include": ["api", "src", "vite.config.ts"]
```

The existing `DOM` library already provides `Request`, `Response`, and `HeadersInit` types.

- [ ] **Step 4: Refresh the lockfile**

Run:

```bash
npm install
```

Expected: the portal workspace links to `@repo/elevenlabs-server` in `package-lock.json`.

- [ ] **Step 5: Validate the Vercel Function and portal bundle**

Run:

```bash
npm run check-types --workspace @voice-agents/portal
npm run build --workspace @voice-agents/portal
```

Expected: both commands exit `0`; the portal Vite build still produces `portal/dist/index.html`, and TypeScript validates `portal/api/voice/session.ts`.

- [ ] **Step 6: Confirm routing remains unambiguous**

Inspect `portal/vercel.json` and confirm all of the following remain true:

```text
/livekit redirects to https://livekit-voiceagent.vercel.app/
/livekit/:path* redirects to https://livekit-voiceagent.vercel.app/
/(.*) rewrites to /index.html
No /api rewrite points to Railway or another external service
```

Do not add an `/api` rewrite; Vercel Functions take filesystem precedence over the SPA rewrite.

- [ ] **Step 7: Commit the function**

```bash
git add portal/api/voice/session.ts portal/package.json portal/tsconfig.json package-lock.json
git commit -m "Add ElevenLabs session Vercel function"
```

---

### Task 3: Switch Production Frontend Calls to Same-Origin

**Files:**
- Modify: `elevenlabs/frontend/src/api.ts:1-90`

**Interfaces:**
- Consumes `VITE_API_URL` as an optional override.
- Produces same-origin `/api/voice/session` requests when `VITE_API_URL` is empty in Preview or Production.
- Preserves `createVoiceSession(vendor: VoiceVendor, agent: VoiceAgent): Promise<VoiceSessionResponse>`.

- [ ] **Step 1: Replace the frontend API wrapper with the focused contract**

Replace `elevenlabs/frontend/src/api.ts` with:

```ts
export type VoiceVendor = "elevenlabs" | "pipecat";
export type VoiceAgent = "maya" | "aarav";

export type VoiceSessionResponse = {
  vendor: "elevenlabs";
  transport: "signed-url";
  signedUrl: string;
  agentId: string;
  createdAgent: boolean;
};

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const API_URL =
  configuredApiUrl || (import.meta.env.DEV ? "http://127.0.0.1:4000" : "");

async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };

    if (typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    return `Request failed with ${response.status}`;
  }

  return `Request failed with ${response.status}`;
}

export function createVoiceSession(vendor: VoiceVendor, agent: VoiceAgent) {
  return fetchJson<VoiceSessionResponse>("/api/voice/session", {
    body: JSON.stringify({ agent, vendor }),
    method: "POST",
  });
}
```

This intentionally removes the unused health, summary, and provider-list types and functions.

- [ ] **Step 2: Validate the frontend type contract and production bundle**

Run:

```bash
npm run check-types --workspace @voice-agents/elevenlabs
npm run build --workspace @voice-agents/elevenlabs
```

Expected: both commands exit `0`; the production bundle contains `/api/voice/session` and does not contain `http://127.0.0.1:4000` as its selected production default.

- [ ] **Step 3: Inspect generated output for accidental Railway coupling**

Run:

```bash
rg -n "up\.railway\.app|localhost:4000|127\.0\.0\.1:4000" elevenlabs/frontend/dist
```

Expected: no Railway URL is present. A development fallback string may be emitted by Vite only if dead-code elimination retains it; it must not be selected in a production build. Confirm `/api/voice/session` exists with:

```bash
rg -n "/api/voice/session" elevenlabs/frontend/dist
```

- [ ] **Step 4: Commit the frontend switch**

```bash
git add elevenlabs/frontend/src/api.ts
git commit -m "Use same-origin ElevenLabs session API"
```

---

### Task 4: Update Environment and Deployment Documentation

**Files:**
- Modify: `.env.example:1-10`
- Modify: `README.md:16-140`
- Modify: `docs/superpowers/specs/2026-08-07-elevenlabs-vercel-function-design.md:1-5`

**Interfaces:**
- Documents portal ownership of server secrets.
- Documents `VITE_API_URL` as optional local/rollback configuration.
- Documents Railway as fallback rather than the production default.

- [ ] **Step 1: Update the safe environment template**

Change the ElevenLabs section of `.env.example` to:

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_CONCIERGE_AGENT_ID=

# Optional local-development or Railway-rollback override.
VITE_API_URL=http://127.0.0.1:4000
```

Preserve the existing Agora variable names below this block.

- [ ] **Step 2: Update repository structure documentation**

Add these responsibilities to the `README.md` repository tree:

```text
portal/api/                    Same-origin Vercel Functions
packages/elevenlabs-server/   Shared server-only ElevenLabs signing logic
```

Keep `elevenlabs/backend` described as the local-development and Railway-rollback Node API.

- [ ] **Step 3: Update ElevenLabs API ownership**

Replace the production-backend description with these exact contracts:

```text
Production:
POST https://all-voice-agents.vercel.app/api/voice/session

Local/Railway fallback:
GET /health
GET /api/voice/providers
POST /api/voice/session
```

Document that both production and fallback paths use `@repo/elevenlabs-server` so signing behavior remains consistent.

- [ ] **Step 4: Update deployment environment ownership**

Document these Vercel project assignments:

```text
all-voice-agents-portal:
  ELEVENLABS_API_KEY
  ELEVENLABS_AGENT_ID
  ELEVENLABS_CONCIERGE_AGENT_ID

all-voice-agents-elevenlabs:
  VITE_API_URL only when intentionally overriding same-origin behavior
```

Document that Railway retains the three ElevenLabs secrets plus `CORS_ORIGIN` only while the fallback deployment remains active.

- [ ] **Step 5: Update the approved design status**

Change the design document header to:

```markdown
**Status:** Approved for implementation
```

- [ ] **Step 6: Validate documentation formatting and secret hygiene**

Run:

```bash
git diff --check
rg -n "ELEVENLABS_API_KEY=[^[:space:]]+|ELEVENLABS_AGENT_ID=agent_|ELEVENLABS_CONCIERGE_AGENT_ID=agent_" .env.example README.md docs/superpowers
```

Expected: `git diff --check` exits `0`; the secret scan returns no real values.

- [ ] **Step 7: Commit the documentation**

```bash
git add .env.example README.md docs/superpowers/specs/2026-08-07-elevenlabs-vercel-function-design.md
git commit -m "Document Vercel session API deployment"
```

---

### Task 5: Run Repository-Level Validation

**Files:**
- Inspect only; no source files should change except generated files already tracked by the repository.

**Interfaces:**
- Verifies every affected workspace resolves the shared server package.
- Verifies no automated tests were added.
- Produces a clean commit range ready for deployment.

- [ ] **Step 1: Run focused checks**

```bash
npm run check-types --workspace @repo/elevenlabs-server
npm run check-types --workspace @voice-agents/elevenlabs-backend
npm run check-types --workspace @voice-agents/portal
npm run check-types --workspace @voice-agents/elevenlabs
```

Expected: every command exits `0`.

- [ ] **Step 2: Run focused builds**

```bash
npm run build --workspace @repo/elevenlabs-server
npm run build --workspace @voice-agents/elevenlabs-backend
npm run build --workspace @voice-agents/portal
npm run build --workspace @voice-agents/elevenlabs
```

Expected: every command exits `0`. The ElevenLabs frontend may retain its existing Vite large-chunk warning; no new build error is acceptable.

- [ ] **Step 3: Run repository-wide static checks**

```bash
npm run check-types
npm run lint
npm run build
```

Expected: all commands exit `0`. Do not run or add automated tests.

- [ ] **Step 4: Confirm the change scope**

```bash
git status -sb
git diff --check HEAD~4..HEAD
git diff --stat HEAD~4..HEAD
```

Expected: only the shared server extraction, Vercel Function, frontend API selection, environment documentation, lockfile, and design-status files appear.

- [ ] **Step 5: Confirm no server secrets are tracked**

```bash
git grep -n -E "ELEVENLABS_API_KEY=.+|ELEVENLABS_AGENT_ID=agent_|ELEVENLABS_CONCIERGE_AGENT_ID=agent_" -- ':!docs/superpowers/plans/*'
```

Expected: no real credential assignment is returned.

---

### Task 6: Configure Vercel and Cut Over Production

**Files:**
- External Vercel project settings only; no repository files.

**Interfaces:**
- Consumes the deployed `portal/api/voice/session.ts` function.
- Produces same-origin signed-session traffic on `all-voice-agents.vercel.app`.
- Preserves Railway as an available rollback target.

- [ ] **Step 1: Configure portal Preview and Production secrets**

In Vercel project `all-voice-agents-portal`, add these existing secret values to both Preview and Production:

```text
ELEVENLABS_API_KEY
ELEVENLABS_AGENT_ID
ELEVENLABS_CONCIERGE_AGENT_ID
```

Do not add a `VITE_` prefix. Confirm the project Root Directory remains `portal` and **Include source files outside of the Root Directory** is enabled.

- [ ] **Step 2: Create a preview deployment and capture its URL**

From the monorepo root, run:

```bash
AVA_PORTAL_PREVIEW_ORIGIN="$(npx vercel@latest deploy --project all-voice-agents-portal --scope agoraio --yes)"
```

Expected: Vercel creates a Preview deployment and `AVA_PORTAL_PREVIEW_ORIGIN` contains its exact `https://...vercel.app` URL. Keep the same shell session for Steps 3–6.

- [ ] **Step 3: Verify method rejection without exposing credentials**

Run:

```bash
curl -i "${AVA_PORTAL_PREVIEW_ORIGIN}/api/voice/session"
```

Expected: HTTP `405`, `Allow: POST`, `Cache-Control: no-store`, and JSON `{ "error": "Method not allowed" }`.

- [ ] **Step 4: Verify validation behavior**

Run:

```bash
curl -i \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"vendor":"elevenlabs","agent":"invalid"}' \
  "${AVA_PORTAL_PREVIEW_ORIGIN}/api/voice/session"
```

Expected: HTTP `400` with JSON `{ "error": "Unsupported ElevenLabs agent: invalid" }`.

- [ ] **Step 5: Verify signed-session creation without printing the signed URL**

Run:

```bash
curl -sS \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"vendor":"elevenlabs","agent":"maya"}' \
  "${AVA_PORTAL_PREVIEW_ORIGIN}/api/voice/session" \
  | jq '{vendor, transport, agentIdPresent: (.agentId | type == "string" and length > 0), signedUrlPresent: (.signedUrl | type == "string" and length > 0)}'
```

Expected:

```json
{
  "vendor": "elevenlabs",
  "transport": "signed-url",
  "agentIdPresent": true,
  "signedUrlPresent": true
}
```

- [ ] **Step 6: Verify the preview user flow**

Open `${AVA_PORTAL_PREVIEW_ORIGIN}/11labs`, start Maya or Aarav, and inspect the browser Network panel.

Expected:

```text
POST ${AVA_PORTAL_PREVIEW_ORIGIN}/api/voice/session → 200
No request to *.up.railway.app
The browser receives a signed URL and begins the existing ElevenLabs connection flow
```

- [ ] **Step 7: Remove the production frontend override**

After Preview succeeds, remove `VITE_API_URL` from the `all-voice-agents-elevenlabs` Vercel project's Production environment. Keep the Railway URL recorded securely for rollback, not in Git.

- [ ] **Step 8: Deploy or promote Production**

Deploy the approved commit to both `all-voice-agents-portal` and `all-voice-agents-elevenlabs`. Confirm both projects report `Ready` before testing the public domain.

- [ ] **Step 9: Verify Production**

Repeat Steps 3–6 with:

```text
https://all-voice-agents.vercel.app
```

Expected: the same-origin Vercel Function handles session creation and no browser request reaches Railway.

- [ ] **Step 10: Preserve rollback readiness**

Leave the Railway service and `elevenlabs/backend` package available during the observation period. The rollback procedure is:

```text
1. Restore the Railway URL as VITE_API_URL on all-voice-agents-elevenlabs.
2. Redeploy the ElevenLabs frontend.
3. Confirm Railway CORS_ORIGIN includes the active portal and LiveKit origins.
```

Do not pause or delete Railway as part of this implementation plan.

---

## Completion Criteria

- `POST /api/voice/session` works on the portal Vercel project with configured secrets.
- Production ElevenLabs frontend sends no request to Railway by default.
- The API key and agent IDs remain server-only.
- Local development still uses the Node backend on port `4000` by default.
- Restoring `VITE_API_URL` can route the frontend back to Railway without a source change.
- The fallback backend, portal, frontend, and shared package all type-check and build.
- No automated test files or test dependencies are added.
- Railway remains available and unchanged unless an operator separately pauses it.
