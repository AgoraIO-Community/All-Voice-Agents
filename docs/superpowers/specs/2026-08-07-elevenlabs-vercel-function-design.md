# ElevenLabs Vercel Function Design

**Date:** 2026-08-07
**Status:** Approved for implementation
**Repository:** `All-Voice-Agents`

## Summary

Replace the ElevenLabs frontend's production dependency on the Railway backend with a same-origin Vercel Function served by the portal project. The public production endpoint will be:

```text
POST https://all-voice-agents.vercel.app/api/voice/session
```

The function will use server-only ElevenLabs credentials to request a signed conversation URL and return that URL to the browser. The existing `elevenlabs/backend` package and Railway deployment contract will remain available for local development and rollback, but normal production traffic will no longer require Railway.

## Goals

- Serve the signed-session API from the existing `all-voice-agents-portal` Vercel project.
- Make production requests same-origin so production CORS configuration is unnecessary.
- Keep `ELEVENLABS_API_KEY` and agent IDs out of browser bundles.
- Preserve the existing `POST /api/voice/session` request and response contract.
- Share one implementation of the ElevenLabs signing logic between Vercel and the fallback Node backend.
- Preserve `elevenlabs/backend` as a working local-development and rollback path.
- Keep `VITE_API_URL` as an optional override rather than a required production variable.
- Avoid adding automated tests, as explicitly requested by the user.

## Non-goals

- Deleting `elevenlabs/backend`.
- Automatically deleting or pausing the Railway service.
- Migrating unused health, summary, or provider-list endpoints to Vercel.
- Adding authentication, rate limiting, billing, or persistent storage.
- Changing the ElevenLabs agent configuration or conversation UI.
- Migrating LiveKit, Vapi, or Agora APIs.
- Exposing the ElevenLabs API key to any frontend Vercel project.

## Approaches Considered

### Portal-hosted Vercel Function — selected

The portal owns `/api/voice/session`. Production frontend requests are relative to the current shared domain, eliminating the cross-origin request and Railway dependency. This is the smallest architecture that meets the same-domain requirement.

### Separate Vercel backend project

The existing backend could be deployed as a separate Vercel project from the same monorepo. This would remove Railway but retain another public origin, `VITE_API_URL`, and CORS. It does not provide the desired same-origin contract.

### Portal rewrite to Railway

The portal could proxy `/api/*` to Railway. This would hide CORS from the browser but would not remove Railway as a production dependency, so it was rejected.

## Target Structure

```text
All-Voice-Agents/
├── packages/
│   └── elevenlabs-server/
│       ├── src/
│       │   ├── http-error.ts
│       │   ├── index.ts
│       │   └── voice.ts
│       ├── package.json
│       └── tsconfig.json
├── portal/
│   ├── api/
│   │   └── voice/
│   │       └── session.ts
│   ├── package.json
│   └── vercel.json
└── elevenlabs/
    ├── frontend/
    │   └── src/api.ts
    └── backend/
        └── src/index.ts
```

`@repo/elevenlabs-server` will be a server-only workspace package. It will contain the current provider validation, agent selection, signed-URL request, and typed HTTP error behavior. It will not be imported by any browser component.

The portal and fallback backend will declare this package as a workspace dependency. The fallback backend's HTTP server remains responsible for CORS and its existing auxiliary routes; only its voice-session implementation moves to the shared package.

## Vercel Function Contract

`portal/api/voice/session.ts` will use the Vercel Web Request/Response function shape and expose one endpoint:

```text
POST /api/voice/session
Content-Type: application/json

{
  "vendor": "elevenlabs",
  "agent": "maya" | "aarav"
}
```

Successful response:

```json
{
  "vendor": "elevenlabs",
  "transport": "signed-url",
  "signedUrl": "wss://...",
  "agentId": "...",
  "createdAgent": false
}
```

Behavior:

- Only `POST` is accepted; other methods return `405` with `Allow: POST`.
- Invalid JSON returns `400`.
- Unsupported vendors or agent identifiers return `400`.
- Missing server environment variables return the existing configuration error without exposing secret values.
- ElevenLabs upstream failures retain the existing `502` behavior.
- Unexpected failures are logged server-side and return a generic `500` response.
- Responses use `Cache-Control: no-store` because signed URLs are session credentials.
- No production CORS headers are required because the browser request is same-origin.

## Routing

The portal Vercel project already uses a catch-all SPA rewrite to `/index.html`. Vercel checks filesystem routes, including Vercel Functions, before applying rewrites, so `/api/voice/session` resolves to the function while other client-side portal paths continue resolving to the SPA.

The Microfrontends configuration claims `/11labs` and `/11labs/*` for the ElevenLabs frontend. It does not claim `/api/*`, so a relative request from the shared public domain resolves through the default portal project and reaches the new function.

No API rewrite to Railway will be added.

## Frontend API Selection

`elevenlabs/frontend/src/api.ts` will choose its API base as follows:

1. Use a non-empty `VITE_API_URL` when explicitly configured. This preserves local overrides and Railway rollback.
2. In development, default to `http://localhost:4000` so the existing root development command continues working.
3. In preview and production builds, default to an empty base URL so requests are same-origin.

The effective production request is therefore:

```ts
fetch("/api/voice/session", ...)
```

The unused frontend wrappers and types for `/health`, `/api/summary`, and `/api/voice/providers` will be removed because no component imports them and those endpoints are not part of the Vercel migration.

## Environment Variables

The `all-voice-agents-portal` Vercel project will receive these server-only values for Preview and Production:

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_CONCIERGE_AGENT_ID=
```

These values must not be configured with a `VITE_` prefix and must not be added to the ElevenLabs frontend Vercel project.

`VITE_API_URL` will be removed from the production ElevenLabs frontend project after the preview function is verified. The root `.env.example` will describe `VITE_API_URL` as an optional local or rollback override rather than a required Railway production URL.

The fallback Railway deployment retains its current server secrets and `CORS_ORIGIN`. If rollback is required, an operator can restore the Railway URL as `VITE_API_URL` and redeploy the ElevenLabs frontend without changing source code.

## Local Development

The normal root development command will continue starting:

- Portal frontend
- ElevenLabs frontend
- Microfrontends proxy
- Existing Node backend on port `4000`

Because development defaults to `http://localhost:4000`, developers do not need Vercel CLI to work locally. Vercel Function behavior can be checked separately with Vercel preview deployments or `vercel dev` when needed.

## Security

- The ElevenLabs API key and agent IDs are read only through `process.env` inside server code.
- Browser code receives only the short-lived signed conversation URL and non-secret agent ID.
- Signed-session responses are not cached.
- Request validation occurs before contacting ElevenLabs.
- Upstream error messages may include operational details but never include the API key.
- The endpoint remains publicly callable, matching the existing Railway behavior. Authentication and rate limiting are follow-up concerns outside this migration.

## Error Handling and User Experience

The frontend's existing session-start error handling remains unchanged. A failed Vercel invocation, invalid configuration, or ElevenLabs upstream failure rejects `createVoiceSession`, and the experience displays its existing connection error with retry behavior.

The function returns JSON errors in the current shape:

```json
{
  "error": "Human-readable message"
}
```

This preserves compatibility with `getErrorMessage` in the frontend API wrapper.

## Rollout

1. Add the shared server-only workspace package and update the fallback backend to use it.
2. Add the portal Vercel Function and its workspace dependency.
3. Update the frontend API base selection and remove unused API wrappers.
4. Update `.env.example` and deployment documentation.
5. Add the three ElevenLabs server variables to the portal Vercel project for Preview and Production.
6. Deploy a preview and verify `/api/voice/session` through the portal preview domain.
7. Verify an ElevenLabs conversation can start through the preview `/11labs` experience.
8. Promote or deploy to production.
9. Remove the production `VITE_API_URL` override from the ElevenLabs frontend project and redeploy it.
10. Keep Railway available during the initial observation period; pausing it is a separate operator decision.

## Verification

No automated test files or test dependencies will be added. Verification will consist of:

- Type-checking the shared server package, portal, frontend, and fallback backend.
- Building the portal, ElevenLabs frontend, and fallback backend.
- Confirming the portal SPA fallback still renders non-API routes.
- Confirming `GET /api/voice/session` returns `405`.
- Confirming invalid JSON and unsupported agent values return `400`.
- Confirming a valid preview `POST /api/voice/session` returns a signed URL when Vercel secrets are configured.
- Confirming `/11labs` can start a conversation through the same-origin API.
- Confirming the browser network panel contains no Railway request in the production path.
- Confirming no ElevenLabs server secret is present in generated frontend assets or committed files.

## Operational Notes

- The portal Vercel project root remains `portal`.
- The project must retain access to workspace source files outside that root so the portal function can bundle `@repo/elevenlabs-server`.
- The Vercel deployment region may use the platform default; no database locality requirement exists.
- Preview and Production must each receive the required ElevenLabs variables.
- The Railway backend remains independently deployable and continues to require CORS when used cross-origin.

## References

- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel monorepos](https://vercel.com/docs/monorepos)
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel rewrites](https://vercel.com/docs/routing/rewrites)
