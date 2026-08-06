# Root Provider Microfrontends Design

**Date:** 2026-08-07
**Status:** Approved for planning
**Repository:** `All-Voice-Agents`

## Summary

Restructure the repository so the comparison portal and every voice-provider stack have explicit root-level ownership boundaries. The current ElevenLabs frontend, backend, assets, and prompts will be relocated into `elevenlabs/`. LiveKit, Vapi, and Agora will receive reserved root folders that can later contain applications with different frontend and backend frameworks.

Vercel Microfrontends will provide one public domain with path-based routing. The portal will remain the default application at `/`, while `/11labs` and all `/11labs/*` paths will be served by the independent ElevenLabs frontend project. The portal will continue serving placeholders for LiveKit, Vapi, and Agora until those projects are implemented and added to the microfrontend routing configuration.

## Goals

- Keep the user experience on one public domain.
- Preserve the provider-tab navigation and the existing ElevenLabs routes.
- Give each provider a root folder that can own its frontend, backend, assets, dependencies, and deployment configuration.
- Allow future providers to use Vite, Next.js, or another Vercel-supported framework.
- Keep the existing ElevenLabs signed-session backend and API keys server-side.
- Maintain one safe root `.env.example` and one ignored root `.env` or `.env.local` for local development.
- Support separate Vercel projects for the portal and provider frontends.
- Avoid adding automated tests, as explicitly requested by the user.

## Non-goals

- Implementing LiveKit, Vapi, or Agora voice-agent functionality.
- Migrating the ElevenLabs backend to Vercel Functions.
- Deploying or configuring projects in the Vercel dashboard.
- Adding authentication, analytics, billing, or a provider comparison database.
- Sharing provider secrets with every deployed project.
- Keeping a second copy of the old combined frontend after the split.

## Target Repository Structure

```text
All-Voice-Agents/
├── portal/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── microfrontends.json
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.ts
├── elevenlabs/
│   ├── frontend/
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vercel.json
│   │   └── vite.config.ts
│   ├── backend/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── prompts/
├── livekit/
│   └── README.md
├── vapi/
│   └── README.md
├── agora/
│   └── README.md
├── packages/
│   ├── provider-navigation/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── ui/
├── docs/
├── .env.example
├── package.json
├── package-lock.json
└── turbo.json
```

The initial npm workspace set will contain `portal`, `elevenlabs/frontend`, `elevenlabs/backend`, and the shared packages. The reserved provider folders will join the workspace only when they contain an actual application. This avoids imposing a framework or package structure on future provider repositories prematurely.

## Application Responsibilities

### Portal

The portal owns:

- The homepage and four provider cards.
- Placeholder pages for `/livekit`, `/vapi`, and `/agora`.
- The default Vercel Microfrontends application and `microfrontends.json`.
- Fallback handling for paths not owned by a provider application.

The portal will no longer import or bundle the ElevenLabs SDK, images, experience component, or session API client.

### ElevenLabs frontend

The ElevenLabs frontend owns:

- `/11labs`
- `/11labs/explore`
- `/11labs/explore/call`
- `/11labs/concierge`
- `/11labs/concierge/call`
- The Maya and Aarav experience components, styles, images, and ElevenLabs browser SDK dependency.
- Calls to the ElevenLabs backend through `VITE_API_URL`.

It will render the shared provider navigation around the existing Paneer experience. Internal ElevenLabs navigation may continue using the History API because all of its subroutes belong to the same frontend application.

### ElevenLabs backend

The current Node TypeScript backend will move without changing its public contract:

- `GET /health`
- `GET /api/voice/providers`
- `POST /api/voice/session`

It will remain independently deployable, including on Railway. It will continue reading the ElevenLabs API key and agent IDs only on the server and returning signed session URLs to the browser.

### Shared provider navigation

`packages/provider-navigation` will own:

- The provider catalog and provider identifiers.
- The common Voice Stack Lab header.
- The provider tabs and active-provider state.
- Shared navigation styles required by both the portal and provider applications.

Cross-application provider links will use normal document navigation through `<a href>` rather than only `history.pushState`. A document request is required so Vercel Microfrontends can route the new path to the correct deployment. This also gives future Next.js and Vite providers the same navigation contract.

## Route Ownership

| Public path | Initial owner | Behavior |
| --- | --- | --- |
| `/` | Portal | Provider comparison homepage |
| `/11labs` | ElevenLabs frontend | Maya experience landing route |
| `/11labs/*` | ElevenLabs frontend | ElevenLabs subroutes |
| `/livekit` | Portal | Coming-soon placeholder |
| `/vapi` | Portal | Coming-soon placeholder |
| `/agora` | Portal | Coming-soon placeholder |
| Other paths | Portal | Render the homepage without changing the requested URL, matching the existing fallback behavior |

When another provider is implemented, its route and wildcard will move from the portal to that provider's Vercel project by updating `microfrontends.json`. For example, LiveKit will claim `/livekit` and `/livekit/:path*` only after its application exists and can serve those paths.

## Vercel Microfrontends Configuration

The portal will be the default application in a Vercel Microfrontends group. The initial group will contain these frontend projects:

- `all-voice-agents-portal`
- `all-voice-agents-elevenlabs`

The portal's `microfrontends.json` will map both `/11labs` and `/11labs/:path*` to `all-voice-agents-elevenlabs`. Application entries will map to the corresponding npm package names so local Turborepo discovery is deterministic.

Both Vite frontends will install `@vercel/microfrontends` and enable `@vercel/microfrontends/experimental/vite`. The plugin will assign unique asset prefixes so the portal and provider bundles do not collide under the shared domain. The local microfrontends proxy will use port `3024`, with the portal on `5173`, the ElevenLabs frontend on `5174`, and the ElevenLabs backend on `4000`.

The normal local entry point after this change will be:

```text
http://127.0.0.1:3024
```

Opening the individual application ports remains useful for isolated debugging, but shared-domain path routing is verified through the proxy.

## Environment Model

The root `.env.example` is the canonical inventory of environment-variable names. The initial contents are:

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_CONCIERGE_AGENT_ID=
VITE_API_URL=https://your-service-name.up.railway.app
```

Developers copy it to an ignored root `.env` or `.env.local`. The ElevenLabs Vite configuration uses the repository root as its `envDir`. The backend dotenv loader will read the root `.env.local` first and then the root `.env`, while allowing deployment-provided process variables to retain highest precedence. Only variables prefixed with `VITE_` may enter a Vite browser bundle.

Production values are configured outside Git:

- The ElevenLabs frontend Vercel project receives only `VITE_API_URL` and Vercel-managed variables.
- The ElevenLabs backend deployment receives `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_CONCIERGE_AGENT_ID`, and `CORS_ORIGIN`.
- Vercel Shared Environment Variables may be used for genuinely common, non-secret values.
- Provider-specific secrets remain scoped to the provider project that consumes them.

The root `.env.example` may grow as new providers are integrated, but it will never contain real credentials.

## Request and Navigation Flow

1. A browser requests `/` on the shared domain.
2. Vercel selects the portal because no provider routing rule claims `/`.
3. The user selects the ElevenLabs tab or card, which performs document navigation to `/11labs`.
4. Vercel Microfrontends routes that request directly to the ElevenLabs frontend deployment without changing the visible domain.
5. The ElevenLabs frontend requests a signed session URL from `VITE_API_URL`.
6. The ElevenLabs backend uses its private credentials to request the signed URL from ElevenLabs.
7. The browser connects to ElevenLabs using the signed URL; the API key never reaches the browser.
8. Selecting another provider tab navigates to its public path. Until that provider is implemented, Vercel routes the request to the portal placeholder.

## Error Handling

- If the signed-session backend is unavailable, the ElevenLabs frontend retains its existing visible connection error and allows the user to retry.
- If the backend lacks required configuration, it returns its existing typed JSON error rather than exposing credential values.
- If a provider route is not yet registered as a microfrontend, the portal displays the provider's coming-soon page.
- If an unknown path is opened, the portal applies the existing safe homepage fallback.
- Deployment configuration will not register a new provider route until that provider project can build and serve its route, preventing broken production paths.

## Migration Strategy

1. Create the shared navigation package by extracting the provider catalog and header from the current combined frontend.
2. Create the portal application from the homepage and placeholder portions of the current frontend.
3. Create the ElevenLabs frontend from the current `providers/11labs` implementation and its route helpers.
4. Move the backend and prompt files into `elevenlabs/`.
5. Update workspace paths, TypeScript configuration references, Turborepo environment declarations, scripts, and the lockfile.
6. Add Vercel Microfrontends configuration and Vite plugins to the portal and ElevenLabs frontend.
7. Add reserved root folders with integration contracts for LiveKit, Vapi, and Agora.
8. Update the README with local proxy, environment, routing, and Vercel project setup instructions.
9. Remove the obsolete combined `apps/frontend`, `apps/backend`, and root `prompts` paths after their content has been relocated.

Git-aware moves will be preferred so file history remains traceable. There will be one source of truth for each application; the old combined application will not remain as a duplicate.

## Verification

No automated test files or test dependencies will be added. Verification will consist of:

- `npm run check-types`
- `npm run lint`
- `npm run build`
- Starting the root development command and opening the local microfrontends proxy.
- Confirming `/`, `/11labs`, every existing ElevenLabs subroute, and the three placeholder routes render from their intended owners.
- Confirming provider-tab navigation changes paths on the same origin.
- Confirming a signed ElevenLabs call session can still be created when valid local credentials and the backend are running.
- Confirming no API key or agent secret appears in browser-facing environment output or committed files.

## Deployment Notes

The repository restructuring prepares the code and configuration but does not mutate Vercel account state. After merge, an operator will:

1. Create or select the `all-voice-agents-portal` Vercel project with root directory `portal`.
2. Create or select the `all-voice-agents-elevenlabs` Vercel project with root directory `elevenlabs/frontend`.
3. Add both projects to one Enterprise Microfrontends group and choose the portal as default.
4. Configure `VITE_API_URL` for the ElevenLabs frontend.
5. Deploy the portal and ElevenLabs projects, then validate the group in Preview before promotion.
6. Attach the public domain to the Microfrontends group so every provider remains under that domain.

The existing ElevenLabs Node backend remains a separate deployment target. Its Railway URL is supplied to the Vercel frontend through `VITE_API_URL`.

## References

- [Vercel Microfrontends overview](https://vercel.com/docs/microfrontends)
- [Vercel Microfrontends quickstart](https://vercel.com/docs/microfrontends/quickstart)
- [Vercel Microfrontends path routing](https://vercel.com/docs/microfrontends/path-routing)
- [Vercel Shared Environment Variables](https://vercel.com/docs/environment-variables/shared-environment-variables)
