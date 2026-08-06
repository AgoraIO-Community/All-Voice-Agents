# Root Provider Microfrontends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the combined Voice Stack Lab into a default portal and an independent ElevenLabs stack while preserving one public domain through Vercel Microfrontends path routing.

**Architecture:** The root npm/Turborepo workspace will contain a Vite portal, an ElevenLabs Vite frontend, the existing ElevenLabs Node backend, and a shared React provider-navigation package. Vercel Microfrontends routes `/11labs` and `/11labs/:path*` to the ElevenLabs frontend; the portal owns `/` and the unimplemented provider routes. Cross-application navigation uses document links so the Vercel routing layer can select the correct project.

**Tech Stack:** npm workspaces, Turborepo 2, React 19, Vite 7, TypeScript 5.9, Node.js 20.19+, `@vercel/microfrontends`, ElevenLabs React SDK.

## Global Constraints

- Do not add automated test files, test scripts, or test dependencies; the user explicitly requested no tests.
- Keep one public origin with `/11labs`, `/livekit`, `/vapi`, and `/agora` provider paths.
- Keep `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, and `ELEVENLABS_CONCIERGE_AGENT_ID` server-only and unprefixed.
- Keep the root `.env.example` safe to commit and preserve the ignored root `.env` containing the user's real credentials.
- Use `all-voice-agents-portal` and `all-voice-agents-elevenlabs` as the Vercel application names.
- Preserve all existing ElevenLabs routes and the Maya/Aarav call behavior.
- Preserve the current visual design; this work changes application boundaries, not the interface concept.
- Keep the ElevenLabs backend deployable as a long-running Node service on Railway.
- Verify each deliverable with type checking, linting, builds, and browser checks instead of automated tests.

---

## File Map

### Shared navigation

- `packages/provider-navigation/src/providerCatalog.ts`: canonical provider IDs, metadata, paths, and status.
- `packages/provider-navigation/src/ProviderShell.tsx`: common header, provider tabs, active state, and content frame.
- `packages/provider-navigation/src/styles.css`: global shell variables, reset rules, header, tabs, and provider content layout.
- `packages/provider-navigation/src/index.ts`: public package exports.

### Portal

- `portal/src/App.tsx`: portal routing for the homepage and unimplemented-provider pages.
- `portal/src/app/portalRoute.ts`: maps `/`, `/livekit`, `/vapi`, `/agora`, and unknown paths to portal screens.
- `portal/src/components/ProviderHome.tsx`: provider launch cards using document links.
- `portal/src/components/ComingSoonProvider.tsx`: placeholder page for provider routes not yet implemented.
- `portal/src/Portal.css`: homepage and coming-soon styles only.
- `portal/microfrontends.json`: default-app and ElevenLabs path ownership.

### ElevenLabs

- `elevenlabs/frontend/src/App.tsx`: ElevenLabs route state and shared shell composition.
- `elevenlabs/frontend/src/app/navigate.ts`: internal History API navigation between ElevenLabs subroutes.
- `elevenlabs/frontend/src/ElevenLabsExperience.tsx`: existing Maya/Aarav user experience.
- `elevenlabs/frontend/src/elevenLabsRoute.ts`: existing `/11labs` route parsing and path creation.
- `elevenlabs/frontend/src/api.ts`: signed-session backend client.
- `elevenlabs/backend/src/*`: existing signed-session Node API.
- `elevenlabs/prompts/*`: existing Maya and Aarav prompt documentation.

### Reserved provider roots

- `livekit/README.md`: LiveKit ownership and route contract.
- `vapi/README.md`: Vapi ownership and route contract.
- `agora/README.md`: Agora ownership and route contract.

---

### Task 1: Extract the shared provider-navigation package

**Files:**

- Create: `packages/provider-navigation/package.json`
- Create: `packages/provider-navigation/tsconfig.json`
- Create: `packages/provider-navigation/eslint.config.js`
- Move: `apps/frontend/src/app/providerCatalog.ts` to `packages/provider-navigation/src/providerCatalog.ts`
- Move and modify: `apps/frontend/src/components/ProviderLayout.tsx` to `packages/provider-navigation/src/ProviderShell.tsx`
- Create: `packages/provider-navigation/src/index.ts`
- Create: `packages/provider-navigation/src/styles.css`
- Modify: `apps/frontend/src/App.tsx`
- Modify: `apps/frontend/src/components/ProviderHome.tsx`
- Modify: `apps/frontend/src/components/ComingSoonProvider.tsx`
- Modify: `apps/frontend/src/App.css`
- Modify: `apps/frontend/package.json`

**Interfaces:**

- Produces: `ProviderId`, `ProviderDefinition`, `PROVIDERS`, and `getProvider(providerId)` from `@repo/provider-navigation`.
- Produces: `ProviderShell({ activeProviderId, children })` from `@repo/provider-navigation`.
- Consumes: React 19 and the current provider metadata.

- [ ] **Step 1: Create the package manifest and TypeScript configuration**

Use this package contract:

```json
{
  "name": "@repo/provider-navigation",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles.css": "./src/styles.css"
  },
  "scripts": {
    "check-types": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0"
  },
  "dependencies": {
    "react": "^19.2.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "@types/react": "19.2.2",
    "eslint": "^9.39.1",
    "typescript": "5.9.2"
  }
}
```

Extend `@repo/typescript-config/react-library.json` in `tsconfig.json`, include `src`, and reuse `@repo/eslint-config/react-internal` in `eslint.config.js`.

- [ ] **Step 2: Move the provider catalog into the package**

Preserve the existing `ProviderId`, `ProviderStatus`, `ProviderDefinition`, `PROVIDERS`, and `getProvider` signatures. The package remains the single source of truth for these definitions.

- [ ] **Step 3: Convert the shared shell to cross-application document navigation**

Replace callback-driven provider buttons with normal links:

```tsx
export interface ProviderShellProps {
  activeProviderId: ProviderId;
  children: React.ReactNode;
}

export const ProviderShell: React.FC<ProviderShellProps> = ({
  activeProviderId,
  children,
}) => (
  <div className="provider-shell">
    <header className="provider-shell__header">
      <a className="provider-shell__brand" href="/">Voice Stack Lab</a>
      <a className="provider-shell__home" href="/">Home</a>
      <nav className="provider-tabs" aria-label="Voice providers">
        {PROVIDERS.map((provider) => (
          <a
            aria-current={provider.id === activeProviderId ? "page" : undefined}
            className={
              provider.id === activeProviderId
                ? "provider-tabs__link provider-tabs__link--active"
                : "provider-tabs__link"
            }
            href={provider.path}
            key={provider.id}
          >
            {provider.name}
          </a>
        ))}
      </nav>
    </header>
    <div className="provider-shell__content">{children}</div>
  </div>
);
```

Export the component and catalog definitions from `src/index.ts`.

- [ ] **Step 4: Extract shared shell styles**

Move the `:root`, element reset, `.provider-shell`, `.provider-shell__header`, `.provider-tabs`, and responsive header rules from `apps/frontend/src/App.css` into `packages/provider-navigation/src/styles.css`. Rename `.provider-tabs__button` selectors to `.provider-tabs__link`, add `text-decoration: none`, and leave homepage/coming-soon rules in the application stylesheet.

- [ ] **Step 5: Update the current combined app to use the package**

Import the shared catalog and shell from `@repo/provider-navigation`. Import `@repo/provider-navigation/styles.css` once from the frontend entry point. Provider cards and coming-soon actions that can cross application boundaries must become `<a href>` elements. Keep `navigateTo` only for the ElevenLabs experience's internal subroutes.

Remove navigation callback props from the portal components so their final call sites are:

```tsx
<ProviderHome />
<ComingSoonProvider provider={provider} />
```

- [ ] **Step 6: Register the workspace dependency**

Add `"@repo/provider-navigation": "*"` to the current frontend dependencies and run:

```bash
npm install
npm run check-types
npm run lint
npm run build
```

Expected: all three commands exit successfully, and the current combined frontend still builds before the directory split.

- [ ] **Step 7: Commit the shared boundary**

```bash
git add packages/provider-navigation apps/frontend package.json package-lock.json
git commit -m "refactor: extract shared provider navigation"
```

---

### Task 2: Split the portal and ElevenLabs applications

**Files:**

- Move: `apps/frontend` to `portal`
- Move: `portal/src/providers/11labs/ElevenLabsExperience.tsx` to `elevenlabs/frontend/src/ElevenLabsExperience.tsx`
- Move: `portal/src/providers/11labs/ElevenLabsExperience.css` to `elevenlabs/frontend/src/ElevenLabsExperience.css`
- Move: `portal/src/providers/11labs/elevenLabsRoute.ts` to `elevenlabs/frontend/src/elevenLabsRoute.ts`
- Move: `portal/src/providers/11labs/api.ts` to `elevenlabs/frontend/src/api.ts`
- Move: `portal/src/providers/11labs/assets/*` to `elevenlabs/frontend/src/assets/`
- Create: `elevenlabs/frontend/src/App.tsx`
- Create: `elevenlabs/frontend/src/main.tsx`
- Create: `elevenlabs/frontend/src/app/navigate.ts`
- Create: `elevenlabs/frontend/package.json`
- Create: `elevenlabs/frontend/tsconfig.json`
- Create: `elevenlabs/frontend/eslint.config.js`
- Create: `elevenlabs/frontend/vite.config.ts`
- Create: `elevenlabs/frontend/index.html`
- Create: `elevenlabs/frontend/vercel.json`
- Modify: `portal/src/App.tsx`
- Move and modify: `portal/src/app/appRoute.ts` to `portal/src/app/portalRoute.ts`
- Modify: `portal/src/components/ProviderHome.tsx`
- Modify: `portal/src/components/ComingSoonProvider.tsx`
- Move: `portal/src/App.css` to `portal/src/Portal.css`
- Modify: `portal/src/main.tsx`
- Delete: `portal/src/app/navigate.ts`
- Modify: `portal/package.json`
- Modify: root `package.json`

**Interfaces:**

- Portal consumes `ProviderShell`, `PROVIDERS`, and `getProvider` from `@repo/provider-navigation`.
- ElevenLabs consumes `ProviderShell` and internal `navigateTo(path: string): void`.
- ElevenLabs frontend exposes Vite application routes rooted at `/11labs`.

- [ ] **Step 1: Move the existing frontend to the portal root**

Use a Git-aware move from `apps/frontend` to `portal`, then set its manifest to this application boundary after the ElevenLabs source is relocated:

```json
{
  "name": "@voice-agents/portal",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 5173",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 5173",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/provider-navigation": "*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "@vitejs/plugin-react": "^5.1.2",
    "eslint": "^9.39.1",
    "typescript": "5.9.2",
    "vite": "^7.3.0"
  }
}
```

- [ ] **Step 2: Create the standalone ElevenLabs frontend manifest**

Use this dependency boundary:

```json
{
  "name": "@voice-agents/elevenlabs",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 5174",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 5174",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@elevenlabs/react": "^1.12.0",
    "@repo/provider-navigation": "*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "@types/node": "^22.15.3",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "@vitejs/plugin-react": "^5.1.2",
    "eslint": "^9.39.1",
    "typescript": "5.9.2",
    "vite": "^7.3.0"
  }
}
```

Use this TypeScript configuration:

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "declaration": false,
    "declarationMap": false,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "types": ["node", "vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

Use `@repo/eslint-config/react-internal` in `eslint.config.js`. Create `index.html` with one `<div id="root"></div>`, the module entry `/src/main.tsx`, title `Voice Stack Lab — ElevenLabs`, and the existing comparison-app meta description. Keep the SPA fallback in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- [ ] **Step 3: Relocate the ElevenLabs implementation**

Move the experience component, CSS, route helper, API client, and both images into `elevenlabs/frontend/src`. Update imports only for their new relative locations; do not change the agent behavior or visual copy.

- [ ] **Step 4: Add the ElevenLabs application shell**

Create a small route-state host:

```tsx
import { ProviderShell } from "@repo/provider-navigation";
import { useEffect, useState } from "react";
import { navigateTo } from "./app/navigate";
import { ElevenLabsExperience } from "./ElevenLabsExperience";

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <ProviderShell activeProviderId="11labs">
      <ElevenLabsExperience pathname={pathname} onNavigate={navigateTo} />
    </ProviderShell>
  );
}
```

The new `main.tsx` imports `@repo/provider-navigation/styles.css`, mounts `App`, and preserves `StrictMode`.

- [ ] **Step 5: Reduce the portal to default and coming-soon routes**

Define the portal route contract as:

```ts
export type PortalRoute =
  | { kind: "home" }
  | { kind: "provider"; providerId: "livekit" | "vapi" | "agora" };
```

`getPortalRoute()` returns the matching placeholder provider for `/livekit`, `/vapi`, or `/agora`; every other path renders the homepage without changing the URL. Remove the lazy ElevenLabs import and Suspense branch from the portal. The ElevenLabs homepage card remains an `<a href="/11labs">` so the microfrontends layer owns the transition.

The portal host becomes synchronous because all navigation links issue document requests:

```tsx
import { getProvider, ProviderShell } from "@repo/provider-navigation";
import { getPortalRoute } from "./app/portalRoute";
import ComingSoonProvider from "./components/ComingSoonProvider";
import ProviderHome from "./components/ProviderHome";
import "./Portal.css";

export function App() {
  const route = getPortalRoute(window.location.pathname);

  if (route.kind === "home") {
    return <ProviderHome />;
  }

  const provider = getProvider(route.providerId);

  return (
    <ProviderShell activeProviderId={provider.id}>
      <ComingSoonProvider provider={provider} />
    </ProviderShell>
  );
}
```

- [ ] **Step 6: Separate application styles**

Keep only homepage and coming-soon styles in `portal/src/Portal.css`. The shared header styles remain in `@repo/provider-navigation/styles.css`; the ElevenLabs visual styles remain in `elevenlabs/frontend/src/ElevenLabsExperience.css`.

Because portal actions are now links, update `.provider-card` and `.coming-soon__actions` selectors to style anchors, including `color: inherit` and `text-decoration: none`. Preserve the existing hover, focus-visible, responsive, and reduced-motion behavior.

- [ ] **Step 7: Register both frontend workspaces**

Temporarily set the root workspace list to:

```json
[
  "portal",
  "elevenlabs/frontend",
  "apps/*",
  "packages/*"
]
```

Run:

```bash
npm install
npm run check-types
npm run lint
npm run build
```

Expected: portal and ElevenLabs compile as separate Vite applications; the backend still builds from `apps/backend` at this checkpoint.

- [ ] **Step 8: Commit the frontend split**

```bash
git add portal elevenlabs/frontend apps/frontend package.json package-lock.json
git commit -m "refactor: split portal and ElevenLabs frontend"
```

---

### Task 3: Isolate the ElevenLabs backend, prompts, and common environment

**Files:**

- Move: `apps/backend` to `elevenlabs/backend`
- Move: `prompts` to `elevenlabs/prompts`
- Modify: `elevenlabs/backend/package.json`
- Modify: `elevenlabs/backend/src/env.ts`
- Modify: root `.env.example`
- Modify: root `package.json`
- Modify: root `turbo.json`
- Modify: root `package-lock.json`

**Interfaces:**

- Preserves: backend HTTP endpoints and JSON response types.
- Produces: local environment precedence of process variables, root `.env.local`, then root `.env`.
- Consumes: `VITE_API_URL` in ElevenLabs frontend and private ElevenLabs variables in backend only.

- [ ] **Step 1: Move backend and prompts under ElevenLabs**

Use Git-aware moves and rename the backend package to `@voice-agents/elevenlabs-backend`. Keep backend scripts and endpoint behavior unchanged.

- [ ] **Step 2: Make root environment loading explicit**

Update `elevenlabs/backend/src/env.ts` to resolve the repository root from `elevenlabs/backend/dist` and load safe local files in precedence order:

```ts
const envFiles = [
  resolve(repoRoot, ".env.local"),
  resolve(repoRoot, ".env"),
];

for (const path of envFiles) {
  config({ override: false, path, quiet: true });
}
```

Existing deployment-provided `process.env` values retain highest precedence because dotenv does not override them. Loading `.env.local` before `.env` makes local overrides win without `override: true`.

- [ ] **Step 3: Make the ElevenLabs Vite frontend read the common root environment**

Set the Vite environment directory in `elevenlabs/frontend/vite.config.ts`:

```ts
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const frontendDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: resolve(frontendDirectory, "../.."),
  plugins: [react()],
});
```

Do not expose the three private ElevenLabs variables through `define` or a `VITE_` prefix.

- [ ] **Step 4: Finalize the common root example**

The committed root `.env.example` must contain only:

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_CONCIERGE_AGENT_ID=
VITE_API_URL=https://your-service-name.up.railway.app
```

Do not stage the ignored root `.env` or print its values.

- [ ] **Step 5: Update root workspace scripts and environment declarations**

Use these final workspaces:

```json
[
  "portal",
  "elevenlabs/frontend",
  "elevenlabs/backend",
  "packages/*"
]
```

Update script filters to the new package names:

```json
{
  "dev:portal": "turbo run dev --filter=@voice-agents/portal",
  "dev:elevenlabs": "turbo run dev --filter=@voice-agents/elevenlabs --filter=@voice-agents/elevenlabs-backend",
  "dev:backend": "turbo run dev --filter=@voice-agents/elevenlabs-backend",
  "dev:frontend": "turbo run dev --filter=@voice-agents/portal --filter=@voice-agents/elevenlabs"
}
```

Keep the existing top-level `dev`, `build`, `lint`, `check-types`, and `start` commands. Keep the existing ElevenLabs and Vite variables in `turbo.json`.

- [ ] **Step 6: Reinstall and verify the isolated stack**

```bash
npm install
npm run check-types
npm run lint
npm run build
```

Expected: no workspace references point to `apps/frontend`, `apps/backend`, or root `prompts`.

- [ ] **Step 7: Commit the provider ownership move**

```bash
git add .env.example elevenlabs apps package.json package-lock.json turbo.json prompts
git commit -m "refactor: isolate ElevenLabs stack"
```

---

### Task 4: Configure Vercel Microfrontends routing

**Files:**

- Create: `portal/microfrontends.json`
- Modify: `portal/package.json`
- Modify: `portal/vite.config.ts`
- Modify: `elevenlabs/frontend/package.json`
- Modify: `elevenlabs/frontend/vite.config.ts`
- Modify: root `package-lock.json`

**Interfaces:**

- Produces: default Vercel app `all-voice-agents-portal`.
- Produces: child Vercel app `all-voice-agents-elevenlabs` for `/11labs` and `/11labs/:path*`.
- Produces: local shared origin `http://127.0.0.1:3024`.

- [ ] **Step 1: Add the Vercel package to both frontend applications**

Run:

```bash
npm install @vercel/microfrontends --workspace @voice-agents/portal --workspace @voice-agents/elevenlabs
```

Expected: both frontend manifests list `@vercel/microfrontends`, and the root lockfile records one compatible resolved version.

- [ ] **Step 2: Add the routing configuration to the default app**

Create `portal/microfrontends.json` with this schema-valid routing:

```json
{
  "$schema": "https://openapi.vercel.sh/microfrontends.json",
  "applications": {
    "all-voice-agents-portal": {
      "packageName": "@voice-agents/portal",
      "development": {
        "fallback": "http://127.0.0.1:5173",
        "local": 5173
      }
    },
    "all-voice-agents-elevenlabs": {
      "packageName": "@voice-agents/elevenlabs",
      "development": {
        "local": 5174
      },
      "routing": [
        {
          "paths": ["/11labs", "/11labs/:path*"]
        }
      ]
    }
  },
  "options": {
    "localProxyPort": 3024
  }
}
```

- [ ] **Step 3: Enable unique Vite asset prefixes**

Add the plugin after React in both Vite configs:

```ts
import { microfrontends } from "@vercel/microfrontends/experimental/vite";

export default defineConfig({
  plugins: [react(), microfrontends()],
});
```

Retain `envDir: resolve(frontendDirectory, "../..")` in the ElevenLabs config. Retain fixed ports `5173` and `5174` in the package scripts so they match `microfrontends.json`.

- [ ] **Step 4: Verify package and routing configuration**

```bash
npm run check-types
npm run lint
npm run build
```

Start development with:

```bash
npm run dev
```

Expected terminal state:

- Portal listens on `127.0.0.1:5173`.
- ElevenLabs listens on `127.0.0.1:5174`.
- ElevenLabs backend listens on `127.0.0.1:4000`.
- The microfrontends proxy advertises port `3024`.

- [ ] **Step 5: Verify same-origin route ownership in the browser**

Open `http://127.0.0.1:3024` and check:

- `/` renders the portal.
- `/11labs` renders ElevenLabs while the origin remains `127.0.0.1:3024`.
- `/11labs/explore/call` and `/11labs/concierge/call` render the correct call screens.
- `/livekit`, `/vapi`, and `/agora` render portal coming-soon pages.
- Provider tabs perform cross-app navigation without asset 404s or console errors.

- [ ] **Step 6: Commit microfrontends routing**

```bash
git add portal elevenlabs/frontend package-lock.json
git commit -m "feat: add Vercel microfrontends routing"
```

---

### Task 5: Reserve provider roots and document deployment

**Files:**

- Create: `livekit/README.md`
- Create: `vapi/README.md`
- Create: `agora/README.md`
- Modify: root `README.md`

**Interfaces:**

- Produces: an explicit integration contract for future provider repositories.
- Documents: Vercel project roots, shared-domain routing, local ports, Railway backend URL, and environment ownership.

- [ ] **Step 1: Add provider ownership contracts**

Each reserved README must state its provider name, public route, ownership boundary, and activation steps. Use this structure with the matching provider values:

```markdown
# LiveKit Provider

This directory owns the future LiveKit frontend, backend, assets, dependencies, and deployment configuration.

- Public route: `/livekit` and `/livekit/:path*`
- Current owner: the portal coming-soon page
- Activation: add the application workspace, configure its Vercel framework integration, and move the route into `portal/microfrontends.json`
- Secrets: configure only on the LiveKit backend project; never expose private values through browser-prefixed variables
```

Write the corresponding Vapi and Agora contracts with `/vapi` and `/agora`.

- [ ] **Step 2: Rewrite the root README for the new structure**

Document:

- The root provider folder map.
- `http://127.0.0.1:3024` as the normal local entry point.
- The `5173`, `5174`, and `4000` isolated service ports.
- The common root environment workflow.
- `VITE_API_URL` as the public Railway backend location.
- Vercel project roots `portal` and `elevenlabs/frontend`.
- The Enterprise Microfrontends group and application names.
- How a future provider takes ownership of its route.

- [ ] **Step 3: Confirm obsolete paths and unsafe files are absent**

Run:

```bash
rg -n "apps/frontend|apps/backend|apps/" README.md package.json turbo.json portal elevenlabs packages livekit vapi agora
git status --short
git diff --check
```

Expected: no active configuration or documentation refers to the old app paths; `.env` remains ignored and untracked.

- [ ] **Step 4: Run final static verification**

```bash
npm run check-types
npm run lint
npm run build
```

Expected: every command exits successfully. No automated tests are created or run.

- [ ] **Step 5: Run final ElevenLabs session smoke check**

With the ignored root `.env` populated and the development processes running:

- Open `/11labs/explore/call` through port `3024`.
- Start a Maya call and confirm the UI reaches the connected state.
- End the call and confirm navigation returns to `/11labs/explore` on the same origin.
- Repeat route rendering for the Aarav concierge screen without printing signed URLs or environment values.

- [ ] **Step 6: Commit documentation and provider roots**

```bash
git add README.md livekit vapi agora
git commit -m "docs: document independent provider stacks"
```

---

## Final Completion Check

- [ ] `git status --short` contains no unexpected modifications.
- [ ] `git log --oneline -5` shows the planned boundary, split, routing, and documentation commits.
- [ ] The ignored root `.env` still contains the user's local credentials and has never been staged.
- [ ] The root `.env.example` contains variable names and the Railway URL placeholder only.
- [ ] The portal bundle does not include `@elevenlabs/react` or the ElevenLabs images.
- [ ] The ElevenLabs frontend and backend can be deployed independently.
- [ ] Vercel can map one public domain to the portal and ElevenLabs projects using `portal/microfrontends.json`.
- [ ] No automated test files or test dependencies were added.
