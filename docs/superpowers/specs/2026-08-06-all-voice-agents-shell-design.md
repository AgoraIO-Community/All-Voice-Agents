# All Voice Agents Shell and ElevenLabs Migration Design

## Goal

Create the first version of All Voice Agents by safely copying the existing Project Paneer application into the empty `All-Voice-Agents` repository. The new application will present four provider choices on its homepage and expose the working Paneer ElevenLabs experience at `/11labs`. LiveKit, Vapi, and Agora will have routed placeholders for later integrations.

## Migration Safety

- Copy source files from `/Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer`.
- Write the new application only in `/Users/bhupendranegi/My-Repos/my-convo-apps/all-voice-agents/All-Voice-Agents`.
- Do not delete, move, commit, or otherwise modify files in the source repository.
- Preserve the copied ElevenLabs frontend behavior, backend signed-URL flow, environment loading, workspace scripts, and deployment configuration.
- Exclude source-repository Git metadata and generated directories such as `.git`, `node_modules`, `.turbo`, and `dist` from the copy.

## Chosen Product Direction

The product name is **Voice Stack Lab** within the interface. The homepage is a four-card launchpad, chosen over a denser comparison workspace because the first release is primarily a provider selector. The provider routes use a persistent shared header, chosen over a floating switcher because it gives every current and future provider a consistent, accessible navigation location without overlapping provider-specific UI.

The visual direction uses a dark, editorial presentation with warm neutrals and a sharp lime status accent. ElevenLabs is marked ready. LiveKit, Vapi, and Agora are marked coming soon. The migrated Paneer experience retains its own hospitality branding beneath the shared provider header.

## Route Map

| Route | Result |
| --- | --- |
| `/` | Four-card provider homepage |
| `/11labs` | ElevenLabs Paneer Explore landing view |
| `/11labs/explore` | ElevenLabs Paneer Explore landing view |
| `/11labs/explore/call` | Maya call view |
| `/11labs/concierge` | ElevenLabs Paneer Concierge landing view |
| `/11labs/concierge/call` | Aarav call view |
| `/livekit` | LiveKit coming-soon view |
| `/vapi` | Vapi coming-soon view |
| `/agora` | Agora coming-soon view |
| Any unknown route | Provider homepage |

Browser back and forward navigation must keep the rendered screen synchronized with `window.location.pathname`. The provider homepage cards and shared provider header must navigate without a full page reload.

## Repository Architecture

The target will remain a single npm Turborepo based on the copied Project Paneer repository. The current Vite/React frontend and Node/TypeScript backend stay in the same build and development workflow.

The frontend will separate the shared comparison shell from provider-specific code:

```text
apps/frontend/src/
├── app/
│   ├── App.tsx
│   ├── appRoute.ts
│   └── navigate.ts
├── components/
│   ├── ProviderHome.tsx
│   ├── ProviderLayout.tsx
│   └── ComingSoonProvider.tsx
└── providers/
    └── 11labs/
        ├── ElevenLabsExperience.tsx
        ├── elevenLabsRoute.ts
        ├── api.ts
        └── assets/
```

Styles may be colocated with these components or split into focused CSS files. Shared shell selectors must be scoped so they do not alter the copied Paneer presentation. ElevenLabs selectors must be scoped to the provider experience so they cannot leak into the homepage or future provider pages.

The backend remains one service. ElevenLabs-specific session creation can remain in the copied backend provider registry for this release. Its public endpoints remain:

- `GET /health`
- `GET /api/voice/providers`
- `POST /api/voice/session`

The public voice-provider response may list only backend-supported providers. The homepage provider catalog is frontend product configuration and must not imply that placeholder providers have working backend implementations.

## Component Responsibilities

### App

`App` reads the current pathname, maps it to a top-level provider route, listens for `popstate`, and renders either the homepage or a provider layout. It does not own voice SDK state or provider-specific call logic.

### ProviderHome

`ProviderHome` renders one card each for ElevenLabs, LiveKit, Vapi, and Agora. ElevenLabs is labeled ready and links to `/11labs`. The other cards are labeled coming soon but remain navigable to their dedicated placeholder routes.

### ProviderLayout

`ProviderLayout` renders the Voice Stack Lab brand, a Home action, and provider tabs. It marks the active provider and renders the selected provider page below the shared header. On small screens, the header remains usable through wrapping or horizontal overflow rather than hiding provider choices.

### ElevenLabsExperience

`ElevenLabsExperience` owns `ConversationProvider`, the ElevenLabs React SDK hooks, Paneer page configuration, session state, controls, transcript/tool behavior, and copied presentation. Its internal navigation always writes `/11labs/...` paths.

When the component unmounts because the user leaves the ElevenLabs route, the active conversation must disconnect through the SDK cleanup path so media and microphone resources are not left active.

### ElevenLabs Route Helper

The route helper maps `/11labs` and `/11labs/explore` to the Explore landing state, maps `/11labs/concierge` to the Concierge landing state, and recognizes the two nested call routes. This mapping is a pure function so it can be tested without rendering the SDK.

### ComingSoonProvider

`ComingSoonProvider` accepts typed provider metadata and renders one reusable placeholder view for LiveKit, Vapi, and Agora. It identifies the selected provider, explains that the integration is not active, and provides actions to return home or open ElevenLabs.

## Data and Navigation Flow

1. The browser opens `/` and `App` renders `ProviderHome`.
2. Selecting ElevenLabs pushes `/11labs` into browser history.
3. `App` renders `ProviderLayout` with ElevenLabs active.
4. `ElevenLabsExperience` maps the pathname to the corresponding Paneer screen.
5. Starting a call requests a signed URL from `POST /api/voice/session` with the selected agent and `elevenlabs` vendor.
6. The backend reads its environment variables and requests the signed URL from ElevenLabs without exposing the API key.
7. The frontend starts the conversation with the signed URL and keeps the existing call controls and tool behavior.
8. Provider-header navigation unmounts the experience and shows the selected placeholder or homepage.

## Environment and Security

The migration preserves these backend environment variables:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `ELEVENLABS_CONCIERGE_AGENT_ID`
- `CORS_ORIGIN`
- `HOST`
- `PORT`

The frontend continues to use its configured Vite API URL. Secret values must remain server-only. The browser receives only the ElevenLabs signed conversation URL and public session metadata.

Environment files containing credentials must not be committed. The target repository will include or preserve a safe `.env.example` containing names and non-secret guidance only.

## Error Handling

- A backend connectivity failure remains an actionable in-page ElevenLabs error.
- A missing ElevenLabs API key or agent ID remains an explicit backend error returned to the frontend.
- An SDK disconnect or client-tool error remains visible within the Paneer call screen.
- Navigating away from a live call performs conversation cleanup during unmount.
- Placeholder routes never attempt backend requests or SDK initialization.
- Unknown paths return to the provider homepage instead of rendering a blank screen.
- Provider navigation remains available when a provider page reports an error.

## Testing and Verification

Automated tests will cover:

- top-level route mapping for `/`, `/11labs`, `/livekit`, `/vapi`, `/agora`, and unknown paths;
- nested ElevenLabs route mapping for Explore, Concierge, and both call routes;
- four provider cards on the homepage with correct labels and destinations;
- shared provider navigation and active-provider state;
- browser-history synchronization through `popstate`;
- reusable placeholder rendering for LiveKit, Vapi, and Agora;
- copied ElevenLabs interactions that can be tested without a real paid voice session; and
- cleanup behavior when leaving an active ElevenLabs experience, where the SDK boundary permits deterministic mocking.

Repository verification will run the test suite, lint, type-check, and production build. A browser smoke test will verify the homepage, `/11labs`, a nested Paneer route, and one placeholder route at desktop and mobile widths. A final source-repository status check will confirm that Project Paneer was not modified.

## Out of Scope

- Implementing working LiveKit, Vapi, or Agora voice agents.
- Producing benchmark metrics or a provider scoring model.
- Redesigning the Paneer call experience beyond nesting it under the shared header and new route prefix.
- Changing ElevenLabs agent configuration, prompts, voices, tools, or dashboard settings.
- Deploying the application or changing external infrastructure.
- Deleting or archiving the original Project Paneer repository.

## Considered Alternatives

### Independent application per provider

This gives maximum dependency isolation, but duplicates navigation, styling, routing, development commands, and deployment configuration before the additional providers exist.

### Entire Project Paneer repository nested under a top-level `11labs` directory

This preserves the source layout literally, but requires a second shell application, proxying or iframe composition, and more complex local and production routing. It also makes shared navigation and future side-by-side comparisons harder.

### Comparison workspace homepage

This makes room for metrics and detailed provider inspection, but is unnecessarily dense while only ElevenLabs is functional. The chosen four-card launchpad can evolve into a richer comparison surface after provider integrations and measurable criteria exist.
