# Full-stack Turborepo

This repo contains a Vite React frontend and a Node.js TypeScript backend.

## Apps

- `apps/frontend`: React + Vite + TypeScript, served on port `5173`
- `apps/backend`: Node.js + TypeScript API, served on port `4000`
- `apps/backend/src/voice.ts`: voice vendor registry with ElevenLabs configured and Pipecat reserved

## Start development

Install dependencies:

```sh
npm install
```

Create local environment variables:

```sh
cp .env.example .env
```

Add your ElevenLabs key and the agent IDs you configured in ElevenLabs to `.env`:

```sh
ELEVENLABS_API_KEY=your-api-key
ELEVENLABS_AGENT_ID=agent_xxxxx
ELEVENLABS_CONCIERGE_AGENT_ID=agent_yyyyy
```

The backend does not create or override agents. Explore uses `ELEVENLABS_AGENT_ID`, Concierge uses `ELEVENLABS_CONCIERGE_AGENT_ID`, and both are used only to request signed conversation URLs. The user talks to each ElevenLabs agent exactly as configured in the ElevenLabs dashboard.

Run both apps:

```sh
npm run dev
```

Open the frontend at [http://127.0.0.1:5173](http://127.0.0.1:5173).

The backend exposes:

- [http://127.0.0.1:4000/health](http://127.0.0.1:4000/health)
- [http://127.0.0.1:4000/api/voice/providers](http://127.0.0.1:4000/api/voice/providers)

## Voice vendors

The frontend talks to a small provider layer instead of calling ElevenLabs directly:

- `elevenlabs`: configured now using signed URLs from the backend
- `pipecat`: listed as a disabled provider for future implementation

The browser never receives `ELEVENLABS_API_KEY`.
The browser starts sessions with the signed URL only; prompt, voice, model, first message, tools, and turn settings all come from the hosted ElevenLabs agent.

## Deploy environment

Set `CORS_ORIGIN` on the backend to the exact frontend origins that can call it. Use comma-separated origins and no trailing slash:

```sh
CORS_ORIGIN=https://www.localhost8080.online,https://project-paneer-frontend-enz7.vercel.app
```

## Useful commands

```sh
npm run dev:frontend
npm run dev:backend
npm run build
npm run lint
npm run check-types
```
