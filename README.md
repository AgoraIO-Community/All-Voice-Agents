# All Voice Agents

All Voice Agents is one comparison portal for independently deployable voice-agent stacks. Each provider can use its own frontend framework, backend, dependencies, and deployment target while Vercel Microfrontends keeps every experience on the same public domain.

## Provider routes

| Provider   | Public route              | Current owner         | Status   |
| ---------- | ------------------------- | --------------------- | -------- |
| ElevenLabs | `/11labs` and `/11labs/*` | `elevenlabs/frontend` | Ready    |
| LiveKit    | `/livekit`                | `portal` placeholder  | Reserved |
| Vapi       | `/vapi`                   | `portal` placeholder  | Reserved |
| Agora      | `/agora`                  | `portal` placeholder  | Reserved |

The homepage at `/` shows all four providers. Shared tabs use normal links so moving between providers performs a document request that Vercel can route to the correct application without changing the domain.

## Repository structure

```text
portal/                       Comparison homepage and placeholder routes
  api/                        Same-origin Vercel Functions
elevenlabs/
  frontend/                   Vite/React ElevenLabs application
  backend/                    Local-development and Railway-rollback Node API
  prompts/                    Maya and Aarav prompt documentation
livekit/                      Reserved independent provider root
vapi/                         Reserved independent provider root
agora/                        Reserved independent provider root
packages/
  elevenlabs-server/          Shared server-only ElevenLabs signing logic
  provider-navigation/        Shared provider catalog, header, and tabs
  eslint-config/              Shared lint configuration
  typescript-config/          Shared TypeScript configuration
  ui/                         Shared UI package
```

The reserved provider folders are intentionally not npm workspaces yet. A future provider can contain a Vite app, Next.js app, separate backend, or another suitable stack. Add it to the root workspaces only when its actual package structure is known.

## Local setup

Install dependencies:

```bash
npm install
```

Copy the safe environment template:

```bash
cp .env.example .env
```

Fill in the local file without committing it:

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_CONCIERGE_AGENT_ID=
VITE_API_URL=http://127.0.0.1:4000
```

Start the complete local stack:

```bash
npm run dev
```

Open [http://127.0.0.1:3024](http://127.0.0.1:3024). The development topology is:

| Service                     | Port   |
| --------------------------- | ------ |
| Vercel Microfrontends proxy | `3024` |
| Portal application          | `5173` |
| ElevenLabs frontend         | `5174` |
| ElevenLabs backend          | `4000` |

Use the proxy URL for normal same-origin navigation. The individual application ports remain useful for isolated debugging.

## Useful commands

```bash
npm run dev                    # Complete stack and shared proxy
npm run dev:portal             # Portal and shared proxy
npm run dev:elevenlabs         # ElevenLabs frontend, backend, and proxy
npm run dev:frontend           # Both frontends and proxy, without backend
npm run dev:backend            # ElevenLabs backend only
npm run check-types
npm run lint
npm run build
```

## ElevenLabs stack

The frontend owns:

- `/11labs` and `/11labs/explore` — Maya vacation explorer
- `/11labs/explore/call` — Maya call screen
- `/11labs/concierge` — Aarav hotel concierge
- `/11labs/concierge/call` — Aarav call screen

Production:

```text
POST https://all-voice-agents.vercel.app/api/voice/session
```

The local-development and Railway fallback backend exposes:

- `GET /health`
- `GET /api/voice/providers`
- `POST /api/voice/session`

The browser sends `maya` or `aarav` to the session endpoint. Both the production Vercel Function and fallback backend use `@repo/elevenlabs-server`, so validation and signing behavior remain consistent. The server uses the private API key and agent IDs to obtain a signed conversation URL; those secrets are never included in the browser bundle.

## Environment ownership

The root `.env.example` is the canonical inventory of local variable names. The ignored root `.env` or `.env.local` can contain values for every stack during local development.

Deployment variables remain scoped to the application that consumes them:

- `all-voice-agents-portal` on Vercel: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, and `ELEVENLABS_CONCIERGE_AGENT_ID` for Preview and Production.
- `all-voice-agents-elevenlabs` on Vercel: `VITE_API_URL` only when intentionally overriding same-origin behavior for rollback.
- ElevenLabs backend on Railway: retain `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_CONCIERGE_AGENT_ID`, and `CORS_ORIGIN` while the fallback deployment remains active.
- Future provider projects: only that provider's public configuration and secrets.

Do not expose server secrets with a `VITE_` prefix. Vite embeds prefixed variables into the browser bundle.

## Vercel deployment

This repository is prepared for two frontend projects in one Enterprise Microfrontends group:

1. Create `all-voice-agents-portal` with root directory `portal`.
2. Create `all-voice-agents-elevenlabs` with root directory `elevenlabs/frontend`.
3. Add both projects to the same Microfrontends group and make the portal the default application.
4. Add `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, and `ELEVENLABS_CONCIERGE_AGENT_ID` to the portal project for Preview and Production.
5. Leave `VITE_API_URL` unset on the ElevenLabs project for normal same-origin production requests. Set it to the Railway backend URL only for an intentional rollback.
6. Deploy both projects, validate `POST /api/voice/session` on the shared Preview domain, and then attach the production domain to the group.

The routing rules live in `portal/microfrontends.json`. They send `/11labs` and `/11labs/:path*` to the ElevenLabs project; all other current routes fall back to the portal.

## Adding another provider

1. Build the provider inside its reserved root folder with any suitable frontend/backend structure.
2. Make its frontend serve both its base route and nested routes, such as `/livekit` and `/livekit/*`.
3. Reuse `@repo/provider-navigation` if it is compatible with the provider framework, or preserve the same provider links in an equivalent shell.
4. Add the frontend package to the root workspace when appropriate.
5. Add the application and its path rules to `portal/microfrontends.json`.
6. Add its Vercel project to the same Microfrontends group only after the route builds successfully.
7. Remove that provider's placeholder ownership from the portal.

Provider-specific backends can deploy independently to Railway, Vercel Functions, or another service. They do not need to match the ElevenLabs directory structure.
