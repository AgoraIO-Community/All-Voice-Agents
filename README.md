# All Voice Agents

Voice Stack Lab is a single place to launch and compare conversational voice-agent implementations. The first release includes the working Project Paneer experience on ElevenLabs and reserved routes for LiveKit, Vapi, and Agora.

## Provider status

| Provider | Route | Status |
| --- | --- | --- |
| ElevenLabs | `/11labs` | Ready |
| LiveKit | `/livekit` | Coming soon |
| Vapi | `/vapi` | Coming soon |
| Agora | `/agora` | Coming soon |

The homepage at `/` presents all four providers. A shared header remains available on every provider route.

## ElevenLabs routes

The copied Paneer experience is isolated under `apps/frontend/src/providers/11labs` and uses these routes:

- `/11labs` and `/11labs/explore` — Maya vacation explorer
- `/11labs/explore/call` — Maya call screen
- `/11labs/concierge` — Aarav hotel concierge
- `/11labs/concierge/call` — Aarav call screen

## Architecture

This repository is an npm Turborepo with:

- `apps/frontend` — React 19, Vite, TypeScript, and the ElevenLabs browser SDK on port `5173`
- `apps/backend` — Node.js TypeScript API for signed ElevenLabs session URLs on port `4000`
- `packages/*` — shared TypeScript and ESLint workspace configuration

The ElevenLabs SDK and large Paneer images are loaded only after opening an ElevenLabs route. API keys remain on the backend; the browser receives only a signed conversation URL.

## Local setup

Install dependencies:

```bash
npm install
```

Create local environment files from the safe examples:

```bash
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env
```

Configure the backend `.env`:

```dotenv
ELEVENLABS_API_KEY=your-api-key
ELEVENLABS_AGENT_ID=agent_xxxxx
ELEVENLABS_CONCIERGE_AGENT_ID=agent_yyyyy
```

`HOST`, `PORT`, and `CORS_ORIGIN` are optional. The backend defaults to
`127.0.0.1:4000` and allows local development when they are omitted.

For a deployed frontend, set the API URL to your Railway backend service:

```dotenv
VITE_API_URL=https://your-service-name.up.railway.app
```

For local development, use `VITE_API_URL=http://127.0.0.1:4000` instead.

Start both workspaces:

```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Useful commands

```bash
npm run dev:frontend
npm run dev:backend
npm run check-types
npm run lint
npm run build
npm run start
```

## Backend endpoints

- `GET /health`
- `GET /api/voice/providers`
- `POST /api/voice/session`

`POST /api/voice/session` accepts `elevenlabs` with agent `maya` or `aarav`. LiveKit, Vapi, and Agora do not call the backend until their integrations are implemented.
