# All Voice Agents Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely copy Project Paneer into All Voice Agents, add the four-provider homepage and shared provider navigation, and serve the working Paneer ElevenLabs experience from `/11labs`.

**Architecture:** Retain the copied npm Turborepo, Vite/React frontend, and Node/TypeScript backend. Add a shared frontend route controller and provider shell, relocate the existing Paneer frontend into `src/providers/11labs`, and keep the signed ElevenLabs session API server-side.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, ElevenLabs React SDK, Node.js HTTP API, npm workspaces, Turborepo, CSS.

## Global Constraints

- Copy from `/Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer` without modifying that repository.
- Write application changes only in `/Users/bhupendranegi/My-Repos/my-convo-apps/all-voice-agents/All-Voice-Agents`.
- Do not copy `.git`, generated build outputs, caches, `node_modules`, or secret `.env*` files.
- Preserve and explicitly copy only safe `.env.example` files.
- Do not create or install an automated test framework, test dependency, test script, or test file, per the user's instruction.
- Use lint, TypeScript checks, production builds, route inspection, and browser smoke checks for verification.
- `/` is the four-card provider homepage.
- `/11labs` and its approved nested routes render the copied Paneer ElevenLabs experience.
- `/livekit`, `/vapi`, and `/agora` render reusable coming-soon pages.
- Unknown routes render the provider homepage.
- Keep ElevenLabs secrets on the backend.

## Final File Structure

```text
All-Voice-Agents/
├── apps/
│   ├── backend/                         # copied signed-session API
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── appRoute.ts          # top-level route parsing
│       │   │   ├── navigate.ts          # History API navigation
│       │   │   └── providerCatalog.ts   # typed provider metadata
│       │   ├── components/
│       │   │   ├── ComingSoonProvider.tsx
│       │   │   ├── ProviderHome.tsx
│       │   │   └── ProviderLayout.tsx
│       │   ├── providers/
│       │   │   └── 11labs/
│       │   │       ├── assets/
│       │   │       ├── api.ts
│       │   │       ├── ElevenLabsExperience.css
│       │   │       ├── ElevenLabsExperience.tsx
│       │   │       └── elevenLabsRoute.ts
│       │   ├── App.css                  # shared shell and homepage styles
│       │   ├── App.tsx                  # route composition
│       │   └── main.tsx
│       └── index.html
├── docs/
├── packages/
├── .env.example
├── .gitignore
├── package.json
└── turbo.json
```

---

### Task 1: Copy the Project Paneer Baseline Safely

**Files:**
- Copy: source repository files into the target repository
- Preserve: `docs/superpowers/specs/2026-08-06-all-voice-agents-shell-design.md`
- Preserve: `docs/superpowers/plans/2026-08-06-all-voice-agents-shell.md`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Produces: the existing `frontend` and `backend` npm workspaces in the target repository.
- Produces: the existing `npm run dev`, `npm run build`, `npm run lint`, and `npm run check-types` commands.
- Consumes: no application interfaces.

- [ ] **Step 1: Record the source status before copying**

Run:

```bash
git -C /Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer status --short
git -C /Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer rev-parse HEAD
```

Expected: status is empty and the revision is recorded for the final safety check.

- [ ] **Step 2: Copy tracked application content without deleting target files**

Run from the target repository:

```bash
rsync -a \
  --exclude='.git' \
  --exclude='.env*' \
  --exclude='.superpowers' \
  --exclude='node_modules' \
  --exclude='.turbo' \
  --exclude='dist' \
  /Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer/ ./
install -m 0644 /Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer/.env.example .env.example
install -m 0644 /Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer/apps/frontend/.env.example apps/frontend/.env.example
```

The command intentionally omits `--delete`, so the approved target design and plan remain present.

- [ ] **Step 3: Update repository identity and local-artifact ignores**

Change the root package name in `package.json` from `my-turborepo` to `all-voice-agents`.

Append this exact entry to `.gitignore`:

```gitignore

# Local Codex visual brainstorming artifacts
.superpowers/
```

- [ ] **Step 4: Install the copied lockfile dependencies**

Run:

```bash
npm install
```

Expected: npm completes without adding testing dependencies.

- [ ] **Step 5: Verify the unmodified baseline builds**

Run:

```bash
npm run check-types
npm run build
```

Expected: both workspaces type-check and build successfully.

- [ ] **Step 6: Commit the safe baseline copy**

```bash
git add . ':!.superpowers'
git commit -m "chore: copy Project Paneer baseline"
```

---

### Task 2: Add the Typed Provider Catalog and Route Model

**Files:**
- Create: `apps/frontend/src/app/providerCatalog.ts`
- Create: `apps/frontend/src/app/appRoute.ts`
- Create: `apps/frontend/src/app/navigate.ts`

**Interfaces:**
- Produces: `type ProviderId = "11labs" | "livekit" | "vapi" | "agora"`.
- Produces: `type ProviderDefinition` with `id`, `name`, `description`, `status`, and `path`.
- Produces: `PROVIDERS: readonly ProviderDefinition[]`.
- Produces: `getProvider(providerId: ProviderId): ProviderDefinition`.
- Produces: `type AppRoute = { kind: "home" } | { kind: "provider"; providerId: ProviderId }`.
- Produces: `getAppRoute(pathname: string): AppRoute`.
- Produces: `navigateTo(path: string): void`.

- [ ] **Step 1: Create the provider catalog**

Define four immutable entries with these exact paths and states:

```typescript
export type ProviderId = "11labs" | "livekit" | "vapi" | "agora";
export type ProviderStatus = "ready" | "coming-soon";

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  description: string;
  path: `/${ProviderId}`;
  status: ProviderStatus;
}

export const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: "11labs",
    name: "ElevenLabs",
    description: "Paneer travel concierge with Maya and Aarav.",
    path: "/11labs",
    status: "ready",
  },
  {
    id: "livekit",
    name: "LiveKit",
    description: "Real-time agent framework comparison slot.",
    path: "/livekit",
    status: "coming-soon",
  },
  {
    id: "vapi",
    name: "Vapi",
    description: "Hosted voice infrastructure comparison slot.",
    path: "/vapi",
    status: "coming-soon",
  },
  {
    id: "agora",
    name: "Agora",
    description: "Conversational AI and RTC comparison slot.",
    path: "/agora",
    status: "coming-soon",
  },
] as const;
```

`getProvider` must use `PROVIDERS.find` and throw a typed `Error` only for an impossible unknown identifier.

- [ ] **Step 2: Implement exact route recognition**

`getAppRoute` must normalize a trailing slash and accept only:

```typescript
const ELEVENLABS_PATHS = new Set([
  "/11labs",
  "/11labs/explore",
  "/11labs/explore/call",
  "/11labs/concierge",
  "/11labs/concierge/call",
]);
```

Exact `/livekit`, `/vapi`, and `/agora` paths map to their provider. `/`, unknown provider names, and unknown nested paths map to `{ kind: "home" }`.

- [ ] **Step 3: Add dependency-free navigation**

Implement:

```typescript
export function navigateTo(path: string): void {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
```

This keeps every navigation source synchronized through one event path.

- [ ] **Step 4: Verify the route foundation**

Run:

```bash
npm run check-types --workspace frontend
npm run lint --workspace frontend
```

Expected: both commands succeed.

- [ ] **Step 5: Commit the route foundation**

```bash
git add apps/frontend/src/app
git commit -m "feat: add provider routes and catalog"
```

---

### Task 3: Build the Four-Card Homepage and Shared Provider Layout

**Files:**
- Create: `apps/frontend/src/components/ProviderHome.tsx`
- Create: `apps/frontend/src/components/ProviderLayout.tsx`
- Create: `apps/frontend/src/components/ComingSoonProvider.tsx`
- Replace: `apps/frontend/src/App.css`
- Modify: `apps/frontend/index.html`

**Interfaces:**
- `ProviderHomeProps.onNavigate(path: string): void`.
- `ProviderLayoutProps.activeProviderId: ProviderId`.
- `ProviderLayoutProps.onNavigate(path: string): void`.
- `ProviderLayoutProps.children: React.ReactNode`.
- `ComingSoonProviderProps.provider: ProviderDefinition`.
- `ComingSoonProviderProps.onNavigate(path: string): void`.

- [ ] **Step 1: Implement the homepage card structure**

`ProviderHome` must render:

- a `main.provider-home` root;
- the label `Voice stack comparison lab`;
- the heading `Hear the difference.`;
- a short explanation that the same conversational concept will be compared across providers;
- one semantic button for every `PROVIDERS` entry;
- `Ready` on ElevenLabs and `Coming soon` on the other three cards; and
- an ElevenLabs card action that navigates to `/11labs`.

All four cards remain navigable, including the coming-soon providers.

- [ ] **Step 2: Implement the persistent provider header**

`ProviderLayout` must render a shell with:

- a `Voice Stack Lab` brand button that navigates to `/`;
- a separate `Home` button;
- four provider tab buttons generated from `PROVIDERS`;
- `aria-current="page"` on the active provider tab; and
- a content region below the header.

Provider buttons call `onNavigate(provider.path)` and never use full-page links.

- [ ] **Step 3: Implement the reusable placeholder**

`ComingSoonProvider` must render the provider name, the label `Integration coming soon`, its catalog description, a `Try ElevenLabs` action to `/11labs`, and a `Back to all providers` action to `/`.

- [ ] **Step 4: Replace shell styles with the approved visual direction**

Define these shared CSS variables in `:root`:

```css
--shell-bg: #111410;
--shell-surface: #1a1e18;
--shell-surface-raised: #23281f;
--shell-text: #f5f2ea;
--shell-muted: #9da394;
--shell-accent: #d3f36b;
--shell-border: rgba(255, 255, 255, 0.1);
--provider-header-height: 64px;
```

Use a responsive two-column provider grid above `760px` and a single column below it. Use visible focus rings, large button hit targets, a sticky/persistent header row, and horizontal provider-tab overflow on narrow screens. Avoid gradients on buttons and avoid generic white-card dashboard styling.

- [ ] **Step 5: Update document metadata**

Change `apps/frontend/index.html` to:

```html
<title>Voice Stack Lab</title>
<meta
  name="description"
  content="Compare conversational voice agent stacks across ElevenLabs, LiveKit, Vapi, and Agora."
/>
```

- [ ] **Step 6: Verify components and styles compile**

Run:

```bash
npm run check-types --workspace frontend
npm run lint --workspace frontend
```

Expected: both commands succeed.

- [ ] **Step 7: Commit the comparison shell**

```bash
git add apps/frontend/src/components apps/frontend/src/App.css apps/frontend/index.html
git commit -m "feat: add voice provider comparison shell"
```

---

### Task 4: Relocate Paneer into the ElevenLabs Provider Folder

**Files:**
- Move: `apps/frontend/src/App.tsx` content to `apps/frontend/src/providers/11labs/ElevenLabsExperience.tsx`
- Move: `apps/frontend/src/api.ts` to `apps/frontend/src/providers/11labs/api.ts`
- Move: `apps/frontend/src/assets/*` to `apps/frontend/src/providers/11labs/assets/`
- Copy and adapt: source `apps/frontend/src/App.css` to target `apps/frontend/src/providers/11labs/ElevenLabsExperience.css`
- Create: `apps/frontend/src/providers/11labs/elevenLabsRoute.ts`

**Interfaces:**
- Produces: `type ElevenLabsRouteId = "explore" | "concierge"`.
- Produces: `interface ElevenLabsRouteState { isCallRoute: boolean; routeId: ElevenLabsRouteId }`.
- Produces: `getElevenLabsRoute(pathname: string): ElevenLabsRouteState`.
- Produces: `getElevenLabsPath(routeId: ElevenLabsRouteId, isCallRoute?: boolean): string`.
- Produces: `ElevenLabsExperienceProps.pathname: string`.
- Produces: `ElevenLabsExperienceProps.onNavigate(path: string): void`.

- [ ] **Step 1: Create provider directories and mechanically relocate files**

Move the copied `api.ts` and image assets into `apps/frontend/src/providers/11labs`. Copy the Paneer stylesheet directly from `/Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer/apps/frontend/src/App.css` into `ElevenLabsExperience.css`, because Task 3 has already replaced the target `App.css` with shared shell styles. Keep both image bytes unchanged and do not remove the new shared `App.css`.

- [ ] **Step 2: Create the pure ElevenLabs route helper**

Use this exact mapping:

```typescript
export type ElevenLabsRouteId = "explore" | "concierge";

export interface ElevenLabsRouteState {
  isCallRoute: boolean;
  routeId: ElevenLabsRouteId;
}

export function getElevenLabsRoute(pathname: string): ElevenLabsRouteState {
  const routeId = pathname.startsWith("/11labs/concierge")
    ? "concierge"
    : "explore";

  return {
    isCallRoute:
      pathname === `/11labs/${routeId}/call`,
    routeId,
  };
}

export function getElevenLabsPath(
  routeId: ElevenLabsRouteId,
  isCallRoute = false,
): string {
  return `/11labs/${routeId}${isCallRoute ? "/call" : ""}`;
}
```

- [ ] **Step 3: Convert the copied app into a provider component**

Rename the copied `App` export to:

```typescript
interface ElevenLabsExperienceProps {
  pathname: string;
  onNavigate: (path: string) => void;
}

export const ElevenLabsExperience: React.FC<ElevenLabsExperienceProps> = ({
  pathname,
  onNavigate,
}) => (
  <ConversationProvider>
    <VoiceExperience pathname={pathname} onNavigate={onNavigate} />
  </ConversationProvider>
);
```

Remove the copied component's root-path redirect and its `popstate` listener. Derive route state from the `pathname` prop, and replace every `/explore` or `/concierge` navigation target with `getElevenLabsPath(...)`. Keep the copied ElevenLabs call, microphone, session, mute, speaker, tool-call, metrics, and error behavior.

- [ ] **Step 4: Add explicit conversation cleanup**

In `VoiceExperience`, keep the latest SDK status and `endSession` method available to an unmount-only effect. On cleanup, call `conversation.endSession()` only when the status is `connected` or `connecting`, and swallow the SDK's no-active-session exception. Do not reset React state during unmount.

- [ ] **Step 5: Adapt Paneer layout CSS below the shared header**

Use `.elevenlabs-experience` as the outer provider root. Change the copied `.landing-page` from `position: fixed; inset: 0` to `position: absolute; inset: 0`, and give the provider root `position: relative; width: 100%; height: 100%; min-height: 0; overflow: hidden`. Keep the existing Paneer visuals and responsive call layout otherwise unchanged.

Move global document reset rules to the shared `App.css`; the provider stylesheet must own Paneer-specific variables and selectors.

- [ ] **Step 6: Verify the provider compiles**

Run:

```bash
npm run check-types --workspace frontend
npm run lint --workspace frontend
```

Expected: both commands succeed with no duplicate JSX props and no stale imports from `./api` or `./assets`.

- [ ] **Step 7: Commit the ElevenLabs relocation**

```bash
git add apps/frontend/src/providers apps/frontend/src/App.css
git commit -m "feat: move Paneer experience to elevenlabs provider"
```

---

### Task 5: Compose Top-Level Routing in App

**Files:**
- Create: `apps/frontend/src/App.tsx`
- Verify: `apps/frontend/src/main.tsx`

**Interfaces:**
- Consumes: `getAppRoute(pathname: string): AppRoute`.
- Consumes: `navigateTo(path: string): void`.
- Consumes: the shared homepage/layout/placeholder components.
- Consumes: `ElevenLabsExperience`.

- [ ] **Step 1: Implement the top-level pathname state**

`App` must initialize `pathname` from `window.location.pathname`, add one `popstate` listener that updates it, and remove the listener on unmount.

Use `getAppRoute(pathname)` for rendering. Do not add React Router or any new runtime dependency.

- [ ] **Step 2: Compose the route branches**

Render `ProviderHome` for `{ kind: "home" }`.

For provider routes, render `ProviderLayout` with the selected provider active. Render:

```typescript
route.providerId === "11labs" ? (
  <ElevenLabsExperience pathname={pathname} onNavigate={navigateTo} />
) : (
  <ComingSoonProvider
    provider={getProvider(route.providerId)}
    onNavigate={navigateTo}
  />
)
```

- [ ] **Step 3: Verify the entry point still renders App**

Keep `main.tsx` in Strict Mode and ensure its `./App` import resolves to the new shell.

- [ ] **Step 4: Run full static verification**

Run:

```bash
npm run check-types
npm run lint
npm run build
```

Expected: all three root commands succeed.

- [ ] **Step 5: Inspect production routes through the built SPA**

Start the preview and backend in separate terminals:

```bash
npm run start --workspace backend
npm run preview --workspace frontend
```

Open `/`, `/11labs`, `/11labs/concierge`, `/livekit`, `/vapi`, `/agora`, and `/unknown`. Confirm the approved route behavior and that a direct browser refresh returns the SPA via `vercel.json` rewrites.

- [ ] **Step 6: Commit the composed application**

```bash
git add apps/frontend/src/App.tsx apps/frontend/src/main.tsx
git commit -m "feat: compose all voice agent routes"
```

---

### Task 6: Update Documentation and Complete Manual Verification

**Files:**
- Replace: `README.md`
- Verify: `.env.example`
- Verify: `apps/frontend/.env.example`

**Interfaces:**
- Documents: repository purpose, route map, setup, environment, and commands.
- Does not introduce application interfaces.

- [ ] **Step 1: Replace the copied README**

Document:

- the Voice Stack Lab purpose;
- the four homepage providers and their v1 status;
- the full `/11labs` nested route map;
- the LiveKit, Vapi, and Agora placeholder routes;
- `npm install`, safe environment setup, and `npm run dev`;
- backend and frontend ports;
- all required ElevenLabs environment variables; and
- `npm run check-types`, `npm run lint`, and `npm run build` verification commands.

- [ ] **Step 2: Confirm examples contain no secrets**

Run:

```bash
git grep -nE '(sk-[A-Za-z0-9_-]{12,}|xi-api-key[=:][^[:space:]]+)' -- . ':!package-lock.json'
```

Expected: no credential value matches.

- [ ] **Step 3: Run final repository verification**

Run:

```bash
npm run check-types
npm run lint
npm run build
git diff --check
git status --short
```

Expected: checks pass; only intended documentation changes are uncommitted before the final commit.

- [ ] **Step 4: Confirm the source repository is untouched**

Run:

```bash
git -C /Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer status --short
git -C /Users/bhupendranegi/My-Repos/my-convo-apps/project-panner/Project-Paneer rev-parse HEAD
```

Expected: status remains empty and the revision matches Task 1.

- [ ] **Step 5: Commit documentation and verification notes**

```bash
git add README.md .env.example apps/frontend/.env.example docs/superpowers/plans/2026-08-06-all-voice-agents-shell.md
git commit -m "docs: document all voice agents setup"
```
